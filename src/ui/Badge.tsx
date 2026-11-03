import React from 'react'
import { View } from 'react-native'
import { useSettings } from '../settings/SettingsProvider'
import { T } from './AppText'

export type Tone = 'red' | 'green' | 'amber' | 'grey'

export function useTone(tone: Tone) {
  const { colors } = useSettings()
  if (tone === 'red') return { fg: colors.red, bg: colors.redbg }
  if (tone === 'green') return { fg: colors.green, bg: colors.greenbg }
  if (tone === 'amber') return { fg: colors.amber, bg: colors.amberbg }
  return { fg: colors.muted, bg: colors.line }
}

export function Badge({ label, tone = 'grey' }: { label: string; tone?: Tone }) {
  const { fg, bg } = useTone(tone)
  return (
    <View style={{ alignSelf: 'flex-start', paddingHorizontal: 9, paddingVertical: 2, borderRadius: 20, backgroundColor: bg, borderWidth: 1, borderColor: fg }}>
      <T w="semibold" size={11} color={fg}>{label}</T>
    </View>
  )
}
