import * as ImagePicker from 'expo-image-picker'

export type Picked = { uri: string; mime: string }

/** Camera or gallery. Returns null when cancelled; calls onDenied when the camera permission is refused. */
export async function pickImage(camera: boolean, onDenied?: () => void): Promise<Picked | null> {
  if (camera) {
    const perm = await ImagePicker.requestCameraPermissionsAsync()
    if (!perm.granted) {
      onDenied?.()
      return null
    }
  }
  const res = camera
    ? await ImagePicker.launchCameraAsync({ quality: 0.6 })
    : await ImagePicker.launchImageLibraryAsync({ quality: 0.6 })
  if (res.canceled || !res.assets[0]) return null
  return { uri: res.assets[0].uri, mime: res.assets[0].mimeType ?? 'image/jpeg' }
}
