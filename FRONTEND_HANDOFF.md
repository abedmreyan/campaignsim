# CampaignSim Frontend — Handoff

Vue 3 SPA for the CampaignSim thesis/demo: upload a brand brief, build a knowledge graph, generate personas, run A/B simulations, view ranked reports, and interview personas. The UI is **frontend-complete for mock demos** and **ready to connect** to a contract-aligned backend.

---

## Quick start

```bash
npm install
cp .env.example .env    # or .env.local
npm run dev
```

Open http://localhost:5173

Production build:

```bash
npm run build
npm run preview
```

Lightweight smoke (dev server should be running):

```bash
npm run smoke
```

Optional full mock journey (requires dev server + one-time `npm install playwright@1.50.0 --no-save` and `npx playwright install chromium`):

```bash
node scripts/manual-mock-walkthrough.mjs
```


---

## Environment variables

| Variable | Default | Purpose |
|----------|---------|---------|
| `VITE_API_BASE_URL` | `http://localhost:5001` | Axios base URL for **live** API (`src/api/client.js`) |
| `VITE_USE_MOCKS` | `true` (anything except `false`) | Switches `src/api/campaignApi.js` to `mockApi.js` vs `realApi.js` |

**Mock mode (default):** No backend required. Data from `CampaignSim_frontend_mock_data.json` via `src/data/mockData.js`.

**Live mode:** Set `VITE_USE_MOCKS=false` and ensure the backend exposes the routes in `FRONTEND_BACKEND_CONTRACT.md` (see also `CampaignSim_Frontend_Backend_Contract.md` for full schemas).

Restart the dev server after any `.env` change (Vite reads env at startup).

---

## Backend developer — connect the real API

1. **Read** `FRONTEND_BACKEND_CONTRACT.md` (16 endpoints the UI calls today) and `CampaignSim_Frontend_Backend_Contract.md` (full schemas).
2. **Run** the Flask/API on the port you will expose (default assumed `5001`).
3. **Enable CORS** for `http://localhost:5173` (and your production frontend origin).
4. **Create** `.env` in the frontend repo root:

```env
VITE_API_BASE_URL=http://localhost:5001
VITE_USE_MOCKS=false
```

5. **Restart** `npm run dev`, open DevTools → Application → clear **localStorage** keys starting with `campaignsim_` (mock IDs will break live calls if left in place).
6. **Verify** `GET /api/health` from the browser (Home should show **Live API** and a healthy status when the backend responds).
7. **Walk** the happy path once using `QA_CHECKLIST.md` → Live backend section.

**Critical live behaviors:**

- Upload must return real `simulation_id` and `graph_id`.
- `POST /api/simulation/ab_test` must return a real `run_id` used for polling and report generation.
- `GET /api/simulation/{id}/run-status` must return numeric `progress` and `variants[]` with per-variant progress.
- `POST /api/report/generate` then `GET /api/report/{report_id}` must match fields in the contract (winner, ranked variants, charts).

Gaps vs a full backend spec: `CampaignSim_Backend_Alignment_Plan_For_Zaid.md`.

---

## Mock vs live

| | Mock | Live |
|---|------|------|
| Toggle | `VITE_USE_MOCKS=true` or unset | `VITE_USE_MOCKS=false` |
| API module | `src/api/mockApi.js` | `src/api/realApi.js` |
| UI indicator | “Mock mode” chip on Home + process shell | “Live API” label |
| CORS | Not needed | Backend must allow the Vite origin |
| IDs | Seeded (`sim_123`, `report_123`, …) | Returned by backend after upload/create |

Mock-only UI is limited to **informational** copy (`isMockMode` demo notes on Home, History, shell). No feature is blocked in live mode.

---

## Folder structure (implemented)

```txt
src/
├── api/                 # Axios client, endpoints map, mock/real implementations
├── components/
│   ├── common/          # Buttons, cards, stepper, skeletons, status
│   ├── graph/           # D3 GraphPanel
│   ├── personas/
│   ├── simulation/
│   ├── reports/
│   ├── interaction/
│   └── history/
├── composables/         # useAnimatedNumber (presentation)
├── data/                # mockData loader
├── layouts/             # AppLayout (step shell + command sidebar)
├── router/              # Routes + guards
├── stores/              # campaignStore (Pinia)
├── styles/              # tokens, layout, layout-qa (frozen), components, views, motion
└── views/               # Home, Process steps, run, report, history
```

Sample assets:

- `sample-data/FreshBrew-Brand-Brief.pdf` — Step 1 upload demo
- `CampaignSim_frontend_mock_data.json` — mock API seed data

