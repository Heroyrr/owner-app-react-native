import React from 'react'
import { Alert, Pressable, View } from 'react-native'
import { useRouter } from 'expo-router'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { useGetHomeQuery } from '../../store/api/home'
import { useAuth } from '../../auth/AuthProvider'
import { useSettings } from '../../settings/SettingsProvider'
import { Screen } from '../../ui/Screen'
import { Card } from '../../ui/Card'
import { T } from '../../ui/AppText'
import { Button } from '../../ui/Button'
import { StatTile } from '../../ui/StatTile'
import { SubscriptionBanner } from '../../ui/SubscriptionBanner'
import { inr } from '../../utils/format'
import type { Key } from '../../i18n/strings'

type Icon = keyof typeof MaterialCommunityIcons.glyphMap
const QUICK: { key: Key; icon: Icon }[] = [
  { key: 'q1', icon: 'file-document-plus-outline' },
  { key: 'q2', icon: 'speedometer' },
  { key: 'q3', icon: 'calendar-plus' },
  { key: 'q4', icon: 'alert-circle-outline' },
]

function when(iso: string | null) {
  if (!iso) return ''
  const d = new Date(iso)
  const today = new Date().toDateString() === d.toDateString()
  return today ? d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : d.toLocaleDateString()
}

export default function Home() {
  const { t, colors, errText } = useSettings()
  const { user } = useAuth()
  const router = useRouter()
  const openQuick = (key: Key) => {
    if (key === 'q2') router.push('/meters' as any)
    else if (key === 'q3') router.push('/tenants/new?reserve=1' as any)
    else Alert.alert(t(key), t('soon'))
  }
  const q = useGetHomeQuery()
  const d = q.data

  return (
    <Screen
      title={`${t('hello')}${user ? `, ${user.name}` : ''}`}
      sub={t('home')}
      refreshing={q.isFetching}
      onRefresh={() => q.refetch()}
    >
      {q.isLoading ? (
        <T color={colors.muted} style={{ textAlign: 'center', marginTop: 40 }}>{t('loading')}</T>
      ) : q.isError ? (
        <Card>
          <T color={colors.red} style={{ marginBottom: 12 }}>{errText(q.error)}</T>
          <Button title={t('retry')} onPress={() => q.refetch()} />
        </Card>
      ) : d ? (
        <>
          <SubscriptionBanner sub={d.subscription} />

          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 14 }}>
            <StatTile tone="red" label={t('totalDue')} value={inr(d.dues_total)} sub={t('nTenants', { n: d.dues_bookings })} />
            <StatTile tone="green" label={t('collected')} value={inr(d.collected_this_month)} />
            <StatTile tone="green" label={t('vr')} value={String(d.vacant)} sub={t('ft', { n: d.units })} />
            <StatTile tone="amber" label={t('tdues')} value={String(d.dues_bookings)} sub={t('tdSub')} />
          </View>

          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 14 }}>
            {QUICK.map((a) => (
              <Pressable
                key={a.key}
                onPress={() => openQuick(a.key)}
                style={({ pressed }) => ({
                  flexGrow: 1, flexBasis: '47%', flexDirection: 'row', alignItems: 'center', gap: 10, padding: 13,
                  borderRadius: 14, backgroundColor: colors.card, opacity: pressed ? 0.8 : 1,
                  borderWidth: 1, borderColor: colors.line,
                })}
              >
                <MaterialCommunityIcons name={a.icon} size={24} color={colors.pri} />
                <T w="semibold" size={13} style={{ flex: 1 }}>{t(a.key)}</T>
              </Pressable>
            ))}
          </View>

          <Card>
            <T w="bold" size={15} style={{ marginBottom: 8 }}>{t('leads')}</T>
            <T size={13.5} color={colors.muted}>
              {t('lPend')} / {t('lProc')}: <T w="bold" size={13.5}>{d.leads_pending}</T>
            </T>
          </Card>

          <Card>
            <T w="bold" size={15} style={{ marginBottom: 8 }}>{t('rem')}</T>
            {d.reminders.leads.length + d.reminders.complaints.length === 0 ? (
              <T size={13.5} color={colors.muted}>{t('noRem')}</T>
            ) : (
              <>
                {d.reminders.leads.map((r) => (
                  <View key={`l${r.id}`} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 }}>
                    <T size={13.5} style={{ flex: 1 }}>{t('lead')}: {r.name}{r.next_action ? ` · ${r.next_action}` : ''}</T>
                    <T size={12.5} color={colors.muted}>{when(r.next_action_at)}</T>
                  </View>
                ))}
                {d.reminders.complaints.map((r) => (
                  <View key={`c${r.id}`} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 }}>
                    <T size={13.5} style={{ flex: 1 }}>{t('complaint')}: {r.service}{r.property ? ` · ${r.property.name}` : ''}</T>
                    <T size={12.5} color={colors.muted}>{when(r.remind_at)}</T>
                  </View>
                ))}
              </>
            )}
          </Card>
        </>
      ) : null}
    </Screen>
  )
}
