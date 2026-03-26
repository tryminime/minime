# MiniMe Scope Audit: Markdown Specification vs Current Build

> Audit date: March 11, 2026 — updated to reflect 9 new features completed: knowledge decay, semantic clustering, custom entity types, voice I/O, plugin system, community detection, predictive forecasting, multi-language NER, and spaCy+BERT pipeline

## Summary

The Markdown folder contains 11 specification documents (~400,000 words) defining MiniMe as a **150+ feature platform across 14 modules**, spanning Personal and Enterprise tiers, 3 client platforms, and 4 databases. The current codebase implements a meaningful subset of the Personal tier, with a working backend, dashboard, browser extensions, and marketing website. No Enterprise-tier code exists yet.

---

## What Exists in the Codebase Today

### Backend (`backend/` — FastAPI, 182 files)
| Component | Status |
|-----------|--------|
| FastAPI application | ✅ Running |
| PostgreSQL (via SQLAlchemy) | ✅ Working |
| Neo4j (knowledge graph) | ✅ Working |
| Qdrant (vector embeddings) | ✅ Working |
| Redis (cache/sessions) | ✅ Working |
| JWT authentication | ✅ Working |
| Activity API (`/api/v1/activities/`) | ✅ Working |
| AI chat (SSE via `/api/v1/ai/chat`) | ✅ Working |
| Knowledge Graph API | ✅ Working |
| Analytics API | ✅ Working |
| Enrichment pipeline | ✅ Working |
| Celery task queue | ✅ Working |

### Desktop App (`desktop/` — Tauri 2.0, 115 files)
- Tauri + Rust daemon for passive window tracking
- System tray integration
- macOS/Windows/Linux support
- Local SQLite buffering
- Auto-start on login

### Browser Extensions (3 extensions)
| Extension | Status |
|-----------|--------|
| Chrome (Manifest V3) | ✅ Published-ready |
| Firefox (Manifest V2) | ✅ Published-ready |
| Edge (Manifest V3) | ✅ Published-ready |
| Safari | ❌ Not started |

### Dashboard (`website/src/app/dashboard/` — 17 views)
Activity Timeline, AI Chat, Collaboration, Enrichment, Goals, Knowledge Graph, Overview, Productivity, Settings, Skills, Tasks, Weekly Digest, Wellness, Career, Billing, and more.

### Marketing Website (19 public pages)
Homepage, About, Features, Pricing, Docs, FAQ, Install, Investors, Blog, Changelog, Contact, Whitepaper, Privacy, Status, Waitlist, Legal/Terms, Legal/Privacy (redirect), Auth pages.

### Infrastructure
- Docker Compose (dev environment)
- Dockerfile, Dockerfile.celery, Dockerfile.graph
- Prometheus, Grafana, Alertmanager configs
- HAProxy config
- Neo4j cluster compose
- Qdrant compose
- CI/CD via GitHub Actions

---

## Module-by-Module Comparison

### Personal Tier (Spec: 60 features across 7 modules)

#### Module 1: Activity Capture (Spec: 15 features)

