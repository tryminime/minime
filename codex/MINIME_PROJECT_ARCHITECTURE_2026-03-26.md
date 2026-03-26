# MiniMe Project Architecture

Date: 2026-03-26

This document describes the actual architecture present in the repository, based on source inspection and targeted verification. It is intentionally grounded in the current codebase rather than the long-form product/spec markdown.

## 1. System Overview

MiniMe is a multi-surface application with these major runtime parts:

1. A FastAPI backend in `backend/`
2. A Next.js website/dashboard in `website/`
3. A desktop application in `desktop/`
   - a React/Vite UI
   - a Tauri native shell and Rust services
4. A browser extension in `extension-chrome/`
5. Local infrastructure services
   - PostgreSQL
   - Neo4j
   - Redis
   - Qdrant

At a high level:

```text
Browser Extension ----\
Desktop Tracker -------\ 
Website Dashboard ------> FastAPI Backend ---> PostgreSQL
Desktop UI ------------/                     ---> Neo4j
                                             ---> Redis
                                             ---> Qdrant

Desktop Tauri Native Layer <--> local desktop DB / OS integration / tracking
```

## 2. Top-Level Repository Layout

Primary directories:

- `backend/`: API server, services, models, database clients, background tasks, tests
- `website/`: Next.js marketing site and dashboard
- `desktop/`: Vite/React app plus Tauri Rust application
- `extension-chrome/`: browser extension for web activity capture
- `docs/`: protocol/spec documents
- `Markdown/`: large product/specification documents
- `scripts/`: operational and data-seeding scripts
- `tests/`: additional root-level tests
- `infra/`: Kubernetes and deployment manifests

## 3. Runtime Orchestration

### 3.1 Main launcher

Primary launcher:
- [start-minime.sh](/home/ansari/Documents/MiniMe/start-minime.sh)

Observed orchestration behavior:

- Loads environment from root `.env` if present
- Starts infrastructure dependencies through Docker
- Starts the FastAPI backend locally via `uvicorn`
- Starts the Next.js website via `npm run dev`
- Starts the desktop app through `npm run tauri:dev`
- Starts the Python system activity tracker from `desktop/minime-tracker.py`

Key implementation references:
- [start-minime.sh:16-18](/home/ansari/Documents/MiniMe/start-minime.sh:16)
- [start-minime.sh:142-162](/home/ansari/Documents/MiniMe/start-minime.sh:142)
- [start-minime.sh:182-220](/home/ansari/Documents/MiniMe/start-minime.sh:182)

### 3.2 Local infrastructure stack

Primary compose file:
- [docker-compose.yml](/home/ansari/Documents/MiniMe/docker-compose.yml)

Services:

- PostgreSQL
  - [docker-compose.yml:4-23](/home/ansari/Documents/MiniMe/docker-compose.yml:4)
- Neo4j
  - [docker-compose.yml:25-48](/home/ansari/Documents/MiniMe/docker-compose.yml:25)
- Redis
  - [docker-compose.yml:50-65](/home/ansari/Documents/MiniMe/docker-compose.yml:50)
- Qdrant
  - [docker-compose.yml:67-88](/home/ansari/Documents/MiniMe/docker-compose.yml:67)
- Optional backend container definition
  - [docker-compose.yml:90-121](/home/ansari/Documents/MiniMe/docker-compose.yml:90)

Actual development pattern:

- The repo includes a backend container definition.
- The main launcher starts infra containers but runs the backend app locally from the Python venv.

## 4. Backend Architecture

### 4.1 Entry point

Backend entry point:
- [backend/main.py](/home/ansari/Documents/MiniMe/backend/main.py)

Responsibilities:

- Initializes FastAPI app
- Configures lifecycle and dependency startup
- Adds middleware
- Registers REST routers
- Exposes health endpoints
- Exposes WebSocket endpoints

