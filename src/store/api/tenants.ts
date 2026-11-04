import { baseApi } from '../baseApi'
import type { Doc, TenantDetail, TenantRow, BookingFull } from '../../api/types'

export const tenantsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // search, status (live | moved_out) and property_id are optional filters
    getTenants: builder.query<TenantRow[], { search?: string; status?: 'live' | 'moved_out'; property_id?: number } | void>({
      query: (params) => ({ url: '/tenants', params: params ?? undefined }),
      providesTags: ['Tenants'],
    }),
    getTenant: builder.query<TenantDetail, number | string>({
      query: (tenantId) => ({ url: `/tenants/${tenantId}` }),
      providesTags: (_r, _e, tenantId) => [{ type: 'Tenant', id: String(tenantId) }],
    }),
    getTenantBookings: builder.query<BookingFull[], number | string>({
      query: (tenantId) => ({ url: `/tenants/${tenantId}/bookings` }),
      providesTags: ['Bookings'],
    }),
    // the person only. The stay is created with addBooking
    addTenant: builder.mutation<{ id: number }, { name: string; phone?: string; photo_key?: string }>({
      query: (body) => ({ url: '/tenants', method: 'POST', body }),
      invalidatesTags: ['Tenants'],
    }),
    updateTenant: builder.mutation<unknown, { id: number; name?: string; phone?: string; photo_key?: string }>({
      query: ({ id, ...body }) => ({ url: `/tenants/${id}`, method: 'PATCH', body }),
      invalidatesTags: ['Tenants', 'Tenant', 'Bookings', 'Booking'],
    }),
    // Aadhaar front and back replace the older file; "other_id" can be added many times
    addTenantDocument: builder.mutation<
      Doc,
      { tenantId: number; kind: 'aadhaar_front' | 'aadhaar_back' | 'other_id'; file_key: string; mime_type: string }
    >({
      query: ({ tenantId, ...body }) => ({ url: `/tenants/${tenantId}/documents`, method: 'POST', body }),
      invalidatesTags: ['Tenants', 'Tenant'],
    }),
    removeTenantDocument: builder.mutation<unknown, number>({
      query: (docId) => ({ url: `/documents/${docId}`, method: 'DELETE' }),
      invalidatesTags: ['Tenants', 'Tenant'],
    }),
  }),
})

export const {
  useGetTenantsQuery,
  useGetTenantQuery,
  useGetTenantBookingsQuery,
  useAddTenantMutation,
  useUpdateTenantMutation,
  useAddTenantDocumentMutation,
  useRemoveTenantDocumentMutation,
} = tenantsApi
