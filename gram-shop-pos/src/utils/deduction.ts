import { ReturnKind } from '../types'

export function deductionPercentFor(
  kind: number,
  settings?: {
    returnDeductionPercent?: number
    exchangeDeductionPercent?: number
    buybackDeductionPercent?: number
  } | null,
) {
  if (!settings) return 0
  if (kind === ReturnKind.Exchange) return Number(settings.exchangeDeductionPercent ?? 0)
  if (kind === ReturnKind.Buyback) return Number(settings.buybackDeductionPercent ?? 0)
  return Number(settings.returnDeductionPercent ?? 0)
}

export function applyAdminDeduction(gross: number, percent: number) {
  const p = Math.min(100, Math.max(0, Number(percent) || 0))
  const deduction = Math.round(((gross * p) / 100) * 100) / 100
  const net = Math.round((gross - deduction) * 100) / 100
  return { gross, percent: p, deduction, net }
}
