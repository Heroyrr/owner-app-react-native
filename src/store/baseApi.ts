import { createApi, type BaseQueryFn } from '@reduxjs/toolkit/query/react'
import { api, ApiError } from '../api/client'

/*
| RTK Query base. Every endpoint file in src/store/api/ adds its endpoints here with injectEndpoints.
| The base query reuses src/api/client.ts, so the login token, the 401 logout and the error codes work as before.
*/
export type ApiArgs = {
  url: string
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE'
  body?: unknown
  params?: Record<string, string | number | boolean | undefined | null>
  form?: FormData
}
export type ApiErr = { status: number; code?: string; message: string }

const baseQuery: BaseQueryFn<ApiArgs, unknown, ApiErr> = async (args) => {
  try {
    const data = await api(args.url, { method: args.method, body: args.body, query: args.params, form: args.form })
    return { data }
  } catch (e) {
    if (e instanceof ApiError) return { error: { status: e.status, code: e.code, message: e.message } }
    return { error: { status: 0, message: e instanceof Error ? e.message : String(e) } }
  }
}

export const baseApi = createApi({
  reducerPath: 'api',
  baseQuery,
  tagTypes: ['Home', 'Properties', 'Property', 'Meters', 'Readings', 'Tenants', 'Tenant', 'Bookings', 'Booking', 'Balances', 'File'],
  refetchOnMountOrArgChange: 20, // seconds: a screen opened again after 20 s loads fresh data
  endpoints: () => ({}),
})
