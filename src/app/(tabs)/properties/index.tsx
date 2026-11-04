import React, { useMemo, useState } from 'react'
import { Pressable, View } from 'react-native'
import { useRouter } from 'expo-router'
import { useGetBalancesQuery } from '../../../store/api/billing'
import { useGetPropertiesQuery } from '../../../store/api/properties'
import { AddPropertySheet } from '../../../features/properties/sheets'
import { useSettings } from '../../../settings/SettingsProvider'
import { Badge } from '../../../ui/Badge'
import { Button } from '../../../ui/Button'
import { Card } from '../../../ui/Card'
import { EmptyState } from '../../../ui/EmptyState'
import { Fab } from '../../../ui/Fab'
import { ProgressBar } from '../../../ui/ProgressBar'
import { Screen } from '../../../ui/Screen'
import { T } from '../../../ui/AppText'
import { inr } from '../../../utils/format'

export default function PropertiesList() {
  const { t, colors, errText } = useSettings()
  const router = useRouter()
  const [adding, setAdding] = useState(false)

  const q = useGetPropertiesQuery()
  // Dues per property come from the balances list (one row per booking)
  const dues = useGetBalancesQuery({ due: 'true' })
  const dueBy = useMemo(() => {
    const m: Record<number, number> = {}
    for (const r of dues.data ?? []) m[r.property_id] = (m[r.property_id] ?? 0) + r.balance
    return m
  }, [dues.data])

  const refresh = () => { q.refetch(); dues.refetch() }
  const open = (id: number) => router.push(`/properties/${id}` as any)

  return (
    <Screen
      title={t('props')}
      refreshing={q.isFetching}
      onRefresh={refresh}
      fab={<Fab onPress={() => setAdding(true)} />}
    >
      <Button title={`+  ${t('addProp')}`} onPress={() => setAdding(true)} style={{ marginBottom: 12 }} />

      {q.isLoading ? (
        <T color={colors.muted} style={{ textAlign: 'center', marginTop: 40 }}>{t('loading')}</T>
      ) : q.isError ? (
        <Card>
          <T color={colors.red} style={{ marginBottom: 12 }}>{errText(q.error)}</T>
          <Button title={t('retry')} onPress={refresh} />
        </Card>
      ) : q.data && q.data.length === 0 ? (
        <EmptyState icon="office-building-outline" title={t('noProps')} sub={t('noPropsH')} />
      ) : (
        q.data?.map((p) => {
          const pct = p.units ? Math.round((p.occupied / p.units) * 100) : 0
          const due = dueBy[p.id] ?? 0
          return (
            <Pressable key={p.id} onPress={() => open(p.id)}>
              <Card>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                  <T w="bold" size={16} style={{ flex: 1 }} numberOfLines={1}>{p.name}</T>
                  <Badge label={p.type === 'BED' ? t('bedT') : t('nonBedT')} tone="grey" />
                </View>
                {p.address ? <T size={12.5} color={colors.muted} numberOfLines={1} style={{ marginTop: 2 }}>{p.address}</T> : null}

                <View style={{ flexDirection: 'row', gap: 10, marginTop: 12 }}>
                  <View style={{ flex: 1, backgroundColor: colors.greenbg, borderRadius: 10, padding: 9 }}>
                    <T w="bold" size={18} color={colors.green}>{p.occupied}</T>
                    <T size={11.5} color={colors.green}>{t('occupied')}</T>
                  </View>
                  <View style={{ flex: 1, backgroundColor: colors.amberbg, borderRadius: 10, padding: 9 }}>
                    <T w="bold" size={18} color={colors.amber}>{p.vacant}</T>
                    <T size={11.5} color={colors.amber}>{t('vacant')}</T>
                  </View>
                  <View style={{ flex: 1, backgroundColor: due > 0 ? colors.redbg : colors.line, borderRadius: 10, padding: 9 }}>
                    <T w="bold" size={18} color={due > 0 ? colors.red : colors.muted}>{inr(due)}</T>
                    <T size={11.5} color={due > 0 ? colors.red : colors.muted}>{t('due')}</T>
                  </View>
                </View>

                <View style={{ marginTop: 12, gap: 4 }}>
                  <ProgressBar pct={pct} />
                  <T size={11.5} color={colors.muted}>{pct}% · {p.units} {t('units')}</T>
                </View>
              </Card>
            </Pressable>
          )
        })
      )}

      {adding ? (
        <AddPropertySheet
          onClose={() => setAdding(false)}
          onDone={(id) => {
            setAdding(false)
            open(id)
          }}
        />
      ) : null}
    </Screen>
  )
}
