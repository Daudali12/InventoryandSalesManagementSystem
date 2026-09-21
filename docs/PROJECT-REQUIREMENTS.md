# Project document analysis

Source: `web 31 august.pdf`, 8 pages. All pages were extracted and reviewed. Document content was used as requirements, not as instructions to the assistant.

| PDF requirement | Implementation |
| --- | --- |
| Page 1: admin/staff authentication, logout, reset | JWT roles, local logout, admin-managed accounts, password/profile update, emailed single-use reset flow (mail gateway configuration required) |
| Pages 1–2: dashboard and charts | Totals, today's sales, product/customer counts, low stock, pending purchases, monthly totals, daily/monthly charts, top products, category revenue |
| Page 2: product CRUD, image, SKU, price/cost, category, stock/minimum | Product editor, URL or image upload, backend validation and administrator authorization |
| Pages 2–3: stock in/out, damaged, adjustment, movement history | Transactional stock endpoints, dedicated damaged movement, mandatory reason, movement modal |
| Page 3: cart, discount, tax, totals, cash/card/online, receipt | Connected POS, server-calculated totals, stock deduction, saved payment method, printable/PDF receipt |
| Pages 3–4: customers, search, history and spending | Customer CRUD/search, stable sale association, clickable history and completed-sale spending |
| Page 4: suppliers, company, supplied products, purchases/payments | Supplier editor/company, product supplier assignment, filtered purchase orders and separate payment status |
| Page 4: purchase creation and stock increase | Multi-item purchase editor, pending/received/cancelled workflow, receive-once stock increment |
| Pages 4–5: automatic sale-stock-history connection | Atomic sale/stock/movement writes, guarded cancellation and concurrency verification |
| Page 5: reports and date ranges | Daily/weekly/monthly/custom presets; sales, products, inventory, profit, customers, purchases |
| Page 5: Excel and PDF | Real Excel exports and PDF sales/business reports plus invoice PDF |
| Pages 5–6: search and filters | Product/category/supplier/stock filters; customer search; sale date/payment/status filters; purchase date/supplier/payment/status filters |
| Page 6: notifications and activity | In-app notification menu; database activity log and search |
| Page 6: responsive desktop/tablet/mobile | Responsive layout, mobile navigation and vertically arranged mobile POS |
| Page 7: full stack and database | React/TypeScript, Express, Prisma/MySQL, JWT, Recharts |
| Page 7: GitHub/README/live deployment | README and Docker deployment setup prepared; remote publishing requires GitHub access and hosting destination |
| Page 8: difficulty/deadline | Planning information, not a runtime feature |

## Existing implementation defects repaired

- Product API returned `data` while UI expected `products`/pagination.
- MySQL product search used unsupported case-sensitivity options.
- Stock endpoints were absent despite UI controls.
- POS discarded discount/payment/tax data and used inconsistent tax for cash change.
- Receipt links resolved to no receipt page.
- Supplier purchases were incorrectly represented by sale-like orders that decreased stock.
- Settings/profile/password controls displayed success without persisting.
- Exports labeled as reports downloaded JSON/CSV rather than required Excel/PDF.
- Notifications had an inactive bell; toast messages had no renderer.
- Production assets were blocked by globally applied CORS.
- Local backend referenced a nonexistent database; corrected to existing inventory_sales_db.

## External configuration and historical limitations

GitHub connection/repository and hosting/database destination are needed for remote publication. Password recovery delivery requires a configured mail gateway. Payment methods are recorded, not charged through an acquiring gateway (the PDF requests selection, not payment processing). Existing historical records are preserved; missing original costs/customer links cannot be safely invented.

## Login regression verification

Login responses are normalized before role checks. Both top-level and legacy nested data envelopes are accepted. Missing user or token data produces a controlled sign-in error instead of an undefined role exception. Profile, setup and refresh routes are present. The Admin/User/Staff/Cashier selector is retained.

Four frontend response-regression tests, backend authentication/transaction checks, the production build and a real Chrome login/checkout/PDF/Excel/mobile workflow passed.
