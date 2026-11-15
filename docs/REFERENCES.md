# Scientific References & Asset Attribution — Badr Health

NASA Space Apps Challenge Dakar 2026

---

## 1. Space Agency Scientific Data & Publications

1. **NASA Human Research Program (HRP) — Five Hazards of Human Spaceflight**
   - URL: https://www.nasa.gov/hrp/hazards/
   - Description: Definition and interaction matrix for Space Radiation, Isolation and Confinement, Distance from Earth, Gravity Fields, and Hostile/Closed Environments.
   - Usage in Project: Governs the five-hazard model, environmental weights, and composite risk scoring.

2. **NASA Human Research Program (HRP) — Risks of Human Spaceflight & Evidence Books**
   - URL: https://www.nasa.gov/hrp/risks/
   - Description: Epidemiological and biomedical evidence books for SANS, cardiovascular deconditioning, bone mineral loss, muscle atrophy, hypoxia, sleep loss, and behavioral adaptation.
   - Usage in Project: Informs the two-layer safety rails, risk definitions in `src/content/risks.ts`, and organ mapping in the Interactive Body Map.

3. **Canadian Space Agency (CSA) — Monitoring radiation for astronaut health (26 Feb 2026)**
   - URL: https://www.asc-csa.gc.ca/eng/news/articles/2026/2026-02-26-monitoring-radiation-astronaut-health.asp
   - Description: Groundbreaking findings on neutron radiation accounting for ~30% of total astronaut radiation dose on the ISS and the development of the Canadian Active Neutron Spectrometer (CANS).
   - Usage in Project: Direct citation on the Radiation Card; incorporated into dosimeter telemetry and neutron share calculations.

4. **NASA Human Integration Design Handbook (HIDH)**
   - URL: https://www.nasa.gov/hhp/human-integration-design-handbook/
   - Description: Habitat environmental standards for cabin CO2, total atmospheric pressure, and acoustic limits.
   - Usage in Project: Establishes the 3,000 ppm warning and 5,000 ppm red limits for cabin carbon dioxide.

---

## 2. Software Libraries & Open Source Licenses

| Dependency | Purpose | License |
|---|---|---|
| `react` & `react-dom` (v18.3.1) | Declarative UI framework | MIT License |
| `vite` (v5.4.3) | Frontend bundler & dev server | MIT License |
| `typescript` (v5.5.4) | Type-safe static analysis | Apache-2.0 License |
| `tailwindcss` (v3.4.11) | Utility-first CSS styling engine | MIT License |
| `zustand` (v4.5.5) | Lightweight global state store | MIT License |
| `react-router-dom` (v6.26.2) | Hash-based static routing | MIT License |
| `recharts` (v2.12.7) | Declarative SVG charting | MIT License |
| `framer-motion` (v11.5.4) | Hardware-accelerated UI transitions | MIT License |
| `lucide-react` (v0.441.0) | Accessible iconography | ISC License |
| `@supabase/supabase-js` (v2.45.4) | PostgreSQL & Realtime client | MIT License |
| `date-fns` (v3.6.0) | ISO date/time manipulation | MIT License |
| `vitest` (v2.0.5) | Unit test runner | MIT License |

---

## 3. Typography & Design Assets

- **Inter**: Designed by Rasmus Andersson. SIL Open Font License 1.1.
- **Manrope**: Designed by Mikhail Sharanda. SIL Open Font License 1.1.
- **Anatomical Body Map**: Original vector artwork generated specifically for Badr Health. No third-party copyrighted illustrations or human photos used.
