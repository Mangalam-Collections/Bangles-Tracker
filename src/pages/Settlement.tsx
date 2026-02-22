import { useState, useEffect } from 'react';
import { db, getPartyPurchaseTotal, getPartyTotalPayments, clearPartyTransactions } from '@/db';
import { useLiveQuery } from 'dexie-react-hooks';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileText, CheckCircle, Plus, Trash2 } from '@/lib/icons';
import { toast } from '@/hooks/use-toast';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger
} from '@/components/ui/alert-dialog';
import { T, DualName } from '@/components/DualText';
import { useLanguage } from '@/contexts/LanguageContext';
import { transliterateToHindi } from '@/lib/sanscript';
import { saveDraft, loadDraft, clearDraft } from '@/lib/drafts';
import { exportComponentAsPDF, generatePDFFilename } from '@/lib/pdfExport';
import { formatCurrency, UI_COLORS, COMPONENT_CLASSES } from '@/lib/styles';
import { createRowUtils, generateRowKey } from '@/lib/tableUtils';
import SettlementPDFTemplate from '@/components/SettlementPDFTemplate';
import { useDraftStatus } from '@/hooks/use-draft-status';
import { DraftStatusIndicator } from '@/components/DraftStatusIndicator';

interface AdjustmentRow {
  key: string;
  type: 'add' | 'subtract';
  amount: number;
  note: string;
}

const DRAFT_KEY = 'settlement';

// Create row management utilities for adjustments
const rowUtils = createRowUtils<AdjustmentRow>();

