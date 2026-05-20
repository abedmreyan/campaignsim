# CampaignSim — Demo / Thesis Walkthrough

**Duration:** ~8–12 minutes in mock mode  
**Prerequisite:** `npm run dev`, `.env` with default mock settings, browser at http://localhost:5173

---

## Before you present

1. Confirm the **Mock mode** chip appears (top of Home and process shell).
2. Optional: clear site data / localStorage if a previous session left the workflow half-finished.
3. Have **`sample-data/FreshBrew-Brand-Brief.pdf`** ready (or use any PDF/TXT brief).
4. Say upfront: *“This build runs against a built-in mock API so we can demo the full journey without the Flask server. The same UI calls real REST endpoints when mock mode is off.”*

---

## What “mock mode” means

| For reviewers | For engineers |
|---------------|---------------|
| All API responses are simulated locally with realistic delays | `VITE_USE_MOCKS` is not the string `false` |
| IDs like `sim_123` and `report_123` are expected | Data shape matches `CampaignSim_frontend_mock_data.json` |
| Demo chip explains how to switch to live API | Set `VITE_USE_MOCKS=false` + running backend |

Mock mode does **not** disable any screen — it only changes where data comes from.

---

## Step-by-step script

### 1. Home (`/`)

**Click:** “Start campaign workflow” (or equivalent primary CTA).

**Reviewer should see:**

- Hero positioning CampaignSim as simulation + insights.
- **Mock mode** chip and short note about `VITE_USE_MOCKS=false` for live API.
- Optional API health line (mock returns OK).

**Say:** *“This is the entry point; health check confirms API reachability in live mode.”*

---

### 2. Process — Step 1: Brand brief & graph (`/process`, step 1)

**Click:**

1. Upload **`FreshBrew-Brand-Brief.pdf`** (or TXT).
2. **Prepare knowledge graph** (or follow sidebar CTA).
3. Wait for graph build progress, then explore the **D3 graph** (pan/zoom, node selection).

**Reviewer should see:**

- Upload confirmation (filename, no raw IDs in primary UI).
- Progress text in sidebar activity strip (“Extracting entities…”).
- Interactive graph with branded nodes (FreshBrew, Instagram, etc.).

**Say:** *“We turn the brief into a marketing knowledge graph — entities and relationships the simulation will use later.”*

---

### 3. Step 2: Personas

**Click:** Continue to Step 2 → **Generate personas** (default count is fine).

**Reviewer should see:**

- Persona cards grid (names, segments, bios).
- Open a card → detail drawer.

**Say:** *“Synthetic audience profiles grounded in the graph — each agent will react to variants in the simulation.”*

---

### 4. Step 3: Campaign variants

**Click:**

1. Add **two** variants (mock-friendly pair: **Instagram VideoAd** + **Email**).
2. Fill headline/body/CTA as needed (pre-filled templates are OK).
3. **Launch simulation**.

**Reviewer should see:**

- Validation if fewer than 2 variants.
- Redirect or navigation to **simulation run** view.

**Say:** *“We A/B test 2–3 channel-specific variants before spending media budget.”*

---

### 5. Simulation run (`/simulation/:simulationId/run`)

**Wait** for polling to complete (mock ~15–30s).

**Reviewer should see:**

- Mission-control layout: progress ring, **live activity** lines, per-variant progress cards.
- Success banner when complete.
- Actions to open report / return to workflow.
- **Run details** collapsed (IDs inside).

**Say:** *“This is the ‘mission control’ moment — each variant runs through simulated rounds until we have engagement signals.”*

---

### 6. Step 4: Insights report

**Click:** Generate or open report (from run view or step 4).

**Reviewer should see:**

- Green **simulation complete** banner.
- **Winner hero** — top variant name, engagement %, trend.
- Sections: Executive summary → Top recommendation → Ranked table → Charts.
- **Technical / debug details** collapsed at bottom.

**Say:** *“The #1 variant is surfaced immediately; supporting evidence and charts are one scroll away.”*

---

### 7. Step 5: Persona interview

**Click:** Continue to interaction / chat step.

**Click:** Select a persona, ask a short question (e.g. “Would this email make you click?”).

**Reviewer should see:**

- Chat bubbles with typing indicator (respects reduced motion).
- Sticky composer on mobile widths.

**Say:** *“Qualitative layer on top of quantitative scores — stakeholders can ‘ask’ the audience.”*

---

### 8. History (`/history`)

**Click:** History in nav (or from home).

**Reviewer should see:**

- Demo note in mock mode.
- Table (desktop) or cards (mobile) with project name, status, top variant.
- **Open report** / **Resume** where applicable.
- Empty state if filters match nothing.

**Say:** *“Past runs are first-class — not a debug log.”*

---

## Switching to live backend (talk track only)

1. Backend implements contract routes (`FRONTEND_BACKEND_CONTRACT.md`).
2. Set `.env`: `VITE_USE_MOCKS=false`, `VITE_API_BASE_URL=<backend>`.
3. Restart `npm run dev`.
4. Clear browser localStorage for `campaignsim_*` keys.
5. Re-run the same clicks — UI is unchanged; data comes from Flask.

Point Zaid/backend to **`CampaignSim_Backend_Alignment_Plan_For_Zaid.md`** for known gaps.

**Handoff docs for engineers:** `FRONTEND_HANDOFF.md` (setup), `FRONTEND_BACKEND_CONTRACT.md` (every endpoint the UI calls), `QA_CHECKLIST.md` (sign-off).

---

## Troubleshooting during demo

| Issue | Fix |
|-------|-----|
| Stuck on old step | Clear localStorage or use store reset if exposed |
| Report route blocked | Complete simulation first (router guard) |
| Graph empty | Re-run prepare graph after upload |
| “Live API” but errors | Backend down or CORS — revert to mock for demo |

---

## Reduced-motion demo note

If presenting with **prefers-reduced-motion: reduce**, call out that animations soften but the workflow is identical — good accessibility story for thesis Q&A.
