// Centralized PDF styling constants for reusability

export const PDF_FONTS = {
  primary: 'Helvetica, Arial, sans-serif',
  hindi: "'Noto Sans Devanagari', serif",
} as const;

export const PDF_COLORS = {
  text: {
    primary: '#1e1e1e',
    secondary: '#666',
    muted: '#999',
    lightMuted: '#aaa',
  },
  bg: {
    white: 'white',
    light: '#f8f9fa',
    lightGray: '#ecf0f1',
    primary: '#2980b9',
  },
  status: {
    success: '#27ae60',
    danger: '#e74c3c',
  },
  border: '#ecf0f1',
} as const;

export const PDF_SPACING = {
  xs: '4px',
  sm: '6px',
  md: '8px',
  lg: '12px',
  xl: '20px',
  xxl: '24px',
  xxxl: '32px',
} as const;

export const PDF_FONT_SIZES = {
  xs: '9px',
  sm: '11px',
  base: '12px',
  md: '13px',
  lg: '15px',
  xl: '20px',
} as const;

export const pdfStyles = {
  container: {
    width: '794px',
    padding: '96px 96px',
    backgroundColor: PDF_COLORS.bg.white,
    fontFamily: PDF_FONTS.primary,
    fontSize: PDF_FONT_SIZES.base,
    color: PDF_COLORS.text.primary,
    lineHeight: '1.5',
    minHeight: '1123px',
  } as React.CSSProperties,

  title: {
    marginBottom: PDF_SPACING.sm,
    fontSize: PDF_FONT_SIZES.xl,
    fontWeight: 'bold',
  } as React.CSSProperties,

  subtitle: {
    fontSize: PDF_FONT_SIZES.base,
    color: PDF_COLORS.text.secondary,
    marginBottom: PDF_SPACING.lg,
    fontFamily: PDF_FONTS.primary,
  } as React.CSSProperties,

  sectionTitle: {
    fontSize: PDF_FONT_SIZES.lg,
    fontWeight: 'bold',
    color: PDF_COLORS.text.primary,
    marginBottom: PDF_SPACING.md,
    marginTop: PDF_SPACING.xl,
    fontFamily: PDF_FONTS.primary,
  } as React.CSSProperties,

  table: {
    width: '100%',
    borderCollapse: 'collapse',
    pageBreakInside: 'auto',
  } as React.CSSProperties,

  tableHeader: {
    backgroundColor: PDF_COLORS.bg.primary,
    color: '#ffffff',
    padding: `${PDF_SPACING.md} 10px`,
    textAlign: 'left',
    fontSize: PDF_FONT_SIZES.md,
    fontFamily: PDF_FONTS.primary,
    letterSpacing: 'normal',
    pageBreakInside: 'avoid',
    pageBreakAfter: 'avoid',
  } as React.CSSProperties,

  tableCell: {
    padding: `7px 10px`,
    fontSize: PDF_FONT_SIZES.md,
    borderBottom: `1px solid ${PDF_COLORS.border}`,
    fontFamily: PDF_FONTS.primary,
    letterSpacing: 'normal',
    color: PDF_COLORS.text.primary,
    pageBreakInside: 'avoid',
  } as React.CSSProperties,

  tableFooterCell: {
    padding: `7px 10px`,
    fontSize: PDF_FONT_SIZES.md,
    borderBottom: `1px solid ${PDF_COLORS.border}`,
    fontFamily: PDF_FONTS.primary,
    letterSpacing: 'normal',
    color: PDF_COLORS.text.primary,
    backgroundColor: PDF_COLORS.bg.lightGray,
    fontWeight: 'bold',
  } as React.CSSProperties,

  footer: {
    marginTop: PDF_SPACING.xxl,
    fontSize: PDF_FONT_SIZES.sm,
    color: PDF_COLORS.text.muted,
    fontFamily: PDF_FONTS.primary,
  } as React.CSSProperties,

  hindiText: {
    fontSize: PDF_FONT_SIZES.md,
    color: PDF_COLORS.text.secondary,
    fontFamily: PDF_FONTS.hindi,
  } as React.CSSProperties,
} as const;

// Re-export formatCurrency from styles for backwards compatibility
export { formatCurrency } from './styles';