export default function Settlement() {
  const { hindiEnabled } = useLanguage();
  const { status: draftStatus, markSaving, markSaved, reset: resetDraftStatus } = useDraftStatus();
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
    if (adjustments.length === 0) {
      resetDraftStatus();
      return;
    }
    markSaving();
    const timer = setTimeout(() => {
      saveDraft(`${DRAFT_KEY}_${selectedPartyObj.id}`, adjustments);
      markSaved();
    }, 400);
    return () => clearTimeout(timer);
  }, [adjustments, selectedPartyObj, markSaving, markSaved, resetDraftStatus]);

  const totalAddAdj = adjustments.filter(a => a.type === 'add').reduce((s, a) => s + (a.amount || 0), 0);
  const totalSubAdj = adjustments.filter(a => a.type === 'subtract').reduce((s, a) => s + (a.amount || 0), 0);
  const netBalance = openingBalance + purchaseAmount - totalPayments;
  const finalBalance = netBalance + totalAddAdj - totalSubAdj;

  const addAdjustment = () => {
    setAdjustments(prev => rowUtils.addRow(prev, { type: 'add', amount: 0, note: '' }));
  };

  const updateAdjustment = (key: string, field: keyof AdjustmentRow, value: any) => {
    setAdjustments(prev => rowUtils.updateRow(prev, key, field, value));
  };

  const removeAdjustment = (key: string) => {
    setAdjustments(prev => rowUtils.removeRowAllowEmpty(prev, key));
  };

  const generatePDF = async () => {
    if (!selectedPartyObj?.id) return;
    const pid = selectedPartyObj.id;

    const partyFin = finalizations.find(f => f.partyId === pid);
    const items = partyFin ? finalizedItems.filter(fi => fi.finalizationId === partyFin.id) : [];
    const partyPayments = payments.filter(p => p.partyId === pid);

    // Create a map of item names to their prices
    const priceMap = new Map<string, number>();
    items.forEach(item => {
      priceMap.set(item.itemName.toLowerCase(), item.price);
    });

    // Fetch purchase blocks and rows for detailed purchase history
    const blocks = await db.purchaseBlocks.where('partyId').equals(pid).sortBy('date');
    const purchaseBlocks = await Promise.all(
      blocks.map(async (block) => {
        const rows = await db.purchaseRows.where('blockId').equals(block.id!).sortBy('sortOrder');
        return {
          date: block.date,
          items: rows.map(row => {
            const price = priceMap.get(row.itemName.toLowerCase()) || 0;
            const amount = row.totalPolate * price;
            return {
              itemName: row.itemName,
              qty: row.qty,
              factor: row.factor,
              totalPolate: row.totalPolate,
              price: price,
              amount: amount,
            };
          }),
        };
      })
    );

    // Use the reusable PDF export utility
    await exportComponentAsPDF(
      <SettlementPDFTemplate
        partyName={selectedParty}
        hindiEnabled={hindiEnabled}
        date={new Date().toLocaleDateString('en-IN')}
        purchaseBlocks={purchaseBlocks}
        items={items}
        grandTotal={partyFin?.grandTotal ?? 0}
        payments={partyPayments}
        totalPayments={totalPayments}
        openingBalance={openingBalance}
        purchaseAmount={purchaseAmount}
        adjustments={adjustments}
        finalBalance={finalBalance}
      />,
      {
        filename: generatePDFFilename('settlement', selectedParty),
        scale: 2,
      }
    );
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
    toast({ title: 'Settlement complete', description: `${selectedParty} data cleared. Balance carried forward: ${formatCurrency(finalBalance)}` });
    setSelectedParty('');
    setAdjustments([]);
  };

  return (
    <div className="p-4 space-y-6">
      <Card className="p-4 space-y-4">
        <T tKey="settlement.title" as="h2" className="text-xl font-semibold text-foreground" />

        <div>
          <T tKey="common.selectParty" as="label" className="text-sm font-medium text-muted-foreground mb-1 block" />
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
            <div className="space-y-2 rounded-lg border p-4">
              <div className="flex justify-between text-base">
                <span className="text-muted-foreground"><T tKey="settlement.openingBalance" /></span>
                <Input
                  type="number"
                  value={openingBalance || ''}
                  onChange={e => setOpeningBalance(Number(e.target.value))}
                  className={COMPONENT_CLASSES.input.narrow}
                />
              </div>
              <div className="flex justify-between text-base">
                <span className="text-muted-foreground"><T tKey="settlement.purchaseAmount" /></span>
                <span className="font-medium">{formatCurrency(purchaseAmount)}</span>
              </div>
              <div className="flex justify-between text-base">
                <span className="text-muted-foreground"><T tKey="settlement.totalPayments" /></span>
                <span className="font-medium">{formatCurrency(totalPayments)}</span>
              </div>
              <div className="border-t pt-2 flex justify-between text-base font-semibold">
                <span><T tKey="settlement.netBalance" /></span>
                <span className="text-primary">{formatCurrency(netBalance)}</span>
              </div>
            </div>

            {/* Multi-row adjustments */}
            <div className="space-y-2 rounded-lg border p-4">
              <div className="flex justify-between items-center">
                <h4 className="text-sm font-medium text-muted-foreground"><T tKey="settlement.adjustments" /></h4>
                <DraftStatusIndicator status={draftStatus} />
              </div>
              {adjustments.map(adj => (
                <div key={adj.key} className="flex gap-1.5 items-center">
                  <button
                    onClick={() => updateAdjustment(adj.key, 'type', 'add')}
                    className={`${COMPONENT_CLASSES.toggleButton.base} ${
                      adj.type === 'add' ? UI_COLORS.button.add : UI_COLORS.button.neutral
                    }`}
                  >+</button>
                  <button
                    onClick={() => updateAdjustment(adj.key, 'type', 'subtract')}
                    className={`${COMPONENT_CLASSES.toggleButton.base} ${
                      adj.type === 'subtract' ? UI_COLORS.button.subtract : UI_COLORS.button.neutral
                    }`}
                  >−</button>
                  <Input
                    type="number"
                    value={adj.amount || ''}
                    onChange={e => updateAdjustment(adj.key, 'amount', Number(e.target.value))}
                    placeholder="Amount"
                    className={COMPONENT_CLASSES.input.wide}
                  />
                  <Input
                    value={adj.note}
                    onChange={e => updateAdjustment(adj.key, 'note', e.target.value)}
                    placeholder="Remark"
                    className="h-9 text-base flex-[2]"
                  />
                  <button onClick={() => removeAdjustment(adj.key)} className={`p-2 rounded ${UI_COLORS.button.destructive}`}>
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
              <Button variant="outline" size="sm" onClick={addAdjustment} className="w-full">
                <Plus className="h-4 w-4 mr-1" /> <T tKey="settlement.addAdjustment" />
              </Button>
            </div>

            {/* Final balance */}
            <div className="rounded-lg bg-primary/10 p-5 text-center">
              <p className="text-sm text-muted-foreground mb-2"><T tKey="settlement.finalBalance" /></p>
              <p className="text-3xl font-bold text-primary">{formatCurrency(finalBalance)}</p>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1 text-base py-5" onClick={generatePDF}>
                <FileText className="h-5 w-5 mr-2" /> <T tKey="settlement.previewPDF" />
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button className="flex-1 text-base py-5">
                    <CheckCircle className="h-5 w-5 mr-2" /> <T tKey="settlement.done" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle><T tKey="settlement.confirmTitle" /></AlertDialogTitle>
                    <AlertDialogDescription>
                      This will generate a PDF, clear all transaction data for {selectedParty}, and carry forward {formatCurrency(finalBalance)} as next month's opening balance. This cannot be undone.
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
