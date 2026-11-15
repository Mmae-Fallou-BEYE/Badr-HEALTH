# NASA Space Apps Challenge Submission Drafts — Badr Health

English submission copy ready for direct insertion into the Space Apps portal.

---

### 1. Project Name
**Badr Health**

---

### 2. High-Level Summary (~150 words)
As human spaceflight ventures beyond Low Earth Orbit toward the Moon and Mars, astronauts face extreme space radiation, altered gravity, and hostile closed habitats, isolated by communication delays that preclude real-time guidance from ground flight surgeons. Badr Health is an autonomous, environment-adaptive physiological monitoring and decision-support web platform built for deep space missions. 

Ingesting biometrics from physical sensors (ESP32) or resilient onboard simulators, Badr Health evaluates astronaut vitals through a deterministic two-layer engine: personal robust baseline z-scores (median and MAD) paired with outer NASA Human Research Program safety rails. The system dynamically recalibrates risk weights when transitioning between low Earth orbit, deep space transit, and lunar surface outposts. Featuring a clickable anatomical body map, predictive 72-hour drift forecasters, and source-cited emergency protocols, Badr Health empowers astronauts to maintain peak operational readiness, spot insidious physiological decline early, and execute autonomous medical countermeasures when Earth is minutes away.

---

### 3. Project Details
- **What It Does**: Monitors multi-astronaut vital signs (HR, SpO2, blood pressure, core temperature, glucose, sleep, mood, cabin CO2, and radiation flux), detects anomalies against personal baselines, and guides autonomous clinical actions during communications blackouts.
- **How It Works**:
  1. *Ingestion*: Real-time HTTPS POST from ESP32 microcontrollers (MAX30102 / BME280) or an offline browser simulator.
  2. *Data Layer*: Dual-mode architecture supporting remote Supabase (PostgreSQL + Realtime WebSockets) and an in-memory offline fallback for zero-downtime operation.
  3. *Engine*: Pure TypeScript statistical engine running robust non-parametric scoring, exponential trend forecasting, 5-hazard calculations, and 3-level alert escalation.
  4. *Interface*: A calm, fintech-inspired dashboard with an interactive anatomical SVG body map, 7-day trend charts, countermeasure goal rings, and a source-verified guides library.
- **Benefits**: Fosters crew medical autonomy, prevents preventable mission aborts, and provides an Earth spin-off framework for remote tele-monitoring in isolated Antarctic bases and rural clinics.
- **Tools & Languages**: TypeScript, React 18, Vite, Tailwind CSS, Recharts, Framer Motion, Zustand, Supabase, Python (data modeling), C++/Arduino (ESP32 firmware).

---

### 4. Space Agency Data
- **NASA Human Research Program (HRP) Five Hazards**: Directly shaped the mathematical hazard score matrix, adapting exposure weights dynamically across Station, Spacecraft, and Moon profiles.
- **NASA HRP Evidence Books & Risks**: Sourced the clinical thresholds and countermeasure actions for SANS (Spaceflight Associated Neuro-ocular Syndrome), cardiovascular deconditioning, bone mineral loss, muscle atrophy, hypoxia, and space fever.
- **Canadian Space Agency (CSA) Radiation Research (Feb 2026)**: Guided our radiation dosimeter model and the CANS instrument panel, highlighting that secondary neutrons account for ~30% of total astronaut radiation dose on the ISS.
- **NASA Spacecraft Environmental Health Specifications**: Defined the cabin CO2 safety limit rails (3,000 ppm warning, 5,000 ppm critical).

---

### 5. Use of AI
- **Assisted**: AI (Antigravity agent) assisted in software scaffolding, frontend styling, drafting unit test cases, and developing Python scripts to simulate synthetic physiological time series with sinusoidal circadian rhythms.
- **Not Used / Human Governed**: All clinical thresholds, alert decision rules, and hazard weights were manually curated from official NASA and CSA publications. No black-box generative models make autonomous medical triage decisions. No copyrighted images or photorealistic depictions were used.
