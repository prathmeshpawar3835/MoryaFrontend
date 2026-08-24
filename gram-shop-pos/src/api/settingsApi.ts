import { axiosClient } from './axiosClient'
import { cleanParams } from '../utils/query'
import type { AuditLog, PagedQuery, PagedResponse, Settings } from '../types'

export const settingsApi = {
  get: async () => (await axiosClient.get<Settings>('/settings')).data,
  update: async (body: Settings) => (await axiosClient.put<Settings>('/settings', body)).data,
  audit: async (query: PagedQuery) =>
    (await axiosClient.get<PagedResponse<AuditLog>>('/audit-logs', { params: cleanParams({ ...query }) })).data,
}
