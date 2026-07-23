# Vendor API documentation

Confirmed Vendor Panel API contracts live under [`contracts/`](./contracts/).

Only add a contract file after inspecting the frontend screen and Postman request/response screenshots. Do not invent fields.

Current contracts:

- [`contracts/vendor-auth.md`](./contracts/vendor-auth.md) — Login + Get Me + Logout + session restoration
- [`contracts/vendor-dashboard.md`](./contracts/vendor-dashboard.md) — Dashboard KPIs + period
- [`contracts/vendor-branches.md`](./contracts/vendor-branches.md) — List / Get / Update / Set status / Close all / Open all
- [`contracts/vendor-live-orders.md`](./contracts/vendor-live-orders.md) — Live board Delivery & Pickup + Dine-in
- [`contracts/vendor-scheduled-orders.md`](./contracts/vendor-scheduled-orders.md) — Scheduled board
- [`contracts/vendor-services-orders.md`](./contracts/vendor-services-orders.md) — Services board + calendar
- [`contracts/vendor-order-history.md`](./contracts/vendor-order-history.md) — Orders history + detail + receipt
- [`contracts/vendor-login.md`](./contracts/vendor-login.md) — Login-only notes (superseded by vendor-auth for full auth flow)
