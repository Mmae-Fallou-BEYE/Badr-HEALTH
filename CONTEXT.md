# CONTEXT — NASA Space Apps Challenge Dakar 2026
## Challenge: "Create Health Monitoring Software for Astronauts on Space Missions"
Team name and project name: **Badr Health**.

This file is the single source of truth for the project. Read it fully before writing code. Every product, design and compliance decision below is binding unless the team overrides it in writing.

---

## 1. Event facts and hard time limits

- Event: NASA Space Apps Challenge, local event in Dakar (Hôtel Le Ndiambour), organised by SENSAT.
- Today: Saturday 14 November 2026 (day 1). Work sessions on day 1: 10:00–13:30, 14:30–17:00, 17:30–20:00. Day 2 (Sunday 15 Nov): 08:00–12:30.
- **Real build time is about 13 hours.** Pitch to the local jury: Sunday 14:00–15:30.
- Submission portal closes Sunday 23:59 (GMT = Dakar time). Plan to click "Submit for Judging" by Sunday 12:00 and re-submit later if needed (re-submission is allowed).
- Everything in the submission form is written in **English**.
- Local winner becomes a "Global Nominee" (announced 3 Dec 2026). Global Finalists 17 Dec 2026. Global Winners (10 teams) 27 Jan 2027.

## 2. Mandatory deliverables (submission page, all in English)

| Field | Requirement |
|---|---|
| Project Name | text |
| High-Level Summary | what we built, how it answers the challenge, why it matters |
| Project Demo | ONE public link: either a slide deck (max 7 slides including title) or a video (max 30 s). Must open without login, password or sign-up |
| Final Project | public link to the product (hosted site and/or GitHub repo). No login required |
| Project Details | what it does, how it works, benefits, goals, tools/languages/hardware/software |
| Use of AI | dropdown declaration of where and how AI was used |
| Space Agency Data | which NASA/partner data we used, how, and how it shaped the project. **At least one NASA resource listed in the challenge is mandatory for Global Awards eligibility** |
| References | every dataset, code, text, image, tool, including open source |

Platform upload limits: images JPG/PNG/GIF up to 10 MB. No video or document upload on the page; use external public links (YouTube, Google Drive, GitHub, etc.). Test every link in a private/incognito window.

## 3. Compliance rules (non-negotiable)

1. No image, video, audio or other depiction of anyone under 18 anywhere in the demo or final project.
2. No NASA logo, flag, meatball, worm or mission patch in AI-generated content. Do not use NASA logos anywhere in the product. Cite NASA as text only.
3. AI-generated images and videos carry a visible watermark reading "AI-generated".
4. AI-generated code and data state their origin in the descriptive text and in metadata (README, file headers, `data/*.meta.json`).
5. Copyrighted content requires permission. Prefer original assets, open-source icons (Lucide), and fonts under open licenses.
6. All simulated or synthetic health data is labelled "SIMULATED" in the UI, in the database (`source` column) and in the README.
7. The product is a decision-support and monitoring tool. It states clearly in the UI that it does not replace a flight surgeon and does not issue medical diagnoses.

## 4. Judging criteria and the project's answer to each

| Criterion | What judges ask | Our answer |
|---|---|---|
| Impact | Qualitative and quantitative potential to help others | Autonomy for crews beyond real-time ground support; earth spin-offs (remote patient monitoring, isolated communities) |
| Creativity | Original approach | Environment-aware health engine (station / spacecraft / Moon), hazard-linked body map, personal-baseline scoring, hardware-to-dashboard pipeline |
| Validity | Scientific basis, technical feasibility demonstrated, ease of use | Every threshold and every guidance card carries a source URL. Personal baseline logic. Working sensor-to-database-to-UI pipeline. Offline-capable engine |
| Relevance | Direct fit to the challenge and NASA data as a CENTRAL element, not a decoration | The five HRP hazards and the HRP risk pages drive the data model, the alert rules, the body map and the guidance content |
| Presentation | Clear, captivating, well structured | Design-led UI, 7-slide deck, live demo with a scripted scenario |

Validity and Relevance separate teams most. Most teams ship a nice UI. We win by anchoring rules and content in the sources listed in section 12.

