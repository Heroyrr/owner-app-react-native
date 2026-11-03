import React from 'react'
import { View } from 'react-native'
import { T } from './AppText'
import { useTone, type Tone } from './Badge'

type Props = { label: string; value: string; sub?: string; tone: Tone }

export function StatTile({ label, value, sub, tone }: Props) {
  const { fg, bg } = useTone(tone)
  return (
    <View style={{ flexGrow: 1, flexBasis: '47%', backgroundColor: bg, borderRadius: 14, padding: 12 }}>
      <T w="bold" size={21} color={fg}>{value}</T>
      <T w="semibold" size={12.5} color={fg}>{label}</T>
      {sub ? <T size={11.5} color={fg} style={{ opacity: 0.85 }}>{sub}</T> : null}
    </View>
  )
}
