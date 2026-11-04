const pad = (n: number) => String(n).padStart(2, '0')

/** Date -> "2026-11-03" in the phone's own time zone (the server expects this format) */
export const toYmd = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`

/** "2026-11-03" -> Date at local midnight */
export const fromYmd = (s: string) => {
  const [y, m, d] = s.split('-').map(Number)
  return new Date(y, (m || 1) - 1, d || 1)
}

export const todayYmd = () => toYmd(new Date())

export const addDays = (ymd: string, days: number) => {
  const d = fromYmd(ymd)
  d.setDate(d.getDate() + days)
  return toYmd(d)
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

/** "2026-11-03" -> "03 Nov 2026" */
export const showDate = (ymd?: string | null) => {
  if (!ymd) return '—'
  const d = fromYmd(ymd)
  return `${pad(d.getDate())} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`
}
