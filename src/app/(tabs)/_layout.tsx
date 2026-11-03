import React from 'react'
import { View } from 'react-native'
import { Tabs } from 'expo-router'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useSettings } from '../../settings/SettingsProvider'
import { T } from '../../ui/AppText'
import type { Key } from '../../i18n/strings'

type Icon = keyof typeof MaterialCommunityIcons.glyphMap

/** Active tab: filled icon inside a soft pill, bold coloured label. Inactive: outline icon, grey label. */
function useTab() {
  const { colors, t } = useSettings()
  return (labelKey: Key, filled: Icon, outline: Icon) => ({
    title: t(labelKey),
    tabBarIcon: ({ focused, color }: { focused: boolean; color: string }) => (
      <View
        style={{
          width: 54, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center',
          backgroundColor: focused ? `${colors.pri}26` : 'transparent',
        }}
      >
        <MaterialCommunityIcons name={focused ? filled : outline} size={23} color={color} />
      </View>
    ),
    tabBarLabel: ({ focused, color }: { focused: boolean; color: string }) => (
      <T w={focused ? 'bold' : 'medium'} size={11} color={color}>{t(labelKey)}</T>
    ),
  })
}

export default function TabsLayout() {
  const { colors } = useSettings()
  const insets = useSafeAreaInsets()
  const tab = useTab()
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.pri,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: {
          backgroundColor: colors.card, borderTopColor: colors.line,
          height: 62 + insets.bottom, paddingBottom: insets.bottom + 4, paddingTop: 6,
        },
      }}
    >
      <Tabs.Screen name="index" options={tab('home', 'home', 'home-outline')} />
      <Tabs.Screen name="properties" options={tab('props', 'office-building', 'office-building-outline')} />
      <Tabs.Screen name="tenants" options={tab('tenants', 'account-group', 'account-group-outline')} />
      <Tabs.Screen name="invoices" options={tab('inv', 'receipt-text', 'receipt-text-outline')} />
      <Tabs.Screen name="more" options={tab('more', 'view-grid', 'view-grid-outline')} />
    </Tabs>
  )
}