## 5. Challenge brief (condensed)

Long-duration missions expose astronauts to space radiation, isolation and confinement, altered gravity, and a hostile closed environment, which can bring immune changes, bone loss, cardiovascular events and behavioural health problems. On long missions astronauts carry much of the responsibility for spotting these changes in themselves. Build a visual health monitoring software that gathers health indicators and lets astronauts evaluate and act on their health status.

Suggested indicators: blood pressure, heart rate, blood sugar, body temperature, daily sleep hours, mood. Any input is valid (keyboard, clicks, camera, sensors). Suggested features: clickable human figure, dynamic charts over time, colour coding, reminders to take measurements, gamification, plain-language instructions for non-experts, support for several environments (spacecraft, station, rover, planetary base). Questions the tool should answer in the UI: which measurements can be taken in space, why a given exam is needed, how spaceflight hazards affect each indicator, when a result needs crew or flight-surgeon attention, which actions prevent a critical condition.

## 6. Team project concept

**Product:** a web application styled as a premium dashboard (reference: a modern fintech dashboard, see section 11). It monitors one or more astronauts, takes live data from physical sensors configured by the team, stores everything in a central database, scores health per astronaut against a personal baseline, adapts to the mission environment, and explains what to do.

**Three data sources feed one central database:**
1. Physical sensors (ESP32-class microcontrollers posting over HTTPS).
2. Manual entries in the web app (blood pressure, glucose, mood, sleep, exercise).
3. A simulator (always available, labelled SIMULATED) that guarantees the demo works without hardware or reliable venue Wi-Fi.

**The database is the centre of the architecture.** It connects the sensors, the web app and the analytics/AI component.

**Three environments (selectable per mission):**
- **Space station (LEO)**: microgravity, inside Earth's magnetosphere, near-real-time contact with ground.
- **Spacecraft in deep-space transit**: microgravity, highest radiation exposure, communication delay grows with distance, autonomy mode more likely.
- **Moon surface base**: about 1/6 g, no magnetosphere or atmosphere, dust, high radiation, communication delay of seconds.
(Mars is a roadmap item: about 3/8 g per the NASA hazards page, delays up to many minutes.)

## 7. Science model: hazards → risks → indicators → actions

Source for hazards and risks: NASA Human Research Program (HRP) pages (section 12). The five hazards: space radiation, isolation and confinement, distance from Earth, gravity fields, hostile/closed environments.

| HRP hazard | HRP risks (from the Risks page) | Indicators in the app | Sensor/entry path | Typical guidance themes |
|---|---|---|---|---|
| Space radiation | Radiation-induced cancers; altered immune responses | Cumulative dose (mSv), dose rate, neutron share, body temperature trend | Dosimeter feed (simulated unless hardware exists) | Shelter protocol during solar particle events, dose budgeting, flight-surgeon review |
| Isolation and confinement | Behavioural changes and psychiatric disorders; inadequate teamwork; inadequate sleep and irregular schedules | Mood (1–5), sleep hours, sleep regularity, stress self-report | Manual + wearable activity proxy | Sleep hygiene, schedule regularity, crew contact, mood check-in escalation |
| Distance from Earth | Inadequate systems operations support; medical autonomy | Communication delay, ground-contact availability (drives escalation mode) | Mission config / simulated | Autonomy mode: app shows full protocols locally when delay is high |
| Gravity fields | Cardiovascular adaptations; reduced cardiorespiratory and musculoskeletal fitness; spaceflight-induced bone changes; SANS (eyes/brain); sensorimotor and vestibular function | Heart rate, blood pressure, exercise minutes, resistive-exercise sessions, vision self-check | Wearable HR, cuff or manual BP, exercise log | Daily exercise countermeasures, nutrition for bone, vision check prompts |
| Hostile/closed environments | Inadequate food and nutrition; host-microorganism interactions; hypoxia; decompression sickness | SpO2, cabin CO2, cabin temperature, humidity, calorie intake, glucose | Pulse oximeter, cabin air sensor, manual glucose | Ventilation checks, nutrition log, hypoxia warning, EVA prep notes |

