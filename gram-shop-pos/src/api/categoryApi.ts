import { axiosClient } from './axiosClient'
import type { Category, CreateCategoryRequest, UpdateCategoryRequest } from '../types'

export const categoryApi = {
  list: async () => (await axiosClient.get<Category[]>('/categories')).data,
  get: async (id: number) => (await axiosClient.get<Category>(`/categories/${id}`)).data,
  create: async (body: CreateCategoryRequest) => (await axiosClient.post<Category>('/categories', body)).data,
  update: async (id: number, body: UpdateCategoryRequest) =>
    (await axiosClient.put<Category>(`/categories/${id}`, body)).data,
  remove: async (id: number) => {
    await axiosClient.delete(`/categories/${id}`)
  },
}
