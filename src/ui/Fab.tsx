import React from 'react'
import { Pressable } from 'react-native'
import { Feather } from '@expo/vector-icons'
import { useSettings } from '../settings/SettingsProvider'

export function Fab({ onPress }: { onPress: () => void }) {
  const { colors } = useSettings()
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        width: 56, height: 56, borderRadius: 28, backgroundColor: colors.btn, alignItems: 'center', justifyContent: 'center',
        opacity: pressed ? 0.85 : 1, shadowColor: colors.shadow, shadowOpacity: 0.3, shadowRadius: 8, shadowOffset: { width: 0, height: 3 }, elevation: 5,
      })}
    >
      <Feather name="plus" size={26} color="#fff" />
    </Pressable>
  )
}