Radiation context from the Canadian Space Agency article (Feb 2026): neutron radiation contributes about 30% of total radiation on the ISS and is especially harmful; CSA invests in the Canadian Active Neutron Spectrometer (CANS), a compact autonomous instrument for continuous neutron measurement. The app's radiation card references this and displays a neutron-share field.

### Reference ranges (terrestrial clinical references, used as defaults)
These are generic adult reference values used as **starting points**. The engine scores deviation against the astronaut's own baseline first and uses these ranges only as outer safety rails. Each entry in `src/config/thresholds.ts` has fields `{metric, unit, min, max, source, verified}`. Set `verified: false` for anything not confirmed from a NASA/CSA page, and surface a "reference value, verify with flight surgeon" tag in the UI.

| Metric | Green (typical) | Orange (watch / act) | Red (escalate) |
|---|---|---|---|
| Resting heart rate (bpm) | 50–90 | 90–110 or 40–50 | >110 or <40 at rest |
| SpO2 (%) | ≥95 | 92–94 | <92 |
| Body temperature (°C) | 36.1–37.2 | 37.3–38.0 | >38.0 or <35.5 |
| Blood pressure (mmHg) | <130/85 | 130–139 / 85–89 | ≥140/90 sustained or ≥180/120 |
| Fasting glucose (mg/dL) | 70–99 | 100–125 or 55–69 | ≥126 or <55 |
| Sleep (h/night) | 7–9 (crew target) | 5.5–7 | <5.5 for 2+ nights |
| Mood (1–5) | 3–5 | 2 | 1, or ≤2 for 3+ days |
| Cabin CO2 (ppm) | <3000 | 3000–5000 | >5000 (confirm limit from NASA spec, `verified:false`) |

Radiation planning values (approximate, `verified:false` until checked against NASA/CSA pages): ISS dose rate on the order of 0.5–1 mSv/day; deep-space transit about 1.5–2 mSv/day; lunar surface about 1.3 mSv/day; NASA career limit 600 mSv. The UI shows "estimated budget used" and flags that values are simulated.

## 8. Analytics and AI design (honest scope)

No public per-astronaut dataset exists for training. A model trained on synthetic data learns only the generator's rules, so the project claims exactly what it does:

1. **Synthetic dataset generator** (Python): produces plausible time series per metric per environment from parameter ranges documented in the references, with injected events (radiation spike, sleep loss streak, BP drift, CO2 rise). Output labelled `SIMULATED` with `data/*.meta.json` stating origin (AI-assisted code).
2. **Personal baseline model** (fit per astronaut on the first N days): robust median and MAD per metric and per time-of-day bucket. Score = robust z-score of the latest window.
3. **Anomaly detector**: Isolation Forest (scikit-learn) trained on the synthetic baseline period, exported as JSON parameters (or approximated by the robust z-score plus rules) so inference runs **in the browser/offline**.
4. **Trend forecaster**: exponentially weighted slope to flag drift (for example BP creeping up over 5 days) before the threshold is crossed.
5. **Environment adjustment**: hazard weights change per environment (radiation weight higher in deep-space transit; bone/muscle weight higher in microgravity; dust/respiratory in Moon base).
6. **Composite Health Score (0–100)** = weighted combination of per-metric status and hazard exposure, with the formula visible in an "About this score" panel.
7. **Guidance content** is a static, source-cited library (`src/content/`). The optional local BioMistral feature provides an on-demand structured review and guided symptom intake through Ollama on the same computer. It does not change dashboard thresholds or deterministic alert levels, and it is not an open-ended chatbot. The AI report's own risk level is separate from dashboard alert status. No readings are sent to a cloud AI service. Declare this use in the "Use of AI" field.

Alert levels: **Green** monitor. **Orange** guided corrective action (checklist). **Red** contact flight surgeon, show emergency protocol, and if communication delay is high, show autonomous-mode protocol first.

## 9. Data architecture (central database)

Recommended: Supabase (PostgreSQL + REST + Realtime). Fallback: if environment variables are missing, the app runs entirely on a local in-memory store plus the simulator, so the demo never breaks. The local BioMistral integration analyzes a current in-memory snapshot; it does not persist reports or send data to Supabase.

