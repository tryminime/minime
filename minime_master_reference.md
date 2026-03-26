# Actual MiniMe Master Reference

> **Purpose**: Single source of truth for all functions, endpoints, enums, message actions, DB schemas, and storage keys across every module. Consult before any cross-module work.

---

## 📁 Project Structure

```
MiniMe/
├── backend/              # FastAPI Python backend
├── website/              # Next.js frontend (dashboard + marketing)
├── extension-chrome/     # Chrome MV3 extension
├── extension-firefox/    # Firefox MV2 extension (self-contained)
├── desktop/              # Tauri + Rust desktop app
└── extension-edge/       # Edge extension (mirrors Chrome)
```

---

## 🔑 Canonical Enums (NEVER deviate from these)

### `ActivityType` — [backend/api/v1/schemas/activity_schemas.py](file:///home/ansari/Documents/MiniMe/backend/api/v1/schemas/activity_schemas.py)

| Value | Use Case |
|-------|----------|
| `page_view` | Generic web page view |
| `web_visit` | ✅ **Use this for browser tab tracking** |
| `app_focus` | ✅ **Use this for desktop app switches** |
| `window_focus` | Specific window focus event |
| `file_edit` | File edited in editor |
| `commit` | Git commit |
| `meeting` | Video/audio meeting |
| `custom` | Custom user-defined |
| `social_media` | Social platform usage (Twitter, Reddit, LinkedIn, etc.) |
| `video_watch` | Video/media consumption (YouTube, Netflix, Twitch, etc.) |
| `search_query` | Search engine query (Google, Bing, DuckDuckGo, etc.) |
| `reading_analytics` | Reading engagement beacon (scroll depth, time on page, word count) |

### `ActivitySource` — [backend/api/v1/schemas/activity_schemas.py](file:///home/ansari/Documents/MiniMe/backend/api/v1/schemas/activity_schemas.py)

| Value | Who sends it |
|-------|-------------|
| `browser` | ✅ Chrome extension, Firefox extension |
| `desktop` | ✅ Desktop/Tauri app |
| `mobile` | Mobile app |
| `integration` | Third-party integrations |

> ⚠️ **Mismatch fixed**: Firefox was sending `browser_firefox` → now `browser`. Chrome was sending `WebBrowsing` → now `web_visit` via TYPE_MAP.

---

### `NodeType` — [backend/models/graph_models.py](file:///home/ansari/Documents/MiniMe/backend/models/graph_models.py)

| Value | Description |
|-------|-------------|
| `PERSON` | Author, collaborator, contact |
| `PAPER` | Academic paper or document |
| `TOPIC` | Subject area or concept |
| `PROJECT` | Software/research project |
| `DATASET` | Dataset or data resource |
| `INSTITUTION` | University or research lab |
| `ORGANIZATION` | ✅ **Company, platform, media, cloud, community** (new — maps from NER `organization` entities) |
| `TOOL` | Software tool or library |
| `VENUE` | Conference or journal |

### `RelationshipType` — [backend/models/graph_models.py](file:///home/ansari/Documents/MiniMe/backend/models/graph_models.py)

| Value | Description |
|-------|-------------|
| `AUTHORED` | Person authored paper |
| `COLLABORATES_WITH` | Person ↔ Person collaboration |
| `WORKS_ON` | Person works on topic/project |
| `CONTRIBUTES_TO` | Person contributes to project |
| `AFFILIATED_WITH` | Person affiliated with institution/org |
| `CITES` | Paper cites another paper |
| `USES` | Paper/project uses dataset/tool/org |
| `ON_TOPIC` | Paper/project on topic |
| `PUBLISHED_AT` | Paper published at venue |
| `RELATED_TO` | General semantic relationship |
| `DEPENDS_ON` | Tool depends on another tool |
| `LEARNED_FROM` | ✅ **User learned from an org/domain** (inferred from reading_analytics on educational orgs) |
| `USED_TOGETHER` | ✅ **Two entities co-occur in same session** (inferred from activity sequence) |

### NER Organization Entity Fields — [backend/services/lightweight_ner.py](file:///home/ansari/Documents/MiniMe/backend/services/lightweight_ner.py)

When `entity_type == "organization"`, entities include additional metadata:

| Field | Values | Description |
|-------|--------|-------------|
| `org_type` | `company`, `educational`, `government`, `open_source`, `media`, `community`, `cloud`, `developer_tools`, `productivity`, `social_media` | Organization category |
| `industry` | `tech`, `finance`, `education`, `social`, `content`, `infrastructure`, `productivity`, `gaming`, `research`, `news`, `health`, `government` | Industry sector |
| `confidence` | 0.55–0.95 | Known domains = 0.88–0.95, edu-pattern = 0.80, gov = 0.85, inferred = 0.55–0.72 |

100+ known domains mapped via `DOMAIN_ORG_MAP`. Unknown domains classified by `classify_domain_org()` using TLD/subdomain patterns.

---

## 🗄️ Database Tables — [backend/models.py](file:///home/ansari/Documents/MiniMe/backend/models.py)