Key references:
- app creation: [backend/main.py:96-104](/home/ansari/Documents/MiniMe/backend/main.py:96)
- middleware: [backend/main.py:111-151](/home/ansari/Documents/MiniMe/backend/main.py:111)
- router mounting: [backend/main.py:272-342](/home/ansari/Documents/MiniMe/backend/main.py:272)
- websocket channel: [backend/main.py:347-414](/home/ansari/Documents/MiniMe/backend/main.py:347)

### 4.2 Backend lifecycle

The backend startup lifecycle in `lifespan()` attempts to initialize:

- PostgreSQL
- Neo4j
- Redis
- Qdrant
- sync scheduler

Reference:
- [backend/main.py:27-93](/home/ansari/Documents/MiniMe/backend/main.py:27)

Behavioral note:

- PostgreSQL is treated as the core required database.
- Neo4j, Redis, and Qdrant are started as optional/non-fatal services in development.

### 4.3 Backend configuration layer

Configuration module:
- [backend/config/settings.py](/home/ansari/Documents/MiniMe/backend/config/settings.py)

Configuration domains:

- app metadata
- JWT/auth configuration
- PostgreSQL connection
- Neo4j connection
- Redis connection
- Qdrant connection
- cloud sync databases
- Celery
- embeddings/NLP
- CORS
- OAuth integration redirect URIs

Key references:
- [backend/config/settings.py:12-150](/home/ansari/Documents/MiniMe/backend/config/settings.py:12)

### 4.4 Backend router architecture

Mounted route families in [backend/main.py:289-342](/home/ansari/Documents/MiniMe/backend/main.py:289):

- `/api/v1/auth`
- `/api/v1/users`
- `/api/v1/activities`
- `/api/v1` + activity ingestion routes
- `/api/v1/entities`
- `/api/v1/enrichment`
- `/api/v1/graph`
- `/api/v1/analytics`
- `/api/v1/realtime`
- `/api/settings`
- `/api/ai`
- `/api/v1` WebSocket stream routes
- `/api/v1/screenshots`
- `/api/v1/wearables`
- `/api/v1/billing`
- `/api/v1/content`
- `/api/v1/documents`
- cloud backup/sync/export/account/admin routes

Architecturally, the backend is organized in three API layers:

1. `backend/api/v1/`
   - most REST endpoints
2. `backend/api/`
   - settings and AI/chat routers outside `v1`
3. `backend/websocket/`
   - websocket-specific endpoint and manager code

### 4.5 Backend domain layering

The backend codebase roughly follows this structure:

- `api/`: HTTP/WebSocket transport layer
- `auth/`: JWT and password functions
- `database/`: DB clients and session management
- `models/`: SQLAlchemy and model groupings
- `services/`: business/domain logic
- `tasks/`: Celery/background task entrypoints
- `monitoring/`: metrics/health/sentry helpers

This is a fairly typical service-layer FastAPI architecture:

```text
Route handler
  -> auth/dependency resolution
  -> service layer
  -> database clients / model access
  -> response model / DTO
```

### 4.6 Backend persistence architecture

#### PostgreSQL

Module:
- [backend/database/postgres.py](/home/ansari/Documents/MiniMe/backend/database/postgres.py)

Role:
- primary relational store
- users, activities, entities, sessions, settings, billing-like state, sync metadata

#### Neo4j

Module:
- [backend/database/neo4j_client.py](/home/ansari/Documents/MiniMe/backend/database/neo4j_client.py)

Role:
- knowledge graph storage
- graph exploration/intelligence
- relationships and graph analytics

#### Redis

Module:
- [backend/database/redis_client.py](/home/ansari/Documents/MiniMe/backend/database/redis_client.py)

Role:
- caching
- counters
- pub/sub
- queue-related behavior

#### Qdrant

Module:
- [backend/database/qdrant_client.py](/home/ansari/Documents/MiniMe/backend/database/qdrant_client.py)

Role:
- vector storage
- embedding similarity search
- semantic retrieval

### 4.7 Backend service domains

The service layer is broad. The main clusters visible in `backend/services/` are:

- activity capture and dedup
- enrichment and NLP
- entity normalization/deduplication
- graph ingestion and graph intelligence
- analytics and productivity metrics
- conversation/AI/RAG/export
- cloud sync and backup
- privacy/settings/notifications
- billing/integrations/wearables

