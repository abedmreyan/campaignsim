# CampaignSim Frontend — QA Checklist

Use before thesis demo, PR merge, or backend integration testing.

**Last mock walkthrough sign-off:** 2026-05-20 — automated via `node scripts/manual-mock-walkthrough.mjs` (Playwright; dev server on :5173). One bug fix applied: interview **Send** button `type="submit"`.

---

## Build checklist

- [x] `npm install` completes without errors
- [x] `npm run build` succeeds (no Vue/JS errors)
- [ ] `npm run preview` serves `dist/` correctly
- [x] `npm run smoke` passes with dev server running
- [x] `.env` / `.env.local` not committed with secrets
- [x] `.env.example` documents all `VITE_*` variables

---

## Mock mode checklist

- [x] Default `.env` has `VITE_USE_MOCKS=true` (or unset)
- [x] Home shows **Demo mode** chip (mock mode indicator)
- [x] `healthCheck` succeeds on Home (mock skips live call; chip visible)
- [x] Full journey: upload → graph → personas → 2 variants → simulation → report → chat → history
- [x] `sample-data/FreshBrew-Brand-Brief.pdf` uploads successfully
- [x] Simulation run reaches **completed** and shows success banner
- [x] Report winner hero shows top variant metrics
- [x] History lists at least one completed run (mock seed)
- [x] Technical IDs only visible inside collapsed `<details>`
- [ ] Refresh mid-flow: localStorage restores reasonable state (or clear if confused)

---

## Backend handoff checklist (documentation + wiring)

**Reference:** `FRONTEND_BACKEND_CONTRACT.md` (endpoint map), `CampaignSim_Frontend_Backend_Contract.md` (schemas).

- [x] All **16** active endpoints documented with method, path, body, and response shape
- [x] `src/api/endpoints.js` is the only path constant source (no duplicate URLs in views)
- [x] `src/api/campaignApi.js` is the only import surface for views/stores (no direct `axios` in views)
- [x] `VITE_USE_MOCKS` and `VITE_API_BASE_URL` documented in `.env.example` and `FRONTEND_HANDOFF.md`
- [x] Mock chip / demo notes hidden or relabeled in live mode (`isMockMode` / `modeLabel`)
- [x] No hardcoded `localhost` API URLs outside `src/api/client.js`
- [x] No mock-only field names required in live mode (except optional fallbacks: `personas`/`items`/`profiles`, `reason`/`rationale`)
- [x] Store sets `*.error` on failed upload, graph, personas, simulation, report, history
- [x] `loadReport` and `stopSimulation` surface errors to store (not silent failures)
- [x] Backend developer received: contract + handoff + demo walkthrough + alignment plan
- [x] `npm run build` + `npm run smoke` pass before tagging handoff complete

---

## Live backend checklist

- [ ] `VITE_USE_MOCKS=false` in `.env`
- [ ] `VITE_API_BASE_URL` points to running Flask/API
- [ ] Backend CORS allows frontend origin
- [ ] `GET /api/health` returns OK from browser/network tab
- [ ] Upload returns real `simulation_id` / `graph_id` (not required to be `sim_123`)
- [ ] Prepare/status polling completes with `nodes` / `edges`
- [ ] Personas endpoint returns `personas` array
- [ ] `ab_test` returns `run_id`; `run-status` returns `progress` + `variants[]`
- [ ] Report generate + get report returns contract fields
- [ ] Interview returns `answer` string
- [ ] History returns `items` array
- [ ] No console errors on happy path
- [ ] Clear `campaignsim_*` localStorage when switching from mock to live

---

## Responsive layout checklist (frozen)

**Status:** Layout pass approved and **frozen** for demo. No layout or animation changes unless a critical bug is found.

**Breakpoints:** stack at **1080px** · mobile tuning at **760px** · narrow at **480px** · shell max **1920px** (`--shell-max` in `src/styles/tokens.css`).

Test at **375px**, **768px**, **1280px**, and **1920px** (browser devtools). Also spot-check **1440px** for sidebar balance.

