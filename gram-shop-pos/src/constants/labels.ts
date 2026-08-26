export const PAYMENT_LABELS: Record<number, string> = {
  1: 'Cash',
  2: 'UPI',
  3: 'Card',
  4: 'Credit / Udhaar',
  5: 'Wallet',
}

export const BILL_STATUS_LABELS: Record<number, string> = {
  1: 'Completed',
  2: 'Partially paid',
  3: 'Credit',
  4: 'Cancelled',
}

export const BILL_TYPE_LABELS: Record<number, string> = {
  1: 'Sale',
  2: 'Exchange',
}

export const MOVEMENT_LABELS: Record<number, string> = {
  1: 'Sale',
  2: 'Return',
  3: 'Purchase',
  4: 'Adjustment in',
  5: 'Adjustment out',
  6: 'Transfer in',
  7: 'Transfer out',
  8: 'Exchange',
  9: 'Opening stock',
}

export const REFERRAL_STATUS_LABELS: Record<number, string> = {
  1: 'Pending',
  2: 'Credited',
  3: 'Redeemed',
  4: 'Cancelled',
}

export const LEDGER_TYPE_LABELS: Record<number, string> = {
  1: 'Sale',
  2: 'Return',
  3: 'Credit',
  4: 'Payment received',
  5: 'Wallet credit',
  6: 'Credit used in sale',
  7: 'Referral credit',
  8: 'Referral reversal',
  9: 'Exchange adjustment',
  10: 'Buyback',
  11: 'Repair charge',
  12: 'Repair Payment',
  13: 'Polish charge',
  14: 'Polish Payment',
}

export const RETURN_KIND_LABELS: Record<number, string> = {
  1: 'Return',
  2: 'Exchange',
  3: 'Buyback',
}

export const ITEM_STATUS_LABELS: Record<number, string> = {
  1: 'Available',
  2: 'Partially returned',
  3: 'Already Returned',
  4: 'Partially exchanged',
  5: 'Already Exchanged',
  6: 'Partially bought back',
  7: 'Already Bought Back',
}

export const REPAIR_STATUS_LABELS: Record<number, string> = {
  1: 'Received',
  2: 'In progress',
  3: 'Ready',
  4: 'Delivered',
  5: 'Cancelled',
}

export const REPAIR_TYPE_LABELS: Record<number, string> = {
  1: 'Repair',
  2: 'Polish',
}

export const WHATSAPP_STATUS_LABELS: Record<number, string> = {
  1: 'Pending',
  2: 'Sent',
  3: 'Failed',
}
