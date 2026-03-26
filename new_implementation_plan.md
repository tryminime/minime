# Local-First + Cloud Sync Implementation Plan

MiniMe currently runs fully locally and has a placeholder cloud sync system (GDrive/OneDrive with AES-256) but it's not wired to real auth or the cloud DBs. This plan completes the architecture in 4 phases, prioritized by dependency order.

## Current State (What Already Exists)

| Component | Status |
|-----------|--------|
| JWT access + refresh tokens | ✅ Fully implemented |
| `sessions` table (device_info, revoked, expires_at) | ✅ Exists in models |
| User tier (free / premium / enterprise) | ✅ In DB and billing |
| AES-256-GCM encryption for backups | ✅ In `cloud_backup.py` |
| GDrive + OneDrive sync | ✅ Implemented but uses `DEMO_USER` placeholder |
| Frontend `localStorage` token storage | ✅ In `auth.ts` |
| Supabase / Upstash / Neo4j AuraDB / Qdrant Cloud | ⚠️ Credentials TBD |
| Remember device / Remember password | ❌ Not implemented |
| Cloud sync gated by tier | ❌ Not implemented |
| Scheduled auto-backup | ❌ Not implemented |
| Cross-device restore on first login | ❌ Not implemented |
| Encrypted export/import for Pro/Enterprise | ❌ Not implemented |

---

## Phase 1 — Auth: Remember Device + Persistent Login
**Priority: Highest — everything else depends on solid auth.**

### What it solves
- App asks for login every time it starts → annoying
- No "remember this device" option
- Refresh token just stored in `localStorage` with no long-lived option

### Backend Changes

#### [MODIFY] [sessions](file:///home/ansari/Documents/MiniMe/backend/models.py)
Add `remember_device` and `device_fingerprint` columns to `Session`:
```sql
ALTER TABLE sessions ADD COLUMN remember_device BOOLEAN DEFAULT FALSE;
ALTER TABLE sessions ADD COLUMN device_fingerprint VARCHAR(255);
ALTER TABLE sessions ADD COLUMN device_name VARCHAR(255);
```
- If `remember_device=true`, refresh token `expires_at` = 90 days (vs 7 days default)
- `device_fingerprint` = hash of OS + machine ID (from Tauri) or browser fingerprint

#### [MODIFY] [auth.py](file:///home/ansari/Documents/MiniMe/backend/api/v1/auth.py) — Login endpoint
Accept `remember_device: bool` in login request body:
```python
class LoginRequest(BaseModel):
    email: str
    password: str
    remember_device: bool = False
    device_name: Optional[str] = None
    device_fingerprint: Optional[str] = None
```
- If `remember_device=True` → set `expires_at = now + 90 days`, save device info on session row
- Return `long_lived: true` flag in response so frontend knows to use secure storage

#### [MODIFY] [jwt_handler.py](file:///home/ansari/Documents/MiniMe/backend/auth/jwt_handler.py)
- Add `create_long_lived_refresh_token()` with 90-day expiry

### Frontend Changes

#### [MODIFY] [auth.ts](file:///home/ansari/Documents/MiniMe/website/src/lib/auth.ts)
- Add `rememberDevice` param to `loginWithEmail()`
- On login with `rememberDevice=true` → store refresh token in `localStorage` + also attempt to write to a cookie with `Secure; HttpOnly; Max-Age=7776000` via a `POST /api/v1/auth/set-cookie` endpoint
- On app startup → check if token is still valid → if fresh access token from refresh token succeeds → skip login entirely

#### [MODIFY] Login Page UI — add "Remember this device" checkbox
- Checked by default for desktop app, unchecked by default for web

### Desktop App Changes (Tauri)

#### [NEW] Desktop secure token store using Tauri's keychain plugin
```rust
// src-tauri/src/keychain.rs
// Store refresh token in OS keychain (libsecret on Linux, Keychain on macOS, Credential Manager on Windows)
tauri::plugin::Store → use tauri-plugin-stronghold or keyring crate
```
- On login → save token to OS keychain with device fingerprint
- On startup → read token from keychain → attempt silent refresh → if success, skip login

---

## Phase 2 — Online Login + Local Operation After
**Priority: High — this is the core "works offline" requirement.**

### What it solves
- Users must be online for **first login** / after logout (to validate credentials)
- After authenticated once on device, works fully locally even when offline

### Architecture

```
┌─────────────────────────────────────────────────────────┐
│                      MiniMe Client                       │
│                                                           │
│  On Startup:                                              │
│   1. Check local keychain/localStorage for refresh token  │
│   2. Try silent refresh (POST /api/v1/auth/refresh)       │
│      ├── Success → use locally, no login needed           │
│      └── Fail (offline / expired) → show login screen     │
│                                                           │
│  On Login:                                                │
│   → Requires internet connection (validates with server)  │
│   → Gets access + refresh tokens                          │
│   → All subsequent API calls go to LOCAL backend          │
└─────────────────────────────────────────────────────────┘
```

