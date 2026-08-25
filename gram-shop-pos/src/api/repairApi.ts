import { axiosClient } from './axiosClient'
import { cleanParams } from '../utils/query'
import type { CreateRepairJobRequest, PagedQuery, PagedResponse, RepairJob, UpdateRepairJobRequest } from '../types'

export const repairApi = {
  list: async (query: PagedQuery) =>
    (await axiosClient.get<PagedResponse<RepairJob>>('/repairs', { params: cleanParams({ ...query }) })).data,
  get: async (id: number) => (await axiosClient.get<RepairJob>(`/repairs/${id}`)).data,
  create: async (body: CreateRepairJobRequest) => (await axiosClient.post<RepairJob>('/repairs', body)).data,
  update: async (id: number, body: UpdateRepairJobRequest) =>
    (await axiosClient.put<RepairJob>(`/repairs/${id}`, body)).data,
}
