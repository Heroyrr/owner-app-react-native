import React, { useState } from 'react'
import { Alert, Pressable, View } from 'react-native'
import { Feather } from '@expo/vector-icons'
import { api } from '../../api/client'
import type { CategoryInfo, RoomInfo } from '../../api/types'
import { useAction } from '../../hooks/useAction'
import { useSettings } from '../../settings/SettingsProvider'
import { Badge } from '../../ui/Badge'
import { Button } from '../../ui/Button'
import { Chip } from '../../ui/Chip'
import { Segmented } from '../../ui/Segmented'
import { Sheet } from '../../ui/Sheet'
import { T } from '../../ui/AppText'
import { TextField } from '../../ui/TextField'

type PType = 'BED' | 'NON_BED'
const isNum = (v: string) => v.trim() !== '' && !Number.isNaN(Number(v))

/** Ask first, then run. Used for every remove or delete. */
function confirm(title: string, message: string | undefined, yes: string, no: string, onYes: () => void) {
  Alert.alert(title, message, [
    { text: no, style: 'cancel' },
    { text: yes, style: 'destructive', onPress: onYes },
  ])
}

/* ------------------------------------------------------------------ Add property (+ first category) */
export function AddPropertySheet({ onClose, onDone }: { onClose: () => void; onDone: (propertyId: number) => void }) {
  const { t, colors, errText } = useSettings()
  const { busy, run } = useAction()
  const [name, setName] = useState('')
  const [address, setAddress] = useState('')
  const [type, setType] = useState<PType>('NON_BED')
  const [catName, setCatName] = useState('')
  const [rent, setRent] = useState('')
  const [beds, setBeds] = useState('3')
  const [rooms, setRooms] = useState('')

  const wantCat = catName.trim() !== '' || rent.trim() !== '' || rooms.trim() !== ''
  const bedsOk = type === 'NON_BED' || (Number(beds) >= 1 && Number(beds) <= 26)
  const catOk = !wantCat || (catName.trim() !== '' && isNum(rent) && rooms.trim() !== '' && bedsOk)
  const valid = name.trim() !== '' && catOk

  async function submit() {
    const r = await run(async () => {
      const prop = await api<{ id: number }>('/properties', {
        method: 'POST',
        body: { name: name.trim(), type, ...(address.trim() ? { address: address.trim() } : {}) },
      })
      let catError = ''
      if (wantCat) {
        try {
          await api(`/properties/${prop.id}/categories`, {
            method: 'POST',
            body: { name: catName.trim(), rent: Number(rent), rooms: rooms.trim(), ...(type === 'BED' ? { beds_per_room: Number(beds) } : {}) },
          })
        } catch (e) {
          catError = errText(e)
        }
      }
      return { id: prop.id, catError }
    })
    if (r.ok) {
      if (r.data.catError) Alert.alert(t('error'), t('catPartial') + r.data.catError)
      onDone(r.data.id)
    }
  }

  return (
    <Sheet title={t('addProp')} onClose={onClose}>
      <TextField label={t('propName')} value={name} onChangeText={setName} autoCapitalize="words" />
      <TextField label={t('address')} value={address} onChangeText={setAddress} />
      <T w="medium" size={12.5} color={colors.muted} style={{ marginBottom: 6 }}>{t('ptype')}</T>
      <Segmented<PType>
        value={type}
        onChange={setType}
        options={[{ v: 'NON_BED', label: t('pNonT') }, { v: 'BED', label: t('pBedT') }]}
      />
      <T size={12} color={colors.muted} style={{ marginTop: 6, marginBottom: 14 }}>{type === 'BED' ? t('pBedH') : t('pNonH')}</T>

      <T w="bold" size={14} style={{ marginBottom: 8 }}>{t('firstCat')}</T>
      <TextField label={t('catName')} value={catName} onChangeText={setCatName} />
      <TextField label={t('rent')} value={rent} onChangeText={setRent} keyboardType="numeric" />
      {type === 'BED' ? <TextField label={t('bedsPer')} value={beds} onChangeText={setBeds} keyboardType="number-pad" maxLength={2} /> : null}
      <TextField label={t('roomNos')} value={rooms} onChangeText={setRooms} placeholder="101-110" autoCapitalize="characters" />
      <T size={12} color={colors.muted} style={{ marginTop: -6, marginBottom: 14 }}>{t('roomNosH')}</T>

      <Button title={t('create')} onPress={submit} loading={busy} disabled={!valid} />
    </Sheet>
  )
}

