import React from 'react'
import { useSettings } from '../../settings/SettingsProvider'
import { ComingNext } from '../../ui/ComingNext'

export default function Invoices() {
  const { t } = useSettings()
  return <ComingNext title={t('inv')} icon="receipt-text-outline" />
}
