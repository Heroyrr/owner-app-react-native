import React, { useState } from 'react'
import { Alert, View } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { EditBookingSheet, MoveOutSheet, NoticeSheet, TransferSheet } from '../../../../features/bookings/sheets'
import { statusLook } from '../../../../features/bookings/status'
import { useAction } from '../../../../hooks/useAction'
import { useOpenFile } from '../../../../hooks/useOpenFile'
import { usePickPhoto } from '../../../../hooks/usePickPhoto'
import { useSettings } from '../../../../settings/SettingsProvider'
import {
  useActivateBookingMutation, useCancelNoticeMutation, useDeleteBookingMutation, useGetBookingQuery,
  useGetLedgerQuery, useSetAgreementMutation,
} from '../../../../store/api/bookings'
import { useUploadFileMutation } from '../../../../store/api/files'
import { Badge } from '../../../../ui/Badge'
import { Button } from '../../../../ui/Button'
import { Card } from '../../../../ui/Card'
import { Screen } from '../../../../ui/Screen'
import { T } from '../../../../ui/AppText'
import { showDate } from '../../../../utils/dates'
import { inr } from '../../../../utils/format'

type Sheet = 'edit' | 'notice' | 'moveOut' | 'transfer' | null

function Row({ label, value, color }: { label: string; value: string; color?: string }) {
  const { colors } = useSettings()
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 5 }}>
      <T size={13.5} color={colors.muted}>{label}</T>
      <T w="semibold" size={13.5} color={color}>{value}</T>
    </View>
  )
}

