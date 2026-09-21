# Inventory & Sales Management System

Full-stack React, TypeScript, Express, Prisma and MySQL application based on all 8 pages of `web 31 august.pdf`.

## Run locally

Requires Node.js 20.19+ (or 22+) and MySQL/MariaDB. Start MySQL in XAMPP.

1. Copy `backend/.env.example` to `backend/.env`. Set database credentials and independent random JWT secrets. Use your existing database when upgrading; do not reset it.
2. In `backend`, run `npm ci`, then `npm run db:setup`. This creates/synchronizes the database schema and generates Prisma. Review schema changes before applying to a production database.
3. In `frontend`, run `npm ci` then `npm run build`.
4. In `backend`, run `npm start` and open **http://localhost:5000/login**.
5. On an empty database, First-time setup creates the first administrator. Thereafter, administrators create staff/manager accounts in Settings. Existing accounts and data are retained on upgrade.

For development, run `npm run dev` in each folder. Open http://localhost:5173. Vite proxies `/api` to port 5000. The backend serves the built frontend in production; client routes are supported directly.

## Workflows

- Admin: products with images/SKU/cost/category/supplier, categories, suppliers, customers, purchases, reports, settings and staff accounts.
- Staff: POS, product browsing, sales history/receipts and inventory adjustments. Management pages have route guards; API writes also enforce permissions. Manager is an additional management role; account administration and product editing remain admin-only.
- Inventory: stock in, stock out, damaged stock and absolute count adjustments with mandatory reasons and movement history. Opening stock and edits are logged.
- POS: customer selection, product search, quantity changes, discounts, configured tax, cash/card/online payment recording, stock deduction, sales history and printable/PDF receipts. Payment methods record how a payment was collected; no card acquiring or online gateway is integrated.
- Purchases: choose supplier, date, products, quantities and costs. New orders are pending. Receive once to increase stock, or cancel while pending. Track unpaid/partial/paid separately.
- Reports: daily/weekly/monthly/custom date ranges, daily/monthly charts, top products, category revenue, sales, current inventory, customer spending, purchases and profit. Excel and PDF downloads are actual `.xlsx`/`.pdf` files.
- Customer history uses stable customer IDs selected at checkout. Legacy sales without customer IDs are preserved, not guessed by customer name.
- In-app alerts show low stock, completed sales and received purchases. Activity log records important new actions. Password/profile changes persist.

## Integrity and historical data

Sale creation, cancellation, stock adjustment and purchase receipt use database transactions. Conditional updates prevent overselling and repeated stock restoration/receipt. Invalid/negative/fractional quantities and excess discounts are rejected. Prices and tax are validated server-side; cost snapshots are captured at sale time.

Legacy sales created before this implementation have no cost snapshot. Profit is explicitly unavailable when a report includes those records; original cost cannot be recovered reliably from today's product cost. Historic tax, payment and customer associations cannot be reconstructed automatically. UTC boundaries are used for date-range reports. The activity log starts with actions recorded by this implementation.

## Password recovery

Configure `MAIL_GATEWAY_URL`, `MAIL_GATEWAY_TOKEN` and `FRONTEND_URL`. The gateway must accept an authenticated JSON POST `{ "to": "...", "subject": "...", "text": "..." }` and deliver email. Recovery tokens are stored hashed, expire after 30 minutes and can be used once. Without a configured gateway, the screen reports that recovery email is unavailable. It never falsely reports a successful email send.

## Verification

```text
cd backend
npm test
npm run test:integration
cd ../frontend
npm test
npm run build
```

Integration tests need the configured local database. They create unique temporary fixtures and remove only those fixtures. They cover role checks, sale totals, customer linkage, stock changes, purchase receipt, simultaneous checkout/cancellation, reporting and reset-token reuse. Do not point verification scripts at a public production database.

`backend/tests/browser.cjs` uses an installed Playwright module (`PLAYWRIGHT_MODULE` can specify its path) and headless Chrome to inspect all application routes and desktop/mobile layouts. `backend/tests/browser-workflow.cjs` additionally verifies login, real checkout/stock deduction, receipt PDF, Excel export and mobile catalog visibility with temporary fixtures. Browser previews are generated under `docs/` and excluded from Git.

## Deployment

A Dockerfile builds and serves the complete application. Provide a persistent external MySQL database, the environment settings above, and HTTPS through your hosting provider. Build with `docker build -t inventory-sales .`; run with the environment file and port 5000. Apply `npm run db:setup` as a controlled release step before starting a new deployment. Back up the database before schema changes.

Do not use the optional historical seed script on a real store; it adds demo accounts/data. There is no automatic destructive data reset or pretend backup toggle.

GitHub publication requires access to the destination repository. Live deployment additionally requires a selected hosting project and database connection. Neither a repository nor a live URL has been created by the local setup.

See [document analysis](docs/PROJECT-REQUIREMENTS.md) for the PDF-to-implementation checklist.