Tables:
- `astronauts(id, callsign, display_name, mission_id, baseline_fitted_at, baseline jsonb)`
- `missions(id, name, environment text check in ('station','spacecraft','moon'), gravity_g numeric, comms_delay_s numeric, started_at)`
- `sensors(id, astronaut_id, kind, device_key, status, last_seen)`
- `readings(id, astronaut_id, sensor_id null, metric, value numeric, unit, recorded_at timestamptz, source text check in ('sensor','manual','simulated'))`
- `cabin_readings(id, mission_id, metric, value, unit, recorded_at, source)`
- `radiation_log(id, astronaut_id, dose_rate_usv_h, cumulative_msv, neutron_share, recorded_at, source)`
- `mood_logs(id, astronaut_id, mood int, stress int, note, recorded_at)`
- `exercise_logs(id, astronaut_id, kind, minutes, recorded_at)`
- `alerts(id, astronaut_id, metric, level text check in ('green','orange','red'), rule_id, message, created_at, acknowledged_at)`
- `hazard_scores(astronaut_id, hazard, score, computed_at)`

Row-level security: demo mode uses permissive policies on these tables so judges can open the app without login. Document this in the README as demo-only.

**Sensor ingestion path:** ESP32 → HTTPS POST to the Supabase REST endpoint (`/rest/v1/readings`) with the project anon key plus a `device_key` header validated by a database function, JSON body `{astronaut_id, metric, value, unit, recorded_at}`. Provide an Arduino/ESP32 sketch template in `hardware/` and a Python simulator `tools/simulate.py` posting the same payload.

Candidate sensors (team chooses what it actually has): MAX30102 (heart rate, SpO2), MLX90614 or DS18B20 (temperature), SCD41 or MH-Z19 (cabin CO2), BME280 (temperature, humidity, pressure), MPU6050 (activity proxy). Blood pressure and glucose are manual entries in the demo.

## 10. Features by priority

**P0 (must work by Saturday 20:00):** dashboard shell with the reference layout; mission/environment switch; 5 core metrics live from the database (HR, SpO2, temperature, BP, sleep) plus mood; colour-coded status; trend charts; simulator; manual entry form; alerts with 3 levels; English UI; deployed public URL.

**P1 (Sunday morning):** clickable body figure with per-organ status and linked HRP risk; hazard exposure panel (five hazards); personal baseline scoring and Health Score; measurement guide cards (what, why, how, how often, source); real sensor feed demo; reminders for scheduled measurements; README, references, AI-use declaration.

**Implemented optional feature:** local BioMistral structured review and guided symptom intake, available on demand when the local Ollama service is running; it does not replace the deterministic dashboard engine.

**P2 (only if time remains):** gamification (streaks, countermeasure rings, badges), Python-trained Isolation Forest exported to JSON, multi-astronaut crew view, offline PWA.

Everything else goes into the pitch roadmap: Mars profile, ultrasound image input via camera, EVA mode, flight-surgeon ground portal.

## 11. Visual design specification

Reference image: a modern digital-banking dashboard ("Nexora") with a warm light canvas, a slim icon sidebar on the left, a greeting header, a large hero card with a big number, a card visual, row of quick-action buttons, a recent-activity list, an insights bar chart, a goals card with progress, and a donut breakdown. **Reproduce the layout pattern and visual language with original artwork and original copy. Do not copy its branding, text or imagery.**

Palette (health-oriented, greener than the reference): canvas `#F4F7F2`, surface `#FFFFFF`, soft panel `#E9F1EA`, primary green `#1F7A5A`, deep green `#0F3D2E`, accent mint `#8FD3B6`, warm sand `#EFE8DA`, ink `#13211B`, muted text `#5E6F66`. Status colours: green `#2FA36B`, orange `#F2A33A`, red `#E5484D`. Provide an optional dark mode `#0E1A15` canvas.

Type: Inter or Manrope (open licenses). Radius 20–28 px on cards, generous spacing, soft shadows, subtle motion (Framer Motion: count-up numbers, ring fills, card hover).

