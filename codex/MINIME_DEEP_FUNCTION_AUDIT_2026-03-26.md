# MiniMe Deep Function Audit

Date: 2026-03-26

Artifacts generated for this pass:
- `codex/MINIME_CODE_AUDIT_2026-03-26.md`
- `codex/MINIME_DEEP_FUNCTION_AUDIT_2026-03-26.md`
- `codex/python_function_inventory.txt`
- `codex/frontend_endpoint_inventory.txt`
- `codex/backend_targeted_pytest.log`
- `codex/website_build.log`
- `codex/desktop_build.log`

## Method

This pass went deeper than the first audit:

- Started from `start-minime.sh` and traced the runtime paths.
- Enumerated Python functions across `backend/`, `scripts/`, and `tests/`.
- Searched frontend, desktop, and extension code for endpoint usage and hard-coded backend assumptions.
- Ran targeted verification:
  - backend tests: failed at bootstrap
  - website production build: passed with warnings
  - desktop production build: passed with warnings

Important constraint:
- I can honestly claim a full function inventory and broad static sweep.
- I cannot honestly claim formal semantic proof of all `2243` Python functions in one turn.
- I can claim that the critical runtime paths, route consumers, startup logic, and the most inconsistency-prone functions were checked in detail and backed by runtime evidence where possible.

## Verification Results

### Backend tests

Artifact:
- `codex/backend_targeted_pytest.log`

Observed result:
- The targeted backend test run does not reach the tests.
- It fails during `conftest` import.

Root cause:
- `backend/tests/conftest.py:11` imports `from main import app`
- The application entrypoint is `backend/main.py`, not a top-level `main.py`

Impact:
- Backend test bootstrap is broken from the repo root.
- Any CI or local test run using this conftest will fail before test execution.

### Website build

Artifact:
- `codex/website_build.log`

Observed result:
- Build succeeds.
- Warnings are emitted for missing `metadataBase`.

Root cause:
- `website/src/app/layout.tsx:26-38` defines metadata but omits `metadataBase`

Impact:
- Open Graph and related image URLs are resolved against `http://localhost:3000` during build-time fallback.
- This is not a compile failure, but it is a deployment-quality issue.

### Desktop build

Artifact:
- `codex/desktop_build.log`

Observed result:
- Build succeeds.
- Vite warns that `@tauri-apps/api/core.js` is both dynamically and statically imported.
- Output bundle is very large.

Impact:
- This is not an immediate runtime failure.
- It indicates chunking/code-splitting problems and raises the chance of slower startup and more brittle bundling behavior.

## High-Signal Function-Level Findings

### 1. Test bootstrap is broken before any backend test runs

Files:
- `backend/tests/conftest.py:11`
- `backend/main.py`

Details:
- `backend/tests/conftest.py` imports `from main import app`
- The app is defined in `backend/main.py`

Why this matters:
- This is a direct import bug in a function-support path, not a test-data issue.
- The failure is verified in `codex/backend_targeted_pytest.log`

### 2. Desktop hooks call a non-existent entity endpoint

Files:
- `desktop/src/lib/hooks/useApi.ts:119-125`
- `desktop/src/lib/hooks/useApi.ts:152-158`
- `backend/api/v1/entities.py:32-39`

Details:
- `useKnowledgeGraph()` calls `/api/v1/entities/entities?limit=50`
- `usePapers()` calls `/api/v1/entities/entities?limit=20`
- The backend entity list route is mounted at `/api/v1/entities/`

Impact:
- These hooks should 404.
- This is a concrete consumer-function bug.

### 3. Desktop sync functions call a real route with the wrong payload shape

Files:
- `desktop/src/lib/hooks/useApi.ts:163-183`
- `backend/api/v1/activities.py:248-290`

Details:
- `useToggleTracking()` and `useSyncNow()` both call `POST /api/v1/activities/sync` with no request body.
- The backend route expects `batch: ActivityBatchSync` and iterates `for act in batch.activities`

Impact:
- These mutations should fail validation or 422.
- The route exists, but the caller contract is wrong.

### 4. Desktop graph service uses the wrong auth token key

Files:
- `desktop/src/services/api.ts:68-78`
- `desktop/src/services/graphAPI.ts:72-77`

