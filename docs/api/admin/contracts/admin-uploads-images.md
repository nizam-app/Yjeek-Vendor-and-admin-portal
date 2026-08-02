# Admin uploads — images

Confirmed: `POST /admin/uploads/images` for UI Editor banner image upload (2026-08-02).

## Endpoint

| Field | Value |
| --- | --- |
| Method | `POST` |
| Path | `/admin/uploads/images` |
| Auth | Bearer Admin access token |
| Content-Type | `multipart/form-data` (browser sets boundary) |
| File field | `file` |
| Registry | `endpoints.admin.uploads.images` |
| Service | `adminUploadService.uploadImage(file)` |

## Success

```json
{
  "success": true,
  "data": {
    "url": "https://cdn.example.com/path/image.webp"
  }
}
```

Mapped as `data.url` → banner form `imageUrl`.

## Client validation

- Types: JPEG, PNG, WebP
- Max size: 5 MB (`ADMIN_IMAGE_UPLOAD_MAX_BYTES`)

## Banner create / update

Include returned URL as:

```json
{ "imageUrl": "https://cdn.example.com/path/image.webp" }
```

Do not send `blob:` or `data:` URLs.
