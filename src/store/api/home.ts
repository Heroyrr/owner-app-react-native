import { baseApi } from '../baseApi'
import type { HomeData } from '../../api/types'

export const homeApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getHome: builder.query<HomeData, void>({
      query: () => ({ url: '/home' }),
      providesTags: ['Home'],
    }),
  }),
})

export const { useGetHomeQuery } = homeApi
