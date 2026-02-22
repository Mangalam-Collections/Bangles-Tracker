import { useState, useEffect } from 'react';
import { db, getPartyPurchaseTotal, getPartyTotalPayments, clearPartyTransactions } from '@/db';
import { useLiveQuery } from 'dexie-react-hooks';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileText, CheckCircle, Plus, Trash2 } from '@/lib/icons';
import { toast } from '@/hooks/use-toast';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger
} from '@/components/ui/alert-dialog';
import { T, DualName } from '@/components/DualText';
import { useLanguage } from '@/contexts/LanguageContext';
import { transliterateToHindi } from '@/lib/sanscript';
import { saveDraft, loadDraft, clearDraft } from '@/lib/drafts';

interface AdjustmentRow {
  key: string;
  type: 'add' | 'subtract';
  amount: number;
  note: string;
}

const DRAFT_KEY = 'settlement';

export default function Settlement() {
  const { hindiEnabled } = useLanguage();
  const [selectedParty, setSelectedParty] = useState('');
  const [openingBalance, setOpeningBalance] = useState(0);
  const [purchaseAmount, setPurchaseAmount] = useState(0);
  const [totalPayments, setTotalPayments] = useState(0);
  const [adjustments, setAdjustments] = useState<AdjustmentRow[]>([]);

  const parties = useLiveQuery(() => db.parties.toArray(), []) ?? [];
  const finalizations = useLiveQuery(() => db.finalizations.toArray(), []) ?? [];
  const finalizedItems = useLiveQuery(() => db.finalizedItems.toArray(), []) ?? [];
  const payments = useLiveQuery(() => db.payments.toArray(), []) ?? [];

  const selectedPartyObj = parties.find(p => p.name === selectedParty);

  useEffect(() => {
    if (!selectedPartyObj?.id) return;
    const pid = selectedPartyObj.id;
    setOpeningBalance(selectedPartyObj.openingBalance || 0);
    getPartyPurchaseTotal(pid).then(setPurchaseAmount);
    getPartyTotalPayments(pid).then(setTotalPayments);

    // Load draft adjustments
    const draft = loadDraft<AdjustmentRow[]>(`${DRAFT_KEY}_${pid}`);
    if (draft && draft.length > 0) {
      setAdjustments(draft);
    } else {
      setAdjustments([]);
    }
  }, [selectedPartyObj]);

  // Auto-save adjustments draft
  useEffect(() => {
    if (!selectedPartyObj?.id) return;
    if (adjustments.length === 0) return;
    const timer = setTimeout(() => {
      saveDraft(`${DRAFT_KEY}_${selectedPartyObj.id}`, adjustments);
      toast({ title: 'Draft saved', duration: 2000 });
    }, 400);
    return () => clearTimeout(timer);
  }, [adjustments, selectedPartyObj]);

  const totalAddAdj = adjustments.filter(a => a.type === 'add').reduce((s, a) => s + (a.amount || 0), 0);
  const totalSubAdj = adjustments.filter(a => a.type === 'subtract').reduce((s, a) => s + (a.amount || 0), 0);
  const netBalance = openingBalance + purchaseAmount - totalPayments;
  const finalBalance = netBalance + totalAddAdj - totalSubAdj;

  const addAdjustment = () => {
    setAdjustments(prev => [...prev, { key: crypto.randomUUID(), type: 'add', amount: 0, note: '' }]);
  };

  const updateAdjustment = (key: string, field: keyof AdjustmentRow, value: any) => {
    setAdjustments(prev => prev.map(a => a.key === key ? { ...a, [field]: value } : a));
  };

  const removeAdjustment = (key: string) => {
    setAdjustments(prev => prev.filter(a => a.key !== key));
  };

  const generatePDF = () => {
    if (!selectedPartyObj?.id) return;
    const pid = selectedPartyObj.id;
    const doc = new jsPDF();

    doc.setFontSize(16);
    doc.text(`Settlement — ${selectedParty}`, 14, 20);
    doc.setFontSize(10);
    doc.text(`Date: ${new Date().toLocaleDateString('en-IN')}`, 14, 28);

    // Finalized items
    const partyFin = finalizations.find(f => f.partyId === pid);
    if (partyFin) {
      const items = finalizedItems.filter(fi => fi.finalizationId === partyFin.id);
      doc.setFontSize(12);
      doc.text('Purchase Summary', 14, 38);
      autoTable(doc, {
        startY: 42,
        head: [['Item', 'Qty', 'Price', 'Total']],
        body: items.map(i => [i.itemName, i.totalQty.toString(), `₹${i.price}`, `₹${i.totalAmount.toLocaleString('en-IN')}`]),
        foot: [['', '', 'Grand Total', `₹${partyFin.grandTotal.toLocaleString('en-IN')}`]],
      });
    }

    // Payments
    const partyPayments = payments.filter(p => p.partyId === pid);
    const lastY = (doc as any).lastAutoTable?.finalY ?? 60;
    doc.setFontSize(12);
    doc.text('Payments', 14, lastY + 10);
    autoTable(doc, {
      startY: lastY + 14,
      head: [['Date', 'Amount']],
      body: partyPayments.map(p => [p.date, `₹${p.amount.toLocaleString('en-IN')}`]),
      foot: [['Total', `₹${totalPayments.toLocaleString('en-IN')}`]],
    });

    // Settlement with individual adjustments
    const lastY2 = (doc as any).lastAutoTable?.finalY ?? 120;
    doc.setFontSize(12);
    doc.text('Settlement Calculation', 14, lastY2 + 10);

    const settBody: string[][] = [
      ['Opening Balance', `₹${openingBalance.toLocaleString('en-IN')}`],
      ['+ Purchase Amount', `₹${purchaseAmount.toLocaleString('en-IN')}`],
      ['− Total Payments', `₹${totalPayments.toLocaleString('en-IN')}`],
    ];

    for (const adj of adjustments) {
      if (adj.amount > 0) {
        const sign = adj.type === 'add' ? '+' : '−';
        settBody.push([`${sign} ${adj.note || 'Adjustment'}`, `₹${adj.amount.toLocaleString('en-IN')}`]);
      }
    }

    settBody.push(['Final Balance', `₹${finalBalance.toLocaleString('en-IN')}`]);

    autoTable(doc, { startY: lastY2 + 14, body: settBody });

    const lastY3 = (doc as any).lastAutoTable?.finalY ?? 180;
    doc.setFontSize(9);
    doc.text(`Settled on ${new Date().toLocaleDateString('en-IN')}`, 14, lastY3 + 10);

    doc.save(`settlement-${selectedParty}-${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  const handleDone = async () => {
    if (!selectedPartyObj?.id) return;

    await db.settlements.add({
      partyId: selectedPartyObj.id,
      partyName: selectedParty,
      openingBalance,
      purchaseAmount,
      totalPayments,
      adjustments: adjustments.map(a => ({ type: a.type, amount: a.amount, note: a.note })),
      finalBalance,
      settledAt: new Date(),
    });

    generatePDF();

    clearDraft(`${DRAFT_KEY}_${selectedPartyObj.id}`);
    await clearPartyTransactions(selectedPartyObj.id, finalBalance);
    toast({ title: 'Settlement complete', description: `${selectedParty} data cleared. Balance carried forward: ₹${finalBalance.toLocaleString('en-IN')}` });
    setSelectedParty('');
    setAdjustments([]);
  };

  return (
    <div className="p-4 space-y-6">
      <Card className="p-4 space-y-4">
        <T tKey="settlement.title" as="h2" className="text-base font-semibold text-foreground" />

        <div>
          <T tKey="common.selectParty" as="label" className="text-xs font-medium text-muted-foreground mb-1 block" />
          <Select value={selectedParty} onValueChange={setSelectedParty}>
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

        {selectedPartyObj && (
          <div className="space-y-3">
            {/* Balance breakdown */}
            <div className="space-y-2 rounded-lg border p-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground"><T tKey="settlement.openingBalance" /></span>
                <Input
                  type="number"
                  value={openingBalance || ''}
                  onChange={e => setOpeningBalance(Number(e.target.value))}
                  className="h-7 w-28 text-right text-sm"
                />
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground"><T tKey="settlement.purchaseAmount" /></span>
                <span className="font-medium">₹{purchaseAmount.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground"><T tKey="settlement.totalPayments" /></span>
                <span className="font-medium">₹{totalPayments.toLocaleString('en-IN')}</span>
              </div>
              <div className="border-t pt-2 flex justify-between text-sm font-semibold">
                <span><T tKey="settlement.netBalance" /></span>
                <span className="text-primary">₹{netBalance.toLocaleString('en-IN')}</span>
              </div>
            </div>

            {/* Multi-row adjustments */}
            <div className="space-y-2 rounded-lg border p-3">
              <h4 className="text-xs font-medium text-muted-foreground"><T tKey="settlement.adjustments" /></h4>
              {adjustments.map(adj => (
                <div key={adj.key} className="flex gap-1.5 items-center">
                  <button
                    onClick={() => updateAdjustment(adj.key, 'type', 'add')}
                    className={`px-2 py-1 text-xs rounded font-bold transition-colors ${
                      adj.type === 'add'
                        ? 'bg-success/20 text-success border border-success/40'
                        : 'bg-muted text-muted-foreground border border-border'
                    }`}
                  >+</button>
                  <button
                    onClick={() => updateAdjustment(adj.key, 'type', 'subtract')}
                    className={`px-2 py-1 text-xs rounded font-bold transition-colors ${
                      adj.type === 'subtract'
                        ? 'bg-destructive/20 text-destructive border border-destructive/40'
                        : 'bg-muted text-muted-foreground border border-border'
                    }`}
                  >−</button>
                  <Input
                    type="number"
                    value={adj.amount || ''}
                    onChange={e => updateAdjustment(adj.key, 'amount', Number(e.target.value))}
                    placeholder="Amount"
                    className="h-7 text-sm flex-1"
                  />
                  <Input
                    value={adj.note}
                    onChange={e => updateAdjustment(adj.key, 'note', e.target.value)}
                    placeholder="Remark"
                    className="h-7 text-sm flex-[2]"
                  />
                  <button onClick={() => removeAdjustment(adj.key)} className="p-1 text-destructive hover:bg-destructive/10 rounded">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
              <Button variant="outline" size="sm" onClick={addAdjustment} className="w-full">
                <Plus className="h-4 w-4 mr-1" /> <T tKey="settlement.addAdjustment" />
              </Button>
            </div>

            {/* Final balance */}
            <div className="rounded-lg bg-primary/10 p-4 text-center">
              <p className="text-xs text-muted-foreground mb-1"><T tKey="settlement.finalBalance" /></p>
              <p className="text-2xl font-bold text-primary">₹{finalBalance.toLocaleString('en-IN')}</p>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={generatePDF}>
                <FileText className="h-4 w-4 mr-1" /> <T tKey="settlement.previewPDF" />
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button className="flex-1">
                    <CheckCircle className="h-4 w-4 mr-1" /> <T tKey="settlement.done" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle><T tKey="settlement.confirmTitle" /></AlertDialogTitle>
                    <AlertDialogDescription>
                      This will generate a PDF, clear all transaction data for {selectedParty}, and carry forward ₹{finalBalance.toLocaleString('en-IN')} as next month's opening balance. This cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel><T tKey="settlement.cancel" /></AlertDialogCancel>
                    <AlertDialogAction onClick={handleDone}><T tKey="settlement.confirmGenerate" /></AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
