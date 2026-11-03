import React, { useState } from 'react'
import { TextInput, View, type TextInputProps } from 'react-native'
import { useSettings } from '../settings/SettingsProvider'
import { T } from './AppText'

type Props = TextInputProps & { label?: string; prefix?: string }

export function TextField({ label, prefix, style, onFocus, onBlur, ...rest }: Props) {
  const { colors, font } = useSettings()
  const [focus, setFocus] = useState(false)
  return (
    <View style={{ marginBottom: 12 }}>
      {label ? <T w="medium" size={12.5} color={colors.muted} style={{ marginBottom: 5 }}>{label}</T> : null}
      <View
        style={{
          flexDirection: 'row', alignItems: 'center', height: 52, borderRadius: 12, borderWidth: 1.5,
          borderColor: focus ? colors.pri : colors.line, backgroundColor: colors.card, paddingHorizontal: 12,
        }}
      >
        {prefix ? <T w="semibold" size={15} color={colors.muted} style={{ marginRight: 8 }}>{prefix}</T> : null}
        <TextInput
          {...rest}
          placeholderTextColor={colors.muted}
          onFocus={(e) => { setFocus(true); onFocus?.(e) }}
          onBlur={(e) => { setFocus(false); onBlur?.(e) }}
          style={[{ flex: 1, fontFamily: font('medium'), fontSize: 16, color: colors.text, paddingVertical: 0 }, style]}
        />
      </View>
    </View>
  )
}
