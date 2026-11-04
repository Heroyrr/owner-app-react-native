import { baseApi } from '../baseApi'
import type { BookingDetail, BookingFull, Ledger } from '../../api/types'

/** A booking change affects tenants, room occupancy, property counts, Home dues and balances */
const AFTER_BOOKING = ['Bookings', 'Booking', 'Tenants', 'Tenant', 'Properties', 'Property', 'Home', 'Balances', 'Meters'] as const

type Settle = { settle_mode?: string; payment_mode?: string; ref_no?: string }

export const bookingsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // status: live | reserved | active | notice | moved_out
    getBookings: builder.query<BookingFull[], { status?: string; property_id?: number; tenant_id?: number } | void>({
      query: (params) => ({ url: '/bookings', params: params ?? undefined }),
      providesTags: ['Bookings'],
    }),
    // booking with tenant, property, room, bed, balance and summary
    getBooking: builder.query<BookingDetail, number | string>({
      query: (bookingId) => ({ url: `/bookings/${bookingId}` }),
      providesTags: (_r, _e, bookingId) => [{ type: 'Booking', id: String(bookingId) }],
    }),
    // invoices and payments of this booking only
    getLedger: builder.query<Ledger, number | string>({
      query: (bookingId) => ({ url: `/bookings/${bookingId}/ledger` }),
      providesTags: (_r, _e, bookingId) => [{ type: 'Booking', id: String(bookingId) }],
    }),

    addBooking: builder.mutation<
      { id: number },
      {
        tenant_id: number; room_id: number; bed_id?: number; start_date: string; end_date?: string
        status?: 'reserved' | 'active'; deposit?: number; advance?: number
      }
    >({
      query: (body) => ({ url: '/bookings', method: 'POST', body }),
      invalidatesTags: [...AFTER_BOOKING],
    }),
    updateBooking: builder.mutation<unknown, { id: number; start_date?: string; end_date?: string; deposit?: number }>({
      query: ({ id, ...body }) => ({ url: `/bookings/${id}`, method: 'PATCH', body }),
      invalidatesTags: [...AFTER_BOOKING],
    }),
    // only for a reservation with no invoice or payment
    deleteBooking: builder.mutation<unknown, number>({
      query: (id) => ({ url: `/bookings/${id}`, method: 'DELETE' }),
      invalidatesTags: [...AFTER_BOOKING],
    }),
    activateBooking: builder.mutation<unknown, number>({
      query: (id) => ({ url: `/bookings/${id}/activate`, method: 'POST' }),
      invalidatesTags: [...AFTER_BOOKING],
    }),
    giveNotice: builder.mutation<unknown, { id: number; notice_date: string; leave_date: string }>({
      query: ({ id, ...body }) => ({ url: `/bookings/${id}/notice`, method: 'POST', body }),
      invalidatesTags: [...AFTER_BOOKING],
    }),
    cancelNotice: builder.mutation<unknown, number>({
      query: (id) => ({ url: `/bookings/${id}/notice`, method: 'DELETE' }),
      invalidatesTags: [...AFTER_BOOKING],
    }),
    // frees the room or bed and settles the balance (collected, written_off, refunded or pending)
    moveOut: builder.mutation<unknown, { id: number; out_date: string } & Settle>({
      query: ({ id, ...body }) => ({ url: `/bookings/${id}/move-out`, method: 'POST', body }),
      invalidatesTags: [...AFTER_BOOKING],
    }),
    // room or bed change: closes this booking and opens a new one that starts at zero
    transferBooking: builder.mutation<
      { old_booking: { id: number }; new_booking: { id: number } },
      { id: number; room_id: number; bed_id?: number; start_date: string; deposit?: number } & Settle
    >({
      query: ({ id, ...body }) => ({ url: `/bookings/${id}/transfer`, method: 'POST', body }),
      invalidatesTags: [...AFTER_BOOKING],
    }),
    setAgreement: builder.mutation<unknown, { id: number; file_key: string }>({
      query: ({ id, ...body }) => ({ url: `/bookings/${id}/agreement`, method: 'PUT', body }),
      invalidatesTags: ['Bookings', 'Booking', 'Tenants', 'Tenant'],
    }),
  }),
})

export const {
  useGetBookingsQuery,
  useGetBookingQuery,
  useGetLedgerQuery,
  useAddBookingMutation,
  useUpdateBookingMutation,
  useDeleteBookingMutation,
  useActivateBookingMutation,
  useGiveNoticeMutation,
  useCancelNoticeMutation,
  useMoveOutMutation,
  useTransferBookingMutation,
  useSetAgreementMutation,
} = bookingsApi
