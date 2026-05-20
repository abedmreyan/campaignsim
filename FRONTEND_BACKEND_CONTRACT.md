# Frontend ↔ Backend Contract (Integration Handoff)

**Audience:** Zaid’s backend developer  
**Status:** Verified against `src/api/*`, `src/stores/campaignStore.js`, and all workflow views (handoff pass)  
**Full JSON schemas:** `CampaignSim_Frontend_Backend_Contract.md`  
**Gap analysis:** `CampaignSim_Backend_Alignment_Plan_For_Zaid.md`

---

## Global conventions

### Base URL and client

| Item | Value |
|------|--------|
| Env variable | `VITE_API_BASE_URL` |
| Default | `http://localhost:5001` (only in `src/api/client.js` — no other hardcoded API hosts in `src/`) |
| HTTP client | Axios (`src/api/client.js`), timeout **30s** |
| API switch | `src/api/campaignApi.js` — `VITE_USE_MOCKS !== "false"` → mock, else real |

### Response envelope (live API)

`realApi.js` unwraps every response as:

```js
response.data?.data ?? response.data
```

**Preferred success shape:**

```json
{
  "success": true,
  "data": { },
  "message": "optional human message",
  "meta": {}
}
```

Bare `data` objects (no wrapper) also work after unwrap.

### Error responses (live API)

Axios failures are normalized in `client.js` to:

```ts
{
  status?: number,      // HTTP status, e.g. 400, 401, 404, 500
  code: string,        // e.g. "NETWORK_ERROR" or backend error.code
  message: string,     // user-facing text from backend
  details?: object,     // optional field-level errors
  raw: AxiosError
}
```

**Recommended backend error body** (either form works with the interceptor):

```json
{
  "success": false,
  "message": "Human-readable summary",
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Human-readable summary",
    "details": { "field": "reason" }
  }
}
```

**Frontend UI handling today:**

| State | Where handled |
|--------|----------------|
| Loading | `graph.loading`, `personas.loading`, `simulationRun.loading`, `report.loading`, `history.loading` |
| Error message | Same `*.error` fields + `ErrorState` / banners in views |
| Empty | `EmptyState` when lists are empty (history, personas gate, report gate) |
| Unauthorized | **No dedicated 401 UI** — surfaces as generic `message` via `normalizeError()` in store |
| Network | `code: "NETWORK_ERROR"`, message from Axios |

### Auth and headers

| Item | Current frontend |
|------|------------------|
| Auth | **None** — no `Authorization` header |
| `Content-Type` | JSON for POST bodies; `multipart/form-data` for upload only |
| Cookies | Not used |
| Future auth | Backend may add `Authorization: Bearer <token>` — frontend will need a single interceptor change in `client.js` (out of scope for this handoff) |

### CORS (live mode)

Browser origin in dev: `http://localhost:5173` (Vite default).  
Backend must allow that origin (and production frontend URL) for:

- `GET`, `POST`, `OPTIONS`
- Headers: `Content-Type`, `Accept` (and `Authorization` if added later)

### Mock mode

When `VITE_USE_MOCKS` is not the string `false`:

- All functions below are implemented in **`src/api/mockApi.js`**
- Data seed: **`CampaignSim_frontend_mock_data.json`** via `src/data/mockData.js`
- Artificial delays (~180–750 ms)
- **Fixed mock IDs** (not required in live mode): `run_id: "run_ab_123"`, `sim_123`, `graph_123`, `report_123` from mock JSON

**UI in mock mode only (informational, not blocking):**

- “Mock mode” chip on Home + process shell (`isMockMode` from `campaignApi.js`)
- Demo notes on Home, History, command sidebar tooltip
- In live mode: chip shows **“Live API”**; demo notes hidden

---

## Endpoints in use (16)

Columns: **Method** · **Path** · **Body** · **Query** · **Headers** · **Response `data`** · **Errors (UI)** · **Frontend** · **Mock notes**

---

### 1. Health check

| Field | Value |
|-------|--------|
| **Method / path** | `GET /api/health` |
| **Constant** | `endpoints.health` |
| **Body** | — |
| **Query** | — |
| **Headers** | Default |
| **Response** | `{ status, service?, version?, timestamp? }` |
| **Errors** | Home shows “API pending” / failed badge in live mode only |
| **Frontend** | `Home.vue` → `healthCheck()` |
| **Mock** | `{ status: "ok", service: "CampaignSim Mock API", ... }` |

---

### 2. Create simulation project

