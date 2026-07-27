# Admin API documentation

Confirmed Admin Panel API contracts live under [`contracts/`](./contracts/).

Only add a contract file after inspecting the frontend screen and Postman request/response screenshots. Do not invent fields.

Feature-scoped real APIs use `VITE_ADMIN_REAL_API_FEATURES` (see `.env.example`). Keep `VITE_ADMIN_USE_MOCK_API=true` for all other Admin screens.

Current contracts:

- [`contracts/admin-auth.md`](./contracts/admin-auth.md) — Login + Get Me + Logout (confirmed). 2FA Verify pending screenshots.
- [`contracts/admin-dashboard-overview.md`](./contracts/admin-dashboard-overview.md) — Dashboard Full Overview KPIs + bucket counts.
- [`contracts/admin-dashboard-map.md`](./contracts/admin-dashboard-map.md) — Live map (`layer=champs` confirmed; orders/vendors same path).
- [`contracts/admin-dashboard-live-orders.md`](./contracts/admin-dashboard-live-orders.md) — Live Orders board columns + cards.
- [`contracts/admin-dashboard-scheduled-board.md`](./contracts/admin-dashboard-scheduled-board.md) — Scheduled Orders pipeline board.
- [`contracts/admin-dashboard-pickup-board.md`](./contracts/admin-dashboard-pickup-board.md) — Pickup board (Incident / On Track).
- [`contracts/admin-dashboard-dine-in-board.md`](./contracts/admin-dashboard-dine-in-board.md) — Dine-in board (Incident / On Track).
- [`contracts/admin-dashboard-services-board.md`](./contracts/admin-dashboard-services-board.md) — Services board (Incident / On Track).
- [`contracts/admin-dashboard-incidents.md`](./contracts/admin-dashboard-incidents.md) — Legacy dashboard incidents feed (superseded for UI by list).
- [`contracts/admin-incidents-list.md`](./contracts/admin-incidents-list.md) — List incidents (`GET /admin/incidents`) → Incidents Log.
- [`contracts/admin-dashboard-chats.md`](./contracts/admin-dashboard-chats.md) — Open chats strip.
- [`contracts/admin-chat-conversation.md`](./contracts/admin-chat-conversation.md) — Get conversation + mark read + send message.
- [`contracts/admin-order-detail.md`](./contracts/admin-order-detail.md) — Get order detail modal.
- [`contracts/admin-order-action-options.md`](./contracts/admin-order-action-options.md) — Action options catalog + take-action POSTs.
- [`contracts/admin-order-nearby-champs.md`](./contracts/admin-order-nearby-champs.md) — Nearby champs + Reassign champ.

Mapping overview: [`admin-api-map.md`](./admin-api-map.md)
