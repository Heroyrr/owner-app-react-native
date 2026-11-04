import React, { useState } from 'react'
import { Platform, Pressable, View } from 'react-native'
import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker'
import { Feather } from '@expo/vector-icons'
import { useSettings } from '../settings/SettingsProvider'
import { fromYmd, showDate, toYmd, todayYmd } from '../utils/dates'
import { Button } from './Button'
import { Sheet } from './Sheet'
import { T } from './AppText'

type Props = { label?: string; value: string; onChange: (ymd: string) => void; clearable?: boolean; minDate?: string }

/** Tap to pick a date. Value is "YYYY-MM-DD" (empty string = no date). */
export function DateField({ label, value, onChange, clearable, minDate }: Props) {
  const { colors, t } = useSettings()
  const [iosOpen, setIosOpen] = useState(false)
  const current = fromYmd(value || todayYmd())
  const min = minDate ? fromYmd(minDate) : undefined

  const open = () => {
    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({
        value: current, mode: 'date', minimumDate: min,
        onChange: (e, d) => { if (e.type === 'set' && d) onChange(toYmd(d)) },
      })
    } else {
      setIosOpen(true)
    }
  }

  return (
    <View style={{ marginBottom: 12 }}>
      {label ? <T w="medium" size={12.5} color={colors.muted} style={{ marginBottom: 5 }}>{label}</T> : null}
      <Pressable
        onPress={open}
        style={{ flexDirection: 'row', alignItems: 'center', height: 52, borderRadius: 12, borderWidth: 1.5, borderColor: colors.line, backgroundColor: colors.card, paddingHorizontal: 12, gap: 10 }}
      >
        <Feather name="calendar" size={18} color={colors.pri} />
        <T w="medium" size={15.5} style={{ flex: 1 }} color={value ? colors.text : colors.muted}>{value ? showDate(value) : t('pickDate')}</T>
        {clearable && value ? (
          <Pressable onPress={() => onChange('')} hitSlop={10}>
            <Feather name="x" size={18} color={colors.muted} />
          </Pressable>
        ) : null}
      </Pressable>

      {iosOpen ? (
        <Sheet title={label ?? t('pickDate')} onClose={() => setIosOpen(false)}>
          <DateTimePicker value={current} mode="date" display="inline" minimumDate={min} onChange={(_e, d) => d && onChange(toYmd(d))} />
          <Button title={t('done')} onPress={() => setIosOpen(false)} />
        </Sheet>
      ) : null}
    </View>
  )
}
