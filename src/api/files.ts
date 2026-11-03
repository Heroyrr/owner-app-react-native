import { Linking } from 'react-native'
import { api } from './client'

/** Upload a photo or document picked on the phone. Returns the key to save with the record. */
export async function uploadFile(uri: string, kind: string, mime = 'image/jpeg') {
  const form = new FormData()
  form.append('kind', kind)
  const ext = mime === 'image/png' ? 'png' : mime === 'image/webp' ? 'webp' : mime === 'application/pdf' ? 'pdf' : 'jpg'
  form.append('file', { uri, name: `${kind}.${ext}`, type: mime } as any)
  return api<{ key: string; mime_type: string; size: number }>('/files', { method: 'POST', form })
}

/** Ask the server for a short-lived link and open it */
export async function openFile(key: string) {
  const r = await api<{ url: string }>('/files/url', { query: { key } })
  await Linking.openURL(r.url)
}
