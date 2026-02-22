// This component renders off-screen and gets screenshotted by html2canvas
// All Hindi renders perfectly because the browser handles it natively

import { transliterateToHindi } from '@/lib/sanscript';
import { pdfStyles, formatCurrency, PDF_COLORS } from '@/lib/pdfStyles';
import {
  DualText,
  PDFTable,
  PDFTableHeader,
  PDFTableRow,
  ItemWithHindi,
  SectionTitle,
  CalculationRow,
} from '@/components/pdf/PDFComponents';

interface PDFTemplateProps {
  partyName: string;
  hindiEnabled: boolean;
  date: string;
  purchaseBlocks: Array<{
    date: string;
    items: Array<{ itemName: string; qty: number; factor: number; totalPolate: number; price: number; amount: number }>;
  }>;
  items: { itemName: string; totalQty: number; price: number; totalAmount: number }[];
  grandTotal: number;
  payments: { date: string; amount: number }[];
  totalPayments: number;
  openingBalance: number;
  purchaseAmount: number;
  adjustments: { type: 'add' | 'subtract'; amount: number; note: string }[];
  finalBalance: number;
}

export default function SettlementPDFTemplate({
  partyName,
  hindiEnabled,
  date,
  purchaseBlocks,
  items,
  grandTotal,
  payments,
  totalPayments,
  openingBalance,
  purchaseAmount,
  adjustments,
  finalBalance,
}: PDFTemplateProps) {
  return (
    <div style={pdfStyles.container}>
        {/* Title */}
        <div style={pdfStyles.title}>
        <DualText
          en={`Settlement — ${partyName}`}
          hi={`निपटान — ${transliterateToHindi(partyName)}`}
          hindiEnabled={hindiEnabled}
        />
      </div>
      <div style={pdfStyles.subtitle}>Date: {date}</div>

      {/* Detailed Purchase Entries */}
      {purchaseBlocks.length > 0 && (
        <>
          <SectionTitle en="Purchase Details" hi="खरीद विवरण" hindiEnabled={hindiEnabled} />
          {purchaseBlocks.map((block, blockIdx) => {
            const blockTotal = block.items.reduce((sum, item) => sum + item.amount, 0);
            return (
              <div key={blockIdx} style={{ marginBottom: '16px' }}>
                <div style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '6px', color: PDF_COLORS.text.secondary, pageBreakAfter: 'avoid' }}>
                  Date: {block.date}
                </div>
                <PDFTable>
                  <PDFTableHeader
                    columns={[
                      { label: 'Item', hindiLabel: 'वस्तु' },
                      { label: 'Qty', hindiLabel: 'मात्रा', align: 'center' },
                      { label: 'Factor', hindiLabel: 'गुणक', align: 'center' },
                      { label: 'Polate', hindiLabel: 'पोलाटे', align: 'right' },
                      { label: 'Rate', hindiLabel: 'दर', align: 'right' },
                      { label: 'Amount', hindiLabel: 'राशि', align: 'right' },
                    ]}
                    hindiEnabled={hindiEnabled}
                  />
                  <tbody>
                    {block.items.map((item, i) => (
                      <PDFTableRow
                        key={i}
                        backgroundColor={i % 2 === 0 ? 'white' : PDF_COLORS.bg.light}
                        cells={[
                          { content: <ItemWithHindi name={item.itemName} hindiEnabled={hindiEnabled} /> },
                          { content: item.qty, align: 'center' },
                          { content: item.factor, align: 'center' },
                          { content: item.totalPolate.toFixed(2), align: 'right' },
                          { content: item.price > 0 ? formatCurrency(item.price) : '-', align: 'right' },
                          { content: item.amount > 0 ? formatCurrency(item.amount) : '-', align: 'right' },
                        ]}
                      />
                    ))}
                  </tbody>
                  {blockTotal > 0 && (
                    <tfoot>
                      <PDFTableRow
                        isFooter
                        cells={[
                          { content: '', align: 'right' },
                          { content: '', align: 'right' },
                          { content: '', align: 'right' },
                          { content: '', align: 'right' },
                          { content: <strong>Subtotal:</strong>, align: 'right' },
                          { content: formatCurrency(blockTotal), align: 'right' },
                        ]}
                      />
                    </tfoot>
                  )}
                </PDFTable>
              </div>
            );
          })}
        </>
      )}

      {/* Payments */}
      <div style={{ marginTop: '20px' }}>
      <SectionTitle en="Payments" hi="भुगतान" hindiEnabled={hindiEnabled} />
      <PDFTable>
        <PDFTableHeader
          columns={[
            { label: 'Date', hindiLabel: 'तारीख' },
            { label: 'Amount', hindiLabel: 'राशि', align: 'right' },
          ]}
          hindiEnabled={hindiEnabled}
        />
        <tbody>
          {payments.length === 0 && (
            <PDFTableRow
              cells={[
                {
                  content: (
                    <span style={{ color: PDF_COLORS.text.lightMuted, textAlign: 'center' }}>
                      No payments
                    </span>
                  ),
                  align: 'center',
                },
              ]}
            />
          )}
          {payments.map((p, i) => (
            <PDFTableRow
              key={i}
              backgroundColor={i % 2 === 0 ? 'white' : PDF_COLORS.bg.light}
              cells={[
                { content: p.date },
                { content: formatCurrency(p.amount), align: 'right' },
              ]}
            />
          ))}
        </tbody>
        <tfoot>
          <PDFTableRow
            isFooter
            cells={[
              { content: <DualText en="Total" hi="कुल" hindiEnabled={hindiEnabled} /> },
              { content: formatCurrency(totalPayments), align: 'right' },
            ]}
          />
        </tfoot>
      </PDFTable>
      </div>

      {/* Settlement Calculation */}
      <div style={{ marginTop: '20px' }}>
      <SectionTitle en="Settlement Calculation" hi="निपटान गणना" hindiEnabled={hindiEnabled} />
      <PDFTable>
        <tbody>
          <CalculationRow
            label="Opening Balance"
            hindiLabel="शुरुआती बैलेंस"
            value={openingBalance}
            hindiEnabled={hindiEnabled}
          />
          <CalculationRow
            label="+ Purchase Amount"
            hindiLabel="+ खरीद राशि"
            value={purchaseAmount}
            hindiEnabled={hindiEnabled}
          />
          <CalculationRow
            label="− Total Payments"
            hindiLabel="− कुल भुगतान"
            value={totalPayments}
            hindiEnabled={hindiEnabled}
          />
          {adjustments
            .filter((a) => a.amount > 0)
            .map((adj, i) => {
              const sign = adj.type === 'add' ? '+' : '−';
              const label = adj.note || 'Adjustment';
              return (
                <CalculationRow
                  key={i}
                  label={`${sign} ${label}`}
                  hindiLabel={`${sign} ${transliterateToHindi(label)}`}
                  value={adj.amount}
                  hindiEnabled={hindiEnabled}
                  color={adj.type === 'add' ? PDF_COLORS.status.success : PDF_COLORS.status.danger}
                  prefix={adj.type === 'add' ? '+' : '−'}
                />
              );
            })}
          <CalculationRow
            label="Final Balance"
            hindiLabel="अंतिम बैलेंस"
            value={finalBalance}
            bold
            hindiEnabled={hindiEnabled}
          />
        </tbody>
      </PDFTable>
      </div>

      {/* Footer */}
      <div style={pdfStyles.footer}>Settled on {date}</div>
    </div>
  );
}
