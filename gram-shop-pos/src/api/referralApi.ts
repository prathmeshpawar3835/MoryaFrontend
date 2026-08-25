import { axiosClient } from './axiosClient'
import { cleanParams } from '../utils/query'
import type { PagedQuery, PagedResponse, Referral, ReferralValidation } from '../types'

export const referralApi = {
  list: async (query: PagedQuery) =>
    (await axiosClient.get<PagedResponse<Referral>>('/referrals', { params: cleanParams({ ...query }) })).data,
  validate: async (code: string, excludeCustomerId?: number | null, storeId?: number | null) =>
    (await axiosClient.get<ReferralValidation>('/referrals/validate', {
      params: cleanParams({ code, excludeCustomerId, storeId }),
    })).data,
}
