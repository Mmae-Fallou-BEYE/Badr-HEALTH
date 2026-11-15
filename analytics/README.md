# Analytics & Machine Learning Pipeline — Badr Health

This directory contains the data science scripts for generating synthetic astronaut telemetry, fitting robust personal physiological baselines, and exporting lightweight client-side anomaly detection models.

---

## 1. Ethical AI & Scope Disclosure

- **No Public Per-Astronaut Time Series Exists**: Real longitudinal health telemetry for active astronauts is classified and subject to strict medical privacy laws.
- **Trained on Synthetic Telemetry**: The models and baseline estimators in this repository are trained exclusively on synthetic data generated from physiological ranges published in the **NASA Human Research Program (HRP) Evidence Books**.
- **Demonstration Pipeline**: This software demonstrates an end-to-end telemetry pipeline and browser-based inference. It does **not** claim clinical validation without clinical trials on human subjects.
- **Decision-Support Only**: The product states clearly in the UI and documentation that it does not replace a flight surgeon and does not diagnose medical conditions.

---

## 2. Scripts Overview

1. `generate_synthetic.py`:
   - Produces 30 days of hourly physiological observations across 4 astronauts.
   - Models 24-hour sinusoidal circadian patterns and Gaussian physiological noise.
   - Injects contingency test scenarios (Day 12 SPE radiation spike, Day 20 ast-01 hypoxia event).
   - Exports `analytics/synthetic_30d.csv` and sibling `synthetic_30d.meta.json`.

2. `fit_baseline.py`:
   - Fits robust statistical median and Median Absolute Deviation (MAD) over a 14-day calibration window.
   - Exports parameters to `public/models/baseline.json`.

3. `train_anomaly.py`:
   - Trains a multi-parameter anomaly detector (Isolation Forest equivalent) and exports decision weights and thresholds to `public/models/anomaly.json`.
   - Enables pure offline execution in the browser without server dependencies.

---

## 3. Running the Analytics Pipeline

With `uv` or Python 3.11+:
```bash
python analytics/generate_synthetic.py
python analytics/fit_baseline.py
python analytics/train_anomaly.py
```
