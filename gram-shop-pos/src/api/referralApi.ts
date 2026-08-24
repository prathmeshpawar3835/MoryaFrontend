import { axiosClient } from './axiosClient'
import { cleanParams } from '../utils/query'
import type { PagedQuery, PagedResponse, Referral } from '../types'

export const referralApi = {
  list: async (query: PagedQuery) =>
    (await axiosClient.get<PagedResponse<Referral>>('/referrals', { params: cleanParams({ ...query }) })).data,
}
