import { useState, useEffect } from 'react';
import { db, getPartyPurchaseSummary } from '@/db';
import { useLiveQuery } from 'dexie-react-hooks';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Save, CheckCircle, Trash2 } from '@/lib/icons';
import { toast } from '@/hooks/use-toast';
import { T, DualName } from '@/components/DualText';
import { useLanguage } from '@/contexts/LanguageContext';
import { transliterateToHindi } from '@/lib/sanscript';
import { saveDraft, loadDraft, clearDraft } from '@/lib/drafts';

interface SummaryRow {
  itemName: string;
  totalQty: number;
  price: number;
}

const DRAFT_KEY = 'monthly_summary';

export default function MonthlySummary() {
  const { hindiEnabled } = useLanguage();
  const [selectedParty, setSelectedParty] = useState('');
  const [summaryRows, setSummaryRows] = useState<SummaryRow[]>([]);
  const [saving, setSaving] = useState(false);
  const [deletingIdx, setDeletingIdx] = useState<number | null>(null);

  const parties = useLiveQuery(() => db.parties.toArray(), []) ?? [];
  const finalizations = useLiveQuery(() => db.finalizations.toArray(), []) ?? [];

  const finalizedPartyIds = new Set(finalizations.map(f => f.partyId));

  // Load draft when party changes
  useEffect(() => {
    if (!selectedParty) { setSummaryRows([]); return; }
    const party = parties.find(p => p.name === selectedParty);
    if (!party?.id) return;

    // Check for draft first
    const draft = loadDraft<SummaryRow[]>(`${DRAFT_KEY}_${party.id}`);
    if (draft && draft.length > 0) {
      setSummaryRows(draft);
      return;
    }

    getPartyPurchaseSummary(party.id).then(data => {
      setSummaryRows(data.map(d => ({ ...d, price: 0 })));
    });
  }, [selectedParty, parties]);

  // Auto-save draft for prices
  useEffect(() => {
    if (!selectedParty) return;
    const party = parties.find(p => p.name === selectedParty);
    if (!party?.id) return;
    if (summaryRows.some(r => r.price > 0)) {
      const timer = setTimeout(() => {
        saveDraft(`${DRAFT_KEY}_${party.id}`, summaryRows);
        toast({ title: 'Draft saved', duration: 2000 });
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [summaryRows, selectedParty, parties]);

  const grandTotal = summaryRows.reduce((s, r) => s + r.totalQty * r.price, 0);

  const handleDeleteRow = (idx: number) => {
    setSummaryRows(prev => prev.filter((_, i) => i !== idx));
    setDeletingIdx(null);
    toast({ title: 'Item removed' });
  };

  const handleFinalize = async () => {
    const party = parties.find(p => p.name === selectedParty);
    if (!party?.id) return;
    if (summaryRows.some(r => r.price <= 0)) {
      toast({ title: 'Enter price for all items', variant: 'destructive' });
      return;
    }

    setSaving(true);
    try {
      const finId = await db.finalizations.add({
        partyId: party.id, partyName: party.name, grandTotal, createdAt: new Date(),
      });

      await db.finalizedItems.bulkAdd(
        summaryRows.map(r => ({
          finalizationId: finId as number,
          partyId: party.id!,
          itemName: r.itemName,
          totalQty: r.totalQty,
          price: r.price,
          totalAmount: r.totalQty * r.price,
        }))
      );

      clearDraft(`${DRAFT_KEY}_${party.id}`);
      toast({ title: 'Finalized!', description: `${party.name} purchase locked.` });
      setSelectedParty('');
      setSummaryRows([]);
    } catch {
      toast({ title: 'Error', variant: 'destructive' });
    }
    setSaving(false);
  };

  const selectedPartyObj = parties.find(p => p.name === selectedParty);
  const isAlreadyFinalized = selectedPartyObj?.id ? finalizedPartyIds.has(selectedPartyObj.id) : false;

  return (
    <div className="p-4 space-y-6">
      <Card className="p-4 space-y-4">
        <T tKey="summary.title" as="h2" className="text-base font-semibold text-foreground" />

        <div>
          <T tKey="common.selectParty" as="label" className="text-xs font-medium text-muted-foreground mb-1 block" />
          <Select value={selectedParty} onValueChange={setSelectedParty}>
            <SelectTrigger><SelectValue placeholder="Choose party" /></SelectTrigger>
            <SelectContent>
              {parties.map(p => (
                <SelectItem key={p.id} value={p.name}>
                  <DualName en={p.name} hi={hindiEnabled ? transliterateToHindi(p.name) : undefined} />
                  {p.id && finalizedPartyIds.has(p.id) ? ' ✓' : ''}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {isAlreadyFinalized && (
          <div className="flex items-center gap-2 text-success text-sm">
            <CheckCircle className="h-4 w-4" />
            <T tKey="summary.finalized" />
          </div>
        )}

        {summaryRows.length > 0 && !isAlreadyFinalized && (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-muted-foreground">
                    <th className="text-left py-2 px-1 font-medium"><T tKey="summary.itemName" /></th>
                    <th className="text-right py-2 px-1 font-medium w-20"><T tKey="summary.totalQty" /></th>
                    <th className="text-right py-2 px-1 font-medium w-24"><T tKey="summary.priceUnit" /></th>
                    <th className="text-right py-2 px-1 font-medium w-28"><T tKey="summary.totalAmount" /></th>
                    <th className="w-10"></th>
                  </tr>
                </thead>
                <tbody>
                  {summaryRows.map((row, i) => (
                    <tr key={i} className="border-b border-border/50">
                      <td className="py-1.5 px-1">
                        <DualName en={row.itemName} hi={hindiEnabled ? transliterateToHindi(row.itemName) : undefined} />
                      </td>
                      <td className="py-1.5 px-1 text-right">{row.totalQty}</td>
                      <td className="py-1.5 px-1">
                        <Input
                          type="number"
                          value={row.price || ''}
                          onChange={e => {
                            const val = Number(e.target.value);
                            setSummaryRows(prev => prev.map((r, j) => j === i ? { ...r, price: val } : r));
                          }}
                          className="h-8 text-sm text-right"
                        />
                      </td>
                      <td className="py-1.5 px-1 text-right font-semibold">
                        ₹{(row.totalQty * row.price).toLocaleString('en-IN')}
                      </td>
                      <td className="py-1.5 px-1">
                        {deletingIdx === i ? (
                          <div className="flex gap-1 items-center text-xs">
                            <button onClick={() => handleDeleteRow(i)} className="text-destructive font-medium">Yes</button>
                            <button onClick={() => setDeletingIdx(null)} className="text-muted-foreground">No</button>
                          </div>
                        ) : (
                          <button onClick={() => setDeletingIdx(i)} className="p-1 text-destructive hover:bg-destructive/10 rounded">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2">
                    <td colSpan={3} className="py-2 px-1 text-right font-bold"><T tKey="summary.grandTotal" /></td>
                    <td className="py-2 px-1 text-right font-bold text-primary">
                      ₹{grandTotal.toLocaleString('en-IN')}
                    </td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>

            <div className="flex justify-end">
              <Button onClick={handleFinalize} disabled={saving}>
                <Save className="h-4 w-4 mr-1" /> <T tKey="summary.finalize" />
              </Button>
            </div>
          </>
        )}

        {selectedParty && summaryRows.length === 0 && !isAlreadyFinalized && (
          <p className="text-sm text-muted-foreground text-center py-4"><T tKey="summary.noEntries" /></p>
        )}
      </Card>
    </div>
  );
}
