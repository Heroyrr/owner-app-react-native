import React from 'react'
import { View } from 'react-native'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { useSettings } from '../settings/SettingsProvider'
import { T } from './AppText'

export function EmptyState({ icon, title, sub }: { icon: keyof typeof MaterialCommunityIcons.glyphMap; title: string; sub?: string }) {
  const { colors } = useSettings()
  return (
    <View style={{ alignItems: 'center', paddingVertical: 50, gap: 8 }}>
      <MaterialCommunityIcons name={icon} size={52} color={colors.muted} />
      <T w="semibold" size={16}>{title}</T>
      {sub ? <T size={13.5} color={colors.muted} style={{ textAlign: 'center' }}>{sub}</T> : null}
    </View>
  )
}
