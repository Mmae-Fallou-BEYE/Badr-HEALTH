# PROMPT FOR ANTIGRAVITY — Build "Badr Health"

You are a senior full-stack engineer and product designer. Build the web application described below for the NASA Space Apps Challenge Dakar 2026, challenge "Create Health Monitoring Software for Astronauts on Space Missions". The full project context is in `CONTEXT.md` at the repository root. Read it completely first and treat it as binding. If this prompt and `CONTEXT.md` conflict, ask the team before proceeding.

## 0. Working rules

- The team has about 13 working hours in total. Deliver in the phases below. **After every phase the app must run, build and be deployable.** Never leave the repository in a broken state between phases.
- Write all UI text, code comments, README and commit messages in English.
- Prefer boring, reliable libraries. No experimental dependencies.
- Keep a running `docs/PROGRESS.md` with: phase done, what works, what is stubbed, known bugs.
- Every piece of AI-generated code carries a header comment: `// Generated with AI assistance (Antigravity). Reviewed by the team.` Data files carry a sibling `*.meta.json` with `{ "origin": "AI-assisted generator", "synthetic": true }`.
- Never use NASA logos, flags, meatballs or mission patches anywhere. Cite NASA as plain text and links.
- No images or depictions of people under 18. Avoid photos of people entirely; use illustrations and the SVG body figure.
- Every simulated value is labelled SIMULATED in the UI and stored with `source = 'simulated'`.
- Show this disclaimer persistently in the footer and on alert screens: "Decision-support tool. It does not replace a flight surgeon and does not provide medical diagnoses."

## 1. Stack

