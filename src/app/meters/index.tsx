import React, { useEffect, useState } from 'react'
import { Alert, Image, Pressable, Switch, View } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { Feather } from '@expo/vector-icons'
import type { MeterRow } from '../../api/types'
import { useUploadFileMutation } from '../../store/api/files'
import { useAddReadingMutation, useGetMetersQuery } from '../../store/api/meters'
import { useGetPropertiesQuery } from '../../store/api/properties'
import { pickImage } from '../../utils/pickImage'
import { useAction } from '../../hooks/useAction'
import { useSettings } from '../../settings/SettingsProvider'
import { Button } from '../../ui/Button'
import { Card } from '../../ui/Card'
import { Chip } from '../../ui/Chip'
import { EmptyState } from '../../ui/EmptyState'
import { Screen } from '../../ui/Screen'
import { Sheet } from '../../ui/Sheet'
import { T } from '../../ui/AppText'
import { TextField } from '../../ui/TextField'

const fmt = (n: number) => String(Math.round(n * 100) / 100)

/* ---------------------------------------------------------------- add a reading */
function ReadingSheet({ row, onClose, onDone }: { row: MeterRow; onClose: () => void; onDone: () => void }) {
  const { t, colors } = useSettings()
  const { busy, run } = useAction()
  const [uploadFile] = useUploadFileMutation()
  const [addReading] = useAddReadingMutation()
  const [value, setValue] = useState('')
  const [reset, setReset] = useState(false)
  const [photo, setPhoto] = useState<{ uri: string; mime: string } | null>(null)

  const num = Number(value)
  const last = row.latest?.value
  const tooLow = value !== '' && last !== undefined && num < last && !reset
  const valid = value.trim() !== '' && !Number.isNaN(num) && num >= 0 && !tooLow

  async function pick(camera: boolean) {
    const img = await pickImage(camera, () => Alert.alert(t('error'), t('camDenied')))
    if (img) setPhoto(img)
  }

  async function submit() {
    const r = await run(async () => {
      const key = photo ? (await uploadFile({ uri: photo.uri, kind: 'meter', mime: photo.mime }).unwrap()).key : undefined
      return addReading({ roomId: row.room_id, value: num, ...(reset ? { is_reset: true } : {}), ...(key ? { photo_key: key } : {}) }).unwrap()
    })
    if (r.ok) onDone()
  }

  return (
    <Sheet title={`${t('addReading')} · ${row.room_no}`} onClose={onClose}>
      <T size={13} color={colors.muted} style={{ marginBottom: 10 }}>
        {last !== undefined ? t('lastWas', { n: fmt(last) }) : t('noReading')}
      </T>
      <TextField label={t('newReading')} value={value} onChangeText={setValue} keyboardType="decimal-pad" autoFocus />
      {tooLow ? <T size={12.5} color={colors.red} style={{ marginTop: -6, marginBottom: 10 }}>{t('err_READING_LOWER')}</T> : null}

      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <T w="medium" size={13.5} style={{ flex: 1, paddingRight: 10 }}>{t('replaced')}</T>
        <Switch value={reset} onValueChange={setReset} trackColor={{ true: colors.btn, false: colors.line }} />
      </View>

      <T w="medium" size={12.5} color={colors.muted} style={{ marginBottom: 6 }}>{t('photo')}</T>
      {photo ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 }}>
          <Image source={{ uri: photo.uri }} style={{ width: 72, height: 72, borderRadius: 10 }} />
          <Pressable onPress={() => setPhoto(null)} hitSlop={8}>
            <Feather name="x-circle" size={22} color={colors.red} />
          </Pressable>
        </View>
      ) : (
        <View style={{ flexDirection: 'row', gap: 10, marginBottom: 14 }}>
          <Button title={t('takePhoto')} variant="ghost" onPress={() => pick(true)} style={{ flex: 1 }} />
          <Button title={t('gallery')} variant="ghost" onPress={() => pick(false)} style={{ flex: 1 }} />
        </View>
      )}

      <Button title={t('save')} onPress={submit} loading={busy} disabled={!valid} />
    </Sheet>
  )
}

/* ---------------------------------------------------------------- screen */
export default function Meters() {
  const { propertyId } = useLocalSearchParams<{ propertyId?: string }>()
  const { t, colors, errText } = useSettings()
  const router = useRouter()
  const [selected, setSelected] = useState<number | null>(propertyId ? Number(propertyId) : null)
  const [adding, setAdding] = useState<MeterRow | null>(null)

  const props = useGetPropertiesQuery()
  useEffect(() => {
    if (selected === null && props.data?.length) setSelected(props.data[0].id)
  }, [props.data, selected])

  const q = useGetMetersQuery(selected as number, { skip: selected === null })

  return (
    <Screen title={t('metersT')} back refreshing={q.isFetching} onRefresh={() => q.refetch()}>
      {props.data && props.data.length > 1 ? (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 }}>
          {props.data.map((p) => (
            <Chip key={p.id} label={p.name} active={p.id === selected} onPress={() => setSelected(p.id)} />
          ))}
        </View>
      ) : null}

      {props.isLoading || q.isLoading ? (
        <T color={colors.muted} style={{ textAlign: 'center', marginTop: 40 }}>{t('loading')}</T>
      ) : props.data && props.data.length === 0 ? (
        <EmptyState icon="office-building-outline" title={t('noProps')} sub={t('noPropsH')} />
      ) : q.isError ? (
        <Card>
          <T color={colors.red} style={{ marginBottom: 12 }}>{errText(q.error)}</T>
          <Button title={t('retry')} onPress={() => q.refetch()} />
        </Card>
      ) : q.data && q.data.length === 0 ? (
        <EmptyState icon="speedometer" title={t('noRooms')} />
      ) : (
        q.data?.map((row) => (
          <Pressable key={row.room_id} onPress={() => router.push(`/meters/${row.room_id}?room=${encodeURIComponent(row.room_no)}` as any)}>
            <Card>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <View style={{ flex: 1 }}>
                  <T w="bold" size={16}>{t('room')} {row.room_no}</T>
                  {row.latest ? (
                    <T size={13} color={colors.muted}>
                      {t('latest')}: <T w="semibold" size={13}>{fmt(row.latest.value)}</T>
                      {row.previous ? `  ·  ${t('previous')}: ${fmt(row.previous.value)}` : ''}
                    </T>
                  ) : (
                    <T size={13} color={colors.muted}>{t('noReading')}</T>
                  )}
                  {row.units_used !== null ? <T size={12.5} color={colors.green}>{t('unitsUsed', { n: fmt(row.units_used) })}</T> : null}
                </View>
                <Button title={t('addReading')} onPress={() => setAdding(row)} style={{ height: 40, paddingHorizontal: 12 }} />
              </View>
            </Card>
          </Pressable>
        ))
      )}

      {adding ? (
        <ReadingSheet
          row={adding}
          onClose={() => setAdding(null)}
          onDone={() => setAdding(null)}
        />
      ) : null}
    </Screen>
  )
}
