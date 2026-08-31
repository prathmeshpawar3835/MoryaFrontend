import { axiosClient, downloadResponse } from './axiosClient'
import { cleanParams } from '../utils/query'
import type { PagedResponse, Product, ProductUnit, ProductUnitListQuery, UpdateProductUnitRequest } from '../types'

export const productUnitApi = {
  list: async (query: ProductUnitListQuery) =>
    (await axiosClient.get<PagedResponse<ProductUnit>>('/product-units', { params: cleanParams({ ...query }) })).data,
  lookup: async (uniqueNumber: string, storeId?: number | null) =>
    (
      await axiosClient.get<Product>(`/product-units/lookup/${encodeURIComponent(uniqueNumber)}`, {
        params: cleanParams({ storeId }),
        skipErrorToast: true,
      })
    ).data,
  update: async (id: number, body: UpdateProductUnitRequest) =>
    (await axiosClient.put<ProductUnit>(`/product-units/${id}`, body)).data,
  qrBlob: async (id: number) =>
    (await axiosClient.get<Blob>(`/product-units/${id}/qr`, { responseType: 'blob' })).data,
  barcodeBlob: async (id: number) =>
    (await axiosClient.get<Blob>(`/product-units/${id}/barcode`, { responseType: 'blob' })).data,
  downloadQr: async (id: number, uniqueNumber: string) => {
    const res = await axiosClient.get<Blob>(`/product-units/${id}/qr`, { responseType: 'blob' })
    await downloadResponse(res, `${uniqueNumber}.png`)
  },
  downloadBarcode: async (id: number, uniqueNumber: string) => {
    const res = await axiosClient.get<Blob>(`/product-units/${id}/barcode`, { responseType: 'blob' })
    await downloadResponse(res, `${uniqueNumber}-code128.svg`)
  },
  downloadZip: async (body: { ids?: number[]; productId?: number }) => {
    const res = await axiosClient.post<Blob>('/product-units/qr-zip', body, { responseType: 'blob' })
    await downloadResponse(res, 'jewellery-qr-codes.zip')
  },
  downloadTagsPdf: async (body: { ids?: number[]; productId?: number; widthMm?: number; heightMm?: number }) => {
    const res = await axiosClient.post<Blob>('/product-units/tags-pdf', body, { responseType: 'blob' })
    await downloadResponse(res, 'jewellery-tags.pdf')
  },
}
