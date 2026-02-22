import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { db, getOrCreateParty, getAllPartyNames, getAllItemNames, isPartyFinalized } from '@/db';
import { useLiveQuery } from 'dexie-react-hooks';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import ComboboxInput from '@/components/ComboboxInput';
import { Plus, Trash2, Save, Pencil, X } from '@/lib/icons';
import { toast } from '@/hooks/use-toast';
import { transliterateToHindi } from '@/lib/sanscript';
import { T, DualName } from '@/components/DualText';
import { useLanguage } from '@/contexts/LanguageContext';
import { saveDraft, loadDraft, clearDraft } from '@/lib/drafts';

interface RowData {
  key: string;
  itemName: string;
  qty: number;
  factor: number;
}

const DRAFT_KEY = 'purchase_entry';

export default function PurchaseEntry() {
  const { hindiEnabled } = useLanguage();
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [partyName, setPartyName] = useState('');
  const [rows, setRows] = useState<RowData[]>([
    { key: crypto.randomUUID(), itemName: '', qty: 0, factor: 1 },
  ]);
  const [saving, setSaving] = useState(false);
  const [editingBlockId, setEditingBlockId] = useState<number | null>(null);
  const [deletingBlockId, setDeletingBlockId] = useState<number | null>(null);
  const [isLocked, setIsLocked] = useState(false);

  const partyNames = useLiveQuery(() => getAllPartyNames(), []) ?? [];
  const itemNames = useLiveQuery(() => getAllItemNames(), []) ?? [];
  const parties = useLiveQuery(() => db.parties.toArray(), []) ?? [];
  const blocks = useLiveQuery(() => db.purchaseBlocks.toArray(), []) ?? [];
  const allRows = useLiveQuery(() => db.purchaseRows.toArray(), []) ?? [];
  const finalizations = useLiveQuery(() => db.finalizations.toArray(), []) ?? [];

  const finalizedPartyIds = useMemo(() => new Set(finalizations.map(f => f.partyId)), [finalizations]);

  // Load draft on mount
  useEffect(() => {
    const draft = loadDraft<{ date: string; partyName: string; rows: RowData[] }>(DRAFT_KEY);
    if (draft) {
      setDate(draft.date);
      setPartyName(draft.partyName);
      setRows(draft.rows.length ? draft.rows : [{ key: crypto.randomUUID(), itemName: '', qty: 0, factor: 1 }]);
    }
  }, []);

  // Auto-save draft (debounced)
  useEffect(() => {
    const hasContent = partyName.trim() || rows.some(r => r.itemName.trim());
    if (!hasContent) return;
    const timer = setTimeout(() => {
      saveDraft(DRAFT_KEY, { date, partyName, rows });
      toast({ title: 'Draft saved', duration: 2000 });
    }, 400);
    return () => clearTimeout(timer);
  }, [date, partyName, rows]);

  // Check lock state when party changes
  useEffect(() => {
    const party = parties.find(p => p.name === partyName);
    if (party?.id) {
      setIsLocked(finalizedPartyIds.has(party.id));
    } else {
      setIsLocked(false);
    }
  }, [partyName, parties, finalizedPartyIds]);

  const partyBlocks = useMemo(() => {
    const party = parties.find(p => p.name === partyName);
    if (!party?.id) return [];
    return blocks.filter(b => b.partyId === party.id);
  }, [partyName, parties, blocks]);

  const addRow = () => {
    setRows(prev => [...prev, { key: crypto.randomUUID(), itemName: '', qty: 0, factor: 1 }]);
  };

  const updateRow = (key: string, field: keyof RowData, value: string | number) => {
    setRows(prev => prev.map(r => r.key === key ? { ...r, [field]: value } : r));
  };

  const removeRow = (key: string) => {
    setRows(prev => prev.length > 1 ? prev.filter(r => r.key !== key) : prev);
  };

  const handleSave = async () => {
    if (!partyName.trim()) { toast({ title: 'Enter party name', variant: 'destructive' }); return; }
    const validRows = rows.filter(r => r.itemName.trim());
    if (validRows.length === 0) { toast({ title: 'Add at least one item', variant: 'destructive' }); return; }

    setSaving(true);
    try {
      const partyId = await getOrCreateParty(partyName.trim());
      const finalized = await isPartyFinalized(partyId);
      if (finalized) {
        toast({ title: 'Party is finalized', description: 'Cannot add entries for a finalized party.', variant: 'destructive' });
        setSaving(false);
        return;
      }

      if (editingBlockId) {
        // Update existing block
        await db.purchaseRows.where('blockId').equals(editingBlockId).delete();
        await db.purchaseBlocks.update(editingBlockId, { date });
        await db.purchaseRows.bulkAdd(
          validRows.map((r, i) => ({
            blockId: editingBlockId,
            partyId,
            itemName: r.itemName.trim(),
            qty: r.qty,
            factor: r.factor || 1,
            totalPolate: r.factor ? r.qty / r.factor : r.qty,
            sortOrder: i,
          }))
        );
        setEditingBlockId(null);
        toast({ title: 'Block updated' });
      } else {
        const blockId = await db.purchaseBlocks.add({
          partyId, partyName: partyName.trim(), date, createdAt: new Date(),
        });
        await db.purchaseRows.bulkAdd(
          validRows.map((r, i) => ({
            blockId: blockId as number,
            partyId,
            itemName: r.itemName.trim(),
            qty: r.qty,
            factor: r.factor || 1,
            totalPolate: r.factor ? r.qty / r.factor : r.qty,
            sortOrder: i,
          }))
        );
        toast({ title: 'Saved successfully' });
      }

      setRows([{ key: crypto.randomUUID(), itemName: '', qty: 0, factor: 1 }]);
      clearDraft(DRAFT_KEY);
    } catch {
      toast({ title: 'Error saving', variant: 'destructive' });
    }
    setSaving(false);
  };

  const handleEditBlock = (blockId: number) => {
    const block = blocks.find(b => b.id === blockId);
    if (!block) return;
    const blockRows = allRows.filter(r => r.blockId === blockId);
    setDate(block.date);
    setRows(blockRows.map(r => ({
      key: crypto.randomUUID(),
      itemName: r.itemName,
      qty: r.qty,
      factor: r.factor,
    })));
    setEditingBlockId(blockId);
  };

  const handleDeleteBlock = async (blockId: number) => {
    await db.purchaseRows.where('blockId').equals(blockId).delete();
    await db.purchaseBlocks.delete(blockId);
    setDeletingBlockId(null);
    toast({ title: 'Block deleted' });
  };

  return (
    <div className="p-4 space-y-6">
      {/* Entry Form */}
      <Card className="p-4 space-y-4">
        <T tKey="purchase.title" as="h2" className="text-base font-semibold text-foreground" />

        {isLocked && (
          <div className="text-sm text-destructive font-medium flex items-center gap-1">
            <T tKey="purchase.locked" />
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div>
            <T tKey="purchase.date" as="label" className="text-xs font-medium text-muted-foreground mb-1 block" />
            <Input type="date" value={date} onChange={e => setDate(e.target.value)} />
          </div>
          <div>
            <T tKey="purchase.partyName" as="label" className="text-xs font-medium text-muted-foreground mb-1 block" />
            <ComboboxInput
              value={partyName}
              onChange={setPartyName}
              options={partyNames}
              placeholder="Select or add party"
              showTransliteration={hindiEnabled}
            />
          </div>
        </div>

        {!isLocked && (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-muted-foreground">
                    <th className="text-left py-2 px-1 font-medium"><T tKey="purchase.item" /></th>
                    <th className="text-right py-2 px-1 font-medium w-20"><T tKey="purchase.qty" /></th>
                    <th className="text-right py-2 px-1 font-medium w-20"><T tKey="purchase.factor" /></th>
                    <th className="text-right py-2 px-1 font-medium w-24"><T tKey="purchase.totalPolate" /></th>
                    <th className="w-10"></th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map(row => (
                    <tr key={row.key} className="border-b border-border/50">
                      <td className="py-1.5 px-1">
                        <ComboboxInput
                          value={row.itemName}
                          onChange={v => updateRow(row.key, 'itemName', v)}
                          options={itemNames}
                          placeholder="Item"
                          showTransliteration={hindiEnabled}
                          compact
                        />
                      </td>
                      <td className="py-1.5 px-1">
                        <Input type="number" value={row.qty || ''} onChange={e => updateRow(row.key, 'qty', Number(e.target.value))} className="h-8 text-sm text-right" />
                      </td>
                      <td className="py-1.5 px-1">
                        <Input type="number" value={row.factor || ''} onChange={e => updateRow(row.key, 'factor', Number(e.target.value))} className="h-8 text-sm text-right" />
                      </td>
                      <td className="py-1.5 px-1 text-right font-medium text-foreground">
                        {row.factor ? (row.qty / row.factor).toFixed(2) : '0.00'}
                      </td>
                      <td className="py-1.5 px-1">
                        <button onClick={() => removeRow(row.key)} className="p-1 text-destructive hover:bg-destructive/10 rounded">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-between">
              <Button variant="outline" size="sm" onClick={addRow}>
                <Plus className="h-4 w-4 mr-1" /> <T tKey="purchase.addRow" />
              </Button>
              <Button size="sm" onClick={handleSave} disabled={saving}>
                <Save className="h-4 w-4 mr-1" /> {editingBlockId ? 'Update' : <T tKey="purchase.saveAll" />}
              </Button>
            </div>

            {editingBlockId && (
              <Button variant="ghost" size="sm" onClick={() => {
                setEditingBlockId(null);
                setRows([{ key: crypto.randomUUID(), itemName: '', qty: 0, factor: 1 }]);
              }}>
                <X className="h-4 w-4 mr-1" /> Cancel Edit
              </Button>
            )}
          </>
        )}
      </Card>

      {/* Saved entries for selected party */}
      {partyName && partyBlocks.length > 0 && (
        <Card className="p-4 space-y-2">
          <h3 className="font-semibold text-foreground">
            <DualName en={partyName} hi={hindiEnabled ? transliterateToHindi(partyName) : undefined} />
          </h3>
          {partyBlocks.map(block => {
            const blockRows = allRows.filter(r => r.blockId === block.id);
            return (
              <div key={block.id} className="border rounded-md p-3 space-y-1">
                <div className="flex justify-between items-center">
                  <p className="text-xs text-muted-foreground">{block.date}</p>
                  {!isLocked && (
                    <div className="flex gap-1">
                      <button onClick={() => handleEditBlock(block.id!)} className="p-1 text-primary hover:bg-primary/10 rounded" title="Edit">
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      {deletingBlockId === block.id ? (
                        <div className="flex gap-1 items-center text-xs">
                          <span className="text-muted-foreground">Delete?</span>
                          <button onClick={() => handleDeleteBlock(block.id!)} className="text-destructive font-medium">Yes</button>
                          <button onClick={() => setDeletingBlockId(null)} className="text-muted-foreground">No</button>
                        </div>
                      ) : (
                        <button onClick={() => setDeletingBlockId(block.id!)} className="p-1 text-destructive hover:bg-destructive/10 rounded" title="Delete">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  )}
                </div>
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-muted-foreground border-b">
                      <th className="text-left py-1"><T tKey="purchase.item" /></th>
                      <th className="text-right py-1"><T tKey="purchase.qty" /></th>
                      <th className="text-right py-1"><T tKey="purchase.factor" /></th>
                      <th className="text-right py-1"><T tKey="purchase.totalPolate" /></th>
                    </tr>
                  </thead>
                  <tbody>
                    {blockRows.map(r => (
                      <tr key={r.id} className="border-b border-border/30">
                        <td className="py-1">
                          <DualName en={r.itemName} hi={hindiEnabled ? transliterateToHindi(r.itemName) : undefined} />
                        </td>
                        <td className="py-1 text-right">{r.qty}</td>
                        <td className="py-1 text-right">{r.factor}</td>
                        <td className="py-1 text-right font-medium">{r.totalPolate.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          })}
        </Card>
      )}

      {partyName && partyBlocks.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-4"><T tKey="purchase.noEntries" /></p>
      )}
    </div>
  );
}
