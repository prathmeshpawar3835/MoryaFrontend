import { axiosClient } from './axiosClient'
import { cleanParams } from '../utils/query'
import type { BirthdayEligibility, PagedQuery, PagedResponse, StoreDiscount, StoreDiscountRequest, Supplier, SupplierRequest } from '../types'

export const discountApi = {
  list: async (storeId?: number | null, activeOnly = false, category?: number) =>
    (await axiosClient.get<StoreDiscount[]>('/discounts', { params: cleanParams({ storeId, activeOnly, category }) })).data,
  create: async (body: StoreDiscountRequest) => (await axiosClient.post<StoreDiscount>('/discounts', body)).data,
  update: async (id: number, body: StoreDiscountRequest) =>
    (await axiosClient.put<StoreDiscount>(`/discounts/${id}`, body)).data,
  remove: async (id: number) => {
    await axiosClient.delete(`/discounts/${id}`)
  },
}

export const supplierApi = {
  list: async (query: PagedQuery) =>
    (await axiosClient.get<PagedResponse<Supplier>>('/suppliers', { params: cleanParams({ ...query }) })).data,
  get: async (id: number) => (await axiosClient.get<Supplier>(`/suppliers/${id}`)).data,
  create: async (body: SupplierRequest) => (await axiosClient.post<Supplier>('/suppliers', body)).data,
  update: async (id: number, body: SupplierRequest) =>
    (await axiosClient.put<Supplier>(`/suppliers/${id}`, body)).data,
}

export const birthdayApi = {
  eligibility: async (customerId: number, storeId?: number | null) =>
    (await axiosClient.get<BirthdayEligibility>('/birthday/eligibility', { params: cleanParams({ customerId, storeId }) })).data,
}
