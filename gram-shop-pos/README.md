# Gram Shop POS — React frontend

Production React frontend for the existing **Gram Shop POS** ASP.NET Core Web API. This project does not talk to SQL Server. All data comes from REST APIs.

```text
React + TypeScript
        ↓
Axios / TanStack Query
        ↓
Existing ASP.NET Core REST API
        ↓
Existing SQL Server
```

## Requirements

- Node.js 20 or later
- npm 10 or later
- Running GramShopPOS backend (HTTP `http://localhost:5088` or HTTPS `https://localhost:7088`)

## Installation

```bash
cd Frontend/gram-shop-pos
npm install
```

## Environment configuration

Copy `.env.example` to `.env` if needed.

```env
VITE_API_BASE_URL=http://localhost:5088/api
```

Use HTTPS if that is how you host the API:

```env
VITE_API_BASE_URL=https://localhost:7088/api
```

The Vite dev server also proxies `/api` to `http://localhost:5088`. CORS on the backend already allows `http://localhost:5173`.

## Running the development server

Start the ASP.NET Core API first, then:

```bash
npm run dev
```

Open `http://localhost:5173`.

## Production build

```bash
npm run build
npm run preview
```

## Authentication

The frontend uses the existing JWT APIs:

- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/me`
- `POST /api/auth/change-password`
- `POST /api/auth/forgot-password`
- `POST /api/auth/reset-password`

The access token is stored in `localStorage` and sent as `Authorization: Bearer`. A 401 clears the session and returns to `/login`.

Development seed users (created by the API, not by this frontend):

- `admin` / `ChangeMe@123`
- `salesperson` / `ChangeMe@123`

Both seeded users may require a password change on first login (`mustChangePassword`).

## Roles

| Role | UI access |
| --- | --- |
| Admin | All screens, all assigned stores, settings, users, profit report, stock adjust/transfer, product import |
| SalesPerson | POS, bills, catalog view, stock in, customers, returns, reports except profit |

The API remains the authority. Hidden menus are UI-only.

## Frontend routes

| Path | Screen |
| --- | --- |
| `/login` | Sign in |
| `/forgot-password` | Forgot password |
| `/reset-password` | Reset password |
| `/dashboard` | Dashboard |
| `/pos` | POS billing |
| `/pos/held` | Held bills |
| `/bills` | Bill history |
| `/bills/:id` | Invoice |
| `/products` | Product list |
| `/products/create` | Create product |
| `/products/edit/:id` | Edit product |
| `/products/import` | Excel import |
| `/categories` | Categories |
| `/inventory/stock` | Stock |
| `/inventory/stock-in` | Stock in |
| `/inventory/adjustment` | Adjustment (Admin) |
| `/inventory/transfer` | Transfer (Admin) |
| `/inventory/ledger` | Stock ledger |
| `/customers` | Customers |
| `/customers/:id` | Profile |
| `/customers/:id/ledger` | Ledger |
| `/customers/dues` | Dues |
| `/returns` | Returns |
| `/referrals` | Referrals |
| `/reports/*` | Reports |
| `/settings/*` | Admin settings |

## API integration

Axios lives in `src/api/axiosClient.ts`. JSON responses are unwrapped from `{ success, message, data, errors }`. PDF and Excel downloads use `responseType: 'blob'` and the real file from the API.

Enums are sent as numbers, matching the backend (no string enum converter).

## POS shortcuts

- F2 product search
- F4 customer
- F8 / F10 payment
- F9 hold
- Esc close dialog

## Troubleshooting

**Cannot reach the API**  
Confirm the backend is running and `VITE_API_BASE_URL` ends with `/api`.

**CORS errors**  
Use `http://localhost:5173` or add your origin to `Cors:AllowedOrigins` in the API `appsettings`.

**401 immediately after login**  
Token not stored, or API JWT clock/key mismatch. Check browser storage for `gramshop.token`.

**HTTPS certificate warnings**  
Prefer the HTTP launch profile (`http://localhost:5088`) during local development.

**Empty dashboard / empty lists**  
Normal for a fresh database. Seeded catalog may exist depending on API seed data. Numbers are never mocked in the UI.
