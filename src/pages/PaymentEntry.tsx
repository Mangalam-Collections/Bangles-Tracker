import { useState, useRef, useEffect, KeyboardEvent } from 'react';
import { db, getOrCreateParty } from '@/db';
import { useLiveQuery } from 'dexie-react-hooks';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2, Save, Pencil, X } from '@/lib/icons';
import { toast } from '@/hooks/use-toast';
import { T, DualName } from '@/components/DualText';
import { useLanguage } from '@/contexts/LanguageContext';
import { transliterateToHindi } from '@/lib/sanscript';
import { saveDraft, loadDraft, clearDraft } from '@/lib/drafts';
import { createRowUtils, generateRowKey, handleTableKeyDown } from '@/lib/tableUtils';
import { CommonValidations } from '@/lib/validation';
import { formatCurrency, getTodayString, UI_COLORS } from '@/lib/styles';
import { useDraftStatus } from '@/hooks/use-draft-status';
import { DraftStatusIndicator } from '@/components/DraftStatusIndicator';

interface PaymentRow {
  key: string;
  date: string;
  amount: number;
}

const DRAFT_KEY = 'payment_entry';

// Create row management utilities
const rowUtils = createRowUtils<PaymentRow>();

export default function PaymentEntry() {
  const { hindiEnabled } = useLanguage();
  const { status: draftStatus, markSaving, markSaved, reset: resetDraftStatus } = useDraftStatus();
  const [selectedParty, setSelectedParty] = useState('');
  const [rows, setRows] = useState<PaymentRow[]>([
    { key: generateRowKey(), date: getTodayString(), amount: 0 },
  ]);
  const [saving, setSaving] = useState(false);
  const [editingPaymentId, setEditingPaymentId] = useState<number | null>(null);
  const [editDate, setEditDate] = useState('');
  const [editAmount, setEditAmount] = useState(0);
  const [deletingPaymentId, setDeletingPaymentId] = useState<number | null>(null);
  const tableRef = useRef<HTMLTableElement>(null);

  const parties = useLiveQuery(() => db.parties.toArray(), []) ?? [];
  const payments = useLiveQuery(
    () => selectedParty
      ? db.payments.filter(p => p.partyName === selectedParty).toArray()
      : Promise.resolve([]),
    [selectedParty]
  ) ?? [];

  const runningTotal = rowUtils.calculateTotal(rows, 'amount');
  const savedTotal = payments.reduce((s, p) => s + p.amount, 0);

  // Load draft
  useEffect(() => {
    if (!selectedParty) return;
    const draft = loadDraft<PaymentRow[]>(`${DRAFT_KEY}_${selectedParty}`);
    if (draft && draft.length > 0 && draft.some(r => r.amount > 0)) {
      setRows(draft);
    }
  }, [selectedParty]);

  // Auto-save draft
  useEffect(() => {
    if (!selectedParty) return;
    if (rows.some(r => r.amount > 0)) {
      markSaving();
      const timer = setTimeout(() => {
        saveDraft(`${DRAFT_KEY}_${selectedParty}`, rows);
        markSaved();
      }, 400);
      return () => clearTimeout(timer);
    } else {
      resetDraftStatus();
    }
  }, [rows, selectedParty, markSaving, markSaved, resetDraftStatus]);

  const addRow = () => {
    setRows(prev => rowUtils.addRow(prev, { date: getTodayString(), amount: 0 }));
  };

  const updateRow = (key: string, field: 'date' | 'amount', value: string | number) => {
    setRows(prev => rowUtils.updateRow(prev, key, field, value));
  };

  const removeRow = (key: string) => {
    setRows(prev => rowUtils.removeRow(prev, key));
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>, rowIndex: number, field: 'date' | 'amount') => {
    const colIndex = field === 'date' ? 0 : 1;
    handleTableKeyDown(e, rowIndex, colIndex, tableRef, {
      cols: 2,
      onAddRow: addRow,
    });

    // Handle left/right arrow keys for horizontal navigation
    const inputs = tableRef.current?.querySelectorAll<HTMLInputElement>('input');
    if (!inputs) return;
    const currentIdx = rowIndex * 2 + colIndex;

    if (e.key === 'ArrowLeft' && field === 'amount' && currentIdx > 0) {
      e.preventDefault();
      inputs[currentIdx - 1]?.focus();
    } else if (e.key === 'ArrowRight' && field === 'date' && currentIdx < inputs.length - 1) {
      e.preventDefault();
      inputs[currentIdx + 1]?.focus();
    }
  };

  const handleSave = async () => {
    if (!CommonValidations.selectionRequired(selectedParty, 'party')) return;
    const validRows = rowUtils.filterValidRows(rows, r => r.amount > 0);
    if (!CommonValidations.hasValidRows(validRows.length, 'payment')) return;

    setSaving(true);
    try {
      const party = parties.find(p => p.name === selectedParty);
      const partyId = party?.id ?? await getOrCreateParty(selectedParty);

      await db.payments.bulkAdd(
        validRows.map(r => ({
          partyId,
          partyName: selectedParty,
          date: r.date,
          amount: r.amount,
          createdAt: new Date(),
        }))
      );

      clearDraft(`${DRAFT_KEY}_${selectedParty}`);
      toast({ title: 'Payments saved' });
      setRows([{ key: generateRowKey(), date: getTodayString(), amount: 0 }]);
    } catch {
      toast({ title: 'Error saving', variant: 'destructive' });
    }
    setSaving(false);
  };

  const handleEditPayment = (p: typeof payments[0]) => {
    setEditingPaymentId(p.id!);
    setEditDate(p.date);
    setEditAmount(p.amount);
  };

  const handleSaveEdit = async () => {
    if (!editingPaymentId) return;
    await db.payments.update(editingPaymentId, { date: editDate, amount: editAmount });
    setEditingPaymentId(null);
    toast({ title: 'Payment updated' });
  };

  const handleDeletePayment = async (id: number) => {
    await db.payments.delete(id);
    setDeletingPaymentId(null);
    toast({ title: 'Payment deleted' });
  };

  return (
    <div className="p-4 space-y-6">
      <Card className="p-4 space-y-4">
        <T tKey="payment.title" as="h2" className="text-base font-semibold text-foreground" />

        <div>
          <T tKey="common.selectParty" as="label" className="text-xs font-medium text-muted-foreground mb-1 block" />
          <Select value={selectedParty} onValueChange={v => { setSelectedParty(v); setRows([{ key: generateRowKey(), date: getTodayString(), amount: 0 }]); }}>
            <SelectTrigger><SelectValue placeholder="Choose party" /></SelectTrigger>
            <SelectContent>
              {parties.map(p => (
                <SelectItem key={p.id} value={p.name}>
                  <DualName en={p.name} hi={hindiEnabled ? transliterateToHindi(p.name) : undefined} />
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <table ref={tableRef} className="w-full text-sm">
          <thead>
            <tr className="border-b text-muted-foreground">
              <th className="text-left py-2 px-1 font-medium"><T tKey="payment.date" /></th>
              <th className="text-right py-2 px-1 font-medium"><T tKey="payment.amount" /></th>
              <th className="w-10"></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={row.key} className="border-b border-border/50">
                <td className="py-1.5 px-1">
                  <Input type="date" value={row.date} onChange={e => updateRow(row.key, 'date', e.target.value)} onKeyDown={e => handleKeyDown(e, i, 'date')} className="h-8 text-sm" />
                </td>
                <td className="py-1.5 px-1">
                  <Input type="number" value={row.amount || ''} onChange={e => updateRow(row.key, 'amount', Number(e.target.value))} onKeyDown={e => handleKeyDown(e, i, 'amount')} className="h-8 text-sm text-right" />
                </td>
                <td className="py-1.5 px-1">
                  <button onClick={() => removeRow(row.key)} className={`p-1 rounded ${UI_COLORS.button.destructive}`}>
                    <Trash2 className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="flex items-center justify-between">
          <Button variant="outline" size="sm" onClick={addRow}>
            <Plus className="h-4 w-4 mr-1" /> <T tKey="payment.addRow" />
          </Button>
          <div className="text-sm font-semibold text-foreground">
            <T tKey="payment.total" />: {formatCurrency(runningTotal)}
          </div>
        </div>

        <div className="flex justify-end items-center gap-3">
          <DraftStatusIndicator status={draftStatus} />
          <Button onClick={handleSave} disabled={saving}>
            <Save className="h-4 w-4 mr-1" /> <T tKey="payment.saveAll" />
          </Button>
        </div>
      </Card>

      {/* Saved payments with edit/delete */}
      {payments.length > 0 && (
        <Card className="p-4 space-y-2">
          <h3 className="text-sm font-semibold text-foreground">
            <T tKey="payment.savedPayments" /> — <DualName en={selectedParty} hi={hindiEnabled ? transliterateToHindi(selectedParty) : undefined} />
          </h3>
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b text-muted-foreground">
                <th className="text-left py-1"><T tKey="payment.date" /></th>
                <th className="text-right py-1"><T tKey="payment.amount" /></th>
                <th className="w-20"></th>
              </tr>
            </thead>
            <tbody>
              {payments.map(p => (
                <tr key={p.id} className="border-b border-border/30">
                  {editingPaymentId === p.id ? (
                    <>
                      <td className="py-1"><Input type="date" value={editDate} onChange={e => setEditDate(e.target.value)} className="h-7 text-xs" /></td>
                      <td className="py-1"><Input type="number" value={editAmount || ''} onChange={e => setEditAmount(Number(e.target.value))} className="h-7 text-xs text-right" /></td>
                      <td className="py-1 flex gap-1">
                        <button onClick={handleSaveEdit} className="text-primary text-xs font-medium">Save</button>
                        <button onClick={() => setEditingPaymentId(null)} className="text-muted-foreground text-xs">Cancel</button>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="py-1">{p.date}</td>
                      <td className="py-1 text-right">{formatCurrency(p.amount)}</td>
                      <td className="py-1 flex gap-1 justify-end">
                        <button onClick={() => handleEditPayment(p)} className="p-0.5 text-primary hover:bg-primary/10 rounded"><Pencil className="h-3 w-3" /></button>
                        {deletingPaymentId === p.id ? (
                          <span className="text-xs flex gap-1 items-center">
                            <button onClick={() => handleDeletePayment(p.id!)} className="text-destructive font-medium">Yes</button>
                            <button onClick={() => setDeletingPaymentId(null)} className="text-muted-foreground">No</button>
                          </span>
                        ) : (
                          <button onClick={() => setDeletingPaymentId(p.id!)} className="p-0.5 text-destructive hover:bg-destructive/10 rounded"><Trash2 className="h-3 w-3" /></button>
                        )}
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t">
                <td className="py-1 font-bold"><T tKey="payment.total" /></td>
                <td className="py-1 text-right font-bold">{formatCurrency(savedTotal)}</td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </Card>
      )}
    </div>
  );
}
