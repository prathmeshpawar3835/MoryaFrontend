import { axiosClient, downloadResponse } from './axiosClient'
import { cleanParams } from '../utils/query'
import type {
  CreateCustomerRequest,
  Customer,
  CustomerHistory,
  CustomerPaymentRequest,
  LedgerEntry,
  LedgerReceipt,
  LedgerSummary,
  PagedQuery,
  PagedResponse,
  Payment,
  UpdateCustomerRequest,
  Wallet,
  WalletRedeemRequest,
} from '../types'

export const customerApi = {
  list: async (query: PagedQuery) =>
    (await axiosClient.get<PagedResponse<Customer>>('/customers', { params: cleanParams({ ...query }) })).data,
  get: async (id: number) => (await axiosClient.get<Customer>(`/customers/${id}`)).data,
  create: async (body: CreateCustomerRequest) => (await axiosClient.post<Customer>('/customers', body)).data,
  update: async (id: number, body: UpdateCustomerRequest) =>
    (await axiosClient.put<Customer>(`/customers/${id}`, body)).data,
  search: async (query: string, storeId?: number | null) =>
    (await axiosClient.get<Customer[]>('/customers/search', { params: cleanParams({ query, storeId }) })).data,
  byMobile: async (mobile: string, storeId?: number | null) =>
    (await axiosClient.get<Customer>('/customers/by-mobile', { params: cleanParams({ mobile, storeId }) })).data,
  history: async (id: number) => (await axiosClient.get<CustomerHistory>(`/customers/${id}/history`)).data,
  ledger: async (id: number, query: PagedQuery) =>
    (await axiosClient.get<PagedResponse<LedgerEntry>>(`/customers/${id}/ledger`, { params: cleanParams({ ...query }) })).data,
  ledgerSummary: async (id: number) =>
    (await axiosClient.get<LedgerSummary>(`/customers/${id}/ledger/summary`)).data,
  ledgerReceipt: async (id: number, entryId: number) =>
    (await axiosClient.get<LedgerReceipt>(`/customers/${id}/ledger/${entryId}/receipt`)).data,
  ledgerReceiptPdf: async (id: number, entryId: number) => {
    const res = await axiosClient.get<Blob>(`/customers/${id}/ledger/${entryId}/receipt/pdf`, { responseType: 'blob' })
    await downloadResponse(res, `receipt-${entryId}.pdf`)
  },
  ledgerPdf: async (id: number) => {
    const res = await axiosClient.get<Blob>(`/customers/${id}/ledger/pdf`, { responseType: 'blob' })
    await downloadResponse(res, `ledger-${id}.pdf`)
  },
  pay: async (id: number, body: CustomerPaymentRequest) =>
    (await axiosClient.post<Payment>(`/customers/${id}/payments`, body)).data,
  payments: async (id: number) => (await axiosClient.get<Payment[]>(`/customers/${id}/payments`)).data,
  wallet: async (id: number) => (await axiosClient.get<Wallet>(`/customers/${id}/wallet`)).data,
  redeemWallet: async (id: number, body: WalletRedeemRequest) => {
    await axiosClient.post(`/customers/${id}/wallet/redeem`, body)
  },
}
