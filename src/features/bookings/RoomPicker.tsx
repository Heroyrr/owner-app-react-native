import React, { useEffect, useState } from 'react'
import { Pressable, View } from 'react-native'
import { useSettings } from '../../settings/SettingsProvider'
import { useGetPropertiesQuery, useGetPropertyQuery } from '../../store/api/properties'
import { Chip } from '../../ui/Chip'
import { T } from '../../ui/AppText'
import { inr } from '../../utils/format'

export type Slot = {
  propertyId?: number
  roomId?: number
  bedId?: number
  isBed?: boolean
  rent?: number
  roomNo?: string
  bedLabel?: string
}

/** Pick a property, then a VACANT room (and a vacant bed in a PG). The rent comes from the room's category. */
export function RoomPicker({ value, onChange }: { value: Slot; onChange: (s: Slot) => void }) {
  const { t, colors } = useSettings()
  const props = useGetPropertiesQuery()
  const [propertyId, setPropertyId] = useState<number | undefined>(value.propertyId)

  useEffect(() => {
    if (!propertyId && props.data?.length) setPropertyId(props.data[0].id)
  }, [props.data, propertyId])

  const detail = useGetPropertyQuery(propertyId as number, { skip: !propertyId })
  const p = detail.data
  const isBed = p?.type === 'BED'

  const choosePropertyChip = (id: number) => {
    setPropertyId(id)
    onChange({ propertyId: id })
  }

  const selectRoom = (roomId: number, roomNo: string, rent: number) => {
    onChange({ propertyId, roomId, roomNo, rent, isBed, bedId: undefined, bedLabel: undefined })
  }

  let anyVacant = false
  const selectedRoom = p?.categories.flatMap((c) => c.rooms).find((r) => r.id === value.roomId)

  return (
    <View>
      {props.data && props.data.length > 1 ? (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
          {props.data.map((x) => (
            <Chip key={x.id} label={x.name} active={x.id === propertyId} onPress={() => choosePropertyChip(x.id)} />
          ))}
        </View>
      ) : props.data?.[0] ? (
        <T w="semibold" size={14} style={{ marginBottom: 10 }}>{props.data[0].name}</T>
      ) : null}

      {detail.isFetching && !p ? <T color={colors.muted}>{t('loading')}</T> : null}

      {p?.categories.map((c) => {
        const rooms = c.rooms
        return (
          <View key={c.id} style={{ marginBottom: 12 }}>
            <T w="semibold" size={13} color={colors.muted} style={{ marginBottom: 6 }}>
              {c.name} · {inr(c.rent)}
            </T>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {rooms.map((r) => {
                const free = isBed ? r.beds.filter((b) => !b.occupied).length : r.occupied ? 0 : 1
                const total = isBed ? r.beds.length : 1
                const selectable = free > 0
                if (selectable) anyVacant = true
                const on = r.id === value.roomId
                return (
                  <Pressable
                    key={r.id}
                    disabled={!selectable}
                    onPress={() => selectRoom(r.id, r.room_no, c.rent)}
                    style={{
                      minWidth: 64, paddingHorizontal: 8, paddingVertical: 8, borderRadius: 10, borderWidth: 1.5, alignItems: 'center',
                      opacity: selectable ? 1 : 0.4,
                      backgroundColor: on ? colors.btn : selectable ? colors.greenbg : colors.line,
                      borderColor: on ? colors.btn : selectable ? colors.green : colors.line,
                    }}
                  >
                    <T w="bold" size={14} color={on ? '#fff' : selectable ? colors.green : colors.muted}>{r.room_no}</T>
                    {isBed ? <T size={10.5} color={on ? '#fff' : colors.muted}>{free}/{total}</T> : null}
                  </Pressable>
                )
              })}
            </View>
          </View>
        )
      })}

      {p && !anyVacant ? <T size={13.5} color={colors.red}>{t('noVacant')}</T> : null}

      {isBed && selectedRoom ? (
        <View style={{ marginTop: 4 }}>
          <T w="medium" size={12.5} color={colors.muted} style={{ marginBottom: 6 }}>{t('selBed')}</T>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {selectedRoom.beds.map((b) => (
              <View key={b.id} style={{ opacity: b.occupied ? 0.4 : 1 }}>
                <Chip
                  label={`${t('bed')} ${b.label}`}
                  active={b.id === value.bedId}
                  onPress={b.occupied ? undefined : () => onChange({ ...value, isBed, bedId: b.id, bedLabel: b.label })}
                />
              </View>
            ))}
          </View>
        </View>
      ) : null}
    </View>
  )
}
