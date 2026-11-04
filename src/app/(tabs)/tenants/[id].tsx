import React, { useState } from 'react'
import { Alert, Linking, Pressable, View } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import type { Doc, DocKind } from '../../../api/types'
import { EditTenantSheet } from '../../../features/tenants/EditTenantSheet'
import { statusLook } from '../../../features/bookings/status'
import { useAction } from '../../../hooks/useAction'
import { useOpenFile } from '../../../hooks/useOpenFile'
import { usePickPhoto } from '../../../hooks/usePickPhoto'
import { useSettings } from '../../../settings/SettingsProvider'
import { useUploadFileMutation } from '../../../store/api/files'
import {
  useAddTenantDocumentMutation, useGetTenantQuery, useRemoveTenantDocumentMutation, useUpdateTenantMutation,
} from '../../../store/api/tenants'
import { Avatar } from '../../../ui/Avatar'
import { Badge } from '../../../ui/Badge'
import { Button } from '../../../ui/Button'
import { Card } from '../../../ui/Card'
import { Screen } from '../../../ui/Screen'
import { T } from '../../../ui/AppText'
import { showDate } from '../../../utils/dates'
import { inr } from '../../../utils/format'

function DocRow({ label, doc, onView, onUpload, onRemove }: {
  label: string; doc?: Doc; onView: () => void; onUpload: () => void; onRemove?: () => void
}) {
  const { t, colors } = useSettings()
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 9, borderTopWidth: 1, borderTopColor: colors.line }}>
      <View style={{ flex: 1, gap: 3 }}>
        <T w="medium" size={14}>{label}</T>
        <Badge label={doc ? t('uploaded') : t('missing')} tone={doc ? 'green' : 'amber'} />
      </View>
      {doc ? <Button title={t('view')} variant="ghost" onPress={onView} style={{ height: 36, paddingHorizontal: 12 }} /> : null}
      <Button title={doc ? t('replace') : t('upload')} variant="ghost" onPress={onUpload} style={{ height: 36, paddingHorizontal: 12 }} />
      {onRemove ? <Button title={t('remove')} variant="danger" onPress={onRemove} style={{ height: 36, paddingHorizontal: 12 }} /> : null}
    </View>
  )
}

