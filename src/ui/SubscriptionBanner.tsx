import React from 'react'
import { Alert, Pressable, View } from 'react-native'
import { Feather } from '@expo/vector-icons'
import type { Subscription } from '../api/types'
import { useSettings } from '../settings/SettingsProvider'
import { T } from './AppText'
import { useTone, type Tone } from './Badge'

/** Trial, expiring, grace and locked messages from the subscription state the server sends */
export function SubscriptionBanner({ sub }: { sub?: Subscription | null }) {
  const { t } = useSettings()
  let tone: Tone = 'green'
  let text = ''
  let action = false

  if (sub) {
    const graceLeft = sub.grace_ends_at
      ? Math.max(0, Math.ceil((new Date(sub.grace_ends_at).getTime() - Date.now()) / 86_400_000))
      : 0
    if (sub.state === 'view_only') { tone = 'red'; text = t('lockB'); action = true }
    else if (sub.state === 'grace') { tone = 'red'; text = t('graceB', { n: graceLeft }); action = true }
    else if (sub.plan === 'trial') { tone = (sub.days_left ?? 0) <= 7 ? 'amber' : 'green'; text = t('trialB', { n: sub.days_left ?? 0 }); action = true }
    else if ((sub.days_left ?? 99) <= 7) { tone = 'amber'; text = t('expB', { n: sub.days_left ?? 0 }); action = true }
  }
  const { fg, bg } = useTone(tone)
  if (!text) return null
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: bg, borderRadius: 12, padding: 11, marginBottom: 12, gap: 10 }}>
      <Feather name="info" size={18} color={fg} />
      <T w="medium" size={13} color={fg} style={{ flex: 1 }}>{text}</T>
      {action ? (
        <Pressable onPress={() => Alert.alert(t('choose'), t('soon'))}>
          <T w="bold" size={13} color={fg}>{t('choose')}</T>
        </Pressable>
      ) : null}
    </View>
  )
}
