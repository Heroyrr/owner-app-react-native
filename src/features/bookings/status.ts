import type { BookingStatus } from '../../api/types'
import type { Key } from '../../i18n/strings'
import type { Tone } from '../../ui/Badge'

export const statusLook = (status: BookingStatus): { key: Key; tone: Tone } => {
  switch (status) {
    case 'active': return { key: 'stActive', tone: 'green' }
    case 'reserved': return { key: 'stReserved', tone: 'amber' }
    case 'notice': return { key: 'stNotice', tone: 'red' }
    default: return { key: 'stOut', tone: 'grey' }
  }
}
