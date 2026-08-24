import { axiosClient } from './axiosClient'
import type { CreateStoreRequest, Store, UpdateStoreRequest } from '../types'

export const storeApi = {
  list: async () => (await axiosClient.get<Store[]>('/stores')).data,
  get: async (id: number) => (await axiosClient.get<Store>(`/stores/${id}`)).data,
  create: async (body: CreateStoreRequest) => (await axiosClient.post<Store>('/stores', body)).data,
  update: async (id: number, body: UpdateStoreRequest) => (await axiosClient.put<Store>(`/stores/${id}`, body)).data,
}
