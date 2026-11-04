import { Alert } from 'react-native'
import { useSettings } from '../settings/SettingsProvider'
import { pickImage, type Picked } from '../utils/pickImage'

/** Asks "camera or gallery?" and returns the chosen image (or null) */
export function usePickPhoto() {
  const { t } = useSettings()
  const denied = () => Alert.alert(t('error'), t('camDenied'))
  return (): Promise<Picked | null> =>
    new Promise((resolve) => {
      Alert.alert(t('photo'), undefined, [
        { text: t('takePhoto'), onPress: () => pickImage(true, denied).then(resolve) },
        { text: t('gallery'), onPress: () => pickImage(false).then(resolve) },
        { text: t('cancel'), style: 'cancel', onPress: () => resolve(null) },
      ], { cancelable: true, onDismiss: () => resolve(null) })
    })
}