- Vite + React 18 + TypeScript (strict), React Router with `HashRouter` (no server rewrites needed), Tailwind CSS, Recharts, Framer Motion, Lucide icons, Zustand for state, date-fns.
- Database and realtime: Supabase (`@supabase/supabase-js`). Config through `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
- **Fallback mode is mandatory.** When the environment variables are missing or the network fails, the app silently switches to a local in-memory store with the built-in simulator, shows a small "Offline demo mode" chip, and keeps working. The public demo must never show a blank screen or require login.
- Analytics: Python 3.11 scripts in `analytics/` (numpy, pandas, scikit-learn) that export JSON parameters consumed by the TypeScript engine. Inference runs in the browser.
- Hardware: Arduino/ESP32 sketch template in `hardware/` and a Python simulator in `tools/simulate.py`.
- Deployment target: Vercel or Netlify static build, public URL with no authentication.

## 2. Repository layout

```
/CONTEXT.md
/README.md
/docs/PROGRESS.md
/docs/REFERENCES.md
/docs/AI_USE.md
/supabase/schema.sql
/supabase/seed.sql
/src
  /app            (router, layout, providers)
  /components     (ui primitives, cards, charts, body-map, alerts)
  /features
    /overview /body-map /vitals /hazards /mission /guides /alerts /settings
  /engine         (baseline.ts, scoring.ts, alerts.ts, hazards.ts, trends.ts)
  /config         (thresholds.ts, environments.ts, hazards.ts, metrics.ts)
  /content        (guides/*.ts, risks.ts)   // static, source-cited
  /data           (supabaseClient.ts, store.ts, simulator.ts, repository.ts)
  /styles
/analytics        (generate_synthetic.py, fit_baseline.py, train_anomaly.py, README.md)
/hardware         (esp32_vitals.ino, README.md)
/tools            (simulate.py)
```

## 3. Data layer

1. Write `supabase/schema.sql` with the tables defined in `CONTEXT.md` section 9 (`astronauts`, `missions`, `sensors`, `readings`, `cabin_readings`, `radiation_log`, `mood_logs`, `exercise_logs`, `alerts`, `hazard_scores`), indexes on `(astronaut_id, metric, recorded_at desc)`, check constraints on `environment`, `source` and `level`, and permissive demo RLS policies with a comment marking them demo-only.
2. Write `supabase/seed.sql`: 1 mission per environment (`station`, `spacecraft`, `moon`), 4 adult crew members with callsigns (no real people), 14 days of simulated history per astronaut with `source = 'simulated'`.
3. `repository.ts` exposes one interface (`getLatest`, `getSeries`, `insertReading`, `subscribe`, `listAlerts`, `ackAlert`) with two implementations: Supabase and local. The UI never touches Supabase directly.
4. `simulator.ts` emits a reading per metric every 2–5 seconds in demo mode. Scenarios selectable from the Settings page and a hidden hotkey (`Shift+D`): `nominal`, `poor_sleep_streak`, `solar_particle_event`, `hypoxia_event`, `bp_drift`, `high_co2`. Each scenario modifies the relevant metrics smoothly over time.
5. Realtime: subscribe to inserts on `readings`, `alerts` and `radiation_log`. Charts and cards update without reload.

## 4. Engine (offline, pure TypeScript, unit-tested)

Implement in `src/engine` with Vitest tests for each module.

- `baseline.ts`: robust median and MAD per metric (and per time-of-day bucket when at least 7 days exist). Load fitted parameters from `public/models/baseline.json` when present, else fit on the first 7 days of data.
- `scoring.ts`: per-metric status from two layers. Layer 1: robust z-score against the personal baseline (|z| ≥ 2 orange, ≥ 3.5 red). Layer 2: absolute safety rails from `config/thresholds.ts` (terrestrial reference ranges in `CONTEXT.md` section 7). The worse of the two wins. Return `{status, value, z, rule_id, reason}`.
- `trends.ts`: exponentially weighted slope over 3–7 days. Flag drift when the projected value crosses an orange threshold within 72 hours.
- `hazards.ts`: five hazard scores 0–100 (radiation, isolation, distance, gravity, closed environment) computed from the metrics mapped in `CONTEXT.md` section 7 and weighted by the active environment (`config/environments.ts`).
- `alerts.ts`: generate alerts with levels green/orange/red, deduplicate within 30 minutes, escalate red when two orange alerts on related metrics persist more than 2 hours. When `comms_delay_s` is above 60, red alerts present the autonomous protocol first and the "Contact flight surgeon" action second.
- `scoring.ts` also computes the composite **Health Score (0–100)**: weighted metric statuses plus hazard exposure, weights editable in `config/environments.ts`. Expose the formula and weights in an "About this score" drawer.
- `config/thresholds.ts`: every entry has `{metric, unit, green:[min,max], orange:[…], red:[…], source_url, verified}`. Use the values from `CONTEXT.md` section 7 and mark `verified: false` for anything not directly confirmed on a NASA or CSA page. The UI shows a small "Reference value" badge on unverified entries.

## 5. Analytics scripts (Phase 4, optional but valuable)

- `generate_synthetic.py`: produce 30 days at 1-minute resolution per astronaut and environment, with documented parameter ranges, circadian pattern, noise, and injected events matching the six scenarios. Write CSV and `*.meta.json`.
- `fit_baseline.py`: compute per-astronaut robust baselines, write `public/models/baseline.json`.
- `train_anomaly.py`: train an Isolation Forest on the baseline window of the synthetic data, export parameters (or a compact approximation) to `public/models/anomaly.json`. Document clearly in `analytics/README.md` and in the UI "About this score" drawer that the model is trained on synthetic data and demonstrates the pipeline, not clinical validity.

## 6. UI and design specification

Follow `CONTEXT.md` section 11. Summary of the visual target:

- Premium, calm, light dashboard with a warm-green palette: canvas `#F4F7F2`, surface `#FFFFFF`, soft panel `#E9F1EA`, primary `#1F7A5A`, deep `#0F3D2E`, mint `#8FD3B6`, sand `#EFE8DA`, ink `#13211B`, muted `#5E6F66`; status green `#2FA36B`, orange `#F2A33A`, red `#E5484D`. Optional dark mode.
- Font: Manrope or Inter. Card radius 20–28 px, soft shadows, 8-pt spacing grid.
- Layout copied as a *pattern* from the reference dashboard: slim left icon sidebar; top greeting; hero card with the key number; quick-action row; recent-activity list; insights bar chart; goals card with ring progress; donut breakdown; right column for alerts and next measurement. Use original artwork and copy. Do not reproduce any branding from the reference.
- Responsive: desktop first (1440 px), good at tablet width, usable on mobile.
- Motion: count-up numbers, ring fills, card hover lift, smooth chart transitions. Respect `prefers-reduced-motion`.
- Accessibility: every status pairs colour with an icon and a text label, AA contrast, keyboard navigation, visible focus rings.

### Pages

1. **Overview**: greeting ("Good morning, <callsign>", mission day, environment chip, gravity and comms-delay chips); hero Health Score card with status chip, trend arrow, sparkline; crew ID card visual (original design, no NASA marks); quick actions (Log vitals, Start check-in, Contact flight surgeon, Open protocol); recent measurements list; weekly insights bar chart with a metric selector; countermeasure goals with progress rings; hazard donut; alerts column; next scheduled measurement with countdown.
2. **Body Map**: stylised SVG human figure with clickable regions (brain, eyes, heart, lungs, gut, bones/spine, muscles). Each region shows status colour, opens a side panel with function, current related metrics, linked HRP risk, recommended action, and source link. Hover highlights the region.
3. **Vitals**: grid of metric cards (HR, SpO2, temperature, BP, glucose, sleep, mood) with live value, status, 24 h and 7-day charts (Recharts) with threshold bands, manual entry modal, and a "How to measure" button opening the guide card.
4. **Hazards**: five hazard cards (radiation, isolation and confinement, distance from Earth, gravity fields, hostile/closed environments) each with score, drivers, related HRP risks and actions. A radiation panel shows dose rate, cumulative dose against budget, neutron-share field with a note referencing the CSA article on neutron radiation (about 30% of ISS radiation) and the CANS instrument.
5. **Mission**: environment selector (Station, Spacecraft, Moon) that changes gravity, comms delay, hazard weights and guidance in real time; crew list; sensor status (online, last seen, source).
6. **Guides**: searchable library of measurement guides (what, why in space, how to measure with onboard equipment, how often, normal range, when to alert, source). Plain language for non-experts.
7. **Alerts**: timeline of alerts with level, rule, reason, suggested action checklist, acknowledge button, and the escalation protocol view.
8. **Settings**: scenario switcher, data mode (live/offline), units, dark mode, "About this score" access, SIMULATED/REAL data legend.

### Content library (`src/content`)

Create guide entries for: heart rate, SpO2, body temperature, blood pressure, glucose, sleep, mood, radiation dose, cabin CO2. Create risk entries for the HRP risks listed in `CONTEXT.md` (at minimum cardiovascular adaptations, bone changes, reduced fitness, SANS, behavioural conditions, sleep and irregular schedules, inadequate food and nutrition, hypoxia, altered immune responses, radiation-induced cancers). Each entry includes `summary`, `why_it_matters_in_space`, `actions[]`, `escalate_when[]`, `source_url`. Base the text on the NASA HRP pages cited in `CONTEXT.md` section 12 and keep claims to what those pages support; add "reference value" tags where numeric guidance comes from general clinical references.

## 7. Phases and acceptance tests

**Phase 1 — Shell and data (target: 3 h)**
Project scaffold, theme, layout with sidebar, Overview with placeholder cards wired to the local store, simulator running, environment switch, public deploy.
*Acceptance:* open the deployed URL in a private window, see the dashboard with moving values, no login, no console errors.

**Phase 2 — Core vitals and engine (target: 3 h)**
Schema and seed, repository with Supabase + local implementations, engine modules with tests, Vitals page with charts and manual entry, alerts with three levels, Health Score.
*Acceptance:* run scenario `hypoxia_event`; SpO2 falls, status moves green → orange → red, an alert appears with the correct protocol, Health Score drops, `npm test` passes.

**Phase 3 — Body map, hazards, guides (target: 3 h)**
Body Map, Hazards page with radiation panel, Guides library, content with source URLs, "About this score" drawer, environment-dependent weights.
*Acceptance:* clicking lungs opens the hypoxia risk with action steps and a working HRP link; switching to Moon changes gravity to 0.165 g and shifts hazard weights visibly.

**Phase 4 — Hardware and polish (target: 3 h)**
ESP32 sketch and README, ingestion test with a real device if available, `tools/simulate.py`, goals and gamification (streaks, badges, ring progress), reminders, analytics scripts and exported models, animation polish, README, REFERENCES, AI_USE.
*Acceptance:* a POST from `tools/simulate.py` or the device appears on the dashboard within 3 seconds; README lets a stranger run the project in under 10 minutes.

If time runs short, cut from Phase 4 downward. Phases 1–3 constitute the minimum submission.

## 8. Required documents (drafts for the team to review)

- `README.md`: purpose, screenshot placeholders, architecture diagram (Mermaid) of sensors → database → engine/AI → UI, setup, environment variables, scenarios, deployment, limitations, disclaimer.
- `docs/REFERENCES.md`: every dataset, source page, library, font, icon set, and AI tool used, with licence.
- `docs/AI_USE.md`: where AI assisted (code generation, synthetic data generation, copy drafting), where it did not (thresholds are sourced from the references and reviewed by humans), and the watermark policy for any AI-generated image.
- Provide a short `docs/SUBMISSION_DRAFTS.md` containing English drafts for the submission fields: Project Name, High-Level Summary (about 150 words), Project Details, Space Agency Data, Use of AI.

## 9. Quality bar

- TypeScript strict, ESLint clean, no `any` in the engine.
- Lighthouse performance above 80 on desktop for the deployed build.
- No secrets committed. `.env.example` provided.
- Smooth first paint, skeleton loaders, graceful error states.
- Every alert, threshold and guidance card links to a source.

## 10. First action

1. Read `CONTEXT.md`.
2. Reply with a 10-line plan confirming stack, phases and any blocking questions (Supabase project available? which sensors exist?).
3. Start Phase 1 immediately after the team confirms, or after 2 minutes without a reply using the defaults in this prompt.
