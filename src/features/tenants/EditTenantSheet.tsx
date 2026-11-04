import React, { useState } from 'react'
import type { TenantDetail } from '../../api/types'
import { useAction } from '../../hooks/useAction'
import { useSettings } from '../../settings/SettingsProvider'
import { useUpdateTenantMutation } from '../../store/api/tenants'
import { Button } from '../../ui/Button'
import { Sheet } from '../../ui/Sheet'
import { TextField } from '../../ui/TextField'
import { cleanPhone } from '../../utils/format'

/** Editing the person once updates it on every booking of that person */
export function EditTenantSheet({ tenant, onClose }: { tenant: Pick<TenantDetail, 'id' | 'name' | 'phone'>; onClose: () => void }) {
  const { t } = useSettings()
  const { busy, run } = useAction()
  const [update] = useUpdateTenantMutation()
  const [name, setName] = useState(tenant.name)
  const [phone, setPhone] = useState(tenant.phone ?? '')
  const digits = cleanPhone(phone)
  const valid = name.trim() !== '' && (phone.trim() === '' || /^[6-9]\d{9}$/.test(digits))

  async function submit() {
    const r = await run(() => update({ id: tenant.id, name: name.trim(), ...(phone.trim() ? { phone: digits } : {}) }).unwrap())
    if (r.ok) onClose()
  }
  return (
    <Sheet title={t('editTenant')} onClose={onClose}>
      <TextField label={t('tName')} value={name} onChangeText={setName} autoCapitalize="words" />
      <TextField label={t('tPhone')} prefix="+91" value={phone} onChangeText={setPhone} keyboardType="number-pad" maxLength={14} />
      <Button title={t('save')} onPress={submit} loading={busy} disabled={!valid} />
    </Sheet>
  )
}
