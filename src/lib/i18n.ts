// Static translation dictionary for all UI strings
const dict: Record<string, { en: string; hi: string }> = {
  // App
  'app.title': { en: 'Bangles Tracker', hi: 'चूड़ी ट्रैकर' },

  // Nav
  'nav.purchase': { en: 'Purchase', hi: 'खरीद' },
  'nav.summary': { en: 'Summary', hi: 'सारांश' },
  'nav.payments': { en: 'Payments', hi: 'भुगतान' },
  'nav.settlement': { en: 'Settlement', hi: 'निपटान' },

  // Page 1
  'purchase.title': { en: 'New Purchase Entry', hi: 'नई खरीद प्रविष्टि' },
  'purchase.date': { en: 'Date', hi: 'तारीख' },
  'purchase.partyName': { en: 'Party Name', hi: 'पार्टी का नाम' },
  'purchase.selectParty': { en: 'Select or add party', hi: 'पार्टी चुनें या जोड़ें' },
  'purchase.item': { en: 'Item', hi: 'आइटम' },
  'purchase.qty': { en: 'Qty', hi: 'मात्रा' },
  'purchase.factor': { en: 'Factor', hi: 'गुणक' },
  'purchase.totalPolate': { en: 'Total Polate', hi: 'कुल पोलाटे' },
  'purchase.addRow': { en: 'Add Row', hi: 'पंक्ति जोड़ें' },
  'purchase.saveAll': { en: 'Save All', hi: 'सभी सहेजें' },
  'purchase.noEntries': { en: 'No entries yet for this party', hi: 'इस पार्टी के लिए अभी तक कोई प्रविष्टि नहीं' },
  'purchase.newParty': { en: 'New party', hi: 'नई पार्टी' },
  'purchase.edit': { en: 'Edit', hi: 'संपादित करें' },
  'purchase.delete': { en: 'Delete', hi: 'हटाएं' },
  'purchase.confirmDelete': { en: 'Delete this block?', hi: 'इस ब्लॉक को हटाएं?' },
  'purchase.locked': { en: 'Finalized — editing disabled', hi: 'अंतिम — संपादन अक्षम' },

  // Page 2
  'summary.title': { en: 'Monthly Party Summary', hi: 'मासिक पार्टी सारांश' },
  'summary.selectParty': { en: 'Choose party', hi: 'पार्टी चुनें' },
  'summary.itemName': { en: 'Item Name', hi: 'आइटम का नाम' },
  'summary.totalQty': { en: 'Total Qty', hi: 'कुल मात्रा' },
  'summary.priceUnit': { en: 'Price/Unit', hi: 'मूल्य/इकाई' },
  'summary.totalAmount': { en: 'Total Amount', hi: 'कुल राशि' },
  'summary.grandTotal': { en: 'Grand Total', hi: 'कुल योग' },
  'summary.finalize': { en: 'Finalize', hi: 'अंतिम करें' },
  'summary.finalized': { en: 'This party is already finalized.', hi: 'यह पार्टी पहले से अंतिम है।' },
  'summary.noEntries': { en: 'No purchase entries found for this party.', hi: 'इस पार्टी के लिए कोई खरीद प्रविष्टि नहीं मिली।' },
  'summary.deleteRow': { en: 'Delete this item?', hi: 'इस आइटम को हटाएं?' },

  // Page 3
  'payment.title': { en: 'Payment Entry', hi: 'भुगतान प्रविष्टि' },
  'payment.selectParty': { en: 'Choose party', hi: 'पार्टी चुनें' },
  'payment.date': { en: 'Date', hi: 'तारीख' },
  'payment.amount': { en: 'Amount (₹)', hi: 'राशि (₹)' },
  'payment.addRow': { en: 'Add Row', hi: 'पंक्ति जोड़ें' },
  'payment.saveAll': { en: 'Save All', hi: 'सभी सहेजें' },
  'payment.total': { en: 'Total', hi: 'कुल' },
  'payment.savedPayments': { en: 'Saved Payments', hi: 'सहेजे गए भुगतान' },
  'payment.edit': { en: 'Edit', hi: 'संपादित करें' },
  'payment.delete': { en: 'Delete', hi: 'हटाएं' },
  'payment.confirmDelete': { en: 'Delete this payment?', hi: 'इस भुगतान को हटाएं?' },

  // Page 4
  'settlement.title': { en: 'Final Settlement', hi: 'अंतिम निपटान' },
  'settlement.selectParty': { en: 'Choose party', hi: 'पार्टी चुनें' },
  'settlement.openingBalance': { en: 'Opening Balance', hi: 'प्रारंभिक शेष' },
  'settlement.purchaseAmount': { en: '+ Purchase Amount', hi: '+ खरीद राशि' },
  'settlement.totalPayments': { en: '− Total Payments', hi: '− कुल भुगतान' },
  'settlement.netBalance': { en: 'Net Balance', hi: 'शुद्ध शेष' },
  'settlement.adjustments': { en: 'Adjustments', hi: 'समायोजन' },
  'settlement.addAdjustment': { en: 'Add Adjustment', hi: 'समायोजन जोड़ें' },
  'settlement.remark': { en: 'Remark', hi: 'टिप्पणी' },
  'settlement.finalBalance': { en: 'Final Balance', hi: 'अंतिम शेष' },
  'settlement.previewPDF': { en: 'Preview PDF', hi: 'पीडीएफ पूर्वावलोकन' },
  'settlement.done': { en: 'Done', hi: 'हो गया' },
  'settlement.confirmTitle': { en: 'Confirm Settlement', hi: 'निपटान की पुष्टि करें' },
  'settlement.confirmDesc': { en: 'This will generate a PDF, clear all transaction data, and carry forward the final balance. This cannot be undone.', hi: 'यह एक पीडीएफ बनाएगा, सभी लेनदेन डेटा साफ़ करेगा, और अंतिम शेष आगे ले जाएगा। यह पूर्ववत नहीं किया जा सकता।' },
  'settlement.cancel': { en: 'Cancel', hi: 'रद्द करें' },
  'settlement.confirmGenerate': { en: 'Confirm & Generate PDF', hi: 'पुष्टि करें और पीडीएफ बनाएं' },

  // Common
  'common.save': { en: 'Save', hi: 'सहेजें' },
  'common.cancel': { en: 'Cancel', hi: 'रद्द करें' },
  'common.yes': { en: 'Yes', hi: 'हाँ' },
  'common.no': { en: 'No', hi: 'नहीं' },
  'common.draftSaved': { en: 'Draft saved', hi: 'ड्राफ्ट सहेजा गया' },
  'common.saved': { en: 'Saved successfully', hi: 'सफलतापूर्वक सहेजा गया' },
  'common.deleted': { en: 'Deleted', hi: 'हटाया गया' },
  'common.error': { en: 'Error', hi: 'त्रुटि' },
  'common.selectParty': { en: 'Select Party', hi: 'पार्टी चुनें' },
};

export function t(key: string, hindiEnabled: boolean): { en: string; hi?: string } {
  const entry = dict[key];
  if (!entry) return { en: key };
  if (hindiEnabled) return { en: entry.en, hi: entry.hi };
  return { en: entry.en };
}

// Helper component-friendly: returns just the English string if hindi is off
export function tEn(key: string): string {
  return dict[key]?.en ?? key;
}
