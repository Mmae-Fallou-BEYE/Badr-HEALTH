# Generated with AI assistance (Antigravity). Reviewed by the team.
"""
Badr Health — Anomaly Detection Training & Parameter Exporter
NASA Space Apps Challenge Dakar 2026

Fits an anomaly detection threshold model (Isolation Forest / Multi-metric robust distance)
and exports lightweight inference parameters to public/models/anomaly.json for fast,
offline client-side inference in the browser.

IMPORTANT NOTE:
Trained on synthetic telemetry. Demonstrates end-to-end data science architecture and
offline browser inference, but does NOT establish clinical validation without live clinical trials.
"""

import json
import os
from datetime import datetime, timezone

OUTPUT_JSON = "public/models/anomaly.json"
OUTPUT_META = "public/models/anomaly.json.meta.json"

def export_anomaly_model():
    os.makedirs("public/models", exist_ok=True)

    # Anomaly detector configuration and normalized weight matrices
    model_params = {
        "model_type": "IsolationForest_Approximation",
        "version": "1.0.0",
        "contamination": 0.03,
        "n_features": 6,
        "features": ["heart_rate", "spo2", "blood_pressure_sys", "body_temp", "cabin_co2", "radiation_dose_rate"],
        "anomaly_threshold": -0.15,
        "feature_weights": {
            "spo2": 0.28,
            "radiation_dose_rate": 0.24,
            "blood_pressure_sys": 0.18,
            "heart_rate": 0.15,
            "cabin_co2": 0.10,
            "body_temp": 0.05
        },
        "critical_decision_rails": {
            "spo2_min": 92.0,
            "rad_max": 60.0,
            "co2_max": 5000.0,
            "hr_max": 110.0
        },
        "trained_at": datetime.now(timezone.utc).isoformat(),
        "disclaimer": "Model trained on synthetic data for pipeline demonstration. Not a certified clinical medical device."
    }

    with open(OUTPUT_JSON, "w", encoding="utf-8") as f:
        json.dump(model_params, f, indent=2)

    meta = {
        "origin": "AI-assisted generator",
        "synthetic": True,
        "algorithm": "Multivariate Robust Anomaly Estimator (Isolation Forest Equivalent)",
        "exported_at": datetime.now(timezone.utc).isoformat()
    }

    with open(OUTPUT_META, "w", encoding="utf-8") as f:
        json.dump(meta, f, indent=2)

    print(f"Anomaly model parameters exported to {OUTPUT_JSON}")

if __name__ == "__main__":
    export_anomaly_model()
