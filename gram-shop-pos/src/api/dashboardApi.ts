import { axiosClient } from './axiosClient'
import { cleanParams } from '../utils/query'
import type { Dashboard } from '../types'

export const dashboardApi = {
  get: async (storeId?: number | null) =>
    (await axiosClient.get<Dashboard>('/dashboard', { params: cleanParams({ storeId }) })).data,
}
