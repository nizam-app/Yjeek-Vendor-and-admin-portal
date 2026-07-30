# Admin API documentation

Confirmed Admin Panel API contracts live under [`contracts/`](./contracts/).

Only add a contract file after inspecting the frontend screen and Postman request/response screenshots. Do not invent fields.

Feature-scoped real APIs use `VITE_ADMIN_REAL_API_FEATURES` (see `.env.example`). Keep `VITE_ADMIN_USE_MOCK_API=true` for all other Admin screens.

Current contracts:

- [`contracts/admin-auth.md`](./contracts/admin-auth.md) — Login + Get Me + Logout (confirmed). 2FA Verify pending screenshots.
- [`contracts/admin-vendors-list.md`](./contracts/admin-vendors-list.md) — Vendor Management list + KPIs + filters.
- [`contracts/admin-vendors-detail.md`](./contracts/admin-vendors-detail.md) — Vendor detail Overview (Get vendor).
- [`contracts/admin-vendors-store-update.md`](./contracts/admin-vendors-store-update.md) — PATCH update store info.
- [`contracts/admin-vendors-create.md`](./contracts/admin-vendors-create.md) — POST create vendor (Add vendor wizard) + activate.
- [`contracts/admin-users-list.md`](./contracts/admin-users-list.md) — List users + summary KPIs + filters.
- [`contracts/admin-users-detail.md`](./contracts/admin-users-detail.md) — Get user detail (permissions + activity).
- [`contracts/admin-users-meta.md`](./contracts/admin-users-meta.md) — Create-user meta (permission modules).
- [`contracts/admin-users-create.md`](./contracts/admin-users-create.md) — POST create user (invite).
- [`contracts/admin-users-actions.md`](./contracts/admin-users-actions.md) — PATCH update + reset password + suspend / unsuspend.
- [`contracts/admin-activity.md`](./contracts/admin-activity.md) — Activity log list + meta filters + CSV export.
- [`contracts/admin-roles.md`](./contracts/admin-roles.md) — Roles meta + list + get role.
- [`contracts/admin-vendors-force-close.md`](./contracts/admin-vendors-force-close.md) — Force close store.
- [`contracts/admin-vendors-reopen.md`](./contracts/admin-vendors-reopen.md) — Reopen / Resume after force close.
- [`contracts/admin-vendors-suspend.md`](./contracts/admin-vendors-suspend.md) — Suspend / Unsuspend vendor.
- [`contracts/admin-vendors-branches.md`](./contracts/admin-vendors-branches.md) — List + create vendor branches.
- [`contracts/admin-vendors-branch-update.md`](./contracts/admin-vendors-branch-update.md) — PATCH update branch.
- [`contracts/admin-vendors-branch-delete.md`](./contracts/admin-vendors-branch-delete.md) — DELETE branch.
- [`contracts/admin-vendors-staff.md`](./contracts/admin-vendors-staff.md) — List + create vendor staff.
- [`contracts/admin-vendors-delivery-zones.md`](./contracts/admin-vendors-delivery-zones.md) — Delivery zones GET + apply-all.
- [`contracts/admin-vendors-commission.md`](./contracts/admin-vendors-commission.md) — Commission & fees GET + PATCH.
- [`contracts/admin-vendors-promotions.md`](./contracts/admin-vendors-promotions.md) — Vendor promotions list + create + get.
- [`contracts/admin-vendors-sla.md`](./contracts/admin-vendors-sla.md) — Vendor SLA GET (rules + VPI; compliance when present).
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
- [`contracts/admin-order-dispatch-attempts.md`](./contracts/admin-order-dispatch-attempts.md) — List dispatch attempts (order evidence).
- [`contracts/admin-order-redispatch.md`](./contracts/admin-order-redispatch.md) — Redispatch order modal.
- [`contracts/admin-order-refund.md`](./contracts/admin-order-refund.md) — Refund modal.
- [`contracts/admin-order-cancel.md`](./contracts/admin-order-cancel.md) — Cancel order modal.
- [`contracts/admin-order-suspend-champ.md`](./contracts/admin-order-suspend-champ.md) — Suspend champ from order.
- [`contracts/admin-order-flag-vendor.md`](./contracts/admin-order-flag-vendor.md) — Flag vendor modal.

Mapping overview: [`admin-api-map.md`](./admin-api-map.md)
