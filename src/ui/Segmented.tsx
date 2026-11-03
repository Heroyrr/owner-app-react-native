import React from 'react'
import { Pressable, View } from 'react-native'
import { useSettings } from '../settings/SettingsProvider'
import { T } from './AppText'

export function Segmented<V extends string>({
  value, options, onChange,
}: { value: V; options: { v: V; label: string }[]; onChange: (v: V) => void }) {
  const { colors } = useSettings()
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
      {options.map((o) => {
        const on = o.v === value
        return (
          <Pressable
            key={o.v}
            onPress={() => onChange(o.v)}
            style={{ paddingHorizontal: 13, paddingVertical: 7, borderRadius: 20, backgroundColor: on ? colors.btn : 'transparent', borderWidth: 1, borderColor: on ? colors.btn : colors.line }}
          >
            <T w="semibold" size={12.5} color={on ? '#fff' : colors.text}>{o.label}</T>
          </Pressable>
        )
      })}
    </View>
  )
}
