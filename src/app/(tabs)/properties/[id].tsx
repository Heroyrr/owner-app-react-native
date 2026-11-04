import React, { useState } from 'react'
import { Alert, Pressable, View } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { Feather } from '@expo/vector-icons'
import type { CategoryInfo, RoomInfo } from '../../../api/types'
import { useDeleteCategoryMutation, useGetPropertyQuery } from '../../../store/api/properties'
import { AddRoomSheet, CategorySheet, EditPropertySheet, RoomSheet } from '../../../features/properties/sheets'
import { useAction } from '../../../hooks/useAction'
import { useSettings } from '../../../settings/SettingsProvider'
import { Button } from '../../../ui/Button'
import { Card } from '../../../ui/Card'
import { Screen } from '../../../ui/Screen'
import { StatTile } from '../../../ui/StatTile'
import { T } from '../../../ui/AppText'
import { inr } from '../../../utils/format'

type Sheet =
  | { kind: 'addCat' }
  | { kind: 'editCat'; cat: CategoryInfo }
  | { kind: 'addRoom'; catId?: number }
  | { kind: 'room'; catId: number; roomId: number }
  | { kind: 'editProp' }
  | null

/** Colour of a room box: vacant = green, partly full = amber, full = solid */
function roomLook(r: RoomInfo, isBed: boolean, colors: ReturnType<typeof useSettings>['colors']) {
  const total = isBed ? r.beds.length : 1
  const used = isBed ? r.beds.filter((b) => b.occupied).length : r.occupied ? 1 : 0
  if (used === 0) return { bg: colors.greenbg, fg: colors.green, border: colors.green, used, total }
  if (used < total) return { bg: colors.amberbg, fg: colors.amber, border: colors.amber, used, total }
  return { bg: colors.btn, fg: '#ffffff', border: colors.btn, used, total }
}

export default function PropertyDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const { t, colors, errText } = useSettings()
  const router = useRouter()
  const { run } = useAction()
  const [deleteCategory] = useDeleteCategoryMutation()
  const [sheet, setSheet] = useState<Sheet>(null)

  const q = useGetPropertyQuery(id, { skip: !id })
  const p = q.data
  const isBed = p?.type === 'BED'

  const close = () => setSheet(null)
  const done = () => close() // lists refresh by themselves after every change

  const removeCategory = (cat: CategoryInfo) =>
    Alert.alert(cat.name, t('rmCatQ'), [
      { text: t('cancel'), style: 'cancel' },
      {
        text: t('delete'), style: 'destructive',
        onPress: async () => {
          await run(() => deleteCategory(cat.id).unwrap())
        },
      },
    ])

  // keep the open room sheet in step with fresh data
  const roomSel = sheet?.kind === 'room' ? p?.categories.find((c) => c.id === sheet.catId) : undefined
  const roomData = sheet?.kind === 'room' ? roomSel?.rooms.find((r) => r.id === sheet.roomId) : undefined

  return (
    <Screen
      title={p?.name ?? t('props')}
      sub={p ? `${p.type === 'BED' ? t('bedT') : t('nonBedT')}${p.address ? ` · ${p.address}` : ''}` : undefined}
      back
      refreshing={q.isFetching}
      onRefresh={() => q.refetch()}
    >
      {q.isLoading ? (
        <T color={colors.muted} style={{ textAlign: 'center', marginTop: 40 }}>{t('loading')}</T>
      ) : q.isError || !p ? (
        <Card>
          <T color={colors.red} style={{ marginBottom: 12 }}>{errText(q.error)}</T>
          <Button title={t('retry')} onPress={() => q.refetch()} />
        </Card>
      ) : (
        <>
          <View style={{ flexDirection: 'row', gap: 10, marginBottom: 12 }}>
            <StatTile tone="grey" label={t('units')} value={String(p.units)} />
            <StatTile tone="green" label={t('occupied')} value={String(p.occupied)} />
            <StatTile tone="amber" label={t('vacant')} value={String(p.vacant)} />
          </View>

          <View style={{ flexDirection: 'row', gap: 10, marginBottom: 14 }}>
            <Button title={t('addCat')} onPress={() => setSheet({ kind: 'addCat' })} style={{ flex: 1 }} />
            <Button title={t('metersT')} variant="ghost" onPress={() => router.push(`/meters?propertyId=${p.id}` as any)} style={{ flex: 1 }} />
          </View>

          {p.categories.map((c) => (
            <Card key={c.id}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <View style={{ flex: 1 }}>
                  <T w="bold" size={16}>{c.name}</T>
                  <T size={13} color={colors.muted}>
                    {inr(c.rent)} {isBed ? t('perBed') : t('perMonth')}
                    {isBed && c.beds_per_room ? ` · ${t('bedsRoom', { n: c.beds_per_room })}` : ''} · {t('nRooms', { n: c.rooms.length })}
                  </T>
                </View>
                <Pressable onPress={() => setSheet({ kind: 'editCat', cat: c })} hitSlop={8} style={{ padding: 6 }}>
                  <Feather name="edit-2" size={18} color={colors.pri} />
                </Pressable>
                <Pressable onPress={() => removeCategory(c)} hitSlop={8} style={{ padding: 6 }}>
                  <Feather name="trash-2" size={18} color={colors.red} />
                </Pressable>
              </View>

              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
                {c.rooms.map((r) => {
                  const look = roomLook(r, isBed, colors)
                  return (
                    <Pressable
                      key={r.id}
                      onPress={() => setSheet({ kind: 'room', catId: c.id, roomId: r.id })}
                      style={{ minWidth: 64, paddingHorizontal: 8, paddingVertical: 8, borderRadius: 10, borderWidth: 1.5, alignItems: 'center', backgroundColor: look.bg, borderColor: look.border }}
                    >
                      <T w="bold" size={14} color={look.fg}>{r.room_no}</T>
                      {isBed ? <T size={10.5} color={look.fg}>{look.used}/{look.total}</T> : null}
                    </Pressable>
                  )
                })}
                <Pressable
                  onPress={() => setSheet({ kind: 'addRoom', catId: c.id })}
                  style={{ minWidth: 64, paddingVertical: 8, borderRadius: 10, borderWidth: 1.5, borderStyle: 'dashed', borderColor: colors.muted, alignItems: 'center', justifyContent: 'center' }}
                >
                  <Feather name="plus" size={20} color={colors.muted} />
                </Pressable>
              </View>
            </Card>
          ))}

          <View style={{ height: 6 }} />
          <Button title={t('editProp')} variant="ghost" onPress={() => setSheet({ kind: 'editProp' })} />
        </>
      )}

      {p && sheet?.kind === 'addCat' ? (
        <CategorySheet propertyId={p.id} propertyType={p.type} onClose={close} onDone={done} />
      ) : null}
      {p && sheet?.kind === 'editCat' ? (
        <CategorySheet propertyId={p.id} propertyType={p.type} category={sheet.cat} onClose={close} onDone={done} />
      ) : null}
      {p && sheet?.kind === 'addRoom' ? (
        <AddRoomSheet propertyId={p.id} categories={p.categories} presetCategoryId={sheet.catId} onClose={close} onDone={done} />
      ) : null}
      {p && roomData && roomSel ? (
        <RoomSheet room={roomData} category={roomSel} propertyType={p.type} onClose={close} onDone={() => {}} />
      ) : null}
      {p && sheet?.kind === 'editProp' ? (
        <EditPropertySheet
          property={p}
          onClose={close}
          onDone={done}
          onDeleted={() => {
            close()
            router.replace('/properties' as any)
          }}
        />
      ) : null}
    </Screen>
  )
}
