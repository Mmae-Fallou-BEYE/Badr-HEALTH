# AI Usage Disclosure — Badr Health

NASA Space Apps Challenge Dakar 2026

In strict compliance with NASA Space Apps Challenge regulations, this document transparently outlines where artificial intelligence was used in the development of Badr Health, and where human scientific review governed decisions.

---

## 1. Where AI Assisted

1. **Code Generation & Scaffolding**:
   - The application scaffold (React components, TypeScript data interfaces, Zustand store, Tailwind CSS configuration, and Vitest test suites) was developed with AI assistance (Antigravity agent).
   - Every AI-generated source file carries the required header comment:
     `// Generated with AI assistance (Antigravity). Reviewed by the team.`

2. **Synthetic Telemetry Modeling**:
   - Python script `analytics/generate_synthetic.py` used AI-assisted code to simulate 30 days of multi-astronaut physiological time series with sinusoidal circadian dynamics and Gaussian noise.
   - Sibling metadata files (`*.meta.json`) accompany all synthetic datasets:
     `{ "origin": "AI-assisted generator", "synthetic": true }`

3. **Plain-Language Text & Documentation Drafting**:
   - AI assisted in synthesizing complex NASA Human Research Program Evidence Books into plain-language biomedical summaries for non-experts.

---

## 2. Where AI Did NOT Intervene (Human Scientific Governance)

1. **Thresholds & Safety Rails**:
   - Physiological reference ranges (SpO2 limits, heart rate brackets, core body temperatures, cabin CO2 limits, and radiation thresholds) were directly extracted by human researchers from official NASA HRP and Canadian Space Agency (CSA) publications.
   - AI was **not** permitted to hallucinate or invent safety thresholds.

2. **Autonomous Medical Decision Boundaries**:
   - The decision-support logic does not rely on opaque "black-box" LLM prompt completions.
   - The engine is deterministic, rule-based, and grounded in transparent non-parametric statistics (robust median and Median Absolute Deviation z-scores).

3. **No Watermarked Imagery**:
   - No AI-generated photorealistic images or deepfakes were used.
   - The body figure is an original vector SVG illustration.

---

## 3. Persistent Compliance Policy

All synthetic values displayed in the software interface carry an unambiguous, visible `SIMULATED` badge. The software persistently displays the following disclaimer:

> **"Decision-support tool. It does not replace a flight surgeon and does not provide medical diagnoses."**
