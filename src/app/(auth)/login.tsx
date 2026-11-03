import React, { useState } from 'react'
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { useSettings } from '../../settings/SettingsProvider'
import { useAuth } from '../../auth/AuthProvider'
import { HeaderTools } from '../../ui/Screen'
import { T } from '../../ui/AppText'
import { Button } from '../../ui/Button'
import { TextField } from '../../ui/TextField'
import { cleanPhone, fmtPhone } from '../../utils/format'

export default function Login() {
  const { t, colors, errText } = useSettings()
  const { sendOtp, verifyOtp } = useAuth()
  const insets = useSafeAreaInsets()

  const [step, setStep] = useState<'phone' | 'otp'>('phone')
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [name, setName] = useState('')
  const [isNew, setIsNew] = useState(false)
  const [devOtp, setDevOtp] = useState<string | undefined>()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const digits = cleanPhone(phone)
  const phoneOk = /^[6-9]\d{9}$/.test(digits)
  const otpOk = /^\d{6}$/.test(otp) && (!isNew || name.trim().length >= 2)

  async function send() {
    setBusy(true)
    setError('')
    try {
      const r = await sendOtp(digits)
      setIsNew(r.is_new)
      setDevOtp(r.dev_otp)
      setOtp(r.dev_otp ?? '') // development only: the server returns the OTP when SMS is off
      setStep('otp')
    } catch (e) {
      setError(errText(e))
    } finally {
      setBusy(false)
    }
  }

  async function verify() {
    setBusy(true)
    setError('')
    try {
      await verifyOtp(digits, otp, isNew ? name.trim() : undefined)
      // the app moves to the tabs by itself when the login is saved
    } catch (e) {
      setError(errText(e))
      setBusy(false)
    }
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.hd }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
        <View style={{ paddingTop: insets.top + 12, paddingHorizontal: 16, paddingBottom: 46 }}>
          <View style={{ alignItems: 'flex-end' }}>
            <HeaderTools />
          </View>
          <View style={{ alignItems: 'center', marginTop: 18 }}>
            <View style={{ width: 76, height: 76, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.16)', alignItems: 'center', justifyContent: 'center' }}>
              <MaterialCommunityIcons name="home-city-outline" size={42} color="#fff" />
            </View>
            <T w="bold" size={26} color="#fff" style={{ marginTop: 12 }}>{t('appN')}</T>
            <T size={14} color="rgba(255,255,255,0.8)" style={{ textAlign: 'center', marginTop: 2 }}>{t('tag')}</T>
          </View>
        </View>

        <View style={{ flex: 1, marginTop: -22, borderTopLeftRadius: 24, borderTopRightRadius: 24, backgroundColor: colors.bg, padding: 20, paddingBottom: insets.bottom + 20 }}>
          {step === 'phone' ? (
            <>
              <TextField
                label={t('mobN')}
                prefix="+91"
                value={phone}
                onChangeText={setPhone}
                keyboardType="number-pad"
                maxLength={14}
                placeholder="98765 43210"
                autoFocus
              />
              {error ? <T size={13} color={colors.red} style={{ marginBottom: 10 }}>{error}</T> : null}
              <Button title={t('cont')} onPress={send} loading={busy} disabled={!phoneOk} />
            </>
          ) : (
            <>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                <T size={14} color={colors.muted}>
                  {t('otpS')}<T w="semibold" size={14}>+91 {fmtPhone(digits)}</T>
                </T>
                <Pressable onPress={() => { setStep('phone'); setError('') }}>
                  <T w="semibold" size={13.5} color={colors.pri}>{t('chg')}</T>
                </Pressable>
              </View>
              {isNew ? (
                <TextField label={t('yname')} value={name} onChangeText={setName} autoCapitalize="words" />
              ) : null}
              <TextField
                label={t('enterOtp')}
                value={otp}
                onChangeText={(v) => setOtp(v.replace(/\D/g, '').slice(0, 6))}
                keyboardType="number-pad"
                maxLength={6}
                placeholder="• • • • • •"
                autoFocus={!isNew}
              />
              {devOtp ? <T size={12.5} color={colors.amber} style={{ marginBottom: 10 }}>{t('devOtp')}: {devOtp}</T> : null}
              {error ? <T size={13} color={colors.red} style={{ marginBottom: 10 }}>{error}</T> : null}
              <Button title={t('verify')} onPress={verify} loading={busy} disabled={!otpOk} />
              <Pressable onPress={send} disabled={busy} style={{ alignItems: 'center', padding: 14 }}>
                <T w="semibold" size={13.5} color={colors.pri}>{t('resend')}</T>
              </Pressable>
            </>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}
