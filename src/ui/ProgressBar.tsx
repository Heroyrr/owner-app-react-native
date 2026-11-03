import React from 'react'
import { View } from 'react-native'
import { useSettings } from '../settings/SettingsProvider'

export function ProgressBar({ pct, color }: { pct: number; color?: string }) {
  const { colors } = useSettings()
  return (
    <View style={{ height: 5, borderRadius: 3, backgroundColor: colors.line, overflow: 'hidden' }}>
      <View style={{ width: `${Math.max(0, Math.min(100, pct))}%`, height: 5, backgroundColor: color ?? colors.green }} />
    </View>
  )
}
