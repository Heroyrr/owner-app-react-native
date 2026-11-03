import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { useColorScheme } from 'react-native'
import * as SecureStore from 'expo-secure-store'
import { dark, light, type Colors } from '../theme/tokens'
import { familyFor, type Weight } from '../theme/fonts'
import { strings, type Key, type Lang } from '../i18n/strings'
import { ApiError } from '../api/client'

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
    // Show a translated message when we have one for the error code, else the server's message
    const errText = (e: unknown) => {
      if (e instanceof ApiError) {
        const key = `err_${e.code}` as Key
        // in English keep the server's own message for codes where it carries numbers or names
        const keepServer = lang === 'en' && ['ROOM_EXISTS', 'UNIT_LIMIT', 'PROPERTY_LIMIT', 'READING_LOWER'].includes(e.code ?? '')
        if (keepServer) return e.message
        return (e.code && strings[lang][key]) || e.message
      }
      return e instanceof Error ? e.message : String(e)
    }
    return {
      ready, lang, mode, isDark, colors: isDark ? dark : light, t, errText,
      font: (w = 'regular') => familyFor(lang, w), setLang, setMode,
    }
  }, [ready, lang, mode, system, setLang, setMode])

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>
}
