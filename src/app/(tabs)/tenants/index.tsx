import React, { useEffect, useState } from 'react'
import { Linking, Pressable, View } from 'react-native'
import { useRouter } from 'expo-router'
import { statusLook } from '../../../features/bookings/status'
import { useSettings } from '../../../settings/SettingsProvider'
import { useGetTenantsQuery } from '../../../store/api/tenants'
import { Avatar } from '../../../ui/Avatar'
import { Badge } from '../../../ui/Badge'
import { Button } from '../../../ui/Button'
import { Card } from '../../../ui/Card'
import { Chip } from '../../../ui/Chip'
import { EmptyState } from '../../../ui/EmptyState'
import { Fab } from '../../../ui/Fab'
import { Screen } from '../../../ui/Screen'
import { T } from '../../../ui/AppText'
import { TextField } from '../../../ui/TextField'
import { inr } from '../../../utils/format'

type Filter = 'all' | 'live' | 'moved_out'

export default function TenantsList() {
  const { t, colors, errText } = useSettings()
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [debounced, setDebounced] = useState('')
  const [filter, setFilter] = useState<Filter>('all')

  useEffect(() => {
    const h = setTimeout(() => setDebounced(search.trim()), 350)
    return () => clearTimeout(h)
  }, [search])

  const q = useGetTenantsQuery({ search: debounced || undefined, status: filter === 'all' ? undefined : filter })
  const add = () => router.push('/tenants/new' as any)

  return (
    <Screen title={t('tenants')} refreshing={q.isFetching && !q.isLoading} onRefresh={() => q.refetch()} fab={<Fab onPress={add} />}>
      <Button title={`+  ${t('tAdd')}`} onPress={add} style={{ marginBottom: 12 }} />
      <TextField value={search} onChangeText={setSearch} placeholder={t('tSearch')} autoCapitalize="none" />
      <View style={{ flexDirection: 'row', gap: 8, marginBottom: 14 }}>
        <Chip label={t('fAll')} active={filter === 'all'} onPress={() => setFilter('all')} />
        <Chip label={t('fLive')} active={filter === 'live'} onPress={() => setFilter('live')} />
        <Chip label={t('fOut')} active={filter === 'moved_out'} onPress={() => setFilter('moved_out')} />
      </View>

      {q.isLoading ? (
        <T color={colors.muted} style={{ textAlign: 'center', marginTop: 30 }}>{t('loading')}</T>
      ) : q.isError ? (
        <Card>
          <T color={colors.red} style={{ marginBottom: 12 }}>{errText(q.error)}</T>
          <Button title={t('retry')} onPress={() => q.refetch()} />
        </Card>
      ) : q.data && q.data.length === 0 ? (
        <EmptyState icon="account-group-outline" title={t('noTen')} sub={t('noTenH')} />
      ) : (
        q.data?.map((x) => {
          const live = x.live_bookings
          return (
            <Pressable key={x.id} onPress={() => router.push(`/tenants/${x.id}` as any)}>
              <Card>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <Avatar name={x.name} id={x.id} />
                  <View style={{ flex: 1 }}>
                    <T w="bold" size={15.5} numberOfLines={1}>{x.name}</T>
                    {x.phone ? <T size={12.5} color={colors.muted}>+91 {x.phone}</T> : null}
                  </View>
                  {x.total_balance !== 0 ? (
                    <View style={{ alignItems: 'flex-end' }}>
                      <T w="bold" size={15} color={x.total_balance > 0 ? colors.red : colors.green}>{inr(Math.abs(x.total_balance))}</T>
                      <T size={11} color={x.total_balance > 0 ? colors.red : colors.green}>{x.total_balance > 0 ? t('due') : t('adv')}</T>
                    </View>
                  ) : null}
                </View>

                {live.map((b) => {
                  const look = statusLook(b.status)
                  return (
                    <View key={b.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 10 }}>
                      <T size={13} style={{ flex: 1 }} numberOfLines={1}>
                        {b.property_name} · {t('room')} {b.room_no}{b.bed_label ? ` (${t('bed')} ${b.bed_label})` : ''}
                      </T>
                      <Badge label={t(look.key)} tone={look.tone} />
                    </View>
                  )
                })}

                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 10 }}>
                  {live.length === 0 ? <Badge label={x.bookings_count > 0 ? t('stOut') : t('noBooking')} tone="grey" /> : null}
                  <Badge label={x.ekyc_done ? t('ekycOk') : t('ekycPend')} tone={x.ekyc_done ? 'green' : 'amber'} />
                  {live.length > 0 ? (
                    <Badge label={live.every((b) => b.agreement_done) ? t('agrOk') : t('agrPend')} tone={live.every((b) => b.agreement_done) ? 'green' : 'amber'} />
                  ) : null}
                </View>

                {x.phone ? (
                  <View style={{ flexDirection: 'row', gap: 10, marginTop: 12 }}>
                    <Button title={t('call')} variant="ghost" onPress={() => Linking.openURL(`tel:${x.phone}`)} style={{ flex: 1, height: 40 }} />
                    <Button title={t('whatsapp')} variant="ghost" onPress={() => Linking.openURL(`https://wa.me/91${x.phone}`)} style={{ flex: 1, height: 40 }} />
                  </View>
                ) : null}
              </Card>
            </Pressable>
          )
        })
      )}
    </Screen>
  )
}
