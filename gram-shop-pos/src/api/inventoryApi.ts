import { axiosClient } from './axiosClient'
import { cleanParams } from '../utils/query'
import type {
  InventoryItem,
  InventoryListQuery,
  PagedResponse,
  StockAdjustRequest,
  StockInRequest,
  StockMovement,
  StockTransferRequest,
} from '../types'

export const inventoryApi = {
  list: async (query: InventoryListQuery) =>
    (await axiosClient.get<PagedResponse<InventoryItem>>('/inventory', { params: cleanParams({ ...query }) })).data,
  getByProduct: async (productId: number, storeId: number) =>
    (await axiosClient.get<InventoryItem>(`/inventory/${productId}`, { params: { storeId } })).data,
  ledger: async (query: InventoryListQuery & { productId?: number }) =>
    (await axiosClient.get<PagedResponse<StockMovement>>('/inventory/ledger', { params: cleanParams({ ...query }) })).data,
  stockIn: async (body: StockInRequest) => {
    await axiosClient.post('/inventory/stock-in', body)
  },
  adjust: async (body: StockAdjustRequest) => {
    await axiosClient.post('/inventory/adjust', body)
  },
  transfer: async (body: StockTransferRequest) => {
    await axiosClient.post('/inventory/transfer', body)
  },
  lowStock: async (storeId?: number | null) =>
    (await axiosClient.get<InventoryItem[]>('/inventory/low-stock', { params: cleanParams({ storeId }) })).data,
}
