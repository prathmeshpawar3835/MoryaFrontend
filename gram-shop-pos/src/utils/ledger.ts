export function ledgerSides(outstanding = 0, totalDebit = 0, totalCredit = 0) {
  const signed = totalDebit !== 0 || totalCredit !== 0 ? totalDebit - totalCredit : outstanding
  const overdue = Math.max(0, Math.round(signed * 100) / 100)
  const advance = Math.max(0, Math.round(-signed * 100) / 100)
  return { signed, overdue, advance, totalDebit, totalCredit }
}
