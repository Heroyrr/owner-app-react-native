/*
| One place that talks to the backend.
| - adds the login token to every request
| - turns every failure into an ApiError with message, status and code
| - tells the app when the token is no longer valid (401)
*/
const BASE = (process.env.EXPO_PUBLIC_API_URL ?? 'http://10.0.2.2:3333/api/v1').replace(/\/$/, '')

let token: string | null = null
let onUnauthorized: (() => void) | null = null

export const setToken = (t: string | null) => { token = t }
export const setUnauthorizedHandler = (fn: (() => void) | null) => { onUnauthorized = fn }
export const apiBase = () => BASE

export class ApiError extends Error {
  status: number
  code?: string
  constructor(message: string, status: number, code?: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
  }
}

type Query = Record<string, string | number | boolean | undefined | null>
type Opts = { method?: string; body?: unknown; query?: Query; form?: FormData; auth?: boolean }

const qs = (q?: Query) => {
  if (!q) return ''
  const parts = Object.entries(q)
    .filter(([, v]) => v !== undefined && v !== null && v !== '')
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
  return parts.length ? `?${parts.join('&')}` : ''
}

export async function api<T = any>(path: string, opts: Opts = {}): Promise<T> {
  const { method = 'GET', body, query, form, auth = true } = opts
  const headers: Record<string, string> = { Accept: 'application/json' }
  if (auth && token) headers.Authorization = `Bearer ${token}`
  if (body !== undefined) headers['Content-Type'] = 'application/json'

  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), 20000)
  let res: Response
  try {
    res = await fetch(`${BASE}${path}${qs(query)}`, {
      method,
      headers,
      body: form ?? (body !== undefined ? JSON.stringify(body) : undefined),
      signal: ctrl.signal,
    })
  } catch {
    throw new ApiError('Cannot reach the server', 0, 'NETWORK')
  } finally {
    clearTimeout(timer)
  }

  const text = await res.text()
  let data: any = null
  try { data = text ? JSON.parse(text) : null } catch {}

  if (!res.ok) {
    const first = data?.errors?.[0]
    const message = data?.message ?? first?.message ?? `Request failed (${res.status})`
    const code = data?.code ?? first?.code ?? first?.rule
    if (res.status === 401 && auth) onUnauthorized?.()
    throw new ApiError(message, res.status, code)
  }
  return data as T
}