| Field | Value |
|-------|--------|
| **Method / path** | `POST /api/simulation/create` |
| **Constant** | `endpoints.simulationCreate` |
| **Body** | `{ project_name?: string, description?: string }` |
| **Query** | — |
| **Headers** | `Content-Type: application/json` |
| **Response** | `{ simulation_id, graph_id?, project_id?, project_name?, status? }` |
| **Errors** | Thrown to upload flow if called inline; no dedicated UI field |
| **Frontend** | `campaignStore.createSimulationProject()` — called before upload if no `simulation_id` |
| **Mock** | FreshBrew project from mock JSON |

---

### 3. Upload brand brief

| Field | Value |
|-------|--------|
| **Method / path** | `POST /api/graph/upload` |
| **Constant** | `endpoints.graphUpload` |
| **Body** | `FormData`: **`file`** (required, PDF or TXT client-side), **`simulation_id`** (optional string) |
| **Query** | — |
| **Headers** | `Content-Type: multipart/form-data` |
| **Response** | `{ simulation_id, graph_id, file: { file_id, filename, mime_type, size_bytes } }` |
| **Errors** | `graph.error` — “Upload failed.” |
| **Frontend** | `Step1GraphBuild.vue` → `uploadBrandBrief()` |
| **Mock** | Returns IDs from mock project (`sim_123` style) |
| **Live note** | Backend must return real `simulation_id` + `graph_id` per upload |

---

### 4. Prepare graph

| Field | Value |
|-------|--------|
| **Method / path** | `POST /api/simulation/prepare` |
| **Constant** | `endpoints.simulationPrepare` |
| **Body** | `{ simulation_id: string, graph_id: string }` |
| **Query** | — |
| **Headers** | `application/json` |
| **Response** | `{ task_id, simulation_id, graph_id, status }` — status e.g. `processing` |
| **Errors** | `graph.error` — “Graph build failed.” |
| **Frontend** | `Step1` → `prepareGraph()` then polls status |
| **Mock** | `task_id: "task_prepare_mock"` |

---

### 5. Preparation status (poll)

| Field | Value |
|-------|--------|
| **Method / path** | `POST /api/simulation/prepare/status` |
| **Constant** | `endpoints.simulationPrepareStatus` |
| **Body** | `{ task_id: string, simulation_id: string }` |
| **Query** | — |
| **Headers** | `application/json` |
| **Response** | `{ task_id, simulation_id, status, progress, current_step?, graph_id?, summary? }` |
| **Status values** | `running`, `processing`, `completed`, `failed` |
| **Poll behavior** | Store loops until `completed` or `failed` (max ~40 attempts, mock increments progress) |
| **Errors** | `graph.error`; throws on `failed` |
| **Frontend** | `campaignStore.pollPreparationStatus()` |
| **Mock** | Progress 0→100% in steps |

---

### 6. Graph relations

| Field | Value |
|-------|--------|
| **Method / path** | `GET /api/graph/{graph_id}/relations` |
| **Constant** | `endpoints.graphRelations(graphId)` |
| **Body** | — |
| **Query** | — |
| **Headers** | Default |
| **Response** | `{ graph_id?, nodes: Node[], edges: Edge[] }` |
| **Node** | `{ id, label, type, degree?, attributes? }` |
| **Edge** | `{ id, source, target, type, weight? }` |
| **Errors** | `graph.error` — “Could not load graph relations.” |
| **Frontend** | `GraphPanel` via `loadGraphRelations()` |
| **Mock** | Full graph from mock JSON |

---

### 7. Generate personas (async task)

| Field | Value |
|-------|--------|
| **Method / path** | `POST /api/simulation/generate-profiles` |
| **Constant** | `endpoints.generateProfiles` |
| **Body** | `{ simulation_id, graph_id, count: number, language: string }` — store sends `language: "en"` |
| **Query** | — |
| **Headers** | `application/json` |
| **Response** | `{ task_id, simulation_id, status }` |
| **Errors** | `personas.error` — “Persona generation failed.” |
| **Frontend** | `Step2` → `generatePersonas(count)` then `loadPersonas()` |
| **Mock** | Task id only; personas loaded in separate GET |

---

### 8. Get personas

| Field | Value |
|-------|--------|
| **Method / path** | `GET /api/simulation/{simulation_id}/profiles` |
| **Constant** | `endpoints.profiles(simulationId)` |
| **Body** | — |
| **Query** | — |
| **Headers** | Default |
| **Response** | Object with **one of**: `personas[]`, `items[]`, or `profiles[]` (store accepts all) |
| **Persona (UI)** | `user_id`, `user_name`, `name`, `bio`, `persona`, `age`, `gender`, `mbti`, `country`, `profession`, `segment`, `platform_preferences`, … |
| **Errors** | `personas.error` |
| **Frontend** | `Step2` persona grid + drawer |
| **Mock** | Expands/clones mock personas to `count` |

