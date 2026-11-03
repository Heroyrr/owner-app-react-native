export type User = { id: number; name: string; phone: string; language: 'en' | 'hi' }

export type Subscription = {
  plan: string | null
  cycle?: 'm' | 'y' | null
  ends_at?: string
  grace_ends_at?: string
  days_left?: number
  state: 'active' | 'grace' | 'view_only'
  can_write: boolean
  unit_limit?: number
  property_limit?: number | null
  used_units: number
  used_properties: number
}

export type HomeData = {
  dues_total: number
  dues_bookings: number
  collected_this_month: number
  units: number
  occupied: number
  vacant: number
  leads_pending: number
  reminders: {
    leads: { id: number; name: string; phone: string | null; next_action: string | null; next_action_at: string | null }[]
    complaints: { id: number; service: string; remind_at: string | null; property?: { id: number; name: string } }[]
  }
  subscription: Subscription
}

export type Property = {
  id: number
  name: string
  type: 'BED' | 'NON_BED'
  address: string | null
  units: number
  occupied: number
  vacant: number
}
export type LiveBooking = { booking_id: number; status: string; tenant_id: number; tenant_name: string }
export type BedInfo = { id: number; label: string; occupied: boolean; booking: LiveBooking | null }
export type RoomInfo = { id: number; room_no: string; occupied: boolean; bookings: LiveBooking[]; beds: BedInfo[] }
export type CategoryInfo = { id: number; name: string; rent: number; beds_per_room: number | null; rooms: RoomInfo[] }
export type PropertyDetail = Property & { categories: CategoryInfo[] }

export type Reading = { id: number; room_id: number; value: number; is_reset: boolean; photo_key: string | null; created_at: string }
export type MeterRow = { room_id: number; room_no: string; latest: Reading | null; previous: Reading | null; units_used: number | null }

export type BalanceRow = { booking_id: number; property_id: number; balance: number }