/* ------------------------------------------------------------------ Add or edit a category */
export function CategorySheet({
  propertyId, propertyType, category, onClose, onDone,
}: { propertyId: number; propertyType: PType; category?: CategoryInfo; onClose: () => void; onDone: () => void }) {
  const { t, colors } = useSettings()
  const { busy, run } = useAction()
  const [name, setName] = useState(category?.name ?? '')
  const [rent, setRent] = useState(category ? String(category.rent) : '')
  const [beds, setBeds] = useState('3')
  const [rooms, setRooms] = useState('')

  const bedsOk = propertyType === 'NON_BED' || (Number(beds) >= 1 && Number(beds) <= 26)
  const valid = name.trim() !== '' && isNum(rent) && (category ? true : rooms.trim() !== '' && bedsOk)

  async function submit() {
    const r = await run(() =>
      category
        ? api(`/categories/${category.id}`, { method: 'PATCH', body: { name: name.trim(), rent: Number(rent) } })
        : api(`/properties/${propertyId}/categories`, {
            method: 'POST',
            body: { name: name.trim(), rent: Number(rent), rooms: rooms.trim(), ...(propertyType === 'BED' ? { beds_per_room: Number(beds) } : {}) },
          })
    )
    if (r.ok) onDone()
  }

  return (
    <Sheet title={category ? t('editCat') : t('addCat')} onClose={onClose}>
      <TextField label={t('catName')} value={name} onChangeText={setName} />
      <TextField label={t('rent')} value={rent} onChangeText={setRent} keyboardType="numeric" />
      {category ? (
        <T size={12} color={colors.muted} style={{ marginTop: -6, marginBottom: 14 }}>{t('rentNote')}</T>
      ) : (
        <>
          {propertyType === 'BED' ? <TextField label={t('bedsPer')} value={beds} onChangeText={setBeds} keyboardType="number-pad" maxLength={2} /> : null}
          <TextField label={t('roomNos')} value={rooms} onChangeText={setRooms} placeholder="101-110" autoCapitalize="characters" />
          <T size={12} color={colors.muted} style={{ marginTop: -6, marginBottom: 14 }}>{t('roomNosH')}</T>
        </>
      )}
      <Button title={t('save')} onPress={submit} loading={busy} disabled={!valid} />
    </Sheet>
  )
}

/* ------------------------------------------------------------------ Add one room */
export function AddRoomSheet({
  propertyId, categories, presetCategoryId, onClose, onDone,
}: { propertyId: number; categories: CategoryInfo[]; presetCategoryId?: number; onClose: () => void; onDone: () => void }) {
  const { t, colors } = useSettings()
  const { busy, run } = useAction()
  const [catId, setCatId] = useState<number | undefined>(presetCategoryId ?? categories[0]?.id)
  const [roomNo, setRoomNo] = useState('')
  const valid = !!catId && roomNo.trim() !== ''

  async function submit() {
    const r = await run(() =>
      api(`/properties/${propertyId}/rooms`, { method: 'POST', body: { category_id: catId, room_no: roomNo.trim() } })
    )
    if (r.ok) onDone()
  }

  return (
    <Sheet title={t('addRoom')} onClose={onClose}>
      <T w="medium" size={12.5} color={colors.muted} style={{ marginBottom: 6 }}>{t('category')}</T>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 }}>
        {categories.map((c) => (
          <Chip key={c.id} label={c.name} active={c.id === catId} onPress={() => setCatId(c.id)} />
        ))}
      </View>
      <TextField label={t('roomNo')} value={roomNo} onChangeText={setRoomNo} autoCapitalize="characters" autoFocus />
      <Button title={t('create')} onPress={submit} loading={busy} disabled={!valid} />
    </Sheet>
  )
}

