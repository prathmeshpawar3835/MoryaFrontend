import { axiosClient, downloadResponse } from './axiosClient'
import { cleanParams } from '../utils/query'
import type { CreateBuybackRequest, CreateExchangeRequest, CreateReturnRequest, ExchangeResult, PagedQuery, PagedResponse, ReturnRecord } from '../types'

export const returnApi = {
  create: async (body: CreateReturnRequest) => (await axiosClient.post<ReturnRecord>('/returns', body)).data,
  list: async (query: PagedQuery) =>
    (await axiosClient.get<PagedResponse<ReturnRecord>>('/returns', { params: cleanParams({ ...query }) })).data,
  get: async (id: number) => (await axiosClient.get<ReturnRecord>(`/returns/${id}`)).data,
  pdf: async (id: number) => {
    const res = await axiosClient.get<Blob>(`/returns/${id}/pdf`, { responseType: 'blob' })
    await downloadResponse(res, `return-${id}.pdf`)
  },
  exchange: async (body: CreateExchangeRequest) => (await axiosClient.post<ExchangeResult>('/exchanges', body)).data,
  buyback: async (body: CreateBuybackRequest) => (await axiosClient.post<ReturnRecord>('/buybacks', body)).data,
}
