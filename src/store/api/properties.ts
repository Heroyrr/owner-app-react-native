import { baseApi } from '../baseApi'
import type { Property, PropertyDetail } from '../../api/types'

/** Anything that changes rooms, beds or categories also changes counts on Home and the meters list */
const STRUCTURE = ['Properties', 'Property', 'Home', 'Meters'] as const

export const propertiesApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getProperties: builder.query<Property[], void>({
      query: () => ({ url: '/properties' }),
      providesTags: ['Properties'],
    }),
    getProperty: builder.query<PropertyDetail, number | string>({
      query: (propertyId) => ({ url: `/properties/${propertyId}` }),
      providesTags: (_r, _e, propertyId) => [{ type: 'Property', id: String(propertyId) }],
    }),
    addProperty: builder.mutation<{ id: number }, { name: string; type: 'BED' | 'NON_BED'; address?: string }>({
      query: (body) => ({ url: '/properties', method: 'POST', body }),
      invalidatesTags: ['Properties', 'Home'],
    }),
    updateProperty: builder.mutation<unknown, { id: number; name?: string; address?: string }>({
      query: ({ id, ...body }) => ({ url: `/properties/${id}`, method: 'PATCH', body }),
      invalidatesTags: ['Properties', 'Property'],
    }),
    // hard delete: also removes the property's bookings, invoices and payments
    deleteProperty: builder.mutation<unknown, number>({
      query: (id) => ({ url: `/properties/${id}`, method: 'DELETE', params: { confirm: 'true' } }),
      invalidatesTags: [...STRUCTURE, 'Bookings', 'Booking', 'Tenants', 'Tenant', 'Balances'],
    }),

    addCategory: builder.mutation<
      { category: { id: number }; rooms_added: number },
      { propertyId: number; name: string; rent: number; rooms: string; beds_per_room?: number }
    >({
      query: ({ propertyId, ...body }) => ({ url: `/properties/${propertyId}/categories`, method: 'POST', body }),
      invalidatesTags: [...STRUCTURE],
    }),
    updateCategory: builder.mutation<unknown, { id: number; name?: string; rent?: number }>({
      query: ({ id, ...body }) => ({ url: `/categories/${id}`, method: 'PATCH', body }),
      invalidatesTags: ['Property'],
    }),
    deleteCategory: builder.mutation<unknown, number>({
      query: (id) => ({ url: `/categories/${id}`, method: 'DELETE' }),
      invalidatesTags: [...STRUCTURE],
    }),

    addRoom: builder.mutation<unknown, { propertyId: number; category_id: number; room_no: string }>({
      query: ({ propertyId, ...body }) => ({ url: `/properties/${propertyId}/rooms`, method: 'POST', body }),
      invalidatesTags: [...STRUCTURE],
    }),
    deleteRoom: builder.mutation<unknown, number>({
      query: (id) => ({ url: `/rooms/${id}`, method: 'DELETE' }),
      invalidatesTags: [...STRUCTURE],
    }),
    addBed: builder.mutation<unknown, number>({
      query: (roomId) => ({ url: `/rooms/${roomId}/beds`, method: 'POST' }),
      invalidatesTags: [...STRUCTURE],
    }),
    deleteBed: builder.mutation<unknown, number>({
      query: (id) => ({ url: `/beds/${id}`, method: 'DELETE' }),
      invalidatesTags: [...STRUCTURE],
    }),
  }),
})

export const {
  useGetPropertiesQuery,
  useGetPropertyQuery,
  useAddPropertyMutation,
  useUpdatePropertyMutation,
  useDeletePropertyMutation,
  useAddCategoryMutation,
  useUpdateCategoryMutation,
  useDeleteCategoryMutation,
  useAddRoomMutation,
  useDeleteRoomMutation,
  useAddBedMutation,
  useDeleteBedMutation,
} = propertiesApi