---

### 9. Start A/B simulation

| Field | Value |
|-------|--------|
| **Method / path** | `POST /api/simulation/ab_test` |
| **Constant** | `endpoints.simulationAbTest` |
| **Body** | `{ simulation_id, variants: Variant[] }` — 2–3 variants required by UI |
| **Variant shape** | `{ variant_id, variant_name, channel, content: { format, headline, body, cta, visual_desc, email_subject, tone }, target_segment, max_rounds, status? }` |
| **Query** | — |
| **Headers** | `application/json` |
| **Response** | `{ simulation_id, run_id, status }` — e.g. `running` |
| **Errors** | `simulationRun.error` — “Simulation failed to start.” |
| **Frontend** | `Step3` → `startAbTest()`; navigates to run view |
| **Mock** | `run_id: "run_ab_123"` — **live must return real `run_id`** |
| **Live note** | Store persists `run_id` for all subsequent poll/stop/report calls |

---

### 10. Stop simulation

| Field | Value |
|-------|--------|
| **Method / path** | `POST /api/simulation/stop` |
| **Constant** | `endpoints.simulationStop` |
| **Body** | `{ simulation_id, run_id }` |
| **Query** | — |
| **Headers** | `application/json` |
| **Response** | `{ simulation_id, run_id, status }` e.g. `stopped` |
| **Errors** | `simulationRun.error` |
| **Frontend** | `SimulationRunView` → `stopSimulation()` |
| **Mock** | Sets internal stopped flag |

---

### 11. Simulation run status (poll)

| Field | Value |
|-------|--------|
| **Method / path** | `GET /api/simulation/{simulation_id}/run-status` |
| **Constant** | `endpoints.simulationRunStatus(simulationId)` |
| **Body** | — |
| **Query** | **`run_id`** (optional) — sent when `simulationRun.runId` is set |
| **Headers** | Default |
| **Response** | `{ simulation_id, run_id, status, progress, current_round?, max_rounds?, variants: [{ variant_id, variant_name, status, progress, current_round, max_rounds }] }` |
| **Status values** | `running`, `completed`, `stopped`, `failed` |
| **On `completed`** | Store calls variant results (endpoint 12) |
| **Errors** | `simulationRun.error` — “Could not refresh simulation status.” |
| **Frontend** | `SimulationRunView` polling |
| **Mock** | Progress increments until 100% |

---

### 12. Variant results

| Field | Value |
|-------|--------|
| **Method / path** | `GET /api/simulation/{variant_id}/results` |
| **Constant** | `endpoints.variantResults(variantId)` |
| **Body** | — |
| **Query** | — |
| **Headers** | Default |
| **Response** | Per-variant result object (see mock `results[]` in JSON seed) |
| **Important fields** | `variant_id`, `variant_name`, `engagement_score`, `engagement_rate_pct`, `trend`, `action_breakdown`, `per_round_engagement`, `segment_scores` |
| **Errors** | Surfaced via simulation poll / report path |
| **Frontend** | `loadVariantResults()` after simulation completes |
| **Mock** | Match by `variant_id` or first result |

---

### 13. Generate report

| Field | Value |
|-------|--------|
| **Method / path** | `POST /api/report/generate` |
| **Constant** | `endpoints.reportGenerate` |
| **Body** | `{ simulation_id, run_id, variant_ids: string[] }` |
| **Query** | — |
| **Headers** | `application/json` |
| **Response** | `{ report_id, simulation_id, status? }` — may be `processing`; frontend immediately calls GET report |
| **Errors** | `report.error` — “Report generation failed.” |
| **Frontend** | `Step4`, History fallback, run view CTA |
| **Mock** | `report_id` from mock JSON |

---

### 14. Get report

| Field | Value |
|-------|--------|
| **Method / path** | `GET /api/report/{report_id}` |
| **Constant** | `endpoints.reportById(reportId)` |
| **Body** | — |
| **Query** | — |
| **Headers** | Default |
| **Response** | Report object + optional `results[]` |
| **Important fields** | `report_id`, `simulation_id`, `executive_summary`, `top_recommendation: { variant_id, variant_name, reason? \| rationale? }`, `ranked_variants[]`, `segment_performance`, `channel_effectiveness`, `strategic_recommendations[]` |
| **Errors** | `report.error`; route load sets `notice` |
| **Frontend** | `loadReport()`, `/report/:id`, History open |
| **UI copy** | Accepts `reason` or `rationale` on recommendation |