/* ------------------------------------------------------------------ One room: beds, tenant, remove */
export function RoomSheet({
  room, category, propertyType, onClose, onDone,
}: { room: RoomInfo; category: CategoryInfo; propertyType: PType; onClose: () => void; onDone: () => void }) {
  const { t, colors } = useSettings()
  const { busy, run } = useAction()

  const removeRoom = () =>
    confirm(t('rmRoom'), t('rmRoomQ'), t('delete'), t('cancel'), async () => {
      const r = await run(() => api(`/rooms/${room.id}`, { method: 'DELETE' }))
      if (r.ok) { onDone(); onClose() }
    })
  const removeBed = (bedId: number) =>
    confirm(t('bed'), t('rmBedQ'), t('delete'), t('cancel'), async () => {
      const r = await run(() => api(`/beds/${bedId}`, { method: 'DELETE' }))
      if (r.ok) onDone()
    })
  const addBed = async () => {
    const r = await run(() => api(`/rooms/${room.id}/beds`, { method: 'POST' }))
    if (r.ok) onDone()
  }

  return (
    <Sheet title={`${t('room')} ${room.room_no}`} onClose={onClose}>
      <T size={13} color={colors.muted} style={{ marginBottom: 12 }}>{category.name}</T>

      {propertyType === 'BED' ? (
        <>
          {room.beds.map((b) => (
            <View key={b.id} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.line, gap: 10 }}>
              <T w="bold" size={15} style={{ width: 62 }}>{t('bed')} {b.label}</T>
              <View style={{ flex: 1 }}>
                {b.occupied ? <T size={13.5}>{b.booking?.tenant_name}</T> : <T size={13.5} color={colors.muted}>{t('noTenant')}</T>}
              </View>
              <Badge label={b.occupied ? t('occupied') : t('vacant')} tone={b.occupied ? 'amber' : 'green'} />
              {!b.occupied ? (
                <Pressable onPress={() => removeBed(b.id)} hitSlop={8}>
                  <Feather name="trash-2" size={18} color={colors.red} />
                </Pressable>
              ) : null}
            </View>
          ))}
          <View style={{ height: 12 }} />
          <Button title={t('addBed')} variant="ghost" onPress={addBed} loading={busy} />
        </>
      ) : (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 6 }}>
          <Badge label={room.occupied ? t('occupied') : t('vacant')} tone={room.occupied ? 'amber' : 'green'} />
          <T size={14}>{room.occupied ? `${t('tenantIn')}: ${room.bookings[0]?.tenant_name ?? ''}` : t('noTenant')}</T>
        </View>
      )}

      <View style={{ height: 16 }} />
      <Button title={t('rmRoom')} variant="danger" onPress={removeRoom} disabled={busy} />
    </Sheet>
  )
}

/* ------------------------------------------------------------------ Edit or delete the property */
export function EditPropertySheet({
  property, onClose, onDone, onDeleted,
}: { property: { id: number; name: string; address: string | null }; onClose: () => void; onDone: () => void; onDeleted: () => void }) {
  const { t } = useSettings()
  const { busy, run } = useAction()
  const [name, setName] = useState(property.name)
  const [address, setAddress] = useState(property.address ?? '')

  async function submit() {
    const r = await run(() => api(`/properties/${property.id}`, { method: 'PATCH', body: { name: name.trim(), address: address.trim() } }))
    if (r.ok) onDone()
  }

  // The only hard delete in the app: ask twice
  const del = () =>
    confirm(t('delPropQ1'), property.name, t('delete'), t('cancel'), () =>
      confirm(t('delProp'), t('delPropQ2'), t('delete'), t('cancel'), async () => {
        const r = await run(() => api(`/properties/${property.id}`, { method: 'DELETE', query: { confirm: 'true' } }))
        if (r.ok) onDeleted()
      })
    )

  return (
    <Sheet title={t('editProp')} onClose={onClose}>
      <TextField label={t('propName')} value={name} onChangeText={setName} autoCapitalize="words" />
      <TextField label={t('address')} value={address} onChangeText={setAddress} />
      <Button title={t('save')} onPress={submit} loading={busy} disabled={name.trim() === ''} />
      <View style={{ height: 14 }} />
      <Button title={t('delProp')} variant="danger" onPress={del} disabled={busy} />
    </Sheet>
  )
}
