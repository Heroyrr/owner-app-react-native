import React from 'react'
import { Pressable, View } from 'react-native'
import { useLocalSearchParams } from 'expo-router'
import { useQuery } from '@tanstack/react-query'
import { Feather } from '@expo/vector-icons'
import { api } from '../../api/client'
import { openFile } from '../../api/files'
import type { Reading } from '../../api/types'
import { useAction } from '../../hooks/useAction'
import { useSettings } from '../../settings/SettingsProvider'
import { Badge } from '../../ui/Badge'
import { Button } from '../../ui/Button'
import { Card } from '../../ui/Card'
import { EmptyState } from '../../ui/EmptyState'
import { Screen } from '../../ui/Screen'
import { T } from '../../ui/AppText'

const fmt = (n: number) => String(Math.round(n * 100) / 100)
const stamp = (iso: string) => {
  const d = new Date(iso)
  return `${d.toLocaleDateString()} ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
}

export default function ReadingHistory() {
  const { roomId, room } = useLocalSearchParams<{ roomId: string; room?: string }>()
  const { t, colors, errText } = useSettings()
  const { run } = useAction()
  const q = useQuery({ queryKey: ['readings', roomId], queryFn: () => api<Reading[]>(`/rooms/${roomId}/meter-readings`), enabled: !!roomId })

  return (
    <Screen title={`${t('history')}${room ? ` · ${room}` : ''}`} sub={t('metersT')} back refreshing={q.isRefetching} onRefresh={() => q.refetch()}>
      {q.isLoading ? (
        <T color={colors.muted} style={{ textAlign: 'center', marginTop: 40 }}>{t('loading')}</T>
      ) : q.isError ? (
        <Card>
          <T color={colors.red} style={{ marginBottom: 12 }}>{errText(q.error)}</T>
          <Button title={t('retry')} onPress={() => q.refetch()} />
        </Card>
      ) : q.data && q.data.length === 0 ? (
        <EmptyState icon="speedometer" title={t('noHistory')} />
      ) : (
        q.data?.map((r, i) => {
          const prev = q.data?.[i + 1]
          const used = prev && r.value >= prev.value && !r.is_reset ? r.value - prev.value : null
          return (
            <Card key={r.id}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <View style={{ flex: 1 }}>
                  <T w="bold" size={18}>{fmt(r.value)}</T>
                  <T size={12.5} color={colors.muted}>{stamp(r.created_at)}</T>
                  {used !== null ? <T size={12.5} color={colors.green}>{t('unitsUsed', { n: fmt(used) })}</T> : null}
                </View>
                {r.is_reset ? <Badge label={t('resetBadge')} tone="amber" /> : null}
                {r.photo_key ? (
                  <Pressable onPress={() => run(() => openFile(r.photo_key as string))} hitSlop={8} accessibilityLabel={t('openPhoto')}>
                    <Feather name="image" size={22} color={colors.pri} />
                  </Pressable>
                ) : null}
              </View>
            </Card>
          )
        })
      )}
    </Screen>
  )
}