---

### 15. Persona interview

| Field | Value |
|-------|--------|
| **Method / path** | `POST /api/report/interview` |
| **Constant** | `endpoints.reportInterview` |
| **Body** | `{ simulation_id, report_id, persona_id, question }` — `persona_id` is numeric in UI |
| **Query** | — |
| **Headers** | `application/json` |
| **Response** | `{ persona_id, persona_name, answer, related_variant_id? }` |
| **Errors** | `PersonaInterviewPanel` local `error` on failed ask |
| **Frontend** | `Step5` → `interviewPersona()` |
| **Mock** | Template answer; ignores some body fields |

---

### 16. Simulation history

| Field | Value |
|-------|--------|
| **Method / path** | `GET /api/simulation/history` |
| **Constant** | `endpoints.simulationHistory` |
| **Body** | — |
| **Query** | — |
| **Headers** | Default |
| **Response** | `{ items: HistoryItem[] }` or `{ history: HistoryItem[] }` |
| **Item fields** | `simulation_id`, `project_name`, `status`, `created_at`, `updated_at`, `graph_id`, `report_id`, `variants_count`, `top_variant_name` |
| **Errors** | `history.error` + Retry button |
| **Frontend** | `HistoryDatabase` on mount |
| **Mock** | `history` array from mock JSON |

---

## Endpoints defined but not called by UI

Listed in `src/api/endpoints.js` for backend parity / future work — **no current frontend call**:

| Method | Path |
|--------|------|
| GET | `/api/graph/{graphId}` |
| GET | `/api/graph/{graphId}/search` |
| POST | `/api/graph/{graphId}/update-from-sim` |
| GET | `/api/simulation/list` |
| GET | `/api/simulation/{simulationId}` |
| GET | `/api/simulation/{simulationId}/profiles/realtime` |
| POST | `/api/simulation/start` |
| POST | `/api/simulation/assign_segments` |

---

## Page → store → API map

| UI area | Route / view | Store actions | API endpoints |
|---------|----------------|---------------|---------------|
| Home | `/` | — | 1 health |
| Step 1 | `/process` (step 1) | upload, prepare, loadGraph | 2–6 |
| Step 2 | `/process` (step 2) | generatePersonas, loadPersonas | 7–8 |
| Step 3 | `/process` (step 3) | startAbTest | 9 |
| Simulation run | `/simulation/:id/run` | poll, stop, loadVariantResults | 10–12 |
| Step 4 / Report | `/process` step 4, `/report/:id` | generateReport, loadReport | 13–14 |
| Step 5 | `/process` step 5, `/interaction/:id` | interviewPersona | 15 |
| History | `/history` | loadHistory, openReport | 16, 14, 13 |

**Routing note:** `goToStep()` navigates to `/process` when changing steps from deep routes (`/report`, `/interaction`, `/simulation/.../run`) so the stepper and content stay in sync.

---

## Backend developer checklist

1. Implement all **16 endpoints** above with **exact field names** (`simulation_id`, `graph_id`, `run_id`, `variant_id`, `report_id`, snake_case).
2. Enable **CORS** for `http://localhost:5173` and production frontend origin.
3. Return success envelope or bare `data` (frontend supports both).
4. Return structured **errors** with `message` and optional `error.code` / `error.details`.
5. `GET .../run-status`: return `progress` (0–100) and `variants[]` with per-variant progress/status.
6. `POST /api/report/generate`: return `report_id` immediately; frontend chains `GET /api/report/{report_id}`.
7. `POST /api/simulation/ab_test`: return a real **`run_id`** (not required to be `run_ab_123`).
8. Do **not** rely on mock-only IDs in live mode — upload/create responses drive the session.
9. Frontend `.env` for integration test:

```env
VITE_API_BASE_URL=http://localhost:5001
VITE_USE_MOCKS=false
```

10. Restart Vite after changing `.env`. Clear browser `localStorage` keys prefixed `campaignsim_` when switching mock → live.
11. Run **`QA_CHECKLIST.md`** → Backend handoff + Live backend sections.

---

## Switching mock ↔ live (summary)

| Goal | Action |
|------|--------|
| Demo (no backend) | `VITE_USE_MOCKS=true` or omit variable |
| Live integration | `VITE_USE_MOCKS=false` + running API at `VITE_API_BASE_URL` |
| Reset polluted IDs | Clear `campaignsim_*` in browser localStorage |
| Verify UI mode | Mock chip vs “Live API” label on Home and shell |

Do **not** rename request/response fields without updating this file and `CampaignSim_Frontend_Backend_Contract.md`.