Representative modules:

- `activity_dedup.py`
- `enrichment_pipeline.py`
- `entity_deduplication.py`
- `graph_ingestion.py`
- `graph_intelligence_service.py`
- `productivity_metrics_service.py`
- `rag_service.py`
- `cloud_sync.py`
- `privacy_settings_service.py`
- `wearable_service.py`

### 4.8 WebSocket architecture

There are two WebSocket-related paths:

1. Inline dashboard websocket in [backend/main.py:373-414](/home/ansari/Documents/MiniMe/backend/main.py:373)
2. Additional stream router under `backend/websocket/`

Supporting modules:

- [backend/websocket/stream_endpoint.py](/home/ansari/Documents/MiniMe/backend/websocket/stream_endpoint.py)
- [backend/websocket/manager.py](/home/ansari/Documents/MiniMe/backend/websocket/manager.py)
- [backend/websocket/activity_stream.py](/home/ansari/Documents/MiniMe/backend/websocket/activity_stream.py)

Role:

- push realtime activity/metrics/graph updates
- keep dashboard and possibly desktop clients live-updated

### 4.9 Background work architecture

The backend includes two async/background patterns:

1. In-process scheduler started during FastAPI lifespan
   - [backend/main.py:65-71](/home/ansari/Documents/MiniMe/backend/main.py:65)
   - `backend/services/sync_scheduler.py`
2. Celery-style task modules
   - `backend/tasks/`
   - `backend/celery_app.py`

Task domains include:

- entity tasks
- embedding tasks
- community/centrality tasks
- inference tasks
- scheduled reports
- wearable sync

## 5. Website Architecture

### 5.1 Framework and shell

Website root:
- [website/src/app/layout.tsx](/home/ansari/Documents/MiniMe/website/src/app/layout.tsx)

Framework:
- Next.js app router

Observed shell responsibilities:

- global fonts
- metadata
- global CSS
- providers
- theme provider

References:
- [website/src/app/layout.tsx:1-72](/home/ansari/Documents/MiniMe/website/src/app/layout.tsx:1)

### 5.2 Website application structure

The website contains two major surfaces:

1. marketing/public pages
   - landing
   - features
   - pricing
   - docs
   - about
   - faq
   - waitlist
2. dashboard pages
   - overview
   - productivity
   - graph
   - knowledge
   - chat
   - settings
   - billing
   - admin

The website is therefore not just a marketing site; it also acts as the main browser dashboard client for the backend.

### 5.3 Website data layer

Primary HTTP client:
- [website/src/lib/api.ts](/home/ansari/Documents/MiniMe/website/src/lib/api.ts)

Pattern:

- central Axios client
- token persistence
- auth error handling
- hook-based data access in `website/src/lib/hooks/`

Main client-facing architecture:

```text
Page / Component
  -> React Query hook
  -> API client
  -> FastAPI backend
```

### 5.4 Website server routes

The website also includes Next.js server routes under `website/src/app/api/`, for example:

- `/api/health`
- `/api/waitlist`

This means the website has both:

- direct frontend-to-backend API consumption
- small local website-side API endpoints for selected actions

## 6. Desktop Architecture

### 6.1 Desktop UI shell

Desktop UI entry:
- [desktop/src/main.tsx](/home/ansari/Documents/MiniMe/desktop/src/main.tsx)

Shell responsibilities:

- React root
- React Query provider
- top-level error boundary

Desktop app shell:
- [desktop/src/App.tsx](/home/ansari/Documents/MiniMe/desktop/src/App.tsx)

Observed desktop UI architecture:

- React Router-based app
- Settings and Chat context providers
- toast/error-boundary providers
- a first-run/auth initialization wrapper
- shared `MainLayout`

Primary routes:

- `/`
- `/analytics`
- `/projects`
- `/papers`
- `/knowledge-graph`
- `/tasks`
- `/entities`
- `/knowledge`
- `/chat`
- `/settings`
- `/help`
- `/setup`
- `/oauth/callback`

