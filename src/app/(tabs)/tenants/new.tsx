import React, { useRef, useState } from 'react'
import { Image, Pressable, View } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { Feather } from '@expo/vector-icons'
import { RoomPicker, type Slot } from '../../../features/bookings/RoomPicker'
import { useAction } from '../../../hooks/useAction'
import { usePickPhoto } from '../../../hooks/usePickPhoto'
import { useSettings } from '../../../settings/SettingsProvider'
import { useAddBookingMutation } from '../../../store/api/bookings'
import { useUploadFileMutation } from '../../../store/api/files'
import { useAddTenantDocumentMutation, useAddTenantMutation, useGetTenantQuery } from '../../../store/api/tenants'
import { Button } from '../../../ui/Button'
import { Card } from '../../../ui/Card'
import { DateField } from '../../../ui/DateField'
import { Screen } from '../../../ui/Screen'
import { Segmented } from '../../../ui/Segmented'
import { T } from '../../../ui/AppText'
import { TextField } from '../../../ui/TextField'
import { todayYmd } from '../../../utils/dates'
import { cleanPhone, inr } from '../../../utils/format'
import type { Picked } from '../../../utils/pickImage'

type Kind = 'aadhaar_front' | 'aadhaar_back' | 'other_id'

/** One ID proof: shows the chosen image and lets you pick or remove it */
function DocPick({ label, value, onPick, onClear }: { label: string; value?: Picked; onPick: () => void; onClear: () => void }) {
  const { colors, t } = useSettings()
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8 }}>
      {value ? (
        <Image source={{ uri: value.uri }} style={{ width: 52, height: 52, borderRadius: 8 }} />
      ) : (
        <View style={{ width: 52, height: 52, borderRadius: 8, borderWidth: 1.5, borderStyle: 'dashed', borderColor: colors.muted, alignItems: 'center', justifyContent: 'center' }}>
          <Feather name="image" size={20} color={colors.muted} />
        </View>
      )}
      <T w="medium" size={14} style={{ flex: 1 }}>{label}</T>
      {value ? (
        <Pressable onPress={onClear} hitSlop={8}><Feather name="x-circle" size={22} color={colors.red} /></Pressable>
      ) : (
        <Button title={t('upload')} variant="ghost" onPress={onPick} style={{ height: 38, paddingHorizontal: 14 }} />
      )}
    </View>
  )
}

