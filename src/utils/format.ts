/** 1234567 -> "12,34,567" (Indian grouping, works without Intl) */
export function indian(n: number) {
  const s = String(Math.round(Math.abs(n)))
  if (s.length <= 3) return s
  const last3 = s.slice(-3)
  const rest = s.slice(0, -3).replace(/\B(?=(\d{2})+(?!\d))/g, ',')
  return `${rest},${last3}`
}

/** 18000 -> "₹18,000" */
export const inr = (n: number) => `₹${indian(n)}`

/** Balance with sign: due is +, advance is − (like the design) */
export const signedInr = (n: number) => `${n > 0 ? '+' : n < 0 ? '−' : ''}${inr(n)}`

/** "9876543210" -> "98765 43210" */
export const fmtPhone = (p: string) => (p.length === 10 ? `${p.slice(0, 5)} ${p.slice(5)}` : p)

/** Keep only the 10 digits the server needs */
export const cleanPhone = (p: string) => p.replace(/\D/g, '').slice(-10)
