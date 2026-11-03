import { useState } from 'react'
import { Alert } from 'react-native'
import { useSettings } from '../settings/SettingsProvider'

/** Runs a server action, shows the error in an alert, and tells the button when it is busy */
export function useAction() {
  const { t, errText } = useSettings()
  const [busy, setBusy] = useState(false)

  async function run<T>(fn: () => Promise<T>): Promise<{ ok: true; data: T } | { ok: false }> {
    setBusy(true)
    try {
      const data = await fn()
      return { ok: true, data }
    } catch (e) {
      Alert.alert(t('error'), errText(e))
      return { ok: false }
    } finally {
      setBusy(false)
    }
  }
  return { busy, run }
}
