import { useEffect } from 'react'
import { Stack, useRouter, useSegments } from 'expo-router'
import { useFonts } from 'expo-font'
import * as SplashScreen from 'expo-splash-screen'
import { StatusBar } from 'expo-status-bar'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { QueryClient, QueryClientProvider, useQueryClient } from '@tanstack/react-query'
import { SettingsProvider, useSettings } from '../settings/SettingsProvider'
import { AuthProvider, useAuth } from '../auth/AuthProvider'
import { fontAssets } from '../theme/fonts'

SplashScreen.preventAutoHideAsync()

const queryClient = new QueryClient({ defaultOptions: { queries: { retry: 1, staleTime: 15_000 } } })

/** Waits for fonts, saved settings and the saved login, then sends the user to login or the app */
function Gate() {
  const { status } = useAuth()
  const { ready } = useSettings()
  const [fontsLoaded] = useFonts(fontAssets)
  const segments = useSegments()
  const router = useRouter()
  const qc = useQueryClient()
  const appReady = fontsLoaded && ready && status !== 'loading'

  useEffect(() => {
    if (appReady) SplashScreen.hideAsync()
  }, [appReady])

  useEffect(() => {
    if (!appReady) return
    const inAuth = segments[0] === '(auth)'
    if (status === 'out') {
      qc.clear() // forget the previous owner's data
      if (!inAuth) router.replace('/(auth)/login' as any)
    } else if (status === 'in' && inAuth) {
      router.replace('/(tabs)' as any)
    }
  }, [appReady, status, segments])

  if (!appReady) return null
  return (
    <>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false }} />
    </>
  )
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <SettingsProvider>
        <AuthProvider>
          <QueryClientProvider client={queryClient}>
            <Gate />
          </QueryClientProvider>
        </AuthProvider>
      </SettingsProvider>
    </SafeAreaProvider>
  )
}
