import { axiosClient, downloadResponse } from './axiosClient'
import { cleanParams } from '../utils/query'
import type { Bill, BillListQuery, Invoice, PagedResponse } from '../types'

export const billApi = {
  list: async (query: BillListQuery) =>
    (await axiosClient.get<PagedResponse<Bill>>('/bills', { params: cleanParams({ ...query }) })).data,
  search: async (query: BillListQuery) =>
    (await axiosClient.get<PagedResponse<Bill>>('/bills/search', { params: cleanParams({ ...query }) })).data,
  get: async (id: number) => (await axiosClient.get<Bill>(`/bills/${id}`)).data,
  invoice: async (id: number) => (await axiosClient.get<Invoice>(`/bills/${id}/invoice`)).data,
  invoicePdf: async (id: number) => {
    const res = await axiosClient.get<Blob>(`/bills/${id}/invoice/pdf`, { responseType: 'blob' })
    await downloadResponse(res, `invoice-${id}.pdf`)
  },
  cancel: async (id: number, reason?: string) => {
    await axiosClient.post(`/bills/${id}/cancel`, { reason })
  },
}
