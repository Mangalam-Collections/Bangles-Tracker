// Reusable form validation utilities
import { toast } from '@/hooks/use-toast';

export interface ValidationResult {
  valid: boolean;
  message?: string;
}

export interface ValidationRule<T = any> {
  validate: (value: T) => boolean;
  message: string;
}

/**
 * Validate a value against a set of rules
 */
export const validateField = <T>(
  value: T,
  rules: ValidationRule<T>[],
  fieldName: string = 'Field'
): ValidationResult => {
  for (const rule of rules) {
    if (!rule.validate(value)) {
      return {
        valid: false,
        message: rule.message || `${fieldName} is invalid`,
      };
    }
  }
  return { valid: true };
};

// Common validation rules
export const ValidationRules = {
  required: (message?: string): ValidationRule<string> => ({
    validate: (value) => value.trim().length > 0,
    message: message || 'This field is required',
  }),

  minLength: (min: number, message?: string): ValidationRule<string> => ({
    validate: (value) => value.trim().length >= min,
    message: message || `Minimum ${min} characters required`,
  }),

  maxLength: (max: number, message?: string): ValidationRule<string> => ({
    validate: (value) => value.trim().length <= max,
    message: message || `Maximum ${max} characters allowed`,
  }),

  positive: (message?: string): ValidationRule<number> => ({
    validate: (value) => value > 0,
    message: message || 'Must be a positive number',
  }),

  nonNegative: (message?: string): ValidationRule<number> => ({
    validate: (value) => value >= 0,
    message: message || 'Must be 0 or greater',
  }),

  min: (min: number, message?: string): ValidationRule<number> => ({
    validate: (value) => value >= min,
    message: message || `Must be at least ${min}`,
  }),

  max: (max: number, message?: string): ValidationRule<number> => ({
    validate: (value) => value <= max,
    message: message || `Must be at most ${max}`,
  }),

  email: (message?: string): ValidationRule<string> => ({
    validate: (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
    message: message || 'Invalid email address',
  }),

  numeric: (message?: string): ValidationRule<string> => ({
    validate: (value) => /^\d+$/.test(value),
    message: message || 'Must contain only numbers',
  }),

  alphanumeric: (message?: string): ValidationRule<string> => ({
    validate: (value) => /^[a-zA-Z0-9]+$/.test(value),
    message: message || 'Must contain only letters and numbers',
  }),
};

/**
 * Validate form data and show toast on error
 */
export const validateAndToast = (
  condition: boolean,
  errorMessage: string
): boolean => {
  if (!condition) {
    toast({ title: errorMessage, variant: 'destructive' });
    return false;
  }
  return true;
};

/**
 * Validate multiple conditions
 */
export const validateAll = (
  validations: Array<{ condition: boolean; message: string }>
): boolean => {
  for (const validation of validations) {
    if (!validateAndToast(validation.condition, validation.message)) {
      return false;
    }
  }
  return true;
};

/**
 * Common form validations
 */
export const CommonValidations = {
  /**
   * Validate party name is not empty
   */
  partyName: (partyName: string): boolean => {
    return validateAndToast(
      partyName.trim().length > 0,
      'Please enter a party name'
    );
  },

  /**
   * Validate at least one valid row exists
   */
  hasValidRows: (count: number, itemType: string = 'item'): boolean => {
    return validateAndToast(
      count > 0,
      `Please add at least one ${itemType}`
    );
  },

  /**
   * Validate amount is positive
   */
  positiveAmount: (amount: number): boolean => {
    return validateAndToast(
      amount > 0,
      'Amount must be greater than 0'
    );
  },

  /**
   * Validate date is not empty
   */
  dateRequired: (date: string): boolean => {
    return validateAndToast(
      date.trim().length > 0,
      'Please select a date'
    );
  },

  /**
   * Validate selection is made
   */
  selectionRequired: (value: string, fieldName: string = 'option'): boolean => {
    return validateAndToast(
      value.trim().length > 0,
      `Please select a ${fieldName}`
    );
  },
};

/**
 * Check if a string is empty or whitespace
 */
export const isEmpty = (value: string | null | undefined): boolean => {
  return !value || value.trim().length === 0;
};

/**
 * Check if a number is valid and positive
 */
export const isValidPositive = (value: number): boolean => {
  return !isNaN(value) && isFinite(value) && value > 0;
};

/**
 * Check if a number is valid and non-negative
 */
export const isValidNonNegative = (value: number): boolean => {
  return !isNaN(value) && isFinite(value) && value >= 0;
};

/**
 * Sanitize string input
 */
export const sanitizeString = (value: string): string => {
  return value.trim().replace(/\s+/g, ' ');
};

/**
 * Parse number from string safely
 */
export const parseNumber = (value: string, defaultValue: number = 0): number => {
  const parsed = parseFloat(value);
  return isNaN(parsed) ? defaultValue : parsed;
};

/**
 * Parse positive number from string (returns 0 if invalid or negative)
 */
export const parsePositiveNumber = (value: string): number => {
  const parsed = parseFloat(value);
  return isNaN(parsed) || parsed < 0 ? 0 : parsed;
};