export default function TenantDetail() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const { t, colors, errText } = useSettings()
  const router = useRouter()
  const { run } = useAction()
  const pick = usePickPhoto()
  const { open } = useOpenFile()
  const q = useGetTenantQuery(id, { skip: !id })
  const [uploadFile] = useUploadFileMutation()
  const [addDoc] = useAddTenantDocumentMutation()
  const [removeDoc] = useRemoveTenantDocumentMutation()
  const [updateTenant] = useUpdateTenantMutation()
  const [editing, setEditing] = useState(false)
  const tenant = q.data

  const uploadDoc = async (kind: DocKind) => {
    const p = await pick()
    if (!p || !tenant) return
    await run(async () => {
      const up = await uploadFile({ uri: p.uri, kind, mime: p.mime }).unwrap()
      await addDoc({ tenantId: tenant.id, kind, file_key: up.key, mime_type: up.mime_type }).unwrap()
    })
  }
  const changePhoto = async () => {
    const p = await pick()
    if (!p || !tenant) return
    await run(async () => {
      const up = await uploadFile({ uri: p.uri, kind: 'photo', mime: p.mime }).unwrap()
      await updateTenant({ id: tenant.id, photo_key: up.key }).unwrap()
    })
  }
  const removeOther = (docId: number) =>
    Alert.alert(t('remove'), t('docDeleteQ'), [
      { text: t('cancel'), style: 'cancel' },
      { text: t('delete'), style: 'destructive', onPress: () => { run(() => removeDoc(docId).unwrap()) } },
    ])

  const docOf = (kind: DocKind) => tenant?.documents.find((d) => d.kind === kind)
  const others = tenant?.documents.filter((d) => d.kind === 'other_id') ?? []
  const hasLive = tenant?.bookings.some((b) => b.status !== 'moved_out')

  return (
    <Screen title={tenant?.name ?? t('tenants')} sub={tenant?.phone ? `+91 ${tenant.phone}` : undefined} back refreshing={q.isFetching && !q.isLoading} onRefresh={() => q.refetch()}>
      {q.isLoading ? (
        <T color={colors.muted} style={{ textAlign: 'center', marginTop: 40 }}>{t('loading')}</T>
      ) : q.isError || !tenant ? (
        <Card>
          <T color={colors.red} style={{ marginBottom: 12 }}>{errText(q.error)}</T>
          <Button title={t('retry')} onPress={() => q.refetch()} />
        </Card>
      ) : (
        <>
          <Card>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
              <Pressable onPress={changePhoto}>
                <Avatar name={tenant.name} id={tenant.id} photoKey={tenant.photo_key} size={64} />
              </Pressable>
              <View style={{ flex: 1, gap: 4 }}>
                <T w="bold" size={17}>{tenant.name}</T>
                <T size={13} color={colors.muted}>{tenant.phone ? `+91 ${tenant.phone}` : '—'}</T>
                <Badge label={tenant.ekyc_done ? t('ekycOk') : t('ekycPend')} tone={tenant.ekyc_done ? 'green' : 'amber'} />
              </View>
            </View>
            <View style={{ flexDirection: 'row', gap: 10, marginTop: 14 }}>
              {tenant.phone ? <Button title={t('call')} variant="ghost" onPress={() => Linking.openURL(`tel:${tenant.phone}`)} style={{ flex: 1, height: 42 }} /> : null}
              {tenant.phone ? <Button title={t('whatsapp')} variant="ghost" onPress={() => Linking.openURL(`https://wa.me/91${tenant.phone}`)} style={{ flex: 1, height: 42 }} /> : null}
              <Button title={t('edit')} variant="ghost" onPress={() => setEditing(true)} style={{ flex: 1, height: 42 }} />
            </View>
          </Card>

          <Card>
            <T w="bold" size={15} style={{ marginBottom: 6 }}>{t('idProofs')}</T>
            <DocRow label={t('aadFront')} doc={docOf('aadhaar_front')} onView={() => open(docOf('aadhaar_front')!.file_key)} onUpload={() => uploadDoc('aadhaar_front')} />
            <DocRow label={t('aadBack')} doc={docOf('aadhaar_back')} onView={() => open(docOf('aadhaar_back')!.file_key)} onUpload={() => uploadDoc('aadhaar_back')} />
            {others.map((d) => (
              <DocRow key={d.id} label={t('otherId')} doc={d} onView={() => open(d.file_key)} onUpload={() => uploadDoc('other_id')} onRemove={() => removeOther(d.id)} />
            ))}
            <View style={{ height: 8 }} />
            <Button title={t('addOtherId')} variant="ghost" onPress={() => uploadDoc('other_id')} />
          </Card>

          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <T w="bold" size={15}>{t('bookingsH')}</T>
          </View>
          {tenant.bookings.length === 0 ? <T size={13.5} color={colors.muted} style={{ marginBottom: 10 }}>{t('noBookingsYet')}</T> : null}
          {tenant.bookings.map((b) => {
            const look = statusLook(b.status)
            return (
              <Pressable key={b.id} onPress={() => router.push(`/tenants/booking/${b.id}` as any)}>
                <Card>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <T w="semibold" size={14.5} style={{ flex: 1 }} numberOfLines={1}>
                      {b.property?.name} · {t('room')} {b.room?.room_no}{b.bed ? ` (${t('bed')} ${b.bed.label})` : ''}
                    </T>
                    <Badge label={t(look.key)} tone={look.tone} />
                  </View>
                  <T size={12.5} color={colors.muted} style={{ marginTop: 4 }}>
                    {showDate(b.start_date)} → {b.out_date ? showDate(b.out_date) : b.end_date ? showDate(b.end_date) : '…'}
                  </T>
                  {b.balance !== 0 ? (
                    <T w="semibold" size={13} color={b.balance > 0 ? colors.red : colors.green} style={{ marginTop: 4 }}>
                      {b.balance > 0 ? t('due') : t('adv')}: {inr(Math.abs(b.balance))}
                    </T>
                  ) : null}
                </Card>
              </Pressable>
            )
          })}
          <Button
            title={`+  ${t('addBooking')}`}
            onPress={() => router.push(`/tenants/new?tenantId=${tenant.id}` as any)}
            variant={hasLive ? 'ghost' : 'primary'}
          />
        </>
      )}

      {editing && tenant ? <EditTenantSheet tenant={tenant} onClose={() => setEditing(false)} /> : null}
    </Screen>
  )
}
