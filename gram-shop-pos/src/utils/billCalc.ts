import { roundMoney } from './format'

export interface LineInput {
  quantity: number
  rate: number
  discountAmount: number
  taxPercent: number
}

export interface LineCalc {
  quantity: number
  rate: number
  discountAmount: number
  taxPercent: number
  lineSubtotal: number
  taxable: number
  taxAmount: number
  total: number
}

export interface BillCalc {
  subtotal: number
  itemDiscountTotal: number
  billDiscount: number
  taxAmount: number
  grandTotal: number
  lines: LineCalc[]
}

function calculateLine(quantity: number, rate: number, discountAmount: number, taxPercent: number): LineCalc {
  const lineSubtotal = roundMoney(quantity * rate)
  const discount = Math.min(roundMoney(discountAmount), lineSubtotal)
  const taxable = roundMoney(lineSubtotal - discount)
  const taxAmount = roundMoney((taxable * taxPercent) / 100)
  return {
    quantity,
    rate,
    discountAmount: discount,
    taxPercent,
    lineSubtotal,
    taxable,
    taxAmount,
    total: roundMoney(taxable + taxAmount),
  }
}

export function calculateBill(lines: LineInput[], billDiscount: number): BillCalc {
  const calculated = lines.map((l) => calculateLine(l.quantity, l.rate, l.discountAmount, l.taxPercent))
  const itemDiscountTotal = roundMoney(calculated.reduce((s, l) => s + l.discountAmount, 0))
  const subtotal = roundMoney(calculated.reduce((s, l) => s + l.lineSubtotal, 0))
  const netAfterItemDiscount = roundMoney(calculated.reduce((s, l) => s + l.taxable, 0))
  const discount = Math.min(roundMoney(billDiscount), netAfterItemDiscount)

  if (discount === 0) {
    return {
      subtotal,
      itemDiscountTotal,
      billDiscount: 0,
      taxAmount: roundMoney(calculated.reduce((s, l) => s + l.taxAmount, 0)),
      grandTotal: roundMoney(calculated.reduce((s, l) => s + l.total, 0)),
      lines: calculated,
    }
  }

  let remaining = discount
  const adjusted = calculated.map((line, i) => {
    let share: number
    if (i === calculated.length - 1) share = remaining
    else {
      share = netAfterItemDiscount === 0 ? 0 : roundMoney(discount * (line.taxable / netAfterItemDiscount))
      remaining = roundMoney(remaining - share)
    }
    return calculateLine(line.quantity, line.rate, line.discountAmount + share, line.taxPercent)
  })

  return {
    subtotal,
    itemDiscountTotal,
    billDiscount: discount,
    taxAmount: roundMoney(adjusted.reduce((s, l) => s + l.taxAmount, 0)),
    grandTotal: roundMoney(adjusted.reduce((s, l) => s + l.total, 0)),
    lines: adjusted,
  }
}
