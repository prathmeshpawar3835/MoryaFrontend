import { axiosClient } from './axiosClient'
import type { CreateBillRequest, HeldBill, HeldBillRequest, Bill, SalesPersonOption } from '../types'

export const posApi = {
  salesPersons: async (storeId: number) =>
    (await axiosClient.get<SalesPersonOption[]>('/pos/sales-persons', { params: { storeId } })).data,
  createBill: async (body: CreateBillRequest) => (await axiosClient.post<Bill>('/pos/bills', body)).data,
  hold: async (body: HeldBillRequest) => (await axiosClient.post<HeldBill>('/pos/held-bills', body)).data,
  heldList: async (storeId?: number | null) =>
    (await axiosClient.get<HeldBill[]>('/pos/held-bills', { params: storeId ? { storeId } : undefined })).data,
  heldById: async (id: number) => (await axiosClient.get<HeldBill>(`/pos/held-bills/${id}`)).data,
  resume: async (id: number) => (await axiosClient.post<HeldBill>(`/pos/held-bills/${id}/resume`)).data,
  deleteHeld: async (id: number) => {
    await axiosClient.delete(`/pos/held-bills/${id}`)
  },
}