| Feature | Spec | Built | Notes |
|---------|------|-------|-------|
| Desktop window tracking | ✅ | ✅ | Tauri daemon, 1Hz polling |
| App usage time tracking | ✅ | ✅ | Via activity aggregation |
| Title capture (privacy-filtered) | ✅ | ✅ | Working |
| Keystroke rate monitoring | ✅ | ❌ | Not implemented |
| Mouse activity patterns | ✅ | ❌ | Not implemented |
| Break detection | ✅ | ✅ | `BreakDetector` in Tauri (idle-to-active tracking, configurable threshold, break counting), `GET /productivity/break-classification` endpoint (micro/short/medium/long/extended + natural/scheduled/forced types, work-break ratio, optimal break score), `BreakClassificationPanel` in dashboard |
| Idle time tracking | ✅ | ✅ | Working |
| Screenshot on-demand (encrypted) | ✅ | ✅ | Full `ScreenshotManager` in Tauri — AES-256-GCM encrypted PNG, SQLite storage, metadata (app context, labels, dimensions), 7 Tauri commands (capture/list/get/delete/purge/monitors), `GET /screenshots/meta` backend endpoint, `ScreenshotTimelinePanel` in dashboard |
| Focus period detection | ✅ | ✅ | `FocusDetector` in Tauri (4-tier: DeepWork/Focused/Moderate/Shallow, 0-100 quality scoring, session history, streak tracking), `GET /productivity/focus-periods` endpoint (5-tier: shallow/moderate/focused/deep_work/flow_state + distraction tracking + quality penalty), `FocusPeriodsPanel` in dashboard |
| Offline queueing | ✅ | ✅ | SQLite buffer |
| Web URL/domain tracking | ✅ | ✅ | Browser extensions |
| Time on page / reading time | ✅ | ✅ | Scroll depth, read %, word count, dwell time. Desktop tracker now sends `reading_analytics` type via Python tracker |
| Social media detection | ✅ | ✅ | 18+ platforms (Facebook, Twitter/X, Instagram, LinkedIn, Reddit, TikTok, etc.) via `activity-detector.js` content script |
| Video watching (YouTube) | ✅ | ✅ | YouTube, Twitch, Netflix, Vimeo, Disney+, Prime Video — captures title, channel, watch %, duration |
| Search query capture | ✅ | ✅ | 12 engines (Google, Bing, DuckDuckGo, Yahoo, Brave, etc.) — captures query, result clicks, time on results |

**Score: 13/15 fully built, 0 partial, 2 not started** _(was 10/15 on March 11)_

> [!IMPORTANT]
> The spec also defines **Mobile Activity Capture** (features 21-30) via React Native and **Wearable Integration** (features 31-40) via Fitbit/Apple Health/Oura. Neither exists in any form. These are Phase 2 items.

#### Module 2: Data Enrichment & NER (Spec: 12 features)

| Feature | Spec | Built | Notes |
|---------|------|-------|-------|
| Entity extraction from window titles | ✅ | ✅ | Via AI enrichment pipeline |
| Project/skill extraction | ✅ | ✅ | Working |
| Organization extraction | ✅ | ✅ | 100+ domains mapped, org_type/industry/confidence per entity, `classify_domain_org()` pattern classifier for unknown domains (edu/gov/news/research/finance/open_source/generic) |
| Relationship inference | ✅ | ✅ | Co-occurrence, 5 ORGANIZATION entity pairs, temporal `USED_TOGETHER` (session window), `LEARNED_FROM` (reading from educational org), `CONTRIBUTED_TO` (GitHub coding), `WORKED_ON` (app focus) |
| Context enrichment | ✅ | ✅ | Via LLM prompts |
| Auto-tagging | ✅ | ✅ | Working |
| Entity deduplication | ✅ | ✅ | Union-Find graph clustering, 5-signal matching (embedding, external-ID, Levenshtein, token-set, alias cross-match), `scan_all_for_user()` batch scan, `merge_cluster()` N-way merge, 2 new API endpoints, full frontend cluster UI |
| Confidence scoring | ✅ | ✅ | Tiered per extraction method (0.55–0.95); confidence thresholds applied per relationship type |
| Multi-language support | ✅ | ✅ | `langdetect` + HuggingFace `bert-base-multilingual-cased-ner-hrl` + spaCy multingual fallback |
| spaCy+BERT NER pipeline | ✅ | ✅ | Hybrid architecture using `SpacyBertNER` service with huggingface pipelines and spaCy models |
| Custom entity type definitions | ✅ | ✅ | CRUD API for user-defined entity types (name, color, icon) + frontend manager in enrichment page |
| Temporal pattern recognition | ✅ | ✅ | Session-based (30-min window), weekly patterns, `infer_from_activity_sequence()` |

**Score: 12/12 fully built** _(was 10/12 — multi-language + spaCy/BERT NER added)_

