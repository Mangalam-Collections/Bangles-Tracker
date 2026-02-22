export interface Party {
  id?: number;
  name: string;
  openingBalance: number;
  createdAt: Date;
}

export interface PurchaseBlock {
  id?: number;
  partyId: number;
  partyName: string;
  date: string;
  createdAt: Date;
}

export interface PurchaseRow {
  id?: number;
  blockId: number;
  partyId: number;
  itemName: string;
  qty: number;
  factor: number;
  totalPolate: number;
  sortOrder: number;
}

export interface Finalization {
  id?: number;
  partyId: number;
  partyName: string;
  grandTotal: number;
  createdAt: Date;
}

export interface FinalizedItem {
  id?: number;
  finalizationId: number;
  partyId: number;
  itemName: string;
  totalQty: number;
  price: number;
  totalAmount: number;
}

export interface Payment {
  id?: number;
  partyId: number;
  partyName: string;
  date: string;
  amount: number;
  createdAt: Date;
}

export interface Adjustment {
  id?: number;
  partyId: number;
  type: 'add' | 'subtract';
  amount: number;
  note: string;
}

export interface Settlement {
  id?: number;
  partyId: number;
  partyName: string;
  openingBalance: number;
  purchaseAmount: number;
  totalPayments: number;
  adjustments: { type: 'add' | 'subtract'; amount: number; note: string }[];
  finalBalance: number;
  settledAt: Date;
}
