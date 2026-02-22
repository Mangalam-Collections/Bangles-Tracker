import * as FiIcons from 'react-icons/fi';
import React from 'react';

const DefaultIcon = (props: any) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <circle cx="12" cy="12" r="8" />
  </svg>
);

function makeIcon(name: string) {
  return (props: any) => {
    const key1 = `Fi${name}`;
    const IconComp = (FiIcons as any)[key1] || (FiIcons as any)[name] || DefaultIcon;
    return React.createElement(IconComp, props);
  };
}

export const Plus = makeIcon('Plus');
export const Trash2 = makeIcon('Trash2');
export const Save = makeIcon('Save');
export const Pencil = makeIcon('Edit2');
export const X = makeIcon('X');
export const FileText = makeIcon('FileText');
export const CheckCircle = makeIcon('CheckCircle');
export const Lock = makeIcon('Lock');
export const Delete = makeIcon('Trash2');
export const Check = makeIcon('Check');
export const ShieldCheck = makeIcon('Shield');
export const ShoppingCart = makeIcon('ShoppingCart');
export const FileSpreadsheet = makeIcon('FileText');
export const CreditCard = makeIcon('CreditCard');
export const Calculator = makeIcon('Grid');
export const FileTextAlt = makeIcon('FileText');
export const ChevronDown = makeIcon('ChevronDown');
export const ChevronUp = makeIcon('ChevronUp');
export const ChevronLeft = makeIcon('ChevronLeft');
export const ChevronRight = makeIcon('ChevronRight');
export const MoreHorizontal = makeIcon('MoreHorizontal');
export const PanelLeft = makeIcon('PanelLeft');
export const GripVertical = makeIcon('GripVertical');
export const Circle = makeIcon('Circle');
export const Dot = makeIcon('Dot');
export const Search = makeIcon('Search');
export const ArrowLeft = makeIcon('ArrowLeft');
export const ArrowRight = makeIcon('ArrowRight');

export default {
  Plus,
  Trash2,
  Save,
  Pencil,
  X,
  FileText,
  CheckCircle,
  Lock,
  Delete,
  Check,
  ShieldCheck,
  ShoppingCart,
  FileSpreadsheet,
  CreditCard,
  Calculator,
};
