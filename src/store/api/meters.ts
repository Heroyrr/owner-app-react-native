import { baseApi } from '../baseApi'
import type { MeterRow, Reading } from '../../api/types'

export const metersApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // every room of a property with its latest and previous reading
    getMeters: builder.query<MeterRow[], number>({
      query: (propertyId) => ({ url: `/properties/${propertyId}/meters` }),
      providesTags: ['Meters'],
    }),
    // history of one room, newest first
    getReadings: builder.query<Reading[], number | string>({
      query: (roomId) => ({ url: `/rooms/${roomId}/meter-readings` }),
      providesTags: ['Readings'],
    }),
    addReading: builder.mutation<Reading, { roomId: number; value: number; is_reset?: boolean; photo_key?: string }>({
      query: ({ roomId, ...body }) => ({ url: `/rooms/${roomId}/meter-readings`, method: 'POST', body }),
      invalidatesTags: ['Meters', 'Readings'],
    }),
  }),
})

export const { useGetMetersQuery, useGetReadingsQuery, useAddReadingMutation } = metersApi
