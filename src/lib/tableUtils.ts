// Reusable utilities for managing table rows and keyboard navigation
import { KeyboardEvent } from 'react';

// Generic row interface with a unique key
export interface BaseRow {
  key: string;
  [key: string]: any;
}

// Row management utilities
export const createRowUtils = <T extends BaseRow>() => {
  /**
   * Add a new row with default values
   */
  const addRow = (
    rows: T[],
    defaultRow: Omit<T, 'key'>
  ): T[] => {
    return [...rows, { ...defaultRow, key: crypto.randomUUID() } as T];
  };

  /**
   * Update a specific field in a row
   */
  const updateRow = (
    rows: T[],
    key: string,
    field: keyof T,
    value: any
  ): T[] => {
    return rows.map(row => 
      row.key === key ? { ...row, [field]: value } : row
    );
  };

  /**
   * Remove a row by key (keeps at least one row)
   */
  const removeRow = (
    rows: T[],
    key: string,
    minRows: number = 1
  ): T[] => {
    return rows.length > minRows 
      ? rows.filter(row => row.key !== key) 
      : rows;
  };

  /**
   * Remove a row by key (allows empty array)
   */
  const removeRowAllowEmpty = (
    rows: T[],
    key: string
  ): T[] => {
    return rows.filter(row => row.key !== key);
  };

  /**
   * Calculate total for a specific numeric field
   */
  const calculateTotal = (
    rows: T[],
    field: keyof T
  ): number => {
    return rows.reduce((sum, row) => {
      const value = row[field];
      return sum + (typeof value === 'number' ? value : 0);
    }, 0);
  };

  /**
   * Filter out empty/invalid rows
   */
  const filterValidRows = (
    rows: T[],
    validationFn: (row: T) => boolean
  ): T[] => {
    return rows.filter(validationFn);
  };

  return {
    addRow,
    updateRow,
    removeRow,
    removeRowAllowEmpty,
    calculateTotal,
    filterValidRows,
  };
};

// Keyboard navigation utilities
export interface KeyboardNavigationOptions {
  cols: number;
  onAddRow: () => void;
  allowVerticalNav?: boolean;
}

/**
 * Handle keyboard navigation in table inputs
 */
export const handleTableKeyDown = (
  e: KeyboardEvent<HTMLInputElement>,
  rowIndex: number,
  colIndex: number,
  tableRef: React.RefObject<HTMLTableElement>,
  options: KeyboardNavigationOptions
) => {
  const { cols, onAddRow, allowVerticalNav = true } = options;
  const inputs = tableRef.current?.querySelectorAll<HTMLInputElement>('input');
  if (!inputs) return;

  const currentIdx = rowIndex * cols + colIndex;

  if (e.key === 'Enter') {
    e.preventDefault();
    
    // If we're at the last input, add a new row
    if (currentIdx >= inputs.length - 1) {
      onAddRow();
      setTimeout(() => {
        const newInputs = tableRef.current?.querySelectorAll<HTMLInputElement>('input');
        // Focus the first input of the new row
        newInputs?.[inputs.length]?.focus();
      }, 50);
    } else {
      // Move to next input
      inputs[currentIdx + 1]?.focus();
    }
  } else if (allowVerticalNav) {
    if (e.key === 'ArrowUp' && currentIdx >= cols) {
      e.preventDefault();
      inputs[currentIdx - cols]?.focus();
    } else if (e.key === 'ArrowDown' && currentIdx < inputs.length - cols) {
      e.preventDefault();
      inputs[currentIdx + cols]?.focus();
    }
  }
};

/**
 * Generate a unique key for a new row
 */
export const generateRowKey = (): string => {
  return crypto.randomUUID();
};

/**
 * Check if a row has any data
 */
export const isRowEmpty = (row: BaseRow, fieldsToCheck: string[]): boolean => {
  return fieldsToCheck.every(field => {
    const value = row[field];
    if (typeof value === 'string') return value.trim() === '';
    if (typeof value === 'number') return value === 0 || isNaN(value);
    return !value;
  });
};

/**
 * Count non-empty rows
 */
export const countValidRows = (rows: BaseRow[], fieldsToCheck: string[]): number => {
  return rows.filter(row => !isRowEmpty(row, fieldsToCheck)).length;
};