References:
- [desktop/src/App.tsx:25-66](/home/ansari/Documents/MiniMe/desktop/src/App.tsx:25)
- [desktop/src/App.tsx:85-128](/home/ansari/Documents/MiniMe/desktop/src/App.tsx:85)

### 6.2 Desktop native/Tauri layer

Tauri bootstrap:
- [desktop/src-tauri/src/main.rs](/home/ansari/Documents/MiniMe/desktop/src-tauri/src/main.rs)
- [desktop/src-tauri/src/lib.rs](/home/ansari/Documents/MiniMe/desktop/src-tauri/src/lib.rs)

Tauri native modules registered in `lib.rs`:

- tracker
- platform
- database
- encryption
- sync
- privacy
- polling
- input
- settings
- ai_chat
- commands
- screenshot
- tray
- focus_timer
- local_search
- setup

This makes the desktop app a hybrid architecture:

```text
React UI
  <-> Tauri commands
       <-> local SQLite-ish/native DB layer
       <-> OS activity/input tracking
       <-> sync manager
       <-> privacy filter
       <-> screenshots / tray / focus timer
```

### 6.3 Desktop application state

Native app state in `desktop/src-tauri/src/lib.rs` includes:

- `ActivityManager`
- `Database`
- `SyncManager`
- `PrivacyFilter`
- `PollingTask`
- `InputMonitor`
- `FocusDetector`
- `SettingsManager`
- `AIChatManager`
- `ScreenshotManager`
- `FocusTimer`

Reference:
- [desktop/src-tauri/src/lib.rs:91-104](/home/ansari/Documents/MiniMe/desktop/src-tauri/src/lib.rs:91)

### 6.4 Desktop responsibilities

The desktop stack is responsible for two different roles:

1. UI client
   - dashboards, settings, chat, graph, knowledge views
2. local system capture/runtime
   - tracking app/window/input behavior
   - storing local state
   - syncing local activity to backend

That is an important architectural distinction: the desktop app is both a consumer UI and a producer of activity data.

## 7. Browser Extension Architecture

### 7.1 Extension shell

Manifest:
- [extension-chrome/manifest.json](/home/ansari/Documents/MiniMe/extension-chrome/manifest.json)

The extension uses:

- Manifest V3
- background service worker
- content scripts on all URLs
- popup UI
- options/settings page
- storage/alarms/webNavigation/contextMenus/nativeMessaging permissions

### 7.2 Extension runtime components

Main components:

- background worker
  - [extension-chrome/background/service-worker.js](/home/ansari/Documents/MiniMe/extension-chrome/background/service-worker.js)
- tab tracker
  - `background/tab-tracker.js`
- queue/sync/storage libs
  - `lib/activity-queue.js`
  - `lib/sync.js`
  - `lib/storage.js`
  - `lib/queue-storage.js`
- content extraction and activity detection
  - `content/activity-detector.js`
  - `content/content-extractor.js`
  - `content/code-block-extractor.js`

### 7.3 Extension role in the architecture

The extension is an activity producer. It captures:

- web visits
- page activity
- content extraction
- search/media/social/meeting signals

Then it syncs that data to the backend ingestion routes.

Architecturally:

```text
Web page
  -> content script detectors
  -> background queue/storage
  -> sync manager / batch sender
  -> FastAPI ingestion API
```

## 8. Data Flow Architecture

### 8.1 Activity ingestion flow

Primary ingestion sources:

- browser extension
- desktop tracker / desktop sync
- website/dashboard actions
- possibly wearable and cloud integrations

Flow:

```text
Source event
  -> API route or local queue
  -> backend ingestion route
  -> PostgreSQL activity storage
  -> enrichment / entity extraction
  -> entity storage
  -> graph updates in Neo4j
  -> embeddings in Qdrant
  -> analytics recomputation / websocket notifications
```

### 8.2 Analytics flow

Analytics consumption path:

```text
PostgreSQL activities
  + entities / graph / screenshots / wearables
  -> analytics services
  -> API routes
  -> website dashboard / desktop dashboard
```

### 8.3 AI / retrieval flow