### `users`
| Column | Type | Notes |
|--------|------|-------|
| [id](file:///home/ansari/Documents/MiniMe/extension-firefox/popup/popup.js#19-20) | UUID PK | |
| `email` | String(255) UNIQUE | |
| `password_hash` | String(255) | |
| `full_name` | String(255) | nullable |
| `tier` | String(50) | `free`, `premium`, `enterprise` |
| `subscription_status` | String(50) | `active` |
| `avatar_url` | Text | nullable |
| `preferences` | JSON | |
| `privacy_settings` | JSON | |
| `email_verified` | Boolean | |
| `created_at` / `updated_at` / `deleted_at` | DateTime | |

### `sessions`
| Column | Type | Notes |
|--------|------|-------|
| [id](file:///home/ansari/Documents/MiniMe/extension-firefox/popup/popup.js#19-20) | UUID PK | |
| `user_id` | UUID FK → users | |
| `refresh_token` | String(512) UNIQUE | |
| `device_info` | JSON | |
| `is_revoked` | Boolean | |
| `expires_at` | DateTime | |

### `activities`
| Column | Type | Notes |
|--------|------|-------|
| [id](file:///home/ansari/Documents/MiniMe/extension-firefox/popup/popup.js#19-20) | UUID PK | |
| `user_id` | UUID FK → users | |
| `type` | String(50) | **See ActivityType enum** |
| `source` | String(50) | **See ActivitySource enum** |
| `source_version` | String(50) | e.g. `ext-0.1.0` |
| `client_generated_id` | String(255) | for idempotency |
| [app](file:///home/ansari/Documents/MiniMe/desktop/src-tauri/src/platform/wayland.rs#308-325) | String(255) | desktop app name |
| `title` | Text | window/page title |
| `domain` | String(255) | web domain |
| `url` | Text | full URL |
| `duration_seconds` | Integer | |
| `data` | JSON | legacy |
| `context` | JSON | `{url, domain, title, app_name, ...}` |
| `ingestion_metadata` | JSON | `{source, received_at, ...}` |
| `occurred_at` | DateTime | **When* it happened (client time) |
| `received_at` | DateTime | When server received it |
| `created_at` | DateTime | DB insert time |

### `entities`
| Column | Type | Notes |
|--------|------|-------|
| [id](file:///home/ansari/Documents/MiniMe/extension-firefox/popup/popup.js#19-20) | UUID PK | |
| `user_id` | UUID FK → users | |
| `entity_type` | String(50) | `person, project, skill, concept, organization, artifact, event, interaction` |
| [name](file:///home/ansari/Documents/MiniMe/desktop/src-tauri/src/platform/wayland.rs#308-325) | String(500) | |

### `activity_entity_links`
| Column | Type | Notes |
|--------|------|-------|
| [id](file:///home/ansari/Documents/MiniMe/extension-firefox/popup/popup.js#19-20) | UUID PK | |
| `activity_id` | UUID FK → activities | |
| `entity_id` | UUID FK → entities | |
| `relationship` | String(100) | e.g. `mentioned`, `created`, `visited` |
| `confidence` | Float | |
| `created_at` | DateTime | |

### `audit_logs`
| Column | Type | Notes |
|--------|------|-------|
| [id](file:///home/ansari/Documents/MiniMe/extension-firefox/popup/popup.js#19-20) | UUID PK | |
| `user_id` | UUID FK → users | |
| `action` | String(100) | e.g. [login](file:///home/ansari/Documents/MiniMe/extension-firefox/background/background.js#172-192), `export_data` |
| `resource` | String(100) | What was acted on |
| `details` | JSON | |
| `ip_address` | String | |
| `created_at` | DateTime | |

### `user_goals`
| Column | Type | Notes |
|--------|------|-------|
| [id](file:///home/ansari/Documents/MiniMe/extension-firefox/popup/popup.js#19-20) | UUID PK | |
| `user_id` | UUID FK → users | |
| `title` | String | |
| `description` | Text | |
| `target_metric` | String | |
| `target_value` | Float | |
| `current_value` | Float | |
| `status` | String | `active`, `completed`, `paused` |
| `deadline` | DateTime | |
| `created_at` / `updated_at` | DateTime | |

### `content_items`
| Column | Type | Notes |
|--------|------|-------|
| [id](file:///home/ansari/Documents/MiniMe/extension-firefox/popup/popup.js#19-20) | UUID PK | |
| `user_id` | UUID FK → users | |
| `url` | Text | |
| `title` | Text | |
| `doc_type` | String | `webpage`, [pdf](file:///home/ansari/Documents/MiniMe/test_ml.pdf), `video`, etc. |
| `full_text` | Text | |
| `word_count` | Integer | |
| `importance_score` | Float | 0–100 |
| `is_important` | Boolean | |
| `engagement` | JSON | scroll_depth, time_on_page |
| `links` | JSON | outbound links |
| `metadata` | JSON | description, author |
| `created_at` | DateTime | |

---

## 🌐 Backend API Endpoints

### Router Prefixes  ([backend/main.py](file:///home/ansari/Documents/MiniMe/backend/main.py))

| Module | Prefix | Tags |
|--------|--------|------|
| `auth.router` | `/api/v1/auth` | Authentication |
| `users.router` | `/api/v1/users` | Users |
| `activities.router` | `/api/v1/activities` | Activities |
| `activity_ingestion.router` | `/api/v1` | Activity Ingestion |
| `entities.router` | `/api/v1/entities` | Entities |
| `graph.router` | `/api/v1/graph` | Knowledge Graph |
| `analytics.router` | `/api/v1/analytics` | Analytics |
| `realtime.router` | `/api/v1/realtime` | Real-time |
| `screenshots.router` | `/api/v1/screenshots` | Screenshots |
| `wearables.router` | `/api/v1/wearables` | Wearables |
| `billing.router` | `/api/v1/billing` | Billing |
| `content_ingestion.router` | `/api/v1` | Content Intelligence |
| `documents_api.router` | `/api/v1` | Documents |
| `cloud_backup.router` | (own prefix) | Cloud Sync |
| `account_api.router` | (own prefix) | Account |
| `settings_api.settings_router` | (own prefix) | Settings |
| `ai_chat.ai_router` | `/api/ai` | AI Chat |

---

### Auth — `/api/v1/auth/`

| Method | Path | Request | Response |
|--------|------|---------|----------|
| `POST` | `/login` | `{email, password}` | `{access_token, refresh_token, token_type}` |
| `POST` | `/register` | `{email, password, full_name?}` | `{access_token, ...}` |
| `POST` | `/refresh` | `{refresh_token}` | `{access_token, refresh_token}` |
| `POST` | `/logout` | (Bearer token) | `204` |
| `GET` | `/me` | (Bearer token) | `UserResponse` |

---

### Activities — `/api/v1/activities/`

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/` | List activities. Query: `?type=web_visit&limit=50&offset=0` |
| `GET` | `/{activity_id}` | Get single activity |
| `DELETE` | `/{activity_id}` | Delete activity |
| `POST` | `/batch` | **Batch ingest from extensions/desktop** |
| `POST` | `/sync` | Sync endpoint (desktop app uses this) |

#### `/activities/batch` — Request Body
```json
{
  "source": "browser",          // ENUM: browser | desktop | mobile | integration
  "source_version": "0.1.0",
  "activities": [
    {
      "client_generated_id": "browser:123:1234567890:abc12345",
      "occurred_at": "2026-03-03T18:22:15Z",
      "type": "web_visit",      // ENUM: see ActivityType
      "context": {
        "url": "https://example.com/page",
        "domain": "example.com",
        "title": "Page Title"
      },
      "duration_seconds": 45,
      "metadata": {}
    }
  ]
}
```

#### `/activities/sync` — Request Body (Desktop)
```json
{
  "activities": [
    {
      "activity_type": "window_focus",    // string (desktop uses this field)
      "source": "desktop",
      "occurred_at": "...",
      "duration_seconds": 120,
      "context": { "app_name": "VS Code", "window_title": "..." }
    }
  ]
}
```

---

### Activities (Ingestion Router) — `/api/v1/activities/` (activity_ingestion.py)

> Different router from `activities.py` — registered via `activity_ingestion.router`

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/activities/batch` | **Primary ingest endpoint for extensions** |
| `GET` | `/activities/stats` | Ingestion statistics |

---

### Content — `/api/v1/content/`

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/ingest` | Ingest page content from extensions |
| `POST` | `/search` | Semantic search |
| `GET` | `/` | List content records |
| `GET` | `/stats/summary` | Content stats |
| `GET` | `/export` | Export content |
| `GET` | `/{content_id}` | Get single content record |
| `DELETE` | `/{content_id}` | Delete content record |

---

### Documents — `/api/v1/documents/`

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/extract` | Extract text from uploaded document |
| `GET` | `/{doc_id}` | Get document |
| `GET` | `/` | List documents |

---

### Account — `/api/v1/account/`

| Method | Path | Description |
|--------|------|-------------|
| `DELETE` | `/` | Delete account |
| `GET` | `/export` | Export all user data |

---

### Cloud Sync — `/api/v1/sync/`

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/status` | Sync status |
| `POST` | `/backup` | Create cloud backup |
| `POST` | `/gdrive/connect` | Connect Google Drive |
| `GET` | `/gdrive/callback` | OAuth callback |
| `GET` | `/gdrive/status` | GDrive sync status |

---

### Integrations — `/api/integrations/` ⚠️

> Prefix is `/api/integrations/` NOT `/api/v1/integrations/`

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/github/oauth/initiate` | Start GitHub OAuth |
| `POST` | `/github/oauth/callback` | GitHub OAuth callback |
| `GET` | `/github/status` | GitHub connection status |
| `DELETE` | `/github/disconnect` | Disconnect GitHub |
| `POST` | `/google/oauth/initiate` | Start Google OAuth |
| `POST` | `/google/oauth/callback` | Google OAuth callback |
| `GET` | `/google/status` | Google connection status |
| `DELETE` | `/google/disconnect` | Disconnect Google |
| `POST` | `/notion/oauth/initiate` | Start Notion OAuth |
| `POST` | `/notion/oauth/callback` | Notion OAuth callback |
| `GET` | `/notion/status` | Notion connection status |
| `DELETE` | `/notion/disconnect` | Disconnect Notion |

---

#### `/content/ingest` — Request Body
```json
{
  "url": "https://example.com",
  "title": "Page Title",
  "doc_type": "webpage",
  "full_text": "...",
  "word_count": 500,
  "importance_score": 75,
  "is_important": true,
  "engagement": { "scroll_depth": 0.8, "time_on_page": 120 },
  "links": ["https://..."],
  "metadata": { "description": "...", "author": "..." }
}
```

---

### Analytics — `/api/v1/analytics/`

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/overview` | Dashboard overview |
| `GET` | `/productivity` | Productivity metrics |
| `GET` | `/productivity/daily?date=YYYY-MM-DD` | Daily breakdown |
| `GET` | `/productivity/daily-range?days=30` | Range |
| `GET` | `/career` | Career insights |
| `GET` | `/collaboration` | Collaboration metrics |
| `GET` | `/skills` | Skills analytics |
| `GET` | `/wellness` | Wellness metrics |
| `GET` | `/goals` | Goals list |
| `POST` | `/goals` | Create goal |
| `GET` | `/goals/{id}` | Get goal |
| `PUT` | `/goals/{id}` | Update goal |
| `DELETE` | `/goals/{id}` | Delete goal |
| `GET` | `/export?format=json` | Export data |
| `GET` | `/summary/weekly/email` | Weekly email summary |

---

### Graph — `/api/v1/graph/`

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/visualization` | Full graph for GraphExplorer |
| `GET` | `/nodes/{nodeId}` | Node details |
| `GET` | `/neighbors` | Node neighbors |
| `GET` | `/entities` | Entity list |
| `POST` | `/merge` | Merge entities |
| `GET` | `/duplicates` | Duplicate detection |

---

### Entities — `/api/v1/entities/`

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/entities` | List. Query: `?type=person&limit=50` |
| `GET` | `/entities/{id}` | Get entity |
| `POST` | `/entities/merge` | Merge duplicates |

---

### Users — `/api/v1/users/`

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/me/profile` | Get profile |
| `PUT` | `/me/profile` | Update profile |
| `PUT` | `/me/preferences` | Update preferences |
| `PUT` | `/me/privacy` | Update privacy |
| `POST` | `/me/change-password` | Change password |
| `GET` | `/me/data` | Export all data |

---

### AI Chat — `/api/ai/`

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/chat/stream` | Streaming chat (SSE) |
| `GET` | `/conversations/{id}` | Get conversation |
| `GET` | `/models/available` | List AI models |
| `GET` | `/model/info` | Current model info |
| `GET` | `/analytics/focus-score` | AI focus score |
| `GET` | `/analytics/wellness` | AI wellness |

---

### Billing — `/api/v1/billing/`

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/plans` | Available plans |
| `GET` | `/subscription` | Current subscription |
| `POST` | `/subscription/update` | Upgrade/downgrade |
| `POST` | `/subscription/cancel` | Cancel |
| `GET` | `/invoices` | Invoice history |
| `GET` | `/portal` | Stripe portal URL |
| `GET` | `/usage` | Current usage metrics |
| `POST` | `/checkout` | Create checkout session |

---

### Screenshots — `/api/v1/screenshots/`

| Method | Path |
|--------|------|
| `GET` | `/` |
| `GET` | `/{screenshotId}` |
| `GET` | `/download` |

---

### Wearables — `/api/v1/wearables/`

| Method | Path |
|--------|------|
| `GET` | `/data` |
| `POST` | `/{provider}/connect` |
| `POST` | `/{provider}/disconnect` |
| `GET` | `/{provider}/callback` |

---

### WebSocket Stream — `/api/v1/stream`

| Type | Path | Description |
|------|------|-------------|
| WebSocket | `/v1/stream` | Real-time activity + entity updates (requires `?token=<jwt>`) |
| GET | `/v1/stream/stats` | Admin: active connection count |

> Note: The prefix is `/api/v1` from `activity_ingestion.router` registration, so the full path is `/api/v1/stream`.

---

### Settings API — `/api/settings/`

> **Registered at**: [backend/api/settings.py](file:///home/ansari/Documents/MiniMe/backend/api/settings.py) — prefix `/api/settings`  
> ✅ **This is CORRECT** — desktop `settingsAPI.ts` correctly calls these routes.

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `` (root) | Get all user settings (`AllSettings` model) |
| `PUT` | `/profile` | Update profile |
| `PUT` | `/tracking` | Update tracking settings |
| `PUT` | `/focus` | Update focus settings |
| `PUT` | `/privacy` | Update privacy settings |
| `POST` | `/auth/change-password` | Change password |
| `POST` | `/auth/2fa/enable` | Enable 2FA |
| `POST` | `/auth/2fa/disable` | Disable 2FA |
| `POST` | `/backups/create` | Create backup |
| `GET` | `/backups` | List backups |
| `GET` | `/data/export` | Export all data |

---

### Waitlist — `/api/v1/waitlist`

> Registered with `prefix="/api/v1"` from `waitlist.py`

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/waitlist` | Join waitlist |

---

## 🌐 Frontend — `website/src/`

### Dashboard Pages — `/dashboard/`

| Route | Page File | Key Hooks Used |
|-------|-----------|---------------|
| `/dashboard/overview` | `overview/page.tsx` | `useActivities`, `useGraphData` |
| `/dashboard/activities` | `activities/page.tsx` | `ActivityTimeline`, `FocusSessions`, `SocialMediaTracker`, `MeetingList` |
| `/dashboard/knowledge` | `knowledge/page.tsx` | content API |
| `/dashboard/graph` | `graph/page.tsx` | `useGraphData`, `GraphExplorer` |
| `/dashboard/chat` | `chat/page.tsx` | `useAIChat` |
| `/dashboard/productivity` | `productivity/page.tsx` | `useProductivityMetrics` |
| `/dashboard/skills` | `skills/page.tsx` | `useSkillsMetrics` |
| `/dashboard/goals` | `goals/page.tsx` | `useGoals` |
| `/dashboard/career` | `career/page.tsx` | career API |
| `/dashboard/collaboration` | `collaboration/page.tsx` | `useCollaborationMetrics` |
| `/dashboard/wellness` | `wellness/page.tsx` | wellness API |
| `/dashboard/settings` | `settings/page.tsx` | user API |
| `/dashboard/billing` | `billing/page.tsx` | `useBilling` |
| `/dashboard/weekly-digest` | `weekly-digest/page.tsx` | `useWeeklySummary` |
| `/dashboard/enrichment` | `enrichment/page.tsx` | |
| `/dashboard/tasks` | `tasks/page.tsx` | |
| `/dashboard/screenshots` | (ScreenshotGallery) | `useScreenshots` |

#### Reading Analytics Tab

| Component | Hook | Data Source |
|-----------|------|-------------|
| `ReadingTracker.tsx` | `useReadingAnalytics.ts` | `GET /api/v1/activities?type=reading_analytics` + `web_visit` |

### Key Hooks & Their API Calls

| Hook | File | API Endpoint |
|------|------|-------------|
| `useActivities(type?, limit, offset)` | `hooks/useActivities.ts` | `GET /api/v1/activities?type=xxx` |
| `useGraphData()` | `hooks/useGraphData.ts` | `GET /api/v1/graph/visualization` |
| `useEntities()` | `hooks/useEntities.ts` | `GET /api/v1/entities/entities` |
| `useProductivityMetrics()` | `hooks/useProductivityMetrics.ts` | `GET /api/v1/analytics/productivity` |
| `useFocusSessions()` | `hooks/useFocusSessions.ts` | `GET /api/v1/activities?type=window_focus` + `type=app_focus` |
| `useMeetings()` | `hooks/useMeetings.ts` | `GET /api/v1/activities?type=meeting` |
| `useSocialMedia()` | `hooks/useSocialMedia.ts` | `GET /api/v1/activities?type=social_media` |
| `useAIChat()` | `hooks/useAIChat.ts` | `POST /api/ai/chat/stream` |
| `useAuth()` | `hooks/useAuth.ts` | `POST /api/v1/auth/login` + `/logout` + `/me` |
| `useBilling()` | `hooks/useBilling.ts` | `GET /api/v1/billing/subscription` + `/plans` |
| `useGoals()` | `hooks/useGoals.ts` | CRUD `/api/v1/analytics/goals` |
| `useCollaborationMetrics()` | `hooks/useCollaborationMetrics.ts` | `GET /api/v1/analytics/collaboration` |
| `useWeeklySummary()` | `hooks/useWeeklySummary.ts` | `/api/v1/analytics/summary/weekly` |
| `useSkillsMetrics()` | `hooks/useSkillsMetrics.ts` | `GET /api/v1/analytics/skills` |
| `useScreenshots()` | `hooks/useScreenshots.ts` | `GET /api/v1/screenshots` |
| `useWearables()` | `hooks/useWearables.ts` | `GET /api/v1/wearables/data` |
| `useWebSocket()` | `hooks/useWebSocket.ts` | WS `/api/v1/ws/{user_id}` |

### API Client — `lib/api.ts`

```typescript
// Base: reads from NEXT_PUBLIC_API_URL or defaults to http://localhost:8000
// Auth: reads JWT from authStore (Zustand)
// All requests: Authorization: Bearer <token>
```

---

## 🔵 Chrome Extension — `extension-chrome/`

### Files

| File | Purpose |
|------|---------|
| `manifest.json` | MV3 config — service worker, permissions |
| `background/service-worker.js` | Main background logic (MV3 Service Worker) |
| `background/tab-tracker.js` | Tab focus/URL change tracking → `TabTracker` class |
| `content/content-extractor.js` | Page content extraction + importance scoring |
| `content/activity-detector.js` | Social media, video watching (YouTube), search query detection |
| `content/code-block-extractor.js` | Code snippet extraction |
| `lib/activity-queue.js` | `ActivityQueue` class — IndexedDB queue + sync |
| `lib/storage.js` | `StorageManager` class — IndexedDB |
| `lib/sync.js` | `SyncManager` class — login, sync, badge |
| `lib/privacy.js` | `PrivacyFilter` class — blacklist/whitelist |
| `lib/focus-tracker.js` | `FocusPeriodTracker` class — deep work detection |
| `lib/queue-storage.js` | `IndexedDBStorage` class — persistent queue storage |
| `lib/media-detector.js` | `MediaDetector` — YouTube/streaming detection |
| `lib/social-detector.js` | `SocialMediaDetector` — social platform detection |
| `lib/meeting-detector.js` | `MeetingDetector` — Zoom/Meet/Teams detection |
| `lib/search-detector.js` | `SearchDetector` — 14 search engine query extraction |
| `lib/domain-categorizer.js` | `DomainCategorizer` — category tagging |
| `lib/url-analyzer.js` | `URLAnalyzer` — URL pattern analysis |
| `lib/browser-compat.js` | Cross-browser compat shims |
| `lib/toast.js` | `Toast` — notification UI |
| `lib/native-messenger.js` | Native messaging for desktop integration |
| `lib/history-sync.js` | Browser history sync |
| `popup/popup.js` | Popup UI logic |
| `popup/content-status.js` | Content extraction status display |
| `options/settings.js` | Options page logic |

### Message Actions — Chrome Service Worker (`service-worker.js`)

| Action (sender → SW) | Handler | Notes |
|---------------------|---------|-------|
| `autoSync` | alarm | Every N minutes |
| `flushActivity` | alarm | Periodic flush |
| `cleanupOldData` | alarm | Daily cleanup |
| `queueMaintenance` | alarm | Queue health |
| `getCurrentTabTime` | popup | Returns elapsed seconds |
| `getTodayStats` | popup | `{totalTime, pagesVisited, entities}` |
| `getRecentActivities` | popup | `limit` param → recent list |
| `setTracking` | popup | `tracking: bool` |
| `syncNow` | popup | Flush + sync |
| `toggleTracking` | popup | Toggle isTracking |
| `getStatus` | popup | Full status object |
| `login` | popup | `{email, password}` → calls SyncManager.login |
| `logout` | popup | Clears authToken |
| `clearOldData` | options | Clears >N days data |
| `exportData` | options | Returns JSON blob |
| `clearAllData` | options | Wipes IndexedDB |
| `getQueueMetrics` | debug | ActivityQueue stats |
| `enqueueActivity` | tab-tracker | Adds activity to queue |
| `getQueuePending` | debug | Pending queue items |
| `getQueueDeadLetters` | debug | Failed items |
| `retryQueueFailed` | debug | Retry dead letters |
| `clearQueueDeadLetters` | debug | Clear dead letters |
| `content_extracted` | content script | Ingest page content → `/content/ingest` |
| `reading_analytics` | content script | Reading engagement beacon (scroll, time, words) → enqueue as `reading_analytics` type |
| `getContentStatus` | content-status.js | Last ingestion result |

### Chrome `chrome.storage.local` Keys

| Key | Type | Used By |
|-----|------|---------|
| `authToken` | String | JWT access token — all modules |
| `refreshToken` | String | For token refresh |
| `apiUrl` | String | Backend URL (default: `http://localhost:8000`) |
| `dashboardUrl` | String | Frontend URL |
| `deviceId` | String | Unique device identifier |
| `trackingEnabled` | Boolean | Global tracking on/off |
| `settings` | Object | User preferences |
| `blacklist` | String[] | Domains NOT to track |
| `whitelist` | String[] | Only track these domains |
| `retentionDays` | Number | How long to keep data |
| `focusSessions` | Object | Focus period state |
| `historySyncProgress` | Object | History import state |
| `historySyncSettings` | Object | History sync config |
| `lastHistorySync` | String | ISO timestamp |

### Activity Object — Chrome → Backend

```javascript
// What tab-tracker.js writes to IndexedDB via StorageManager:
{
  id: "uuid-string",           // crypto.randomUUID()
  timestamp: "ISO-8601",       // occurred_at
  activityType: "WebBrowsing", // LEGACY — TYPE_MAP converts to "web_visit"
  url: "https://...",
  domain: "example.com",
  windowTitle: "Page Title",
  durationSeconds: 45,
  isIdle: false,
  deviceId: "browser-uuid"
}

// What sync.js sends to /api/v1/activities/batch:
{
  client_generated_id: activity.id,
  type: TYPE_MAP[activity.activityType] || activity.activityType || "web_visit",
  occurred_at: activity.timestamp,
  duration_seconds: activity.durationSeconds,
  context: { url, domain, title: windowTitle },
  metadata: { idle: isIdle, device_id: deviceId }
}
```

**TYPE_MAP in `lib/sync.js`:**
```javascript
const TYPE_MAP = {
  'WebBrowsing':  'web_visit',
  'WebVisit':     'web_visit',
  'AppFocus':     'app_focus',
  'AppSwitch':    'app_focus',
  'WindowFocus':  'window_focus',
  'Meeting':      'meeting',
  'FileEdit':     'file_edit',
  'Commit':       'commit',
};
```

---

## 🦊 Firefox Extension — `extension-firefox/`

### Architecture (MV2 — completely self-contained)

> **Design rule**: Firefox extension is a single self-contained `background/background.js` — NO lib files loaded in background. The lib/ files exist but are NOT used by background.js.

| File | Purpose |
|------|---------|
| `manifest.json` | MV2 — single background script, `persistent: true` |
| `background/background.js` | ✅ **ACTIVE** — all logic inline, zero deps |
| `background/service-worker.js` | ❌ **LEGACY** — not loaded in manifest |
| `background/tab-tracker.js` | ❌ **LEGACY** — not loaded in manifest |
| `lib/*.js` | ❌ **LEGACY** — not loaded in manifest |
| `content/content-extractor.js` | ✅ Content script — sends `content_extracted` message |
| `content/activity-detector.js` | ✅ Content script — sends `social_media_activity`, `video_watching`, `search_query` messages |
| `popup/popup.js` | ✅ Popup UI — no imports, uses `chrome.runtime.sendMessage` |
| `popup/popup.html` | ✅ Uses `<script src="popup.js">` (NOT type=module) |

### Message Actions — Firefox Background (`background.js`)

| Action | Handler |
|--------|---------|
| `getStatus` | Returns `{tracking, authenticated, unsyncedCount, todayStats, currentSite}` |
| `syncNow` | Flush current activity + call `syncToBackend()` |
| `login` | `{email, password}` → POST `/api/v1/auth/login` |
| `logout` | Clears `authToken` + `refreshToken` |
| `toggleTracking` | Toggle `isTracking` |
| `content_extracted` | Ingest page payload → POST `/api/v1/content/ingest` |
| `reading_analytics` | Reading engagement beacon → enqueue as `reading_analytics` type |
| `getTodayStats` | `{totalActivities, domains}` for today |
| `getRecentActivities` | `{limit}` → recent items from `pendingQueue` |

### Firefox `chrome.storage.local` Keys

| Key | Type | Purpose |
|-----|------|---------|
| `authToken` | String | JWT access token |
| `refreshToken` | String | Refresh token |
| `apiUrl` | String | Backend URL |
| `trackingEnabled` | Boolean | Tracking on/off |
| `activityQueue` | Array | Pending activities (stored locally, synced every 5min) |

### Activity Object — Firefox → Backend

```javascript
// What background.js builds and stores in activityQueue:
{
  id: `ff:${domain}:${Date.now()}`,
  occurred_at: "ISO-8601",
  type: "web_visit",             // ✅ Correct enum value
  context: { url, domain, title },
  duration_seconds: 45,
  metadata: { browser: "firefox", source: "tab_tracker" }
}

// What syncToBackend() sends to /api/v1/activities/batch:
{
  source: "browser",             // ✅ Correct enum value  
  source_version: "0.1.0",
  activities: [...activityQueue.slice(0, 100)]
}
```

### Firefox Alarm Schedule

| Alarm | Interval | Action |
|-------|----------|--------|
| `flush` | 1 min | Save current tab activity |
| `sync` | 5 min | Sync pendingQueue to backend |
| `cleanup` | 24 hrs | Remove activities >7 days old |

---

## 🖥️ Desktop App — `desktop/src-tauri/src/`

### Rust Source Files

| File | Purpose |
|------|---------|
| `lib.rs` | App setup, Tauri app builder, main init |
| `commands.rs` | All `#[tauri::command]` handlers |
| `database.rs` | SQLite operations |
| `sync.rs` | HTTP client to backend |
| `tracker.rs` | `ActivityTracker` trait + `ActivityEvent` struct |
| `platform/wayland.rs` | Wayland window detection (3-strategy) |
| `platform/linux.rs` | X11 window detection |
| `platform/macos.rs` | macOS window detection |
| `platform/windows.rs` | Windows window detection |
| `platform/mod.rs` | Platform dispatcher |
| `polling.rs` | Polling loop — calls platform tracker every N seconds |
| `sync.rs` | Backend sync client |
| `ai_chat.rs` | Local AI chat |
| `screenshot.rs` | Screenshot capture commands |
| `focus_timer.rs` | Focus timer logic |
| `encryption.rs` | AES-256-GCM encryption |
| `batching.rs` | Activity batching |
| `settings.rs` | User settings |
| `setup.rs` | First-run setup |
| `privacy.rs` | Privacy filter |
| `tray.rs` | System tray |
| `input.rs` | `LinuxInputMonitor` (reads `/dev/input/event*`), `BreakDetector`, `FocusDetector`, `InputMetrics` |
| `local_search.rs` | Local search |
| `tests.rs` | Unit tests |

### Desktop Data Structs — `tracker.rs` / `input.rs`

**`InputMetricsSnapshot`** (attached to every non-idle `ActivityEvent`):

| Field | Type | Description |
|-------|------|-------------|
| `keystrokes_per_minute` | `f64` | Aggregate KPM (no keylogging) |
| `mouse_distance` | `f64` | Cumulative mouse movement distance |
| `click_count` | `u32` | Total mouse clicks since last snapshot |
| `activity_level` | `u32` | 0-100 composite activity score |

**`BreakDetector`** (emits `ActivityType::Break` events):
- Tracks idle-to-active transitions
- Default threshold: 5 minutes idle
- Emits break event with duration on return

**`ScreenshotMeta`** (auto-labeling):

| Field | Type | Description |
|-------|------|-------------|
| `app_name` | `Option<String>` | Active app when screenshot was taken |
| `window_title` | `Option<String>` | Window title at capture time |
| `label` | `Option<String>` | User label or auto-generated `"App — Title"` |

### Tauri Commands — `commands.rs`

| Command | Frontend Call | Description |
|---------|--------------|-------------|
| `update_profile` | `invoke('update_profile', {...})` | Update user profile |
| `update_tracking_settings` | `invoke('update_tracking_settings', {...})` | |
| `update_focus_settings` | `invoke('update_focus_settings', {...})` | |
| `update_privacy_settings` | `invoke('update_privacy_settings', {...})` | |
| `update_notification_settings` | `invoke('update_notification_settings', {...})` | |
| `change_password` | `invoke('change_password', {...})` | |
| `enable_2fa` | `invoke('enable_2fa')` | |
| `disable_2fa` | `invoke('disable_2fa')` | |
| `export_data` | `invoke('export_data')` | |
| `create_backup` | `invoke('create_backup')` | |
| `send_chat_message` | `invoke('send_chat_message', {...})` | Local AI chat |
| `get_conversation_history` | `invoke('get_conversation_history', {...})` | |
| `get_all_conversations` | `invoke('get_all_conversations')` | |
| `get_focus_score` | `invoke('get_focus_score')` | |
| `get_wellness_score` | `invoke('get_wellness_score')` | |
| `generate_weekly_report` | `invoke('generate_weekly_report')` | |
| `capture_screenshot` | `invoke('capture_screenshot')` | |
| `capture_screenshot_monitor` | `invoke('capture_screenshot_monitor', {monitor})` | |
| `list_screenshots` | `invoke('list_screenshots')` | |
| `get_screenshot` | `invoke('get_screenshot', {id})` | |

### Desktop Sync — `sync.rs`

**Endpoint used**: `POST /api/v1/activities/sync`
> ⚠️ **Note**: Desktop uses `/sync` not `/batch`. These are different endpoints.

```rust
// ActivityType mapping in sync.rs:
ActivityType::WindowFocus => "window_focus",
ActivityType::AppSwitch   => "app_focus",

// source is always "desktop"

// ActivityCreatePayload sent:
{
  "activity_type": "window_focus",   // field name is activity_type not type
  "source": "desktop",
  "occurred_at": "ISO-8601",
  "duration_seconds": 120,
  "context": {
    "app_name": "VS Code",
    "window_title": "..."
  },
  "data": {
    "input_metrics": {
      "keystrokes_per_minute": 42.5,
      "mouse_distance": 1234.5,
      "click_count": 18,
      "activity_level": 72
    }
  }
}
```

### Wayland Window Detection Strategy — `platform/wayland.rs`

Priority order:
1. `xdotool getactivewindow` via discovered XWayland display
2. `gdbus` GNOME Shell DBus eval (GNOME < 45 only)
3. `/proc` filesystem scan — matches against KNOWN_GUI_APPS list (50+ apps), highest RSS process wins

### Desktop SQLite Schema — `database.rs`

DB path: `{app_data_dir}/minime.db`

**Table: `activities`**

| Column | Type | Notes |
|--------|------|-------|
| `id` | TEXT PK | |
| `timestamp` | TEXT | ISO-8601, when occurred |
| `activity_type` | TEXT | `window_focus`, `app_focus`, etc. |
| `app_name` | TEXT | Application name |
| `window_title` | TEXT | Window title |
| `domain` | TEXT | Domain if web |
| `duration_seconds` | INTEGER | |
| `synced` | BOOLEAN | Whether synced to backend |
| `device_id` | TEXT | |
| `created_at` | TEXT | |

**Table: `settings`**

| Column | Type |
|--------|------|
| `key` | TEXT PK |
| `value` | TEXT |
| `updated_at` | TEXT |

Indexes: `idx_activities_timestamp`, `idx_activities_synced`

---

### Desktop Frontend (Tauri React App) — `desktop/src/`

| Page | File |
|------|------|
| Dashboard | `pages/Dashboard.tsx` |
| Analytics | `pages/Analytics.tsx` |
| Chat | `pages/Chat.tsx` |
| Knowledge | `pages/Knowledge.tsx` |
| Knowledge Graph | `pages/KnowledgeGraphPage.tsx` |
| Graph | `pages/GraphPage.tsx` |
| Entities | `pages/Entities.tsx` |
| Settings | `pages/Settings.tsx` |
| Projects | `pages/Projects.tsx` |
| Tasks | `pages/Tasks.tsx` |
| Papers | `pages/Papers.tsx` |
| Setup Wizard | `pages/SetupWizard.tsx` |
| OAuth Callback | `pages/OAuthCallback.tsx` |

**Desktop settingsAPI.ts calls — ✅ CORRECT**

> These HTTP routes DO exist in `backend/api/settings.py` at prefix `/api/settings/`. The desktop settings page is wired correctly.

| What it calls | Backend route |
|--------------|------------------|
| `GET /api/settings` | ✅ `GET /api/settings/` (GetAllSettings) |
| `PUT /api/settings/profile` | ✅ `PUT /api/settings/profile` |
| `PUT /api/settings/tracking` | ✅ `PUT /api/settings/tracking` |
| `PUT /api/settings/focus` | ✅ `PUT /api/settings/focus` |
| `PUT /api/settings/privacy` | ✅ `PUT /api/settings/privacy` |
| `POST /api/settings/auth/change-password` | ✅ `POST /api/settings/auth/change-password` |

**Desktop services directory** (`desktop/src/services/`):
- `auth.ts` — login, register, check auth
- `settingsAPI.ts` — all settings CRUD
- `integrationAPI.ts` — GitHub/Google/Notion OAuth

**Desktop stores** (`desktop/src/stores/`): `authStore.ts` (Zustand)  
**Desktop contexts** (`desktop/src/contexts/`):
- `ChatContext.tsx` — AI chat state
- `SettingsContext.tsx` — User settings state

---

---

## ⚠️ Known Mismatches & Fixes Applied

| Issue | File | Wrong | Fixed |
|-------|------|-------|-------|
| Firefox source enum | `background/background.js` | `"browser_firefox"` | `"browser"` |
| Chrome activity type | `lib/sync.js` | `"WebBrowsing"` | `TYPE_MAP → "web_visit"` |
| Firefox badge API | `lib/sync.js` | `chrome.action.setBadgeText` | `chrome.browserAction.setBadgeText` |
| Firefox ES module | `background/tab-tracker.js` | `import …` | removed |
| Firefox ES export | `lib/activity-queue.js` | `export class` | removed |
| Firefox privacy init | `lib/privacy.js` | Crashed on null storage | `try/catch` with safe defaults |
| Chrome JWT expiry | `lib/sync.js` | Silent 401 | Auto-refresh → re-login prompt |
| Content ingest | `background/background.js` | `err.message` on non-Error | `String(err)` |
| FF popup module | `popup/popup.html` | `type="module"` | Plain `<script>` |
| Settings mismatch label | Previous note | Incorrectly labeled settings API as missing | Settings API at `/api/settings/` DOES exist |

---

## 🌍 Environment Variables — `.env`

| Variable | Value / Purpose |
|----------|----------------|
| `DATABASE_URL` | `postgresql://minime:minime_dev_password@localhost:5432/minime` |
| `NEO4J_URI` | `bolt://localhost:7687` |
| `NEO4J_USER` | `neo4j` |
| `NEO4J_PASSWORD` | `minime_dev_password` |
| `REDIS_URL` | `redis://:minime_dev_password@localhost:6379/0` |
| `QDRANT_URL` | `http://localhost:6333` |
| `JWT_SECRET_KEY` | `dev_secret_key_change_in_production_12345` |
| `CORS_ORIGINS` | `http://localhost:1420,http://localhost:5173,http://localhost:8000,http://localhost:3000` |
| `ENVIRONMENT` | `development` |
| `DEBUG` | `true` |
| `USE_OLLAMA` | `true` |
| `OLLAMA_MODEL` | `llama2` |
| `OLLAMA_BASE_URL` | `http://localhost:11434` |
| `GITHUB_CLIENT_ID/SECRET` | GitHub OAuth app credentials |
| `GOOGLE_CLIENT_ID/SECRET` | Google OAuth (auth + Drive) |
| `NOTION_CLIENT_ID/SECRET` | Notion OAuth |
| `GITHUB_REDIRECT_URI` | `http://localhost:1420/oauth/callback` (desktop) |
| `GOOGLE_REDIRECT_URI` | `http://localhost:3000/auth/callback/google` (web) |
| `NOTION_REDIRECT_URI` | `http://localhost:1420/oauth/callback` (desktop) |
| `GOOGLE_DRIVE_REDIRECT_URI` | `http://localhost:8000/api/v1/sync/gdrive/callback` |

> ⚠️ **Port map**: Backend=8000 · Next.js website=3000 · Desktop Tauri=1420 · Desktop dev server=5173

---

## ⚙️ Celery Background Tasks

**Broker**: Redis (`REDIS_URL`)  
**Files**: `backend/tasks/`

| Task File | Purpose |
|-----------|--------|
| `analytics_tasks.py` | Compute productivity/wellness/focus metrics |
| `embedding_tasks.py` | Generate vector embeddings for content/entities |
| `entity_tasks.py` | NER extraction, entity dedup, normalization |
| `inference_tasks.py` | Graph link prediction, relationship inference |
| `centrality_tasks.py` | Neo4j centrality computation |
| `community_tasks.py` | Community detection in knowledge graph |
| `wearable_sync.py` | Pull wearable data from providers |
| `ner_worker.py` | Named Entity Recognition worker |
| `celery_app.py` | Celery app config + beat schedule |

Schedule: `backend/config/celery_beat_schedule.py`

---

## 🔗 Data Flow Diagrams

### Browser Tab Visit → Backend

```
User browses page
  → tab-tracker.js: onTabChange() / handleTabChanged()
  → saveCurrentActivity() → StorageManager.saveActivity(activity) [IndexedDB]
  → chrome.runtime.sendMessage({action: 'enqueueActivity', activity})
  → service-worker.js: activityQueue.add(activity)
  → [alarm every 5min] activityQueue.flush() → SyncManager.sync()
  → POST /api/v1/activities/batch
  → Activity saved to PostgreSQL activities table
  → GET /api/v1/activities → shown in Dashboard Timeline tab
```

### Firefox Tab Visit → Backend

```
User browses page
  → background.js: chrome.tabs.onActivated → onTabChange()
  → saveCurrentActivity() → pushActivity() → chrome.storage.local {activityQueue}
  → [alarm 'flush' every 1min] saveCurrentActivity()
  → [alarm 'sync' every 5min] syncToBackend()
  → POST /api/v1/activities/batch
  → Activity saved to PostgreSQL
  → Shown in Dashboard Timeline tab
```

### Desktop App Focus → Backend

```
User switches window
  → polling.rs: poll every ~5s
  → platform/wayland.rs: get_current_window()
  → polling.rs: detects change → creates ActivityEvent
  → [every 30s] database.rs: save to SQLite
  → sync.rs: sync_activities()
  → POST /api/v1/activities/sync     ← NOTE: /sync not /batch
  → Activity saved to PostgreSQL
```

---

## 🧩 Content Extraction Flow

```
User visits page (any URL)
  → content-extractor.js runs (content script)
  → Extracts: title, full_text, word_count, links, engagement
  → Scores importance: 0–100 (≥50 = important, ≥70 = essential)
  → chrome.runtime.sendMessage({action: 'content_extracted', payload: {...}})
  → service-worker.js / background.js: handleContentExtracted()
  → POST /api/v1/content/ingest
  → Backend: NLP pipeline → entities extracted → Neo4j graph updated
  → Shown in Dashboard Knowledge tab + Graph Explorer
```

---

### Reading Analytics — Browser Extension → Backend

```
User reads article
  → content-extractor.js: tracks scroll depth, time on page, word count
  → visibilitychange / pagehide fires
  → sendReadingAnalytics() → chrome.runtime.sendMessage({action: 'reading_analytics', payload})
  → service-worker.js / background.js: reading_analytics handler
  → activityQueue.enqueue({type: 'reading_analytics', context: {reading: {...}}}) 
  → POST /api/v1/activities/batch
  → Activity saved with type = 'reading_analytics', context.reading = {
      scroll_depth_pct, time_on_page_sec, word_count,
      estimated_read_time_sec, estimated_read_pct,
      selection_count, user_interacted
    }
```

### Desktop Input Metrics + Break Detection

```
User typing/clicking
  → LinuxInputMonitor: reads /dev/input/event* in background thread
  → Counts: key presses, mouse clicks, mouse movement (aggregate only, no keylogging)
  → polling.rs: attaches InputMetricsSnapshot to ActivityEvent
  → sync.rs: includes input_metrics in data payload
  → POST /api/v1/activities/sync

User goes idle > 5 min, then returns
  → BreakDetector: detects idle-to-active transition
  → Emits ActivityType::Break event with break duration
  → Stored in local SQLite + synced to backend
```

---

## ✅ Quick Checklist Before Any Cross-Module Change

- [ ] Activity `type` is one of: `page_view`, `web_visit`, `app_focus`, `window_focus`, `file_edit`, `commit`, `meeting`, `custom`, `social_media`, `video_watch`, `search_query`, `reading_analytics`
- [ ] Activity `source` is one of: `browser`, `desktop`, `mobile`, `integration`
- [ ] Extensions sync to `/api/v1/activities/batch`
- [ ] Desktop syncs to `/api/v1/activities/sync`
- [ ] Content ingestion goes to `/api/v1/content/ingest`
- [ ] JWT stored under key `authToken` in `chrome.storage.local`
- [ ] Refresh token stored under key `refreshToken`
- [ ] Firefox popup has `<script src="popup.js">` NOT `type="module"`
- [ ] Firefox lib files NOT loaded in manifest (only `background/background.js` is)
- [ ] Chrome lib files ARE loaded as ES modules via `service-worker.js` imports
- [ ] `occurred_at` = when it happened (client time, ISO-8601 UTC)
- [ ] `client_generated_id` format: `browser:{tabId}:{timestamp}:{uuid_prefix}`
- [ ] Reading analytics uses type `reading_analytics` (NOT `page_view`)
- [ ] Desktop input metrics are aggregate only (no keylogging)

