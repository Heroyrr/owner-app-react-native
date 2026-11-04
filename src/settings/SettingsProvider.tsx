import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { useColorScheme } from 'react-native'
import * as SecureStore from 'expo-secure-store'
import { dark, light, type Colors } from '../theme/tokens'
import { familyFor, type Weight } from '../theme/fonts'
import { strings, type Key, type Lang } from '../i18n/strings'

export type Mode = 'light' | 'dark' | 'system'

type Ctx = {
  ready: boolean
  lang: Lang
  mode: Mode
  isDark: boolean
  colors: Colors
  t: (key: Key, vars?: Record<string, string | number>) => string
  font: (w?: Weight) => string
  errText: (e: unknown) => string
  setLang: (l: Lang) => void
  setMode: (m: Mode) => void
}

const SettingsContext = createContext<Ctx>(null as unknown as Ctx)
export const useSettings = () => useContext(SettingsContext)

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const system = useColorScheme()
  const [lang, setLangState] = useState<Lang>('en')
  const [mode, setModeState] = useState<Mode>('system')
  const [ready, setReady] = useState(false)

  useEffect(() => {
    ;(async () => {
      try {
        const l = await SecureStore.getItemAsync('oa_lang')
        const m = await SecureStore.getItemAsync('oa_theme')
        if (l === 'en' || l === 'hi') setLangState(l)
        if (m === 'light' || m === 'dark' || m === 'system') setModeState(m)
      } catch {}
      setReady(true)
    })()
  }, [])

  const setLang = useCallback((l: Lang) => {
    setLangState(l)
    SecureStore.setItemAsync('oa_lang', l).catch(() => {})
  }, [])
  const setMode = useCallback((m: Mode) => {
    setModeState(m)
    SecureStore.setItemAsync('oa_theme', m).catch(() => {})
  }, [])

  const value = useMemo<Ctx>(() => {
    const isDark = mode === 'dark' || (mode === 'system' && system === 'dark')
    const t: Ctx['t'] = (key, vars) => {
      let s: string = strings[lang][key] ?? strings.en[key] ?? key
      if (vars) for (const k of Object.keys(vars)) s = s.replace(`{${k}}`, String(vars[k]))
      return s
    }
    // Show a translated message when we have one for the error code, else the server's message.
    // Works for ApiError and for the plain { status, code, message } objects RTK Query gives.
    const errText = (e: unknown) => {
      const o = e as { message?: unknown; code?: unknown } | null
      const code = typeof o?.code === 'string' ? o.code : undefined
      const message = typeof o?.message === 'string' ? o.message : e instanceof Error ? e.message : String(e)
      if (!code) return message
      // in English keep the server's own message for codes where it carries numbers or names
      const keepServer = lang === 'en' && ['ROOM_EXISTS', 'UNIT_LIMIT', 'PROPERTY_LIMIT', 'READING_LOWER'].includes(code)
      if (keepServer) return message
      return strings[lang][`err_${code}` as Key] || message
    }
    return {
      ready, lang, mode, isDark, colors: isDark ? dark : light, t, errText,
      font: (w = 'regular') => familyFor(lang, w), setLang, setMode,
    }
  }, [ready, lang, mode, system, setLang, setMode])

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>
}
