// Centralized styling constants for UI components
// Provides consistent styling across the application

export const UI_COLORS = {
  // Button variants
  button: {
    add: 'bg-success/20 text-success border border-success/40',
    subtract: 'bg-destructive/20 text-destructive border border-destructive/40',
    neutral: 'bg-muted text-muted-foreground border border-border',
    destructive: 'text-destructive hover:bg-destructive/10',
  },
  // Text colors
  text: {
    primary: 'text-foreground',
    secondary: 'text-muted-foreground',
    success: 'text-success',
    destructive: 'text-destructive',
    primary_color: 'text-primary',
  },
  // Background colors
  bg: {
    card: 'bg-card',
    muted: 'bg-muted',
    primary: 'bg-primary/10',
    success: 'bg-success/20',
    destructive: 'bg-destructive/20',
  },
  // Border colors
  border: {
    default: 'border',
    primary: 'border-primary',
    success: 'border-success/40',
    destructive: 'border-destructive/40',
  },
} as const;

export const UI_SPACING = {
  // Padding
  padding: {
    xs: 'p-1',
    sm: 'p-2',
    md: 'p-4',
    lg: 'p-5',
    xl: 'p-6',
  },
  // Margin
  margin: {
    xs: 'm-1',
    sm: 'm-2',
    md: 'm-4',
    lg: 'm-5',
    xl: 'm-6',
  },
  // Gap
  gap: {
    xs: 'gap-1',
    sm: 'gap-1.5',
    md: 'gap-2',
    lg: 'gap-3',
    xl: 'gap-4',
  },
  // Space-y
  spaceY: {
    xs: 'space-y-1',
    sm: 'space-y-2',
    md: 'space-y-3',
    lg: 'space-y-4',
    xl: 'space-y-6',
  },
} as const;

export const UI_SIZES = {
  // Input heights
  input: {
    sm: 'h-8',
    md: 'h-9',
    lg: 'h-10',
    xl: 'h-11',
  },
  // Button heights
  button: {
    sm: 'py-2',
    md: 'py-3',
    lg: 'py-5',
  },
  // Icon sizes
  icon: {
    xs: 'h-3 w-3',
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6',
  },
  // Text sizes
  text: {
    xs: 'text-xs',
    sm: 'text-sm',
    base: 'text-base',
    lg: 'text-lg',
    xl: 'text-xl',
    '2xl': 'text-6xl',
    '3xl': 'text-3xl',
  },
} as const;

export const UI_LAYOUTS = {
  // Common flex layouts
  flex: {
    center: 'flex items-center justify-center',
    between: 'flex items-center justify-between',
    start: 'flex items-start',
    end: 'flex items-end',
    col: 'flex flex-col',
  },
  // Common container styles
  container: {
    page: 'p-4 space-y-6',
    card: 'rounded-lg border p-4',
    cardLg: 'rounded-lg border p-5',
  },
  // Common grid layouts
  grid: {
    cols2: 'grid grid-cols-2',
    cols3: 'grid grid-cols-3',
    cols4: 'grid grid-cols-4',
  },
} as const;

export const UI_TRANSITIONS = {
  default: 'transition-colors',
  all: 'transition-all',
  fast: 'transition-all duration-150',
  slow: 'transition-all duration-300',
} as const;

export const UI_FONT_WEIGHTS = {
  normal: 'font-normal',
  medium: 'font-medium',
  semibold: 'font-semibold',
  bold: 'font-bold',
} as const;

// Common component class combinations
export const COMPONENT_CLASSES = {
  // Input field
  input: {
    default: 'h-9 text-base',
    number: 'h-9 text-base text-right',
    wide: 'h-9 text-base flex-1',
    narrow: 'h-9 w-32 text-right text-base',
  },
  // Button groups
  toggleButton: {
    base: 'px-3 py-2 text-sm rounded font-bold transition-colors',
    active: 'border',
  },
  // Cards
  card: {
    default: 'space-y-4',
    section: 'space-y-2 rounded-lg border p-4',
    highlight: 'rounded-lg bg-primary/10 p-5 text-center',
  },
  // Tables
  table: {
    container: 'border rounded-lg overflow-hidden',
    header: 'bg-muted text-sm font-medium',
    row: 'border-b hover:bg-muted/50',
  },
} as const;

// Utility function to combine classes
export const cn = (...classes: (string | boolean | undefined)[]) => {
  return classes.filter(Boolean).join(' ');
};

// Common currency formatting
export const formatCurrency = (amount: number): string => {
  return `₹${amount.toLocaleString('en-IN')}`;
};

// Common date formatting
export const formatDate = (date: Date | string): string => {
  if (typeof date === 'string') return date;
  return date.toISOString().slice(0, 10);
};

export const getTodayString = (): string => {
  return new Date().toISOString().slice(0, 10);
};
