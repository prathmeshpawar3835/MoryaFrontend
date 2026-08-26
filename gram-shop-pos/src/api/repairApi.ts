import { axiosClient, downloadResponse } from './axiosClient'
import { cleanParams } from '../utils/query'
import type { CollectRepairPaymentRequest, CreateRepairJobRequest, PagedQuery, PagedResponse, RepairJob, UpdateRepairJobRequest } from '../types'

export const repairApi = {
  list: async (query: PagedQuery) =>
    (await axiosClient.get<PagedResponse<RepairJob>>('/repairs', { params: cleanParams({ ...query }) })).data,
  get: async (id: number) => (await axiosClient.get<RepairJob>(`/repairs/${id}`)).data,
  create: async (body: CreateRepairJobRequest) => (await axiosClient.post<RepairJob>('/repairs', body)).data,
  update: async (id: number, body: UpdateRepairJobRequest) =>
    (await axiosClient.put<RepairJob>(`/repairs/${id}`, body)).data,
  pay: async (id: number, body: CollectRepairPaymentRequest) =>
    (await axiosClient.post<RepairJob>(`/repairs/${id}/payments`, body)).data,
  pdf: async (id: number) => {
    const res = await axiosClient.get<Blob>(`/repairs/${id}/pdf`, { responseType: 'blob' })
    await downloadResponse(res, `repair-${id}.pdf`)
  },
}
