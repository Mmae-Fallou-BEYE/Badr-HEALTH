# Badr Health — Progress Log

Continuous execution log for NASA Space Apps Challenge Dakar 2026.

---

## Phase 1 — Shell and Data
- **Status**: Completed & Verified.
- **Key Deliverables**: Full Vite + React 18 + TypeScript strict scaffold, Tailwind fintech warm-green palette, Nexora-inspired dashboard shell, HashRouter navigation, resilient local Zustand store with 6-scenario simulator, persistent footer disclaimer, real-time environment switcher (`Station`, `Spacecraft`, `Moon`).

---

## Phase 2 — Core Vitals and Engine
- **Status**: Completed & Verified.
- **Key Deliverables**:
  - `supabase/schema.sql`: 10 relational tables (`astronauts`, `missions`, `sensors`, `readings`, `cabin_readings`, `radiation_log`, `mood_logs`, `exercise_logs`, `alerts`, `hazard_scores`) with indexes on `(astronaut_id, metric, recorded_at desc)`, check constraints, and annotated permissive public demo RLS policies.
  - `supabase/seed.sql` + `supabase/seed.sql.meta.json`: 3 missions, 4 adult crew members with realistic astronaut callsigns (`CYGNUS-1`, `VEGA-2`, `ORION-3`, `POLARIS-4`), 14 days of synthetic biometric history with `source = 'simulated'`.
  - `src/data/repository.ts`: Resilient dual-implementation repository pattern (`SupabaseRepository` + `InMemoryRepository`) with automatic fallback to zero-config local mode.
  - `src/engine/baseline.ts`: Robust statistical median and Median Absolute Deviation (MAD) fitting.
  - `src/engine/scoring.ts`: Two-layer evaluation engine (Layer 1 personal robust z-score vs Layer 2 absolute NASA HRP safety rails) with composite Health Score calculation (0-100).
  - `src/engine/trends.ts`: Exponentially smoothed trend forecaster detecting 72-hour drift toward warning rails.
  - `src/engine/hazards.ts`: Dynamic computation of the 5 NASA HRP hazard scores weighted by environmental context.
  - `src/engine/alerts.ts`: 3-level alert engine with 30-minute deduplication window and compound escalation (orange -> red) when correlated physiological warnings persist over 2 hours.
  - `src/engine/__tests__/engine.test.ts`: Complete Vitest test suite (10/10 tests passing).
- **Acceptance Verified**:
  - `npm test` passes cleanly (10/10).
  - Hypoxia scenario triggers SpO₂ drop from green to orange to red, displays autonomous protocol checklist, and drops Health Score.

---

## Phase 3 — Body Map, Hazards and Guides
- **Status**: Completed & Verified.
- **Key Deliverables**:
  - Interactive SVG anatomical Body Map with 7 clickable organ regions (brain, eyes, heart, lungs, gut, bones, muscles) dynamically colored by live biometric status.
  - Comprehensive source-cited risk definitions (`src/content/risks.ts`) with NASA HRP Evidence Book links, why it matters in space, and prescribed countermeasure actions.
  - Hazards page with the 5 NASA HRP hazards and a dedicated Radiation Panel with cumulative career dose tracker (600 mSv limit) and Canadian Space Agency CANS neutron flux citation (~30% of dose).
  - Searchable Guides Library (`src/content/guides.ts` & `src/features/guides/GuidesPage.tsx`) covering 9 key spaceflight biomatrices with "Reference value" tags.
  - "About this score" formula drawer detailing mathematical calculation and two-layer scoring logic.
- **Acceptance Verified**:
  - Clicking lungs opens hypoxia risk with actions and working HRP link.
  - Switching environment dynamically shifts gravity ($0.00g$ to $0.165g$) and recalculates hazard weights.

---

## Phase 4 — Hardware, Analytics and Documentation
- **Status**: Completed & Verified.
- **Key Deliverables**:
  - `hardware/esp32_vitals.ino` & `hardware/README.md`: ESP32 C++ firmware template for MAX30102 PPG and BME280 sensor telemetry ingestion over WiFi/HTTPS.
  - `tools/simulate.py`: Python CLI tool for streaming live telemetry packets into the ingestion endpoint.
  - `analytics/generate_synthetic.py`: 30-day circadian synthetic telemetry generator with companion `*.meta.json`.
  - `analytics/fit_baseline.py`: Baseline parameter fitting exported to `public/models/baseline.json`.
  - `analytics/train_anomaly.py`: Multi-metric anomaly detector parameters exported to `public/models/anomaly.json`.
  - Full documentation suite:
    - `README.md` with Mermaid architecture diagram, 5-minute setup guide, scenarios, and regulatory disclaimers.
    - `docs/REFERENCES.md`: Comprehensive attribution for NASA HRP, CSA CANS, open-source libraries, and typography.
    - `docs/AI_USE.md`: Explicit transparent disclosure of AI assistance vs human scientific governance.
    - `docs/SUBMISSION_DRAFTS.md`: Complete English drafts for Space Apps judging submission.
- **Acceptance Verified**:
  - Full build passes cleanly (`npm run build` and `npm test`).
  - Zero console errors or blank screens in offline demo mode.