> [!NOTE]
> `ORGANIZATION` node type and `LEARNED_FROM` / `USED_TOGETHER` relationship types added to `graph_models.py`. Pre-existing syntax error in `RelationshipProperties` also fixed.

#### Module 3: Knowledge Graph (Spec: 15 features)

| Feature | Spec | Built | Notes |
|---------|------|-------|-------|
| Graph building (8 node types) | ✅ | ✅ | Neo4j with all 9 NodeTypes: PERSON, PROJECT, TOPIC, ORGANIZATION, INSTITUTION, TOOL, PAPER, DATASET, VENUE |
| Relationship creation | ✅ | ✅ | All RelationshipTypes including LEARNED_FROM and USED_TOGETHER |
| Edge weight calculation | ✅ | ✅ | Co-occurrence frequency + session strength |
| Temporal relationships | ✅ | ✅ | Edges carry timestamps; session-window inference |
| Graph visualization | ✅ | ✅ | Force-directed layout, node-type color legend, Graph Stats overlay |
| Graph filtering | ✅ | ✅ | Node type filter (9 types) + Relationship type filter (8 types incl. LEARNED_FROM/USED_TOGETHER) |
| Expertise discovery | ✅ | ✅ | Postgres-based skill profiling, ranking, gap analysis, expertise timeline via `graph_intelligence_service.py` → `/intelligence/expertise` API → Intelligence tab |
| Learning path recommendations | ✅ | ✅ | Category gap analysis, skill step ordering, priority/effort estimation → `/intelligence/learning-paths` API → Intelligence tab |
| Collaboration patterns | ✅ | ✅ | PERSON entity co-occurrence SQL analysis, strength scoring, pattern detection → `/intelligence/collaboration` API → Intelligence tab |
| Cross-domain connections | ✅ | ✅ | Bridge entity detection, Shannon diversity scoring, cross-type co-occurrence analysis → `/intelligence/cross-domain` API → Intelligence tab |
| PageRank expertise scoring | ✅ | ✅ | Iterative PageRank (d=0.85, 20 iterations) on entity co-occurrence graph → `/intelligence/pagerank` API → Intelligence tab |
| Graph-based recommendations | ✅ | ✅ | `get_recommendations()` combines PageRank trending + learning path gaps + cross-domain bridges → 4 categories (Trending Topic, Deepen Expertise, Bridge Gap, Explore Connection) → `GET /graph/recommendations` API |
| Community detection | ✅ | ✅ | `detect_communities()` via Label Propagation on entity co-occurrence graph → `GET /intelligence/communities` API → CommunitiesPanel in graph page |
| Knowledge decay modeling | ✅ | ✅ | `KnowledgeDecayService` — exponential decay, adjustable rates by occurrence count, freshness classification (fresh/fading/stale/forgotten) → `GET /knowledge/decay` + `GET /knowledge/decay/at-risk` APIs → KnowledgeFreshnessPanel |
| Semantic similarity clustering | ✅ | ✅ | `SemanticClusteringService` — DBSCAN on Qdrant embeddings, cluster coherence scoring, dominant type detection → `GET /knowledge/clusters` API → SemanticClustersPanel |

**Score: 15/15 fully built** _(was 12/15 — community detection, knowledge decay, semantic clustering added)_

#### Module 4: AI Assistant (Spec: 14 features)

