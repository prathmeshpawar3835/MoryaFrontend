# Backend API gaps

The React frontend was built against the existing GramShopPOS ASP.NET Core API. Backend files were not modified. Features that could not be fully implemented, or that only have a partial backend contract, are listed below.

| Feature | Required API | Existing API status | What is missing | Recommended endpoint |
| --- | --- | --- | --- | --- |
| In-app notifications | Notification inbox for the top nav | Not found | No notification list or unread count | `GET /api/notifications` |
| Product status filter | Filter products by active/inactive with paging | `GET /api/products` supports `search`, `categoryId`, `lowStockOnly` | No `isActive` query parameter | Add `isActive` to `ProductListRequest` |
| Bill payment-mode filter | Filter bill history by Cash/UPI/Card/Credit | `GET /api/bills` supports `status`, `customerId`, dates, store | No `paymentMode` query parameter | Add `paymentMode` to `BillListRequest` |
| Customer status filter | Filter customers by active flag | `GET /api/customers` uses shared paging | No `isActive` query parameter | Add `isActive` to `PagedRequest` or customer list DTO |
| Dedicated customer ledger list (all customers) | Browse ledgers without opening a customer | Ledger is per customer: `GET /api/customers/{id}/ledger` | No global ledger index | Optional `GET /api/ledgers` |
| Last payment date on dues | Dues table “last payment” column | `GET /api/reports/customer-dues` | DTO has no last payment date; `agingDays` is always `0` | Add `lastPaymentDate` and real aging |
| Referral details / redeem UI | Referral detail and reward redeem screens | `GET /api/referrals` list only | No get-by-id; wallet redeem exists on customer (`POST /api/customers/{id}/wallet/redeem`) | `GET /api/referrals/{id}` |
| Store-wise sales chart | Dashboard chart by store | `GET /api/dashboard` | Has sales trend and payment modes, not a store-wise series | Add `storeSales` to dashboard DTO |
| Logo upload | Upload shop logo from business profile | Settings store `logoPath` as a string | No file upload API | `POST /api/settings/logo` |
| Invoice thermal layout from API | 80mm / 58mm templates from server | `GET /api/bills/{id}/invoice` + PDF | PDF is A4-style from QuestPDF; frontend print CSS can approximate thermal | Optional `?format=thermal80` |
| Report Excel/PDF for purchases, returns, referrals, profit | Export buttons on every report | Excel: sales, inventory, customers, product-sales. PDF: sales, inventory | No export for purchases, returns, referrals, profit | Mirror existing `/export/excel` and `/export/pdf` routes |
| Fine-grained permissions | PermissionProtectedRoute per screen | Roles only: `Admin`, `SalesPerson` | No permission claims beyond role + store ids | Optional permission set on users |
| Forgot password email | Email delivery of reset token | `POST /api/auth/forgot-password` returns a development token in Development | No email sender | Keep current API; add SMTP later |
| Held bill customer name | Held bills table customer column | `HeldBillDto` has `customerId` only | No customer name on held DTO | Add `customerName` to `HeldBillDto` |
| Stock ledger user column | Show which user moved stock | `StockMovement` DTO has no user name | User not returned | Add `createdBy` to ledger DTO |
| Category paging | Server-side category pagination | `GET /api/categories` returns the full list | No paging | Optional paged categories |

## Implemented on the frontend using existing APIs

Login, logout, me, change/forgot/reset password, dashboard, POS (search, barcode, cart, split/credit/wallet, hold/resume, complete), invoices, invoice PDF download, bill cancel, products CRUD + soft deactivate, Excel preview/confirm/template, categories, stock/stock-in/adjust/transfer/ledger, purchases list, customers CRUD, ledger + ledger PDF, dues (report API), wallet, referrals list, returns, exchanges, reports (including profit for Admin), settings (single GET/PUT covering billing, tax, referral, business), stores, users, audit logs.

## Notes

- Invoice PDF is downloaded from `GET /api/bills/{id}/invoice/pdf` (real file, not a fake blob).
- Print uses browser print CSS plus that PDF download.
- Dashboard figures come only from `GET /api/dashboard`.
- POS totals shown before complete are a preview that matches `BillCalculator`; the API is authoritative after `POST /api/pos/bills`.
