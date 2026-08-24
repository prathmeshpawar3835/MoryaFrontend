import { axiosClient } from './axiosClient'
import { cleanParams } from '../utils/query'
import type { CreatePurchaseRequest, PagedQuery, PagedResponse, Purchase } from '../types'

export const purchaseApi = {
  list: async (query: PagedQuery) =>
    (await axiosClient.get<PagedResponse<Purchase>>('/purchases', { params: cleanParams({ ...query }) })).data,
  get: async (id: number) => (await axiosClient.get<Purchase>(`/purchases/${id}`)).data,
  create: async (body: CreatePurchaseRequest) => (await axiosClient.post<Purchase>('/purchases', body)).data,
}
