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

/* ---------------- tenants and bookings ---------------- */
export type DocKind = 'aadhaar_front' | 'aadhaar_back' | 'other_id'
export type Doc = { id: number; tenant_id: number; kind: DocKind; file_key: string; mime_type: string }

export type BookingStatus = 'reserved' | 'active' | 'notice' | 'moved_out'

export type BookingFull = {
  id: number
  tenant_id: number
  property_id: number
  room_id: number
  bed_id: number | null
  start_date: string
  end_date: string | null
  status: BookingStatus
  notice_date: string | null
  leave_date: string | null
  out_date: string | null
  deposit: number
  advance: number
  written_off: number
  settle_mode: string | null
  agreement_file_key: string | null
  balance: number
  tenant?: { id: number; name: string; phone: string | null }
  property?: { id: number; name: string; type?: 'BED' | 'NON_BED' }
  room?: { id: number; room_no: string }
  bed?: { id: number; label: string } | null
}

export type BookingSummary = { invoiced: number; paid: number; advance: number; written_off: number; balance: number }
export type BookingDetail = BookingFull & { summary: BookingSummary }

export type LiveSummary = {
  id: number
  status: BookingStatus
  property_name?: string
  room_no?: string
  bed_label: string | null
  balance: number
  agreement_done: boolean
}
export type TenantRow = {
  id: number
  name: string
  phone: string | null
  photo_key: string | null
  ekyc_done: boolean
  documents: Doc[]
  live_bookings: LiveSummary[]
  bookings_count: number
  total_balance: number
}
export type TenantDetail = {
  id: number
  name: string
  phone: string | null
  photo_key: string | null
  ekyc_done: boolean
  documents: Doc[]
  bookings: BookingFull[]
}

export type LedgerInvoice = { id: number; number: string; period_start: string; period_end: string; total: number; paid: number; cancelled: boolean }
export type LedgerPayment = { id: number; mode: string; amount: number; ref_no: string | null; paid_on: string }
export type Ledger = { summary: BookingSummary; invoices: LedgerInvoice[]; payments: LedgerPayment[] }