| Feature | Spec | Built | Notes |
|---------|------|-------|-------|
| RAG-based Q&A | ✅ | ✅ | Qdrant + LLM, SSE streaming |
| Multi-turn conversations | ✅ | ✅ | Chat history maintained |
| Context awareness | ✅ | ✅ | Activity context injected |
| Source attribution | ✅ | ✅ | RAG citations streamed in SSE done event, expandable "N sources" list in chat page + ChatPopup |
| Daily summary generation | ✅ | ✅ | Weekly digest view |
| Weekly insights | ✅ | ✅ | Weekly digest dashboard |
| Proactive insights (push) | ✅ | ✅ | `proactive_insights_service.py` (6 insight types: focus, productivity, wellness, achievement, collaboration, learning), `GET /api/ai/insights` endpoint, `InsightsBanner` component fed from Postgres activity data |
| Milestone celebrations | ✅ | ✅ | `milestone_service.py` (16 milestones across 5 categories: activity count, entity count, hours tracked, focus streak, unique apps), `GET /api/ai/milestones` endpoint, `MilestonesBanner` with progress cards |
| Smart search (NL) | ✅ | ✅ | Dedicated `GET /api/ai/search` endpoint, `SearchPanel` with `useAISearch` hook, search button in chat header |
| Local LLM option (Ollama) | ✅ | ✅ | Configurable |
| Custom prompt templates | ✅ | ✅ | `PromptTemplateManager` with 5 builtins (Productivity Coach, Code Review, Weekly Summary, Creative Writing, Research Assistant) + user CRUD; `template_id` in `ChatRequest` → prefixes system prompt; `GET/POST/PUT/DELETE /api/ai/templates` |
| Scheduled report delivery | ✅ | ✅ | `scheduled_report_task.py` — Celery Beat at 09:00 UTC, SMTP delivery, HTML email template; user preferences (frequency, email, enabled); `celery_beat_schedule.py` entry added |
| Voice input/output | ✅ | ✅ | `VoiceInputButton` (Web Speech API → STT) + `SpeakButton` (SpeechSynthesis → TTS) in chat page; mic button next to send, speaker button on assistant messages |
| Plugin/extension system | ✅ | ✅ | `PluginManager` with 4 built-in plugins (Productivity Coach, Code Reviewer, Meeting Summarizer, Learning Tracker) + custom plugin CRUD; prompt-based modification for security; 5 API endpoints in `ai_chat.py`; `PluginGallery` sidebar in chat page |

**Score: 14/14 fully built** _(was 12/14 — voice I/O + plugin system added)_

#### Module 5: Personal Analytics (Spec: 10 features)

| Feature | Spec | Built | Notes |
|---------|------|-------|-------|
| Productivity metrics | ✅ | ✅ | Focus score, time breakdowns |
| Skill tracking | ✅ | ✅ | Skills dashboard view |
| Energy/wellbeing | ✅ | ✅ | Wellness dashboard view |
| Career analytics | ✅ | ✅ | Career dashboard view |
| Collaboration analytics | ✅ | ✅ | Collaboration view |
| Deep work tracking | ✅ | ✅ | Full session analysis: ≥25min blocks, daily aggregates, top apps, longest streak → `GET /productivity/deep-work-sessions` + `DeepWorkPanel` |
| Context switch analysis | ✅ | ✅ | Hourly/daily switch counts, A→B pattern tracking, peak hour detection → `GET /productivity/context-switch-timeline` + `ContextSwitchPanel` |
| Break patterns | ✅ | ✅ | Gap detection (5-120min), daily quality scoring (0-10), AI recommendations → `GET /productivity/break-patterns` + `BreakPatternsPanel` |
| Goal tracking with auto-progress | ✅ | ✅ | `GoalTrackingService` (632 lines), `goals.py` API router with 15 endpoints (CRUD, progress absolute/delta, complete/pause/resume/archive, stats, streaks, deadlines); all user-scoped via JWT |
| Predictive productivity forecasting | ✅ | ✅ | `PredictiveService` — linear regression on historical daily scores, weekly patterns, peak hour analysis, confidence-banded predictions → `GET /productivity/forecast` API → `ProductivityForecastPanel` with prediction bars + weekly pattern chart + peak hours |

**Score: 10/10 fully built** _(was 9/10 — predictive forecasting added)_

#### Module 6: Dashboards & Visualization (Spec: 4 features)

| Feature | Spec | Built | Notes |
|---------|------|-------|-------|
| Interactive dashboards | ✅ | ✅ | 14+ dashboard views built |
| Timeline visualization | ✅ | ✅ | Activity timeline view |
| Network graphs | ✅ | ✅ | Knowledge graph view |
| Report generation | ✅ | ✅ | `GET /analytics/report` → multi-section HTML report (8 stats, daily breakdown, top apps, deep work, context switches, break patterns) with print/PDF button; frontend 'Report' button in dashboard |

