// Payment interface — ONE place for all payment methods.
// Manual payment is live today. The live JazzCash / Easypaisa gateway is
// NOT configured: it needs a merchant account approved by the bank (usually
// 7-15 days) and then a Store ID + Hash Key. Until then, do not add a
// gateway redirect here — the manual flow (pay, then enter Transaction ID)
// is the delivery. No credentials are stored in this file.

// Manual methods. requiresTxnId: the customer must enter the Transaction ID
// they got after paying. Cash at the clinic needs no Transaction ID.
export const PAYMENT_METHODS = [
  { id: 'jazzcash', label: 'JazzCash', requiresTxnId: true },
  { id: 'easypaisa', label: 'Easypaisa', requiresTxnId: true },
  { id: 'bank_transfer', label: 'Bank Transfer', requiresTxnId: true },
  { id: 'cash', label: 'Cash (at clinic)', requiresTxnId: false },
]

// Live gateway status. Both are 'not_configured' until the merchant
// approval comes through and the Store ID / Hash Key are added in the
// Supabase settings / server — never in frontend code.
export const GATEWAY_STATUS = {
  jazzcash: 'not_configured',
  easypaisa: 'not_configured',
}

export function getPaymentInstructions(method) {
  switch (method) {
    case 'jazzcash':
      return 'Pay via JazzCash, then enter the Transaction ID below. The clinic JazzCash number will be shared on confirmation.'
    case 'easypaisa':
      return 'Pay via Easypaisa, then enter the Transaction ID below. The clinic Easypaisa number will be shared on confirmation.'
    case 'bank_transfer':
      return 'Transfer to the clinic bank account, then enter the Transaction ID (reference) below.'
    case 'cash':
      return 'Pay cash at the clinic when you collect your order. No Transaction ID is needed.'
    default:
      return 'Pay, then enter the Transaction ID below.'
  }
}

export function methodLabel(id) {
  return (PAYMENT_METHODS.find(m => m.id === id) || {}).label || id
}