AI/RAG-related path:

```text
Activity data + content records + vectors
  -> backend AI/chat routes
  -> retrieval services / embedding services
  -> model adapter / AI manager
  -> website chat / desktop chat
```

### 8.4 Sync / backup flow

Cloud sync architecture present in code:

- local backend/local DB as source of truth for active user runtime
- optional push/pull to cloud providers
- encrypted export/import paths

Exposed domains:

- cloud backup
- sync scheduling
- export/import

## 9. Security and Auth Architecture

### 9.1 Backend auth

Modules:

- [backend/auth/jwt_handler.py](/home/ansari/Documents/MiniMe/backend/auth/jwt_handler.py)
- [backend/auth/password.py](/home/ansari/Documents/MiniMe/backend/auth/password.py)

Pattern:

- JWT access/refresh tokens
- password hashing
- per-route dependencies
- session/device concepts in backend auth routes

### 9.2 Client auth surfaces

Auth consumers:

- website auth client under `website/src/lib/auth.ts`
- desktop auth service under `desktop/src/services/auth.ts`
- extension sync/login functions under `extension-chrome/lib/sync.js`

This means auth is shared conceptually, but implemented independently across multiple clients.

## 10. Deployment Architecture

The repo contains multiple deployment targets:

- local Docker Compose
- Vercel-related website config
- Render/backend deployment hints
- Kubernetes manifests under `infra/k8s/`
- packaging scripts for desktop distribution

This implies a multi-target deployment architecture:

1. Local developer stack
2. Web-hosted marketing/dashboard deployment
3. Packaged desktop application
4. Optional container/orchestrated backend deployment

## 11. Actual Architectural Characteristics

### Strengths

- clear separation between backend, website, desktop, and extension
- backend has recognizable transport/service/database layering
- desktop has a meaningful local-native architecture, not just a wrapped webview
- multiple persistence backends match product goals:
  - relational
  - graph
  - cache/queue
  - vector

### Complexity drivers

- several clients target the same backend with partially divergent assumptions
- desktop is both client and local capture runtime
- extension and desktop both produce activity streams
- cloud sync/export/AI/features expand the backend into many bounded contexts

### Current reality

The architecture is best described as:

- one central Python backend
- two major first-party UI clients
  - website
  - desktop
- one first-party capture extension
- one local infrastructure cluster
- one hybrid local/native desktop runtime

## 12. Architecture Diagram

```text
                                 +----------------------+
                                 |   Website (Next.js)  |
                                 | marketing + dashboard|
                                 +----------+-----------+
                                            |
                                            | HTTPS / WS
                                            v
 +----------------------+         +---------+----------+         +----------------------+
 | Browser Extension    |-------> |   FastAPI Backend  | <------ | Desktop React UI     |
 | content + bg worker  | batch   | backend/main.py    |         | Vite + Router + RQ   |
 +----------+-----------+         +----+----+----+-----+         +----------+-----------+
            |                          |    |    |                            |
            | local queue/storage      |    |    |                            | Tauri commands
            v                          |    |    |                            v
 +----------------------+              |    |    |                 +----------------------+
 | IndexedDB / ext libs |              |    |    |                 | Tauri Native Layer   |
 +----------------------+              |    |    |                 | tracking/sync/localdb|
                                       |    |    |                 +----------+-----------+
                                       |    |    |                            |
                                       v    v    v                            |
                                 +-----+ +--+--+ +------+                     |
                                 | PG  | |Neo4j| |Redis |                     |
                                 +-----+ +-----+ +------+                     |
                                       \     |      /                         |
                                        \    |     /                          |
                                         \   |    /                           |
                                          v  v   v                            |
                                           +------+                           |
                                           |Qdrant| <-------------------------+
                                           +------+
```

## 13. Recommended Use of This Document

Use this document as the source-of-truth architecture map for:

- onboarding
- debugging cross-surface issues
- deciding where a bug belongs
- understanding why website/desktop/extension behavior can diverge

Do not rely on the large `Markdown/` spec documents for runtime architecture without cross-checking them against this code-grounded map.