**Score: 4/4 fully built**

#### Module 7: Privacy & Settings (Spec: 3 features)

| Feature | Spec | Built | Notes |
|---------|------|-------|-------|
| Privacy controls | ✅ | ✅ | Settings page, local-first |
| Integration management | ✅ | ✅ | GitHub/Google/Notion + Slack/Jira — 5 live OAuth flows (initiate/callback/status/disconnect) |
| Notification preferences | ✅ | ✅ | Settings → Notifications tab: 4 sections (Delivery Channels, Insight Categories, Schedule w/ quiet hours, Digest Frequency); 10 prefs persisted via `GET/PUT /api/v1/users/me/preferences` |

**Score: 3/3 fully built** _(was 2/3 — Slack/Jira integrations added)_

---

### Enterprise Tier (Spec: 90+ features across 7 modules)

> [!CAUTION]
> **None of the Enterprise tier modules exist in the codebase.** The entire Enterprise tier is Phase 2/3 scope per the roadmap (Months 9-18).

| Module | Features in Spec | Built |
|--------|-----------------|-------|
| Module 8: Team Analytics | 18 | ❌ None |
| Module 9: Burnout Detection | 12 | ❌ None |
| Module 10: Org Insights | 15 | ❌ None |
| Module 11: Advanced Recommendations | 10 | ❌ None |
| Module 12: Compliance & Governance | 8 | ❌ None |
| Module 13: Knowledge Management | 12 | ❌ None |
| Module 14: Integrations & Automation | 10 | ❌ None (3 basic integrations exist in Personal tier) |

---

### Platform Coverage

| Platform | Spec | Built |
|----------|------|-------|
| Web Dashboard (Next.js) | ✅ | ✅ 14+ views |
| Marketing Website | ✅ | ✅ 19 pages |
| Desktop (Tauri 2.0) | ✅ | ✅ Working |
| Browser Extensions (Chrome) | ✅ | ✅ MV3 |
| Browser Extensions (Firefox) | ✅ | ✅ MV2 |
| Browser Extensions (Edge) | ✅ | ✅ MV3 |
| Browser Extensions (Safari) | ✅ | ❌ Not started |
| Mobile (React Native) | ✅ | ❌ Not started |

---

### Infrastructure & Storage

| Component | Spec | Built |
|-----------|------|-------|
| PostgreSQL | ✅ | ✅ |
| Neo4j | ✅ | ✅ |
| Redis | ✅ | ✅ |
| Qdrant | ✅ | ✅ |
| Docker Compose | ✅ | ✅ |
| CI/CD (GitHub Actions) | ✅ | ✅ |
| Prometheus/Grafana | ✅ | ✅ |
| Kubernetes (Production) | ✅ | ❌ |
| Vault (key management) | ✅ | ❌ |

---

## Scorecard Summary

| Category | Spec Features | Fully Built | Partial | Not Started | Coverage |
|----------|:---:|:---:|:---:|:---:|:---:|
| Activity Capture | 15 | 13 | 0 | 2 | **87%** |
| Data Enrichment | 12 | 12 | 0 | 0 | **100%** |
| Knowledge Graph | 15 | 15 | 0 | 0 | **100%** |
| AI Assistant | 14 | 14 | 0 | 0 | **100%** |
| Personal Analytics | 10 | 10 | 0 | 0 | **100%** |
| Dashboards | 4 | 4 | 0 | 0 | **100%** |
| Privacy & Settings | 3 | 3 | 0 | 0 | **100%** |
| **Personal Tier Total** | **73** | **71** | **0** | **2** | **97%** |
| Enterprise Tier | 90+ | 0 | 0 | 90+ | 0% |
| **Overall** | **163+** | **71** | **0** | **92+** | **44%** |

---

## What the Website Claims vs Reality

Key claims on the marketing website that should be verified against actual build status:

| Website Claim | Accuracy | Notes |
|---------------|----------|-------|
| Zero raw cloud storage | ✅ Accurate | Data stays local by default |
| Self-hostable | ✅ Accurate | Docker compose works |
| AES-256-GCM encryption | ⚠️ Partially | Encryption exists but cloud sync via Google Drive is limited |
| 14 dashboard views | ✅ Accurate | Counted and verified |
| 3 live integrations (GitHub, Google, Notion) | ⚠️ Outdated | Now **5 live** — Slack & Jira added |
| Local API at localhost:8000 | ✅ Accurate | FastAPI running |
| PostgreSQL + Qdrant + Neo4j + Redis | ✅ Accurate | All 4 running |
| Sentence transformer embeddings | ✅ Accurate | all-MiniLM-L6-v2 |
| Safari "coming soon" | ✅ Honest | Not started |
| RAG-powered AI chat | ✅ Accurate | SSE streaming works |
| Burnout prediction (mentioned in whitepaper) | ⚠️ Future | Not built yet — spec feature |
| 93% NER accuracy claim (spec) | ⚠️ Not validated | Using LLM extraction, not spaCy+BERT |
| Mobile app | ❌ Not mentioned | Correctly absent from website |

---

## What's Missing from the Website (But Should Exist)

Based on the Markdown spec, these items are either built or close to built but **not reflected on the website**:

1. **Desktop App Download Page** — The desktop Tauri app is built but the website has no dedicated download page. The `/install` page focuses on browser extensions only.

2. **Integration Details** — GitHub, Google Calendar, and Notion integrations are working but the website doesn't showcase them in detail.

3. **Knowledge Graph Demo/Screenshot** — The graph visualization is one of the most visually impressive features but isn't shown on the marketing pages.

4. **Weekly Digest Preview** — A key differentiator; should be showcased.

---

## Alignment with Roadmap

Per the spec's 18-month roadmap:

| Phase | Months | Status |
|-------|--------|--------|
| Phase 0: Foundation | 1-2 | ✅ **Complete** — Backend, DBs, auth, CI/CD all done |
| Phase 1: Personal MVP | 3-8 | ✅ **Complete** — Core tracking, NER, graph, AI chat, dashboards working. Social/video/search detection added. Graph intelligence (expertise, learning paths, collaboration, cross-domain, PageRank, recommendations, community detection) complete. Knowledge graph analytics (decay modeling, semantic clustering) complete. AI assistant features (source attribution, smart search, proactive insights, milestone celebrations, custom prompt templates, scheduled report delivery, voice I/O, plugin system) complete. Personal analytics (deep work sessions, context switch analysis, break patterns, goal tracking, predictive forecasting) complete. Custom entity types, report generation, notification preferences complete. 5 integrations (GitHub, Google, Notion, Slack, Jira). Multi-language NER + spaCy/BERT pipeline complete. Missing: mobile SDK. |
| Phase 2: Enterprise | 9-14 | ❌ **Not started** — No team analytics, burnout detection, mobile app, or compliance |
| Phase 3: Scale | 15-18 | ❌ **Not started** — No international, sales infra, or Series A metrics |

---

## Key Gaps to Consider Next

### High Impact, Buildable Now
1. Desktop app download page on website
2. Integration showcase (GitHub/Google/Notion details)
3. Safari extension
4. Keystroke rate monitoring (input.rs stub exists in Tauri — partially scaffolded)
5. Mouse activity patterns