Layout mapping from the reference to our product:
- Left sidebar icons: Overview, Body Map, Vitals, Hazards, Mission, Guides, Alerts, Settings.
- Greeting: "Good morning, <callsign>" with mission day count and environment chip.
- Hero card (reference: balance): **Health Score** large number with status chip, trend arrow, and a mini sparkline. Beside it, a crew ID card visual (original, no NASA marks).
- Quick actions (reference: Send/Pay/Top-up): Log vitals, Start check-in, Contact flight surgeon, Open protocol.
- Recent activity list (reference: transactions): latest measurements with metric icon, value, time, status dot.
- Insights bar chart: weekly trend of a selectable metric.
- Goals card: countermeasure goals (exercise minutes, sleep hours) with progress ring.
- Donut (reference: spending): hazard exposure split across the five HRP hazards.
- Right column: Alerts and "Next scheduled measurement".

Body figure: stylised SVG silhouette with clickable regions (brain/head, eyes, heart, lungs, gut, bones/spine, muscles). Click opens a side panel: function, current status, linked HRP risk, recommended action, source link.

Accessibility: colour never carries meaning alone (icon plus label with every status), contrast AA, keyboard navigable.

## 12. NASA and space-agency sources (cite in References and in-app)

Read and used:
- NASA HRP, Five Hazards of Human Spaceflight: https://www.nasa.gov/hrp/hazards/ . Defines space radiation, isolation and confinement, distance from Earth, gravity fields, hostile/closed environments. States that hazards interact and amplify each other. Notes Mars gravity is three-eighths of Earth's.
- NASA HRP, Risks of Human Spaceflight: https://www.nasa.gov/hrp/risks/ . Lists the specific risks (immune responses, sensorimotor/vestibular, cardiovascular adaptations, decompression sickness, host-microorganism interactions, hypoxia, food and nutrition, EVA injury, reduced fitness, SANS, bone changes, behavioural conditions, teamwork, sleep and irregular schedules, systems operations support, dynamic loads, radiation-induced cancers). Each risk page is linked from there and is the citation target for guidance cards.
- Canadian Space Agency, Monitoring radiation for astronaut health (26 Feb 2026): https://www.asc-csa.gc.ca/eng/news/articles/2026/2026-02-26-monitoring-radiation-astronaut-health.asp . Neutron radiation about 30% of ISS radiation; CANS instrument.

Provided by the team, not yet read by the assistant (open them and extend guidance cards):
- https://www.nasa.gov/hrp/ongoing-hrp-research/
- https://www.asc-csa.gc.ca/eng/iss/science/why-do-we-conduct-science-experiments-in-space.asp
- Resources tab of the challenge page on spaceappschallenge.org (datasets).

Each guidance card and each threshold stores a `source_url`. The Space Agency Data field of the submission lists exactly these pages and states what each one fed (hazard model, risk-to-indicator mapping, radiation card, guidance content).

## 13. Demo script (for the pitch and the 7-slide deck)

1. Open dashboard in "Space station" mode, healthy crew member, Health Score 91.
2. Live sensor shows heart rate and SpO2 updating from the real device.
3. Switch environment to "Moon base": exposure weights shift, gravity 0.165 g, new guidance appears.
4. Trigger scenario "Solar particle event + poor sleep": radiation card rises, mood and sleep drift, Health Score falls, orange alert with checklist.
5. Escalate to red (SpO2 drop): protocol opens, communication-delay banner shows autonomous mode.
6. Click the body figure (lungs): HRP hypoxia risk, action steps, source.
7. Close on roadmap: Mars profile, ultrasound input, flight-surgeon portal.

Slides (max 7): 1 title and team; 2 challenge and why autonomy matters; 3 solution overview; 4 architecture (sensors → database → AI → app); 5 NASA data and how it drives rules; 6 UX and demo screenshots; 7 impact and roadmap.

## 14. Open items to confirm with the team

- Member names (adults only for any on-screen content). Team and project name are fixed: Badr Health.
- Which sensors physically exist and who owns the firmware.
- Hosting accounts (Vercel/Netlify, Supabase) and who holds the credentials.