Details:
- The main desktop client stores auth under `minime_auth_token`
- `GraphAPIService.getAuthHeaders()` reads `auth_token`

Impact:
- Graph requests can be unauthorized while the rest of the desktop app appears logged in.

### 5. Desktop API base configuration is split across incompatible env names

Files:
- `start-minime.sh:391-397`
- `desktop/src/services/api.ts:4`
- `desktop/src/services/auth.ts:12`
- `desktop/src/services/graphAPI.ts:8`
- `desktop/src/services/entityAPI.ts:7`
- `desktop/src/pages/Knowledge.tsx:36`

Details:
- Launcher creates `VITE_API_URL`
- Main API client expects `VITE_API_BASE_URL`
- Auth service expects `VITE_API_BASE_URL`
- Graph service expects `VITE_API_URL`
- Entity service expects `VITE_BACKEND_URL`
- Knowledge page hard-codes `http://localhost:8000`

Impact:
- Desktop functions are not reading a single coherent backend base URL.
- Different parts of the app can target different backends or fall back differently.

### 6. Website weekly-summary functions are out of contract with the backend

Files:
- `website/src/lib/hooks/useWeeklySummary.ts:27-40`
- `website/src/lib/hooks/useWeeklySummary.ts:43-80`
- `backend/api/v1/analytics.py:1304-1309`

Details:
- The hook calls `/api/v1/analytics/summary/weekly?date=...`
- The backend route accepts `week_offset`, not `date`
- The hook for history generates fake digest entries client-side instead of fetching persisted history
- `emailWeeklySummary()` calls `/api/v1/analytics/summary/weekly/email`, but only `GET /summary/weekly` exists

Impact:
- A selected date may not do what the UI implies.
- Digest history is synthetic, not real.
- Email-send action points at a missing route.

### 7. Website plugin gallery calls AI plugin routes under the wrong prefix

Files:
- `website/src/components/FeaturePanels.tsx:251-283`
- `backend/api/ai_chat.py:60`
- `backend/api/ai_chat.py:1497-1557`

Details:
- Frontend calls `/api/v1/ai/plugins`
- Backend mounts plugin routes under `/api/ai/plugins`

Impact:
- Plugin list/create/toggle/delete functions are broken.

### 8. Waitlist behavior is split across two incompatible implementations

Files:
- `website/src/app/waitlist/page.tsx:24-31`
- `website/src/app/api/waitlist/route.ts:3-18`
- `website/src/components/FooterNewsletter.tsx:10-33`
- `backend/api/v1/waitlist.py:32-80`

Details:
- The waitlist page posts directly to `http://localhost:8000/api/v1/waitlist`
- The footer newsletter posts to `/api/waitlist` on the Next.js app
- The Next.js API route only validates `email`, logs it, and returns success
- The backend waitlist route logs submissions, returns a fixed position, and does not persist anything

Impact:
- There are two different fake waitlist paths.
- One is localhost-bound and unsuitable for deployment.
- The other is server-local but still a stub.
- The product behavior is inconsistent depending on which function the user touches.

### 9. Website metadata references a missing Apple icon file

Files:
- `website/src/app/layout.tsx:29-32`
- asset check result: only `website/src/app/apple-icon.png` exists

Details:
- Metadata points Apple icon to `/apple-touch-icon.png`
- The actual app asset present is `apple-icon.png`

Impact:
- Apple touch icon metadata is inconsistent with the file set.
- The build still succeeds, but the asset reference is wrong.

### 10. Website docs page documents routes that do not exist as written

Files:
- `website/src/app/docs/page.tsx:73-77`
- `website/src/app/docs/page.tsx:115-126`
- `backend/api/v1/graph.py`
- `backend/api/v1/analytics.py:1304`

Details:
- Docs advertise `/api/v1/graph/edges`
- Docs advertise `/api/v1/analytics/focus`
- Docs advertise `/api/v1/analytics/summary/weekly/email`
- The backend graph API exposes different shapes like `/api/v1/graph/visualization` and `/api/v1/graph/nodes/{node_id}`
- The analytics router exposes `GET /summary/weekly`, not the documented email route

Impact:
- The docs page is not a reliable contract source.

