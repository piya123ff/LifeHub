export function formatMoney(amount, currency = 'THB') {
  return new Intl.NumberFormat('th-TH', {
    style: 'currency', currency, maximumFractionDigits: 0,
  }).format(amount ?? 0)
}

export function formatNumber(n) {
  return new Intl.NumberFormat('th-TH').format(Math.round(n ?? 0))
}

export function formatCompact(n) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000)     return `${(n / 1_000).toFixed(1)}K`
  return String(Math.round(n))
}