export default function NewTenant() {
  const { tenantId, reserve } = useLocalSearchParams<{ tenantId?: string; reserve?: string }>()
  const { t, colors, errText } = useSettings()
  const router = useRouter()
  const { busy, run } = useAction()
  const pick = usePickPhoto()
  const [uploadFile] = useUploadFileMutation()
  const [addTenant] = useAddTenantMutation()
  const [addDoc] = useAddTenantDocumentMutation()
  const [addBooking] = useAddBookingMutation()

  const existing = useGetTenantQuery(tenantId as string, { skip: !tenantId })
  const isExisting = !!tenantId

  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [photo, setPhoto] = useState<Picked | undefined>()
  const [docs, setDocs] = useState<Partial<Record<Kind, Picked>>>({})
  const [slot, setSlot] = useState<Slot>({})
  const [start, setStart] = useState(todayYmd())
  const [end, setEnd] = useState('')
  const [deposit, setDeposit] = useState('')
  const [advance, setAdvance] = useState('')
  const [status, setStatus] = useState<'active' | 'reserved'>(reserve === '1' ? 'reserved' : 'active')

  // what was already saved, so a retry after an error never creates the same tenant or file twice
  const saved = useRef<{ tenantId?: number; photoKey?: string; docs: Partial<Record<Kind, boolean>> }>({ docs: {} })

  const digits = cleanPhone(phone)
  const phoneOk = phone.trim() === '' || /^[6-9]\d{9}$/.test(digits)
  const personOk = isExisting || (name.trim() !== '' && phoneOk)
  const slotOk = !!slot.roomId && (!slot.isBed || !!slot.bedId)
  const numsOk = (deposit === '' || !Number.isNaN(Number(deposit))) && (advance === '' || !Number.isNaN(Number(advance)))
  const valid = personOk && slotOk && !!start && numsOk && (!end || end >= start)

  const setDoc = (k: Kind) => async () => {
    const p = await pick()
    if (p) setDocs((d) => ({ ...d, [k]: p }))
  }
  const clearDoc = (k: Kind) => () => setDocs((d) => ({ ...d, [k]: undefined }))

  async function submit() {
    const r = await run(async () => {
      let tid = tenantId ? Number(tenantId) : saved.current.tenantId
      let newPerson = false
      if (!tid) {
        let photoKey = saved.current.photoKey
        if (photo && !photoKey) {
          photoKey = (await uploadFile({ uri: photo.uri, kind: 'photo', mime: photo.mime }).unwrap()).key
          saved.current.photoKey = photoKey
        }
        const created = await addTenant({ name: name.trim(), ...(digits ? { phone: digits } : {}), ...(photoKey ? { photo_key: photoKey } : {}) }).unwrap()
        tid = created.id
        saved.current.tenantId = tid
        newPerson = true
      }
      try {
        for (const kind of ['aadhaar_front', 'aadhaar_back', 'other_id'] as const) {
          const p = docs[kind]
          if (p && !saved.current.docs[kind]) {
            const up = await uploadFile({ uri: p.uri, kind, mime: p.mime }).unwrap()
            await addDoc({ tenantId: tid, kind, file_key: up.key, mime_type: up.mime_type }).unwrap()
            saved.current.docs[kind] = true
          }
        }
        const b = await addBooking({
          tenant_id: tid,
          room_id: slot.roomId as number,
          ...(slot.bedId ? { bed_id: slot.bedId } : {}),
          start_date: start,
          ...(end ? { end_date: end } : {}),
          status,
          deposit: Number(deposit || 0),
          advance: Number(advance || 0),
        }).unwrap()
        return b.id
      } catch (e) {
        // the person is saved: say so, so the owner can just fix the booking and press Save again
        if (newPerson || saved.current.tenantId) throw { message: t('tenantSavedPartial') + errText(e) }
        throw e
      }
    })
    if (r.ok) router.replace(`/tenants/booking/${r.data}` as any)
  }

  const title = isExisting ? t('newBooking') : status === 'reserved' ? t('resv') : t('newTenant')

  return (
    <Screen title={title} sub={isExisting ? `${t('existingTenant')}: ${existing.data?.name ?? ''}` : undefined} back>
      {!isExisting ? (
        <Card>
          <T w="bold" size={15} style={{ marginBottom: 10 }}>{t('person')}</T>
          <TextField label={t('tName')} value={name} onChangeText={setName} autoCapitalize="words" />
          <TextField label={t('tPhone')} prefix="+91" value={phone} onChangeText={setPhone} keyboardType="number-pad" maxLength={14} />
          <T w="bold" size={14} style={{ marginTop: 4, marginBottom: 2 }}>{t('idProofs')}</T>
          <DocPick label={t('profilePhoto')} value={photo} onPick={async () => { const p = await pick(); if (p) setPhoto(p) }} onClear={() => setPhoto(undefined)} />
          <DocPick label={t('aadFront')} value={docs.aadhaar_front} onPick={setDoc('aadhaar_front')} onClear={clearDoc('aadhaar_front')} />
          <DocPick label={t('aadBack')} value={docs.aadhaar_back} onPick={setDoc('aadhaar_back')} onClear={clearDoc('aadhaar_back')} />
          <DocPick label={t('otherId')} value={docs.other_id} onPick={setDoc('other_id')} onClear={clearDoc('other_id')} />
        </Card>
      ) : null}

      <Card>
        <T w="bold" size={15} style={{ marginBottom: 10 }}>{t('stay')}</T>
        <T w="medium" size={12.5} color={colors.muted} style={{ marginBottom: 6 }}>{t('bookType')}</T>
        <Segmented<'active' | 'reserved'>
          value={status}
          onChange={setStatus}
          options={[{ v: 'active', label: t('bkActive') }, { v: 'reserved', label: t('bkReserved') }]}
        />
        <View style={{ height: 14 }} />
        <T w="medium" size={12.5} color={colors.muted} style={{ marginBottom: 6 }}>{t('selRoom')}</T>
        <RoomPicker value={slot} onChange={setSlot} />
        {slot.rent !== undefined ? (
          <T w="semibold" size={13.5} color={colors.green} style={{ marginBottom: 12 }}>{t('rentIs', { n: inr(slot.rent) })}</T>
        ) : null}
        <DateField label={t('startDate')} value={start} onChange={setStart} />
        <DateField label={t('endDate')} value={end} onChange={setEnd} clearable minDate={start} />
        <TextField label={t('deposit')} value={deposit} onChangeText={setDeposit} keyboardType="numeric" />
        <TextField label={t('advancePay')} value={advance} onChangeText={setAdvance} keyboardType="numeric" />
      </Card>

      <Button title={t('saveBooking')} onPress={submit} loading={busy} disabled={!valid} />
    </Screen>
  )
}
