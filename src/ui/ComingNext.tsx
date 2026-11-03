import React from 'react'
import { View } from 'react-native'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { useSettings } from '../settings/SettingsProvider'
import { Screen } from './Screen'
import { T } from './AppText'

/** Placeholder for tabs that are built in the next steps */
export function ComingNext({ title, icon }: { title: string; icon: keyof typeof MaterialCommunityIcons.glyphMap }) {
  const { colors, t } = useSettings()
  return (
    <Screen title={title} scroll={false}>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10 }}>
        <MaterialCommunityIcons name={icon} size={56} color={colors.pri} />
        <T w="semibold" size={16}>{t('comingTitle')}</T>
        <T size={13.5} color={colors.muted} style={{ textAlign: 'center' }}>{t('soon')}</T>
      </View>
    </Screen>
  )
}