### Recently Completed (March 2026)
- ✅ Desktop PDF/document reading tracking (Python tracker `reading_analytics` type)
- ✅ Social media detection — 18 platforms via `activity-detector.js`
- ✅ Video watching detection — YouTube, Netflix, Twitch, Vimeo and more
- ✅ Search query capture — 12 engines with query text, result clicks
- ✅ Reading tab fixed (was showing "Failed to load reading data")
- ✅ Desktop tracker auth fixed (auto-auth via token file)
- ✅ Non-learning domain filtering (WhatsApp, Facebook etc. excluded from Reading tab)
- ✅ **Organization extraction** — `DOMAIN_ORG_MAP` expanded to 100+ entries as 5-tuple with `org_type`, `industry`, `confidence`; new `classify_domain_org()` pattern classifier for unknown domains; entity dicts enriched with org metadata (`lightweight_ner.py`)
- ✅ **Relationship inference** — 5 ORGANIZATION entity pairs added, `batch_infer_from_activity_log()` fixed (was hardcoded PERSON/PAPER), new `infer_from_activity_sequence()` → `USED_TOGETHER`, new `infer_learning_relationships()` → `LEARNED_FROM`, `CONTRIBUTED_TO`, `WORKED_ON` (`relationship_inference.py`)
- ✅ **Graph models** — `ORGANIZATION` added to `NodeType`, `LEARNED_FROM` and `USED_TOGETHER` added to `RelationshipType`, pre-existing syntax error in `RelationshipProperties` fixed (`graph_models.py`)
- ✅ **Frontend — Enrichment page** — `EntityList` shows colored org_type/industry badges on organization cards; `EntityDetail` shows "Organization Intelligence" section with Type + Industry tiles; `useEntities` type updated with `org_type` / `industry` fields
- ✅ **Frontend — Knowledge Graph page** — `GraphFilters` rebuilt with all 9 node types + Relationship Types filter section (8 types, LEARNED_FROM and USED_TOGETHER marked with "new" badge); `GraphExplorer` updated with full node-type color palette, color legend overlay, edge `relType` attribute for filtering; duplicate-edge crash fixed
- ✅ **Entity deduplication** — Full graph-clustering implementation: `UnionFind` DSU for transitive clustering, 5-signal matching (embedding cosine, external-ID, Levenshtein, token-set ratio, alias cross-match), `scan_all_for_user()` batch scan, `merge_cluster()` N-way merge, aliases carried forward on merge; 2 new API endpoints (`GET /entities/dedup-scan`, `POST /entities/dedup-merge-cluster`); `DuplicateDetection.tsx` rebuilt as cluster dashboard with stats banner, auto-merge queue (≥97%), suggested review (80–97%), confidence bars, match-reason pills
- ✅ **Source attribution** — Fixed SSE `stream_message` to include RAG citations in done event; updated `parseSSEChunk` to extract citations; both `page.tsx` (chat) and `ChatPopup.tsx` now display expandable "N sources" list under AI responses
- ✅ **Smart search** — Already fully implemented: `GET /api/ai/search` endpoint, `SearchPanel` component, `useAISearch` hook, search button in chat header
- ✅ **Proactive insights** — New `GET /api/ai/insights` endpoint wires existing `proactive_insights_service.py` (6 categories: productivity, focus, collaboration, wellness, achievement, learning) to Postgres activity data; `InsightsBanner` component in chat page
- ✅ **Milestone celebrations** — New `milestone_service.py` with 16 milestones across 5 categories; `GET /api/ai/milestones` endpoint; `MilestonesBanner` component with scrollable progress cards (e.g. "9/15 Milestones Unlocked")
- ✅ **Deep work tracking** — Upgraded from basic to full session analysis: groups consecutive productive activities (≤5min gap) into sessions ≥25min, daily aggregates, top apps, longest streak stats; `GET /productivity/deep-work-sessions` endpoint; `DeepWorkPanel` with stats cards + daily bars + top apps + recent sessions
- ✅ **Context switch analysis** — Tracks every app/domain transition, hourly/daily counts, top A→B switch patterns with frequency bars, peak switching hour; `GET /productivity/context-switch-timeline` endpoint; `ContextSwitchPanel` with daily trend + pattern breakdown + actionable tip
- ✅ **Break patterns** — Detects gaps ≥5min between activities, daily quality scoring (length + frequency + consistency → 0-10), AI recommendations; `GET /productivity/break-patterns` endpoint; `BreakPatternsPanel` with quality gauge + daily bars + recent breaks timeline + recommendation banner
- ✅ **Report generation** — `GET /analytics/report` endpoint generates comprehensive HTML productivity report with 8 stats cards (hours, activities, deep work, context switches, breaks), daily breakdown table, top 10 applications, deep work summary, context switch analysis, break patterns + print/save-as-PDF button; frontend 'Report' button in productivity dashboard header
- ✅ **Notification preferences** — Enhanced settings → Notifications tab with 4 organized sections: Delivery Channels (email, desktop), Insight Categories (productivity alerts, milestone celebrations, focus reminders), Schedule (DnD with configurable quiet hours from/to), Digest Frequency (daily/weekly/monthly selector); 10 preference fields persisted via `GET/PUT /api/v1/users/me/preferences`
- ✅ **Custom prompt templates** — `PromptTemplateManager` with 5 builtins (Productivity Coach, Code Review, Weekly Summary, Creative Writing, Research Assistant); user-scoped CRUD via `GET/POST/PUT/DELETE /api/ai/templates`; `template_id` in `ChatRequest` prefixes system prompt
- ✅ **Scheduled report delivery** — `scheduled_report_task.py` with SMTP + HTML email template; Celery Beat daily at 09:00 UTC; user preferences (frequency/email/enabled)
- ✅ **Goal tracking API** — `goals.py` with 15 endpoints exposing `GoalTrackingService` (CRUD, progress absolute+delta, complete/pause/resume/archive, stats, streaks, deadlines)
- ✅ **Graph-based recommendations** — `get_recommendations()` in `graph_intelligence_service.py` combining PageRank + learning gaps + cross-domain bridges; `GET /graph/recommendations` in `analytics.py`
- ✅ **Slack & Jira integrations** — Full OAuth flow (initiate/callback/status/disconnect) for both providers in `integrations.py`, following existing GitHub/Google/Notion pattern
- ✅ **Knowledge decay modeling** — `KnowledgeDecayService` with exponential decay, adjustable rates by occurrence count, freshness classification → `GET /knowledge/decay` + `GET /knowledge/decay/at-risk` → `KnowledgeFreshnessPanel` in knowledge dashboard
- ✅ **Semantic similarity clustering** — `SemanticClusteringService` using DBSCAN on Qdrant entity embeddings, cluster coherence scoring → `GET /knowledge/clusters` → `SemanticClustersPanel` in knowledge dashboard
- ✅ **Custom entity type definitions** — CRUD endpoints (`GET/POST/DELETE /entities/types`) + `CustomEntityTypesPanel` in enrichment page (new "Entity Types" tab)
- ✅ **Voice input/output** — `VoiceInputButton` (Web Speech API STT) + `SpeakButton` (SpeechSynthesis TTS) in chat page
- ✅ **Plugin/extension system** — `PluginManager` with 4 built-in plugins + custom plugin CRUD; 5 API endpoints in `ai_chat.py`; `PluginGallery` sidebar in chat page
- ✅ **Community detection** — `detect_communities()` via Label Propagation in `graph_intelligence_service.py` → `GET /intelligence/communities` → CommunitiesPanel in graph page
- ✅ **Predictive productivity forecasting** — `PredictiveService` with linear regression, weekly patterns, peak hours, confidence bands → `GET /productivity/forecast` → `ProductivityForecastPanel` in productivity dashboard
- ✅ **Multi-language NER pipeline** — Overhauled NLP stack with `SpacyBertNER` supporting English + 22 other languages, automatic language detection (`langdetect`), and HuggingFace BERT transformers (`bert-base-multilingual-cased-ner-hrl`, `dslim/bert-base-NER`) + spaCy standard models. Integrated seamlessly into Celery `ner_worker` and `enrichment_pipeline`.

### Requires Significant New Work
1. Mobile app (React Native — entirely new platform)
2. Wearable integration (Fitbit/Apple Health/Oura APIs)
3. Enterprise tier (team analytics, manager dashboard, burnout detection)
4. Kubernetes production deployment
5. Compliance frameworks (SOC2, GDPR, CCPA, HIPAA)