### 11. Extension sync behavior depends on two offsetting URL mismatches

Files:
- `extension-chrome/background/service-worker.js:18-25`
- `extension-chrome/lib/activity-queue.js:239-248`
- `extension-chrome/lib/sync.js:61-68`

Details:
- The queue-backed path passes `apiBaseUrl: 'http://localhost:8000/api'`
- `ActivityQueue.flush()` posts to `${apiBaseUrl}/v1/activities/batch`
- The legacy `SyncManager.sync()` posts to `${API_URL}/api/v1/activities/batch`

Impact:
- The queue path only works because one function uses `/api` as base and another appends `/v1/...`
- This is fragile coupling rather than a clean API contract

### 12. Desktop integration service exposes functions for routes the backend does not implement

Files:
- `desktop/src/services/integrationAPI.ts:100-123`
- `desktop/src/services/integrationAPI.ts:174-183`
- `desktop/src/services/integrationAPI.ts:230-238`
- `backend/api/v1/integrations.py`

Details:
- Desktop service defines:
  - `getGitHubRepos()` -> `/api/integrations/github/repos`
  - `trackGitHubRepo()` -> `/api/integrations/github/repos/track`
  - `untrackGitHubRepo()` -> `/api/integrations/github/repos/{repo}`
  - `getGoogleCalendars()` -> `/api/integrations/google/calendars`
  - `getNotionDatabases()` -> `/api/integrations/notion/databases`
- I searched `backend/api/v1/integrations.py` and found no route definitions for those paths

Impact:
- These consumer functions are dead code against the current backend.

### 13. Readiness remains misleading in the deeper pass

Files:
- `backend/main.py:218-252`

Details:
- `readiness_check()` verifies PostgreSQL
- It marks Neo4j, Redis, and Qdrant healthy without checking them

Impact:
- Function-level health semantics are still wrong.
- This is especially problematic because multiple frontend/dashboard functions depend on graph/vector/cache features.

### 14. Startup script still has launcher/documentation drift

Files:
- `start-minime.sh:102-107`
- `start-minime.sh:124-129`
- `start-minime.sh:531-545`

Details:
- Help examples imply one default
- Actual default starts backend + website + desktop
- Actual desktop launch always runs Tauri

Impact:
- Startup behavior remains misleading for the core launch function.

## Additional Observations

### Hard-coded localhost assumptions remain widespread

Artifact:
- `codex/frontend_endpoint_inventory.txt`

Pattern:
- Many website, desktop, and extension functions still assume `http://localhost:8000`
- Some of these are reasonable for explicitly local products
- Some are not reasonable for website flows that can be deployed remotely

Most problematic cases:
- `website/src/app/waitlist/page.tsx`
- `website/src/lib/hooks/useCloudSync.ts`
- `desktop/src/pages/Knowledge.tsx`

### Raw function inventory is available

Artifact:
- `codex/python_function_inventory.txt`

Summary:
- The inventory found `TOTAL_FUNCTIONS=2243`
- This includes backend code, scripts, and test functions

Use:
- It provides a traceable per-file function listing for follow-up audits

## Most Important Fixes Now

1. Fix `backend/tests/conftest.py` import so backend tests can run.
2. Unify desktop backend env vars and auth-token storage keys.
3. Fix desktop hooks using `/api/v1/entities/entities`.
4. Fix desktop sync mutations to send the required batch payload.
5. Align website weekly-summary hooks with actual analytics routes.
6. Fix website plugin gallery to use `/api/ai/plugins`.
7. Collapse the waitlist into one real implementation instead of two separate stubs.
8. Correct website metadata for `metadataBase` and Apple icon path.
9. Remove or implement the desktop integration functions that point at nonexistent backend routes.
10. Normalize extension sync base URLs so they do not rely on offsetting path mistakes.

## Bottom Line

The deeper pass confirms the first audit and adds stronger evidence:

- there are real runtime-contract bugs at the function level
- the backend test harness is broken
- several frontend and desktop functions call wrong or nonexistent routes
- multiple parts of the product still rely on stubs or synthetic data while presenting real behavior

The repo is not just suffering from documentation drift; several live consumer functions are wired to the wrong backend contract.
