import React from 'react'
import { Image, View } from 'react-native'
import { useSettings } from '../settings/SettingsProvider'
import { useGetFileLinkQuery } from '../store/api/files'
import { T } from './AppText'

const PALETTE = ['#1f5c68', '#2e8b57', '#b7791f', '#7c4dab', '#c0392b', '#2a6fb0']

/** Round avatar: shows the photo when a file key is given, otherwise the first letter */
export function Avatar({ name, id = 0, photoKey, size = 46 }: { name: string; id?: number; photoKey?: string | null; size?: number }) {
  const { colors } = useSettings()
  const link = useGetFileLinkQuery(photoKey ?? '', { skip: !photoKey })
  if (photoKey && link.data?.url) {
    return <Image source={{ uri: link.data.url }} style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: colors.line }} />
  }
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: PALETTE[id % PALETTE.length], alignItems: 'center', justifyContent: 'center' }}>
      <T w="bold" size={size * 0.4} color="#fff">{(name || '?').trim().charAt(0).toUpperCase()}</T>
    </View>
  )
}
