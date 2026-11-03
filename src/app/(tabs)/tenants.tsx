import React from 'react'
import { useSettings } from '../../settings/SettingsProvider'
import { ComingNext } from '../../ui/ComingNext'

export default function Tenants() {
  const { t } = useSettings()
  return <ComingNext title={t('tenants')} icon="account-group-outline" />
}