### Key Design Decisions
- The **local backend** (FastAPI on :8000) is the primary data store
- The **cloud DBs** are for sync only, not for real-time operation
- Internet is only required for: Login, Token refresh, Sync

### Backend Changes

#### [MODIFY] [api.ts](file:///home/ansari/Documents/MiniMe/website/src/lib/api.ts)
Add offline detection + graceful degradation:
```typescript
// If request fails and offline → queue it for retry
// Activities can be written locally and synced later
```

#### [NEW] `backend/api/v1/auth.py` — `POST /api/v1/auth/verify-offline`
- Check if stored token is still locally valid (sig + expiry check only, no DB call)
- Allows app to confirm "logged in" status without internet

---

## Phase 3 — Cloud Sync for Pro/Enterprise (Core Feature)
**Priority: High — the main revenue-differentiating feature.**

### What it solves
- Pro/Enterprise users can access their data from multiple devices
- Data syncs to cloud DBs on a schedule (not real-time to keep app fast)
- Free users get local-only (no sync)

### Sync Architecture

```
Local PostgreSQL ──────────────────────────────────────────────────────────────────────────┐
Local Redis ─────────────────────────────────────────────────────────────────────────────── ├── Synced to → Supabase / Upstash / Neo4j AuraDB / Qdrant Cloud (Pro/Enterprise only)
Local Neo4j (docker) ──────────────────────────────────────────────────────────────────────┘
Local Qdrant (docker) ─────────────────────────────────────────────────────────────────────┘
```

### Sync Schedule Options (user-configurable)
| Frequency | Description |
|-----------|-------------|
| Daily (default) | Once per day at a configurable time |
| Twice daily | 12h intervals |
| Weekly | Every 7 days |
| Bi-weekly | Every 14 days |
| Monthly | Once per month |

### Backend Changes

#### [NEW] `backend/services/cloud_sync_service.py`
Central sync manager:
```python
class CloudSyncService:
    async def sync_to_cloud(user_id, tier) -> SyncResult
    async def restore_from_cloud(user_id) -> RestoreResult
    async def get_sync_status(user_id) -> SyncStatus
    async def schedule_next_sync(user_id, frequency) -> datetime
```

**What gets synced per database:**

| Cloud DB | What It Stores | Local Source |
|----------|----------------|--------------|
| Supabase (PostgreSQL) | activities, entities, users, goals, content_items | Local PostgreSQL |
| Upstash (Redis) | Session cache, rate limits, real-time state | Local Redis |
| Neo4j AuraDB | Knowledge graph nodes + relationships | Local Neo4j |
| Qdrant Cloud | Vector embeddings for content | Local Qdrant |

#### [NEW] `backend/api/v1/sync.py` — new sync endpoints (replaces placeholder cloud_backup.py)
```
GET  /api/v1/sync/status                → sync status + last sync time
POST /api/v1/sync/trigger               → manual sync now (Pro/Enterprise only)
GET  /api/v1/sync/schedule              → get current schedule
PUT  /api/v1/sync/schedule              → update schedule
POST /api/v1/sync/restore               → restore from cloud to local
GET  /api/v1/sync/history               → list of past syncs
```

#### [MODIFY] `billing.py` — Update PLAN_LIMITS
```python
PLAN_LIMITS = {
    "free":       { "cloud_sync": False, "sync_frequency": None,      "export": False },
    "pro":        { "cloud_sync": True,  "sync_frequency": "daily",    "export": True  },
    "enterprise": { "cloud_sync": True,  "sync_frequency": "realtime", "export": True  },
}
```

#### [NEW] `backend/tasks/sync_scheduler.py`
- Celery task that runs on schedule (APScheduler or Celery Beat)
- Checks each user's sync schedule → triggers sync if due
- Stores `last_synced_at` and `next_sync_at` in user preferences JSONB

### Frontend Changes

#### [NEW] Settings → Sync Tab UI
- Show sync status (last synced, next sync)
- Frequency picker (daily / twice daily / weekly / 14 days / monthly)
- Manual "Sync Now" button
- "Restore from Cloud" button
- Show which cloud DBs are connected

#### [NEW] `useSync` hook
```typescript
// Fetches sync status, triggers manual sync, shows progress
```

---

## Phase 4 — Encrypted Export/Import + Cross-Device Restore
**Priority: Medium-High — completes the multi-device story.**

### What it solves
- Pro/Enterprise users can download all data as encrypted file
- Can restore to a new device by logging in (triggers automatic restore from cloud)
- Encryption key derived from user's login credentials → data unreadable without proper login

### Encryption Design

