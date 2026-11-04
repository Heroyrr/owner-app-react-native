import React, { useState } from 'react'
import { View } from 'react-native'
import type { BookingDetail } from '../../api/types'
import { useAction } from '../../hooks/useAction'
import { useSettings } from '../../settings/SettingsProvider'
import {
  useGiveNoticeMutation, useMoveOutMutation, useTransferBookingMutation, useUpdateBookingMutation,
} from '../../store/api/bookings'
import { Button } from '../../ui/Button'
import { DateField } from '../../ui/DateField'
import { Sheet } from '../../ui/Sheet'
import { T } from '../../ui/AppText'
import { TextField } from '../../ui/TextField'
import { addDays, todayYmd } from '../../utils/dates'
import { RoomPicker, type Slot } from './RoomPicker'
import { SettleFields, defaultSettle, settleBody, settleValid } from './SettleFields'

/* ------------------------------------------------------------------ edit dates and deposit */
export function EditBookingSheet({ booking, onClose }: { booking: BookingDetail; onClose: () => void }) {
  const { t } = useSettings()
  const { busy, run } = useAction()
  const [update] = useUpdateBookingMutation()
  const [start, setStart] = useState(booking.start_date)
  const [end, setEnd] = useState(booking.end_date ?? '')
  const [deposit, setDeposit] = useState(String(booking.deposit))
  const valid = !!start && !Number.isNaN(Number(deposit)) && (!end || end >= start)

  async function submit() {
    const r = await run(() =>
      update({ id: booking.id, start_date: start, ...(end ? { end_date: end } : {}), deposit: Number(deposit || 0) }).unwrap()
    )
    if (r.ok) onClose()
  }
  return (
    <Sheet title={t('editBooking')} onClose={onClose}>
      <DateField label={t('startDate')} value={start} onChange={setStart} />
      <DateField label={t('endDate')} value={end} onChange={setEnd} minDate={start} />
      <TextField label={t('deposit')} value={deposit} onChangeText={setDeposit} keyboardType="numeric" />
      <Button title={t('save')} onPress={submit} loading={busy} disabled={!valid} />
    </Sheet>
  )
}

/* ------------------------------------------------------------------ give notice */
export function NoticeSheet({ bookingId, onClose }: { bookingId: number; onClose: () => void }) {
  const { t } = useSettings()
  const { busy, run } = useAction()
  const [giveNotice] = useGiveNoticeMutation()
  const [noticeDate, setNoticeDate] = useState(todayYmd())
  const [leaveDate, setLeaveDate] = useState(addDays(todayYmd(), 30))
  const valid = !!noticeDate && !!leaveDate && leaveDate >= noticeDate

  async function submit() {
    const r = await run(() => giveNotice({ id: bookingId, notice_date: noticeDate, leave_date: leaveDate }).unwrap())
    if (r.ok) onClose()
  }
  return (
    <Sheet title={t('giveNotice')} onClose={onClose}>
      <DateField label={t('noticeDate')} value={noticeDate} onChange={setNoticeDate} />
      <DateField label={t('leaveDate')} value={leaveDate} onChange={setLeaveDate} minDate={noticeDate} />
      <Button title={t('giveNotice')} onPress={submit} loading={busy} disabled={!valid} />
    </Sheet>
  )
}

/* ------------------------------------------------------------------ move out */
export function MoveOutSheet({ bookingId, balance, onClose }: { bookingId: number; balance: number; onClose: () => void }) {
  const { t } = useSettings()
  const { busy, run } = useAction()
  const [moveOut] = useMoveOutMutation()
  const [outDate, setOutDate] = useState(todayYmd())
  const [settle, setSettle] = useState(defaultSettle(balance))
  const valid = !!outDate && settleValid(balance, settle)

  async function submit() {
    const r = await run(() => moveOut({ id: bookingId, out_date: outDate, ...settleBody(balance, settle) }).unwrap())
    if (r.ok) onClose()
  }
  return (
    <Sheet title={t('moveOut')} onClose={onClose}>
      <DateField label={t('outDate')} value={outDate} onChange={setOutDate} />
      <SettleFields balance={balance} value={settle} onChange={setSettle} />
      <View style={{ height: 12 }} />
      <Button title={t('confirmOut')} variant="danger" onPress={submit} loading={busy} disabled={!valid} />
    </Sheet>
  )
}

/* ------------------------------------------------------------------ change room or bed */
export function TransferSheet({ booking, onClose, onDone }: { booking: BookingDetail; onClose: () => void; onDone: (newBookingId: number) => void }) {
  const { t, colors } = useSettings()
  const { busy, run } = useAction()
  const [transfer] = useTransferBookingMutation()
  const balance = booking.summary.balance
  const [slot, setSlot] = useState<Slot>({ propertyId: booking.property_id })
  const [startDate, setStartDate] = useState(todayYmd())
  const [deposit, setDeposit] = useState('')
  const [settle, setSettle] = useState(defaultSettle(balance))
  const valid = !!slot.roomId && (!slot.isBed || !!slot.bedId) && !!startDate && settleValid(balance, settle)

  async function submit() {
    const r = await run(() =>
      transfer({
        id: booking.id, room_id: slot.roomId as number, ...(slot.bedId ? { bed_id: slot.bedId } : {}),
        start_date: startDate, ...(deposit.trim() && !Number.isNaN(Number(deposit)) ? { deposit: Number(deposit) } : {}),
        ...settleBody(balance, settle),
      }).unwrap()
    )
    if (r.ok) onDone(r.data.new_booking.id)
  }
  return (
    <Sheet title={t('changeRoom')} onClose={onClose}>
      <T w="bold" size={14} style={{ marginBottom: 8 }}>{t('moveTo')}</T>
      <RoomPicker value={slot} onChange={setSlot} />
      <DateField label={t('newStart')} value={startDate} onChange={setStartDate} />
      <TextField label={t('deposit')} value={deposit} onChangeText={setDeposit} keyboardType="numeric" />
      <SettleFields balance={balance} value={settle} onChange={setSettle} />
      <T size={12} color={colors.muted} style={{ marginBottom: 12 }}>{t('pendingNote')}</T>
      <Button title={t('confirmTransfer')} onPress={submit} loading={busy} disabled={!valid} />
    </Sheet>
  )
}
