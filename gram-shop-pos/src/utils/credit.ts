export function creditOveruseMessage(available: number, requested: number) {
  const fmt = (n: number) =>
    n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  return `Available customer credit is ₹${fmt(available)}. You cannot use ₹${fmt(requested)}. Please enter an amount up to ₹${fmt(available)}.`
}
