import {
  Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold,
} from '@expo-google-fonts/inter'
import {
  NotoSansDevanagari_400Regular, NotoSansDevanagari_500Medium,
  NotoSansDevanagari_600SemiBold, NotoSansDevanagari_700Bold,
} from '@expo-google-fonts/noto-sans-devanagari'

export type Weight = 'regular' | 'medium' | 'semibold' | 'bold'

export const fontAssets = {
  Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold,
  NotoSansDevanagari_400Regular, NotoSansDevanagari_500Medium,
  NotoSansDevanagari_600SemiBold, NotoSansDevanagari_700Bold,
}

const W = { regular: '400Regular', medium: '500Medium', semibold: '600SemiBold', bold: '700Bold' } as const

/** Hindi text uses Noto Sans Devanagari, English uses Inter (Inter has no Devanagari letters) */
export const familyFor = (lang: 'en' | 'hi', w: Weight) =>
  (lang === 'hi' ? 'NotoSansDevanagari_' : 'Inter_') + W[w]
