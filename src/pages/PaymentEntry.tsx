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

interface PaymentRow {
  key: string;
  date: string;
  amount: number;
}

const DRAFT_KEY = 'payment_entry';

export default function PaymentEntry() {
  const { hindiEnabled } = useLanguage();
  const [selectedParty, setSelectedParty] = useState('');
  const [rows, setRows] = useState<PaymentRow[]>([
    { key: crypto.randomUUID(), date: new Date().toISOString().slice(0, 10), amount: 0 },
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

  const runningTotal = rows.reduce((s, r) => s + (r.amount || 0), 0);
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
      const timer = setTimeout(() => {
        saveDraft(`${DRAFT_KEY}_${selectedParty}`, rows);
        toast({ title: 'Draft saved', duration: 2000 });
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [rows, selectedParty]);

  const addRow = () => {
    setRows(prev => [...prev, { key: crypto.randomUUID(), date: new Date().toISOString().slice(0, 10), amount: 0 }]);
  };

  const updateRow = (key: string, field: 'date' | 'amount', value: string | number) => {
    setRows(prev => prev.map(r => r.key === key ? { ...r, [field]: value } : r));
  };

  const removeRow = (key: string) => {
    setRows(prev => prev.length > 1 ? prev.filter(r => r.key !== key) : prev);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>, rowIndex: number, field: 'date' | 'amount') => {
    const inputs = tableRef.current?.querySelectorAll<HTMLInputElement>('input');
    if (!inputs) return;
    const cols = 2;
    const currentIdx = rowIndex * cols + (field === 'date' ? 0 : 1);

    if (e.key === 'Enter') {
      e.preventDefault();
      if (currentIdx >= inputs.length - 1) {
        addRow();
        setTimeout(() => {
          const newInputs = tableRef.current?.querySelectorAll<HTMLInputElement>('input');
          newInputs?.[newInputs.length - 2]?.focus();
        }, 50);
      } else {
        inputs[currentIdx + 1]?.focus();
      }
    } else if (e.key === 'ArrowUp' && rowIndex > 0) {
      e.preventDefault(); inputs[currentIdx - cols]?.focus();
    } else if (e.key === 'ArrowDown' && rowIndex < rows.length - 1) {
      e.preventDefault(); inputs[currentIdx + cols]?.focus();
    } else if (e.key === 'ArrowLeft' && field === 'amount') {
      e.preventDefault(); inputs[currentIdx - 1]?.focus();
    } else if (e.key === 'ArrowRight' && field === 'date') {
      e.preventDefault(); inputs[currentIdx + 1]?.focus();
    }
  };

  const handleSave = async () => {
    if (!selectedParty) { toast({ title: 'Select a party', variant: 'destructive' }); return; }
    const validRows = rows.filter(r => r.amount > 0);
    if (validRows.length === 0) { toast({ title: 'Enter at least one amount', variant: 'destructive' }); return; }

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
      setRows([{ key: crypto.randomUUID(), date: new Date().toISOString().slice(0, 10), amount: 0 }]);
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
          <Select value={selectedParty} onValueChange={v => { setSelectedParty(v); setRows([{ key: crypto.randomUUID(), date: new Date().toISOString().slice(0, 10), amount: 0 }]); }}>
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
                  <button onClick={() => removeRow(row.key)} className="p-1 text-destructive hover:bg-destructive/10 rounded">
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
            <T tKey="payment.total" />: ₹{runningTotal.toLocaleString('en-IN')}
          </div>
        </div>

        <div className="flex justify-end">
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
                      <td className="py-1 text-right">₹{p.amount.toLocaleString('en-IN')}</td>
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
                <td className="py-1 text-right font-bold">₹{savedTotal.toLocaleString('en-IN')}</td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </Card>
      )}
    </div>
  );
}