export default function BookingDetail() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const { t, colors, errText } = useSettings()
  const router = useRouter()
  const { busy, run } = useAction()
  const pick = usePickPhoto()
  const { open } = useOpenFile()
  const q = useGetBookingQuery(id, { skip: !id })
  const ledger = useGetLedgerQuery(id, { skip: !id })
  const [activate] = useActivateBookingMutation()
  const [cancelNotice] = useCancelNoticeMutation()
  const [removeBooking] = useDeleteBookingMutation()
  const [setAgreement] = useSetAgreementMutation()
  const [uploadFile] = useUploadFileMutation()
  const [sheet, setSheet] = useState<Sheet>(null)
  const b = q.data

  const uploadAgreement = async () => {
    const p = await pick()
    if (!p || !b) return
    await run(async () => {
      const up = await uploadFile({ uri: p.uri, kind: 'agreement', mime: p.mime }).unwrap()
      await setAgreement({ id: b.id, file_key: up.key }).unwrap()
    })
  }
  const cancelReservation = () =>
    Alert.alert(t('cancelRes'), t('cancelResQ'), [
      { text: t('cancel'), style: 'cancel' },
      {
        text: t('cancelRes'), style: 'destructive',
        onPress: async () => {
          const r = await run(() => removeBooking(b!.id).unwrap())
          if (r.ok) router.back()
        },
      },
    ])

  const look = b ? statusLook(b.status) : null
  const bal = b?.summary.balance ?? 0
  const balColor = bal > 0 ? colors.red : bal < 0 ? colors.green : colors.muted

  return (
    <Screen
      title={b?.tenant?.name ?? t('bkDetail')}
      sub={b ? `${b.property?.name} · ${t('room')} ${b.room?.room_no}${b.bed ? ` (${t('bed')} ${b.bed.label})` : ''}` : undefined}
      back
      refreshing={q.isFetching && !q.isLoading}
      onRefresh={() => { q.refetch(); ledger.refetch() }}
    >
      {q.isLoading ? (
        <T color={colors.muted} style={{ textAlign: 'center', marginTop: 40 }}>{t('loading')}</T>
      ) : q.isError || !b || !look ? (
        <Card>
          <T color={colors.red} style={{ marginBottom: 12 }}>{errText(q.error)}</T>
          <Button title={t('retry')} onPress={() => q.refetch()} />
        </Card>
      ) : (
        <>
          <Card>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
              <T w="bold" size={15}>{t('bkDetail')} #{b.id}</T>
              <Badge label={t(look.key)} tone={look.tone} />
            </View>
            <Row label={t('period')} value={`${showDate(b.start_date)} → ${b.end_date ? showDate(b.end_date) : '…'}`} />
            {b.status === 'notice' ? <Row label={t('noticeOn')} value={showDate(b.notice_date)} /> : null}
            {b.status === 'notice' ? <Row label={t('leaves')} value={showDate(b.leave_date)} /> : null}
            {b.status === 'moved_out' ? <Row label={t('movedOutOn')} value={showDate(b.out_date)} /> : null}
            <Row label={t('depositL')} value={inr(b.deposit)} />
          </Card>

          <Card>
            <T w="bold" size={15} style={{ marginBottom: 6 }}>{t('balance')}</T>
            <Row label={t('invoiced')} value={inr(b.summary.invoiced)} />
            <Row label={t('paid')} value={inr(b.summary.paid)} />
            <Row label={t('advanceL')} value={inr(b.summary.advance)} />
            {b.summary.written_off > 0 ? <Row label={t('writtenOff')} value={inr(b.summary.written_off)} /> : null}
            <View style={{ height: 1, backgroundColor: colors.line, marginVertical: 6 }} />
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <T size={13} color={balColor} style={{ flex: 1 }}>{bal > 0 ? t('balDue') : bal < 0 ? t('balAdv') : t('balZero')}</T>
              <T w="bold" size={20} color={balColor}>{inr(Math.abs(bal))}</T>
            </View>
          </Card>

          <Card>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <View style={{ flex: 1, gap: 4 }}>
                <T w="bold" size={15}>{t('agreement')}</T>
                <Badge label={b.agreement_file_key ? t('agrOk') : t('agrPend')} tone={b.agreement_file_key ? 'green' : 'amber'} />
              </View>
              {b.agreement_file_key ? <Button title={t('view')} variant="ghost" onPress={() => open(b.agreement_file_key as string)} style={{ height: 38, paddingHorizontal: 14 }} /> : null}
              <Button title={b.agreement_file_key ? t('replace') : t('upload')} variant="ghost" onPress={uploadAgreement} style={{ height: 38, paddingHorizontal: 14 }} />
            </View>
          </Card>

          {b.status !== 'moved_out' ? (
            <View style={{ gap: 10, marginBottom: 12 }}>
              {b.status === 'reserved' ? (
                <>
                  <Button title={t('activate')} loading={busy} onPress={() => run(() => activate(b.id).unwrap())} />
                  <Button title={t('cancelRes')} variant="danger" onPress={cancelReservation} />
                </>
              ) : null}
              {b.status === 'active' ? <Button title={t('giveNotice')} variant="ghost" onPress={() => setSheet('notice')} /> : null}
              {b.status === 'notice' ? <Button title={t('cancelNotice')} variant="ghost" loading={busy} onPress={() => run(() => cancelNotice(b.id).unwrap())} /> : null}
              {b.status === 'active' || b.status === 'notice' ? (
                <>
                  <Button title={t('changeRoom')} variant="ghost" onPress={() => setSheet('transfer')} />
                  <Button title={t('moveOut')} variant="danger" onPress={() => setSheet('moveOut')} />
                </>
              ) : null}
              <Button title={t('editBooking')} variant="ghost" onPress={() => setSheet('edit')} />
            </View>
          ) : null}

          <Card>
            <T w="bold" size={15} style={{ marginBottom: 8 }}>{t('ledgerH')}</T>
            {ledger.data && ledger.data.invoices.length === 0 ? <T size={13} color={colors.muted}>{t('noInv')}</T> : null}
            {ledger.data?.invoices.map((i) => (
              <View key={i.id} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 6, gap: 8 }}>
                <View style={{ flex: 1 }}>
                  <T w="semibold" size={13.5}>{i.number}</T>
                  <T size={12} color={colors.muted}>{showDate(i.period_start)} → {showDate(i.period_end)}</T>
                </View>
                {i.cancelled ? <Badge label={t('cancelledL')} tone="grey" /> : null}
                <View style={{ alignItems: 'flex-end' }}>
                  <T w="bold" size={13.5}>{inr(i.total)}</T>
                  <T size={11.5} color={colors.muted}>{t('paid')} {inr(i.paid)}</T>
                </View>
              </View>
            ))}
            <View style={{ height: 1, backgroundColor: colors.line, marginVertical: 8 }} />
            {ledger.data && ledger.data.payments.length === 0 ? <T size={13} color={colors.muted}>{t('noPay')}</T> : null}
            {ledger.data?.payments.map((p) => (
              <View key={p.id} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 5 }}>
                <T size={13}>{showDate(p.paid_on)} · {p.mode.toUpperCase()}{p.ref_no ? ` · ${p.ref_no}` : ''}</T>
                <T w="bold" size={13} color={colors.green}>{inr(p.amount)}</T>
              </View>
            ))}
            <T size={11.5} color={colors.muted} style={{ marginTop: 8 }}>{t('invNote')}</T>
          </Card>
        </>
      )}

      {b && sheet === 'edit' ? <EditBookingSheet booking={b} onClose={() => setSheet(null)} /> : null}
      {b && sheet === 'notice' ? <NoticeSheet bookingId={b.id} onClose={() => setSheet(null)} /> : null}
      {b && sheet === 'moveOut' ? <MoveOutSheet bookingId={b.id} balance={b.summary.balance} onClose={() => setSheet(null)} /> : null}
      {b && sheet === 'transfer' ? (
        <TransferSheet
          booking={b}
          onClose={() => setSheet(null)}
          onDone={(newId) => { setSheet(null); router.replace(`/tenants/booking/${newId}` as any) }}
        />
      ) : null}
    </Screen>
  )
}
