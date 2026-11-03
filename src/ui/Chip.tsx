import React from 'react'
import { Pressable } from 'react-native'
import { useSettings } from '../settings/SettingsProvider'
import { T } from './AppText'

export function Chip({ label, active, onPress }: { label: string; active?: boolean; onPress?: () => void }) {
  const { colors } = useSettings()
  return (
    <Pressable
      onPress={onPress}
      style={{
        paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1,
        backgroundColor: active ? colors.btn : colors.card, borderColor: active ? colors.btn : colors.line,
      }}
    >
      <T w="semibold" size={13} color={active ? '#fff' : colors.text}>{label}</T>
    </Pressable>
  )
}
