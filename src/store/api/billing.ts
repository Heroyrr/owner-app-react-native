import { baseApi } from '../baseApi'
import type { BalanceRow } from '../../api/types'

export const billingApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // one row per booking with its calculated balance. due: 'true' = only bookings that owe money
    getBalances: builder.query<BalanceRow[], { due?: 'true'; property_id?: number; status?: string } | void>({
      query: (params) => ({ url: '/balances', params: params ?? undefined }),
      providesTags: ['Balances'],
    }),
  }),
})

export const { useGetBalancesQuery } = billingApi