---

## Routes

| Path | View | Notes |
|------|------|-------|
| `/` | `Home.vue` | Landing + health check |
| `/process` | `Process.vue` | Steps 1–5 in `AppLayout` |
| `/simulation/:simulationId/run` | `SimulationRunView.vue` | Mission control + polling |
| `/report/:reportId` | `Step4Report.vue` | Standalone or step 4 |
| `/interaction/:simulationId` | `Step5Interaction.vue` | Persona chat |
| `/history` | `HistoryDatabase.vue` | Past runs |

Router guards (`src/router/index.js`) enforce workflow order (variants before run, simulation before report, etc.).

---

## State

Single Pinia store: **`src/stores/campaignStore.js`**

Holds project IDs, graph, personas, variants, simulation run, report, history, interview messages. Persists to `localStorage` (`campaignsim_*` keys) for demo continuity.

Presentation-only getters (safe for backend): `shellAmbientStatus`, `shellActivityMessage`, `isMockMode`, `modeLabel`.

---

## API layer

- **`src/api/endpoints.js`** — centralized path constants (single source of truth for URLs)
- **`src/api/client.js`** — Axios instance + error normalization
- **`src/api/campaignApi.js`** — mock/live switch + re-exports
- **`src/api/realApi.js`** — live HTTP calls
- **`src/api/mockApi.js`** — timed mock responses

**Rule:** Views and stores import only from `@/api/campaignApi` (never `axios` directly). Do not change field names in payloads without updating the backend contract.

### Styling (frozen layout)

| File | Role |
|------|------|
| `src/styles/tokens.css` | Design tokens, `--shell-max`, breakpoints |
| `src/styles/layout.css` | Shell grid, sidebar tiers, responsive stack at 1080px |
| `src/styles/layout-qa.css` | Frozen layout QA helpers |
| `src/styles/components.css` | Shared component styles |
| `src/styles/views.css` | Page-specific layout (report, run, history) |
| `src/styles/motion.css` | Motion + `prefers-reduced-motion` overrides |
| `src/styles/dashboard.css` | Aggregator import |

---

## Responsive layout (frozen)

The wide desktop shell and mobile behavior are **frozen for the demo**. Do not add new visual features until documentation and backend handoff are complete.

| Item | Detail |
|------|--------|
| Shell width | `width: min(100%, 1920px)` — Home, dashboard, notices |
| Stack breakpoint | **1080px** — keeps 3-column shell at **1280px** viewports |
| Sidebar columns | 210/272 (1081–1439), 240/300 (1440+), 260/320 (1920+) |
| Mobile stepper | Horizontal scroll + scroll-snap; tooltips via `title` / `aria-label` |
| Deep routes | `goToStep()` returns to `/process` from `/report`, `/interaction`, `/simulation/.../run` |
| Styles | `src/styles/layout.css`, `layout-qa.css`, `views.css`, `motion.css` |

Pre-demo verification: **`QA_CHECKLIST.md`** → section **Responsive layout checklist (frozen)**.

---

## Related docs

| Document | Audience |
|----------|----------|
| `FRONTEND_BACKEND_CONTRACT.md` | Backend integration (endpoints + usage map) |
| `DEMO_WALKTHROUGH.md` | Thesis/demo script |
| `QA_CHECKLIST.md` | Pre-demo and pre-release checks (includes frozen layout QA) |
| `CampaignSim_Frontend_Backend_Contract.md` | Full request/response schemas |
| `CampaignSim_Backend_Alignment_Plan_For_Zaid.md` | Gap analysis for backend team |

---

## Known limitations

- No auth layer (assumes open API or future gateway).
- No automated component/E2E test suite (only `npm run smoke` file/route checks).
- Several paths in `endpoints.js` are **defined but unused** (search, assign_segments, etc.) — reserved for future UI.
- `loadPersonas` accepts `personas`, `items`, or `profiles` keys for backend flexibility.
- Report `top_recommendation` may use `rationale` or `reason` in copy fallbacks.
- History “open report” without `report_id` sets local `simulationRun.status = completed` then calls `generateReport()` (edge case; mock history includes `report_id`).
- LocalStorage persistence can show stale state after backend schema changes — use “reset” / clear site data when switching modes.

---

## Demo walkthrough

See **`DEMO_WALKTHROUGH.md`** for click-by-click steps.

Recommended mock path: Home → Process → upload PDF → build graph → personas → 2 variants → launch simulation → run view → report → chat → history.
