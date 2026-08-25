import { axiosClient, downloadResponse } from './axiosClient'
import { cleanParams } from '../utils/query'
import type {
  CustomerDueRow,
  InventoryReportRow,
  PagedResponse,
  ProductSalesRow,
  ProfitReportRow,
  Purchase,
  ReferralReportRow,
  BirthdayReportRow,
  ReportQuery,
  ReturnRecord,
  SalesReport,
} from '../types'

function params(query: ReportQuery) {
  return cleanParams({ ...query })
}

export const reportApi = {
  sales: async (query: ReportQuery) =>
    (await axiosClient.get<SalesReport>('/reports/sales', { params: params(query) })).data,
  productSales: async (query: ReportQuery & { slowMoving?: boolean }) =>
    (await axiosClient.get<PagedResponse<ProductSalesRow>>('/reports/product-sales', { params: params(query) })).data,
  inventory: async (query: ReportQuery) =>
    (await axiosClient.get<PagedResponse<InventoryReportRow>>('/reports/inventory', { params: params(query) })).data,
  purchases: async (query: ReportQuery) =>
    (await axiosClient.get<PagedResponse<Purchase>>('/reports/purchases', { params: params(query) })).data,
  returns: async (query: ReportQuery) =>
    (await axiosClient.get<PagedResponse<ReturnRecord>>('/reports/returns', { params: params(query) })).data,
  customerDues: async (query: ReportQuery) =>
    (await axiosClient.get<PagedResponse<CustomerDueRow>>('/reports/customer-dues', { params: params(query) })).data,
  referrals: async (query: ReportQuery) =>
    (await axiosClient.get<PagedResponse<ReferralReportRow>>('/reports/referrals', { params: params(query) })).data,
  birthdays: async (query: ReportQuery) =>
    (await axiosClient.get<PagedResponse<BirthdayReportRow>>('/reports/birthdays', { params: params(query) })).data,
  profit: async (query: ReportQuery) =>
    (await axiosClient.get<PagedResponse<ProfitReportRow>>('/reports/profit', { params: params(query) })).data,
  exportSalesExcel: async (query: ReportQuery) => {
    const res = await axiosClient.get<Blob>('/reports/sales/export/excel', { params: params(query), responseType: 'blob' })
    await downloadResponse(res, 'sales-report.xlsx')
  },
  exportInventoryExcel: async (query: ReportQuery) => {
    const res = await axiosClient.get<Blob>('/reports/inventory/export/excel', { params: params(query), responseType: 'blob' })
    await downloadResponse(res, 'inventory-report.xlsx')
  },
  exportCustomersExcel: async (query: ReportQuery) => {
    const res = await axiosClient.get<Blob>('/reports/customers/export/excel', { params: params(query), responseType: 'blob' })
    await downloadResponse(res, 'customers-report.xlsx')
  },
  exportProductSalesExcel: async (query: ReportQuery) => {
    const res = await axiosClient.get<Blob>('/reports/product-sales/export/excel', { params: params(query), responseType: 'blob' })
    await downloadResponse(res, 'product-sales-report.xlsx')
  },
  exportSalesPdf: async (query: ReportQuery) => {
    const res = await axiosClient.get<Blob>('/reports/sales/export/pdf', { params: params(query), responseType: 'blob' })
    await downloadResponse(res, 'sales-report.pdf')
  },
  exportInventoryPdf: async (query: ReportQuery) => {
    const res = await axiosClient.get<Blob>('/reports/inventory/export/pdf', { params: params(query), responseType: 'blob' })
    await downloadResponse(res, 'inventory-report.pdf')
  },
}
