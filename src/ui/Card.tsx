import React from 'react'
import { View, type ViewProps } from 'react-native'
import { useSettings } from '../settings/SettingsProvider'

export function Card({ style, ...rest }: ViewProps) {
  const { colors } = useSettings()
  return (
    <View
      {...rest}
      style={[
        {
          backgroundColor: colors.card, borderRadius: 14, padding: 14, marginBottom: 10,
          shadowColor: colors.shadow, shadowOpacity: 0.08, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 2,
        },
        style,
      ]}
    />
  )
}
