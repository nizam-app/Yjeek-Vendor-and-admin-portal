# Admin Settings — GET / PATCH

Confirmed from Postman **13. Settings** (2026-08-02).

## Feature flag

`settings` in `VITE_ADMIN_REAL_API_FEATURES` (also on when `VITE_ADMIN_USE_MOCK_API=false`).

UI: Admin → Settings (`/admin/settings`). Save changes PATCHes the active tab.

## Get all settings

| Field | Value |
| --- | --- |
| Method | `GET` |
| Path | `/admin/settings` |
| Registry | `endpoints.admin.settings.root` |

Confirmed root fields: versions, RPI targets, SLA seconds/minutes, `updatedAt`, `tabs[]`.

## Get / Patch General

| | |
| --- | --- |
| GET/PATCH | `/admin/settings/general` |
| Registry | `endpoints.admin.settings.general` |

### PATCH body

```json
{
  "companyName": "Yjeek",
  "supportEmail": "support@yjeek.com",
  "supportPhone": "+973 1700 0000",
  "timeFormat": "24h",
  "maintenanceMode": false
}
```

| UI | API |
| --- | --- |
| Company name | `companyName` |
| Support email | `supportEmail` |
| Support phone | `supportPhone` |
| Time format | `24-hour` / `12-hour` ↔ `24h` / `12h` |
| Maintenance mode | `maintenanceMode` |
| App version | read-only (from GET / settings root); not sent on PATCH |

## Get / Patch Localization

| | |
| --- | --- |
| GET/PATCH | `/admin/settings/localization` |
| Registry | `endpoints.admin.settings.localization` |

### PATCH body (confirmed)

```json
{
  "activeCountries": ["BH"],
  "defaultCountry": "BH",
  "timezone": "Asia/Bahrain",
  "currency": "BHD",
  "languages": ["en", "ar"],
  "rtlSupport": true,
  "commission": {
    "defaultCommissionPct": 12,
    "onlineGatewayFeePct": 2.5,
    "vatPct": 10,
    "payoutCycle": "weekly",
    "minPayout": 10,
    "payoutDay": "sunday"
  }
}
```

| UI | API |
| --- | --- |
| Active / default country | name ↔ ISO code (`Bahrain` ↔ `BH`) |
| Timezone | UI label stripped to IANA id |
| Languages | `English`/`العربية` ↔ `en`/`ar` |
| Commission / fees / VAT | `commission.*` |
| Distance unit, date format | UI-only (not in PATCH body) |

## Get / Patch Notifications

| | |
| --- | --- |
| GET/PATCH | `/admin/settings/notifications` |

### PATCH body

```json
{
  "channels": { "push": true, "sms": true, "email": true, "inApp": true },
  "operational": { "incidentEscalation": true, "dailySummaryEmail": true }
}
```

| UI | API |
| --- | --- |
| Channel toggles | `channels.*` |
| Incident escalation | `operational.incidentEscalation` |
| Daily summary email | `operational.dailySummaryEmail` |

## Get / Patch Security

| | |
| --- | --- |
| GET/PATCH | `/admin/settings/security` |

### PATCH body

```json
{
  "enforce2FA": true,
  "passwordPolicy": "strong_12",
  "sessionTimeoutMin": 30,
  "auditLogRetentionMonths": 12,
  "ipAllowlist": "disabled",
  "loginAlerts": true
}
```

| UI | API |
| --- | --- |
| Enforce 2FA | `enforce2FA` |
| Password policy | label ↔ `strong_12` / `medium_8` / `basic_6` |
| Session timeout | label ↔ minutes |
| Audit retention | label ↔ months |
| IP allowlist | `Disabled`/`Enabled` ↔ `disabled`/`enabled` |
| Login alerts | `loginAlerts` |

## Not wired yet

- GET integrations / PATCH Update (flat + sections)
- POST reset, GET meta
