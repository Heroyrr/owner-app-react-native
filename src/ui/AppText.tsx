import React from 'react'
import { Text, type TextProps } from 'react-native'
import { useSettings } from '../settings/SettingsProvider'
import type { Weight } from '../theme/fonts'

type Props = TextProps & { w?: Weight; size?: number; color?: string }

/** Text that always uses the right font for the current language (Inter or Noto Sans Devanagari) */
export function T({ w = 'regular', size = 14, color, style, ...rest }: Props) {
  const { font, colors } = useSettings()
  return (
    <Text
      {...rest}
      style={[{ fontFamily: font(w), fontSize: size, lineHeight: Math.round(size * 1.4), color: color ?? colors.text }, style]}
    />
  )
}
