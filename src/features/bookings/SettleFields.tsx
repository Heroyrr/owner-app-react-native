import React from 'react'
import { View } from 'react-native'
import { useSettings } from '../../settings/SettingsProvider'
import { Segmented } from '../../ui/Segmented'
import { T } from '../../ui/AppText'
import { TextField } from '../../ui/TextField'
import { inr } from '../../utils/format'

export type SettleValue = { mode?: string; payment_mode: 'cash' | 'upi' | 'bank'; ref_no: string }

/** Owes the owner -> collected now, write off or keep pending. Owner holds advance -> refund or keep pending. */
export const defaultSettle = (balance: number): SettleValue => ({
  mode: balance > 0 ? 'collected' : balance < 0 ? 'refunded' : undefined,
  payment_mode: 'cash',
  ref_no: '',
})

export const settleValid = (balance: number, v: SettleValue) =>
  balance > 0 && v.mode === 'collected' ? v.ref_no.trim() !== '' : true

/** The fields the server wants for move-out and room change */
export const settleBody = (balance: number, v: SettleValue) => {
  if (balance === 0 || !v.mode) return {}
  return v.mode === 'collected'
    ? { settle_mode: 'collected', payment_mode: v.payment_mode, ref_no: v.ref_no.trim() }
    : { settle_mode: v.mode }
}

export function SettleFields({ balance, value, onChange }: { balance: number; value: SettleValue; onChange: (v: SettleValue) => void }) {
  const { t, colors } = useSettings()
  return (
    <View style={{ marginBottom: 6 }}>
      <T w="bold" size={14} style={{ marginBottom: 4 }}>{t('settle')}</T>
      {balance === 0 ? (
        <T size={13} color={colors.muted}>{t('noBalance')}</T>
      ) : (
        <>
          <T size={13.5} color={balance > 0 ? colors.red : colors.green} style={{ marginBottom: 8 }}>
            {balance > 0 ? t('balDue') : t('balAdv')}: <T w="bold" size={13.5} color={balance > 0 ? colors.red : colors.green}>{inr(Math.abs(balance))}</T>
          </T>
          <Segmented<string>
            value={value.mode ?? ''}
            onChange={(mode) => onChange({ ...value, mode })}
            options={
              balance > 0
                ? [{ v: 'collected', label: t('sCollected') }, { v: 'written_off', label: t('sWrittenOff') }, { v: 'pending', label: t('sPending') }]
                : [{ v: 'refunded', label: t('sRefunded') }, { v: 'pending', label: t('sPending') }]
            }
          />
          {value.mode === 'pending' ? <T size={12} color={colors.muted} style={{ marginTop: 6 }}>{t('pendingNote')}</T> : null}
          {balance > 0 && value.mode === 'collected' ? (
            <View style={{ marginTop: 12 }}>
              <T w="medium" size={12.5} color={colors.muted} style={{ marginBottom: 6 }}>{t('payMode')}</T>
              <Segmented<'cash' | 'upi' | 'bank'>
                value={value.payment_mode}
                onChange={(payment_mode) => onChange({ ...value, payment_mode })}
                options={[{ v: 'cash', label: t('mCash') }, { v: 'upi', label: t('mUpi') }, { v: 'bank', label: t('mBank') }]}
              />
              <View style={{ height: 10 }} />
              <TextField label={t('refNo')} value={value.ref_no} onChangeText={(ref_no) => onChange({ ...value, ref_no })} autoCapitalize="characters" />
            </View>
          ) : null}
        </>
      )}
    </View>
  )
}
