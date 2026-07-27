# Admin Chats — Conversation thread

Confirmed from Postman response screenshots.

## Get conversation

| Field | Value |
| --- | --- |
| Method | `GET` |
| Relative path | `/admin/chats/:conversationId` |
| Auth | Bearer Admin access token |
| Registry | `endpoints.admin.chats.conversation(id)` |
| Feature flag | `dashboard` |
| UI | Floating `AdminChatPanel` |

### Confirmed `data` fields

| Field | UI use |
| --- | --- |
| `id` | conversation id |
| `orderId` / `orderNumber` / `orderStatus` | header order label |
| `vendorName` | stored |
| `customer` `{ id, name }` | peer when customer chat |
| `champ` `{ id, name }` | peer when champ chat |
| `messages[]` | thread bubbles |

### Message item

| Field | UI |
| --- | --- |
| `id` | key |
| `senderRole` | `ADMIN` → own (right); `CUSTOMER` / `DRIVER` / `SYSTEM` → left |
| `body` | bubble text |
| `timeLabel` | timestamp under bubble |
| `createdAt` / `senderId` | stored |

## Mark chat read

| Field | Value |
| --- | --- |
| Method | `POST` |
| Path | `/admin/chats/:conversationId/read` |
| Body | none |

### Confirmed success

```json
{
  "success": true,
  "data": {
    "conversationId": "<id>",
    "read": true,
    "lastAdminReadAt": "<iso>"
  }
}
```

Called when the panel opens; clears unread on the open-chats strip.

## Send chat message

| Field | Value |
| --- | --- |
| Method | `POST` |
| Path | `/admin/chats/:conversationId/messages` |
| Body | `{ "body": "<text>" }` |
| Success | HTTP 201 |

### Confirmed response `data`

`id`, `senderRole` (`ADMIN`), `senderId`, `body`, `createdAt`, `timeLabel`

Appended to the thread as an own bubble.

## App wiring

```
AdminChatPanel
  → adminChatService.getConversation
  → adminChatService.markRead
  → adminChatService.sendMessage({ body })
```
