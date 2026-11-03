import React from 'react'
import { Pressable, RefreshControl, ScrollView, View } from 'react-native'
import { useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Feather } from '@expo/vector-icons'
import { useSettings } from '../settings/SettingsProvider'
import { useAuth } from '../auth/AuthProvider'
import { api } from '../api/client'
import { T } from './AppText'

/** Language (EN / हिं) and light/dark buttons shown in the header band */
export function HeaderTools() {
  const { lang, setLang, isDark, setMode } = useSettings()
  const { status } = useAuth()
  const toggleLang = () => {
    const next = lang === 'en' ? 'hi' : 'en'
    setLang(next)
    // keep a copy of the language on the server (the phone is the main source)
    if (status === 'in') api('/me', { method: 'PATCH', body: { language: next } }).catch(() => {})
  }
  const btn = { width: 38, height: 38, borderRadius: 19, alignItems: 'center' as const, justifyContent: 'center' as const, backgroundColor: 'rgba(255,255,255,0.16)' }
  return (
    <View style={{ flexDirection: 'row', gap: 8 }}>
      <Pressable onPress={toggleLang} style={btn} hitSlop={6}>
        <T w="bold" size={13} color="#fff">{lang === 'en' ? 'हिं' : 'EN'}</T>
      </Pressable>
      <Pressable onPress={() => setMode(isDark ? 'light' : 'dark')} style={btn} hitSlop={6}>
        <Feather name={isDark ? 'sun' : 'moon'} size={18} color="#fff" />
      </Pressable>
    </View>
  )
}

type Props = {
  title: string
  sub?: string
  children: React.ReactNode
  scroll?: boolean
  back?: boolean
  refreshing?: boolean
  onRefresh?: () => void
  fab?: React.ReactNode
}

/** Teal header band with the content sheet sliding over it, like the design */
export function Screen({ title, sub, children, scroll = true, back, refreshing, onRefresh, fab }: Props) {
  const { colors } = useSettings()
  const insets = useSafeAreaInsets()
  const router = useRouter()
  return (
    <View style={{ flex: 1, backgroundColor: colors.hd }}>
      <View style={{ paddingTop: insets.top + 12, paddingHorizontal: 16, paddingBottom: 30 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          {back ? (
            <Pressable
              onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)' as any))}
              hitSlop={8}
              style={{ width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.16)', marginRight: 10 }}
            >
              <Feather name="chevron-left" size={22} color="#fff" />
            </Pressable>
          ) : null}
          <View style={{ flex: 1, paddingRight: 10 }}>
            <T w="bold" size={21} color="#fff" numberOfLines={1}>{title}</T>
            {sub ? <T size={13} color="rgba(255,255,255,0.8)" numberOfLines={1}>{sub}</T> : null}
          </View>
          <HeaderTools />
        </View>
      </View>
      <View style={{ flex: 1, marginTop: -16, borderTopLeftRadius: 22, borderTopRightRadius: 22, backgroundColor: colors.bg, overflow: 'hidden' }}>
        {scroll ? (
          <ScrollView
            contentContainerStyle={{ padding: 14, paddingBottom: 90 }}
            keyboardShouldPersistTaps="handled"
            refreshControl={onRefresh ? <RefreshControl refreshing={!!refreshing} onRefresh={onRefresh} tintColor={colors.pri} /> : undefined}
          >
            {children}
          </ScrollView>
        ) : (
          <View style={{ flex: 1, padding: 14 }}>{children}</View>
        )}
        {fab ? <View style={{ position: 'absolute', right: 16, bottom: 16 }}>{fab}</View> : null}
      </View>
    </View>
  )
}