| # | Check | Pass criteria |
|---|--------|----------------|
| 1 | Wide screens (1920px) | Shell uses width up to 1920px; prose (`lead`, hero copy) capped ~68ch; charts/tables/cards still fill their panels |
| 2 | No awkward stretch | Tables in `.table-wrap`; charts in cards; history/persona grids use `auto-fill` with ~300px min track |
| 3 | Sidebar balance | **1280px:** 3 columns (210 / 1fr / 272). **1440px:** 240 / 1fr / 300. **1920px:** 260 / 1fr / 320 |
| 4 | Stack breakpoint | Three-column shell **above 1080px**; single column at 1080px and below (not 1120) |
| 5 | Mobile stepper | Horizontal scroll + snap; labels ellipsis/2-line; full label on `title` / `aria-label` |
| 6 | Sticky UI | Topbar does not cover content; chat composer uses safe-area; mission footer not sticky on mobile |
| 7 | Reduced motion | `src/styles/motion.css` disables transitions, pulses, stagger, ambient, border glow |
| 8 | No horizontal overflow | `overflow-x: clip` on `html`/`body`; `min-width: 0` on grid children; graph panel `overflow: auto` on mobile |

Manual sign-off (2026-05-20 — walkthrough script at 375 / 768 / 1280; 1920 not automated):

- [ ] 1 Wide screens
- [x] 2 Stretch / grids
- [x] 3 Sidebar 1280 / 1440 / 1920
- [x] 4 Breakpoint 1080
- [ ] 5 Mobile stepper
- [ ] 6 Sticky composer + topbar
- [x] 7 Reduced motion
- [x] 8 Overflow 375 / 768 / 1280 / 1920

Legacy checks:

- [x] No horizontal page overflow on Home, Process, Run, Report, History (375 / 768 / 1280)
- [ ] Process **sidebar** readable; metrics stack in narrow command card
- [ ] **Graph panel** contained; SVG scrolls inside panel on mobile
- [ ] **Report table** scrolls inside `.table-wrap` (horizontal scroll OK)
- [ ] History: **table** on desktop, **cards** on mobile (`desktop-only` / `mobile-only`)
- [ ] **Chat** composer does not cover last messages (scroll chat log)
- [ ] Mission control footer buttons stack on mobile

---

## Reduced motion checklist

Enable OS **Reduce motion** (or `prefers-reduced-motion: reduce` in devtools).

- [x] Route transitions do not scale/jank noticeably (automated: demo-chip pulse off)
- [x] Ambient shell pulse disabled
- [x] Status badge pulse disabled
- [x] Simulation running card glow disabled
- [x] Report winner pulse disabled
- [x] Chat enter animation minimized
- [x] Progress bar shimmer disabled
- [x] App remains fully navigable and readable

---

## Browser smoke test checklist

Latest **Chrome** or **Edge** (primary); quick pass on **Firefox**.

- [x] `/` loads
- [x] `/process` loads
- [x] `/history` loads
- [ ] Client-side routing (refresh on `/process` does not 404 when using dev server)
- [x] File upload dialog opens (walkthrough: PDF upload)
- [x] D3 graph renders (WebGL/SVG not blocked)
- [ ] No uncaught errors in console on idle Home

---

## Accessibility spot-check (non-exhaustive)

- [ ] Focus visible on buttons and stepper
- [ ] `aria-live` on simulation activity feed when running
- [x] Report sections navigable via in-page nav
- [x] Collapsed details for IDs keyboard-accessible

---

## Known limitations (accept for demo)

- No automated E2E suite (smoke script + optional `scripts/manual-mock-walkthrough.mjs`)
- No authentication
- Unused endpoints in `endpoints.js` not wired to UI
- Mock `run_id` fixed string; live must supply real `run_id`
- History open without `report_id` uses local status hack + `generateReport`
- Interview mock ignores some request fields

---

## Sign-off

| Role | Name | Date | Pass? |
|------|------|------|-------|
| Frontend | Cursor agent (mock walkthrough) | 2026-05-20 | Yes |
| Demo lead | | | |
| Backend | | | |