```
Encryption key = PBKDF2-HMAC-SHA256(
    password = user_password,
    salt     = user_id + device_fingerprint,
    iterations = 310000,   # OWASP recommended
    dklen    = 32          # AES-256 key
)
```
- Export file is AES-256-GCM encrypted
- Can only be decrypted after login with correct credentials
- File contains: all activities, entities, goals, knowledge graph data, settings

### Backend Changes

#### [NEW] `backend/api/v1/export.py`
```
POST /api/v1/export/download     → stream encrypted .mmexport file (Pro/Enterprise)
POST /api/v1/export/restore      → upload + decrypt .mmexport file
GET  /api/v1/export/status       → export job status (async for large datasets)
```

#### Export file format (`.mmexport`)
```json
{
  "version": "1.0",
  "user_id": "...",
  "exported_at": "...",
  "schema_version": "...",
  "encrypted_payload": "<base64-AES-256-GCM>"
}
```

### Cross-Device Restore Flow

```
New Device Login:
  1. User logs in (online required)
  2. Backend checks: has this user synced to cloud before?
     ├── Yes → prompt "Restore from cloud? (last backup: X time ago)"
     │         → User accepts → all 4 cloud DBs pulled to local
     └── No  → fresh start
```

#### [MODIFY] `backend/api/v1/auth.py` — post-login hook
After successful login on a new device, return `has_cloud_backup: bool` and `last_backup_at` in auth response.

### Frontend Changes

#### [NEW] First-Login Restore Dialog
- After login, if `has_cloud_backup=true` → show overlay:
  > *"We found a backup from [date]. Restore your data?"*
  > [Restore Now] [Start Fresh]

#### [NEW] Settings → Export Tab
- "Download all my data" button → triggers export job → download `.mmexport`
- "Restore from file" → upload `.mmexport` → server decrypts + imports

---

## Implementation Order (Prioritized)

| Phase | Feature | Estimated Effort | Impact |
|-------|---------|-----------------|--------|
| **1** | Remember device + persistent login (Keychain, long-lived refresh token) | 2–3 days | 🔥 Daily UX |
| **2** | Online-required first login, offline operation after | 1–2 days | 🔥 Core feature |
| **3a** | Tier gating: block sync for free users | 1 day | 💰 Monetization |
| **3b** | Cloud sync service (Supabase/Upstash/Neo4j/Qdrant) | 3–5 days | 💰 Monetization |
| **3c** | Sync scheduler (configurable frequency) | 2 days | UX |
| **3d** | Sync UI in Settings | 2 days | UX |
| **4a** | Cross-device restore on new device login | 2–3 days | Multi-device |
| **4b** | Encrypted export/import (.mmexport) | 2–3 days | Data control |

---

## User-Visible Feature Matrix

| Feature | Free | Pro ($19/mo) | Enterprise ($99/mo) |
|---------|------|-------------|---------------------|
| Works locally | ✅ | ✅ | ✅ |
| Online-required for login | ✅ | ✅ | ✅ |
| Remember device (90 days) | ✅ | ✅ | ✅ |
| Cloud sync | ❌ | ✅ | ✅ |
| Sync frequency choice | ❌ | Daily–Monthly | Any + real-time |
| Multi-device access | ❌ | ✅ | ✅ |
| Cross-device restore | ❌ | ✅ | ✅ |
| Encrypted data export | ❌ | ✅ | ✅ |
| Bulk data restore | ❌ | ✅ | ✅ |

---

## Security Notes

> [!IMPORTANT]  
> - Refresh tokens for remembered devices must be stored in OS keychain (Tauri: `tauri-plugin-stronghold` or `keyring` crate), NOT plain localStorage
> - Export encryption key must be derived from user credentials at decryption time — never stored anywhere
> - Cloud sync tokens (Supabase connection strings etc.) stored encrypted in user preferences JSONB
> - All sync traffic must be over HTTPS only

> [!WARNING]
> The existing `cloud_backup.py` uses `DEMO_USER` placeholder — it must be updated to use real auth (`get_current_user`) before Phase 3 can go live. This is the **first code change** in Phase 3.

## Verification Plan

### Automated Tests
```bash
# Test remember-device token lifetime
pytest backend/tests/test_auth.py::test_remember_device_token_expiry

# Test tier gating on sync endpoints  
pytest backend/tests/test_sync.py::test_free_user_cannot_sync
pytest backend/tests/test_sync.py::test_pro_user_can_sync

# Test export encryption round-trip
pytest backend/tests/test_export.py::test_encrypt_decrypt_export
```

### Manual Verification
1. Login → check "Remember this device" → close app → reopen → should not ask for login
2. Go offline → all dashboard features work → come back online → sync resumes
3. Upgrade to Pro → Sync tab appears in Settings → trigger manual sync
4. Login on second device → restore dialog appears → confirm data matches

