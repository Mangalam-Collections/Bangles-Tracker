import Dexie, { type EntityTable } from 'dexie';
import type { Party, PurchaseBlock, PurchaseRow, Finalization, FinalizedItem, Payment, Adjustment, Settlement } from './types';

const db = new Dexie('BanglesDB') as Dexie & {
  parties: EntityTable<Party, 'id'>;
  purchaseBlocks: EntityTable<PurchaseBlock, 'id'>;
  purchaseRows: EntityTable<PurchaseRow, 'id'>;
  finalizations: EntityTable<Finalization, 'id'>;
  finalizedItems: EntityTable<FinalizedItem, 'id'>;
  payments: EntityTable<Payment, 'id'>;
  adjustments: EntityTable<Adjustment, 'id'>;
  settlements: EntityTable<Settlement, 'id'>;
};

db.version(1).stores({
  parties: '++id, name',
  purchaseBlocks: '++id, partyId, date',
  purchaseRows: '++id, blockId, partyId',
  finalizations: '++id, partyId',
  finalizedItems: '++id, finalizationId, partyId',
  payments: '++id, partyId, date',
  settlements: '++id, partyId',
});

db.version(2).stores({
  parties: '++id, name',
  purchaseBlocks: '++id, partyId, date',
  purchaseRows: '++id, blockId, partyId',
  finalizations: '++id, partyId',
  finalizedItems: '++id, finalizationId, partyId',
  payments: '++id, partyId, date',
  adjustments: '++id, partyId',
  settlements: '++id, partyId',
});

export { db };

export async function getOrCreateParty(name: string): Promise<number> {
  const existing = await db.parties.where('name').equalsIgnoreCase(name).first();
  if (existing?.id) return existing.id;
  return await db.parties.add({ name, openingBalance: 0, createdAt: new Date() });
}

export async function getAllPartyNames(): Promise<string[]> {
  const parties = await db.parties.toArray();
  return parties.map(p => p.name);
}

export async function isPartyFinalized(partyId: number): Promise<boolean> {
  const fin = await db.finalizations.where('partyId').equals(partyId).first();
  return !!fin;
}

export async function getPartyPurchaseSummary(partyId: number) {
  const rows = await db.purchaseRows.where('partyId').equals(partyId).toArray();
  const grouped: Record<string, { itemName: string; totalQty: number }> = {};
  for (const r of rows) {
    const key = r.itemName;
    if (!grouped[key]) grouped[key] = { itemName: r.itemName, totalQty: 0 };
    grouped[key].totalQty += r.qty;
  }
  return Object.values(grouped);
}

export async function getAllItemNames(): Promise<string[]> {
  const rows = await db.purchaseRows.toArray();
  const names = new Set(rows.map(r => r.itemName));
  return Array.from(names);
}

export async function getPartyTotalPayments(partyId: number): Promise<number> {
  const payments = await db.payments.where('partyId').equals(partyId).toArray();
  return payments.reduce((sum, p) => sum + p.amount, 0);
}

export async function getPartyPurchaseTotal(partyId: number): Promise<number> {
  const fin = await db.finalizations.where('partyId').equals(partyId).first();
  return fin?.grandTotal ?? 0;
}

export async function clearPartyTransactions(partyId: number, finalBalance: number) {
  await db.purchaseBlocks.where('partyId').equals(partyId).delete();
  await db.purchaseRows.where('partyId').equals(partyId).delete();
  await db.finalizations.where('partyId').equals(partyId).delete();
  await db.finalizedItems.where('partyId').equals(partyId).delete();
  await db.payments.where('partyId').equals(partyId).delete();
  await db.adjustments.where('partyId').equals(partyId).delete();
  await db.parties.where('id').equals(partyId).modify({ openingBalance: finalBalance });
}
