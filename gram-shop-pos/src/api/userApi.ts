import { axiosClient } from './axiosClient'
import { cleanParams } from '../utils/query'
import type { CreateUserRequest, PagedQuery, PagedResponse, UpdateUserRequest, User } from '../types'

export const userApi = {
  list: async (query: PagedQuery) =>
    (await axiosClient.get<PagedResponse<User>>('/users', { params: cleanParams({ ...query }) })).data,
  get: async (id: number) => (await axiosClient.get<User>(`/users/${id}`)).data,
  create: async (body: CreateUserRequest) => (await axiosClient.post<User>('/users', body)).data,
  update: async (id: number, body: UpdateUserRequest) => (await axiosClient.put<User>(`/users/${id}`, body)).data,
}
