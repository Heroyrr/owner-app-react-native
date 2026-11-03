import React from 'react'
import { ActivityIndicator, Pressable, type ViewStyle } from 'react-native'
import { useSettings } from '../settings/SettingsProvider'
import { T } from './AppText'

type Props = {
  title: string
  onPress?: () => void
  loading?: boolean
  disabled?: boolean
  variant?: 'primary' | 'danger' | 'ghost'
  style?: ViewStyle
}

export function Button({ title, onPress, loading, disabled, variant = 'primary', style }: Props) {
  const { colors } = useSettings()
  const off = disabled || loading
  const bg = variant === 'primary' ? colors.btn : 'transparent'
  const border = variant === 'danger' ? colors.red : variant === 'ghost' ? colors.line : colors.btn
  const fg = variant === 'primary' ? '#ffffff' : variant === 'danger' ? colors.red : colors.pri
  return (
    <Pressable
      onPress={off ? undefined : onPress}
      style={({ pressed }) => [
        {
          height: 50, borderRadius: 12, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5,
          backgroundColor: bg, borderColor: border, opacity: off ? 0.5 : pressed ? 0.85 : 1,
        },
        style,
      ]}
    >
      {loading ? <ActivityIndicator color={fg} /> : <T w="semibold" size={15} color={fg}>{title}</T>}
    </Pressable>
  )
}
