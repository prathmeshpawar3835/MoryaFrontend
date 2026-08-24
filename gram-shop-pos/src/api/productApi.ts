import { axiosClient, downloadResponse } from './axiosClient'
import { cleanParams } from '../utils/query'
import type {
  CreateProductRequest,
  ImportConfirmResponse,
  ImportPreviewResponse,
  PagedResponse,
  Product,
  ProductListQuery,
  UpdateProductRequest,
} from '../types'

export const productApi = {
  list: async (query: ProductListQuery) =>
    (await axiosClient.get<PagedResponse<Product>>('/products', { params: cleanParams({ ...query }) })).data,
  get: async (id: number, storeId?: number | null) =>
    (await axiosClient.get<Product>(`/products/${id}`, { params: cleanParams({ storeId }) })).data,
  create: async (body: CreateProductRequest) => (await axiosClient.post<Product>('/products', body)).data,
  update: async (id: number, body: UpdateProductRequest) =>
    (await axiosClient.put<Product>(`/products/${id}`, body)).data,
  remove: async (id: number) => {
    await axiosClient.delete(`/products/${id}`)
  },
  search: async (query: string, storeId?: number | null) =>
    (await axiosClient.get<Product[]>('/products/search', { params: cleanParams({ query, storeId }) })).data,
  barcode: async (barcode: string, storeId?: number | null) =>
    (
      await axiosClient.get<Product>(`/products/barcode/${encodeURIComponent(barcode)}`, {
        params: cleanParams({ storeId }),
        skipErrorToast: true,
      })
    ).data,
  previewImport: async (file: File) => {
    const form = new FormData()
    form.append('file', file)
    return (await axiosClient.post<ImportPreviewResponse>('/products/import/preview', form)).data
  },
  confirmImport: async (batchId: string) =>
    (await axiosClient.post<ImportConfirmResponse>('/products/import/confirm', null, { params: { batchId } })).data,
  downloadTemplate: async () => {
    const res = await axiosClient.get<Blob>('/products/import/template', { responseType: 'blob' })
    await downloadResponse(res, 'product-import-template.xlsx')
  },
}
