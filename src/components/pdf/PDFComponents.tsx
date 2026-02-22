// Reusable PDF components for consistent formatting

import { transliterateToHindi } from '@/lib/sanscript';
import { pdfStyles, PDF_COLORS, formatCurrency } from '@/lib/pdfStyles';

interface DualTextProps {
  en: string;
  hi?: string;
  hindiEnabled: boolean;
}

export const DualText: React.FC<DualTextProps> = ({ en, hi, hindiEnabled }) => (
  <span style={{ display: 'inline-flex', alignItems: 'baseline', gap: '8px' }}>
    <span style={{ fontSize: 'inherit', color: PDF_COLORS.text.primary, fontFamily: pdfStyles.tableCell.fontFamily }}>
      {en}
    </span>
    {hindiEnabled && hi && (
      <span style={{ fontSize: '0.9em', color: PDF_COLORS.text.secondary, fontFamily: pdfStyles.hindiText.fontFamily }}>
        {hi}
      </span>
    )}
  </span>
);

interface PDFTableProps {
  children: React.ReactNode;
}

export const PDFTable: React.FC<PDFTableProps> = ({ children }) => (
  <table style={pdfStyles.table}>{children}</table>
);

interface PDFTableHeaderProps {
  columns: Array<{ label: string; hindiLabel?: string; align?: 'left' | 'center' | 'right' }>;
  hindiEnabled: boolean;
}

export const PDFTableHeader: React.FC<PDFTableHeaderProps> = ({ columns, hindiEnabled }) => (
  <thead style={{ display: 'table-header-group' }}>
    <tr>
      {columns.map((col, idx) => (
        <th key={idx} style={{ ...pdfStyles.tableHeader, textAlign: col.align || 'left' }}>
          <DualText en={col.label} hi={col.hindiLabel} hindiEnabled={hindiEnabled} />
        </th>
      ))}
    </tr>
  </thead>
);

interface PDFTableRowProps {
  cells: Array<{ content: React.ReactNode; align?: 'left' | 'center' | 'right' }>;
  isFooter?: boolean;
  backgroundColor?: string;
}

export const PDFTableRow: React.FC<PDFTableRowProps> = ({ cells, isFooter = false, backgroundColor }) => {
  const style = isFooter ? pdfStyles.tableFooterCell : pdfStyles.tableCell;
  
  return (
    <tr style={{ pageBreakInside: 'avoid', ...(backgroundColor ? { backgroundColor } : {}) }}>
      {cells.map((cell, idx) => (
        <td key={idx} style={{ ...style, textAlign: cell.align || 'left' }}>
          {cell.content}
        </td>
      ))}
    </tr>
  );
};

interface ItemWithHindiProps {
  name: string;
  hindiEnabled: boolean;
}

export const ItemWithHindi: React.FC<ItemWithHindiProps> = ({ name, hindiEnabled }) => (
  <>
    <div>{name}</div>
    {hindiEnabled && (
      <div style={pdfStyles.hindiText}>
        {transliterateToHindi(name)}
      </div>
    )}
  </>
);

interface SectionTitleProps {
  en: string;
  hi?: string;
  hindiEnabled: boolean;
}

export const SectionTitle: React.FC<SectionTitleProps> = ({ en, hi, hindiEnabled }) => (
  <div style={pdfStyles.sectionTitle}>
    <DualText en={en} hi={hi} hindiEnabled={hindiEnabled} />
  </div>
);

interface CalculationRowProps {
  label: string;
  hindiLabel: string;
  value: number;
  bold?: boolean;
  hindiEnabled: boolean;
  color?: string;
  prefix?: string;
}

export const CalculationRow: React.FC<CalculationRowProps> = ({
  label,
  hindiLabel,
  value,
  bold = false,
  hindiEnabled,
  color,
  prefix,
}) => (
  <tr style={{ backgroundColor: bold ? PDF_COLORS.bg.lightGray : 'white' }}>
    <td style={{ ...pdfStyles.tableCell, fontWeight: bold ? 'bold' : 'normal' }}>
      <DualText en={label} hi={hindiLabel} hindiEnabled={hindiEnabled} />
    </td>
    <td
      style={{
        ...pdfStyles.tableCell,
        textAlign: 'right',
        fontWeight: bold ? 'bold' : 'normal',
        color: color || PDF_COLORS.text.primary,
      }}
    >
      {prefix}{formatCurrency(value)}
    </td>
  </tr>
);
