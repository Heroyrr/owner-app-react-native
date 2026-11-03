import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import * as SecureStore from 'expo-secure-store'
import { api, ApiError, setToken, setUnauthorizedHandler } from '../api/client'
import type { Subscription, User } from '../api/types'

type Status = 'loading' | 'out' | 'in'
type Ctx = {
  status: Status
  user: User | null
  subscription: Subscription | null
  sendOtp: (phone: string) => Promise<{ is_new: boolean; dev_otp?: string }>
  verifyOtp: (phone: string, otp: string, name?: string) => Promise<void>
  logout: () => Promise<void>
  refreshMe: () => Promise<void>
}

const AuthContext = createContext<Ctx>(null as unknown as Ctx)
export const useAuth = () => useContext(AuthContext)

const clearSession = async () => {
  setToken(null)
  await SecureStore.deleteItemAsync('oa_token').catch(() => {})
  await SecureStore.deleteItemAsync('oa_user').catch(() => {})
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<Status>('loading')
  const [user, setUser] = useState<User | null>(null)
  const [subscription, setSub] = useState<Subscription | null>(null)

  const logoutLocal = useCallback(async () => {
    await clearSession()
    setUser(null)
    setSub(null)
    setStatus('out')
  }, [])

  // Any 401 from the server means the token is no longer valid
  useEffect(() => {
    setUnauthorizedHandler(() => { logoutLocal() })
    return () => setUnauthorizedHandler(null)
  }, [logoutLocal])

  // Restore the session when the app opens
  useEffect(() => {
    ;(async () => {
      const saved = await SecureStore.getItemAsync('oa_token').catch(() => null)
      if (!saved) return setStatus('out')
      setToken(saved)
      try {
        const me = await api<{ user: User; subscription: Subscription }>('/me')
        setUser(me.user)
        setSub(me.subscription)
        SecureStore.setItemAsync('oa_user', JSON.stringify(me.user)).catch(() => {})
        setStatus('in')
      } catch (e) {
        if (e instanceof ApiError && e.status === 401) return // handler already logged out
        // Server not reachable: stay signed in with the saved profile
        const cached = await SecureStore.getItemAsync('oa_user').catch(() => null)
        if (cached) { setUser(JSON.parse(cached)); setStatus('in') } else { await logoutLocal() }
      }
    })()
  }, [logoutLocal])

  const sendOtp: Ctx['sendOtp'] = (phone) =>
    api('/auth/send-otp', { method: 'POST', body: { phone }, auth: false })

  const verifyOtp: Ctx['verifyOtp'] = async (phone, otp, name) => {
    const res = await api<{ token: string; user: User; subscription: Subscription }>('/auth/verify-otp', {
      method: 'POST',
      body: { phone, otp, ...(name ? { name } : {}) },
      auth: false,
    })
    setToken(res.token)
    await SecureStore.setItemAsync('oa_token', res.token)
    await SecureStore.setItemAsync('oa_user', JSON.stringify(res.user))
    setUser(res.user)
    setSub(res.subscription)
    setStatus('in')
  }

  const logout = async () => {
    try { await api('/auth/logout', { method: 'POST' }) } catch {}
    await logoutLocal()
  }

  const refreshMe = async () => {
    const me = await api<{ user: User; subscription: Subscription }>('/me')
    setUser(me.user)
    setSub(me.subscription)
  }

  const value = useMemo(
    () => ({ status, user, subscription, sendOtp, verifyOtp, logout, refreshMe }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [status, user, subscription]
  )
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
