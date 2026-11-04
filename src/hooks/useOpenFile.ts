import { Linking } from 'react-native'
import { useLazyGetFileLinkQuery } from '../store/api/files'
import { useAction } from './useAction'

/** Opens a private file (photo or PDF) with a short-lived link from the server */
export function useOpenFile() {
  const [load] = useLazyGetFileLinkQuery()
  const { busy, run } = useAction()
  const open = (key: string) =>
    run(async () => {
      const r = await load(key).unwrap()
      await Linking.openURL(r.url)
    })
  return { open, busy }
}
