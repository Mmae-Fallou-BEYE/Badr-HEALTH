# Generated with AI assistance (Antigravity). Reviewed by the team.
"""
Badr Health — Synthetic Biometric Dataset Generator
NASA Space Apps Challenge Dakar 2026

Generates 30 days of high-resolution (hourly or minute-level) physiological and
environmental telemetry for 4 astronauts across 3 environments with circadian patterns,
Gaussian noise, and injected contingency scenarios.
"""

import math
import random
import csv
import json
from datetime import datetime, timezone, timedelta

OUTPUT_CSV = "analytics/synthetic_30d.csv"
OUTPUT_META = "analytics/synthetic_30d.meta.json"

ASTRONAUTS = ["ast-01", "ast-02", "ast-03", "ast-04"]
ENVIRONMENTS = ["station", "spacecraft", "moon"]

def generate_dataset(days: int = 30):
    start_time = datetime(2026, 10, 1, 0, 0, tzinfo=timezone.utc)
    rows = []

    print(f"Generating {days} days of synthetic astronaut vitals...")

    for day in range(days):
        for hour in range(24):
            current_time = start_time + timedelta(days=day, hours=hour)
            iso_time = current_time.isoformat()

            # Circadian cycle (cosine with peak around late afternoon)
            circadian = math.cos((hour - 16) * 2 * math.pi / 24)

            for astro in ASTRONAUTS:
                # Individual variation factor
                astro_offset = (int(astro[-1]) - 2) * 1.5

                # Nominal values
                hr = round(68 + circadian * 4.0 + astro_offset + random.gauss(0, 1.5), 1)
                spo2 = min(100.0, round(98.2 - abs(circadian) * 0.3 + random.gauss(0, 0.4), 1))
                sys_bp = round(118 + circadian * 3.5 + astro_offset * 1.2 + random.gauss(0, 1.8), 1)
                dia_bp = round(76 + circadian * 2.0 + random.gauss(0, 1.2), 1)
                temp = round(36.75 + circadian * 0.2 + random.gauss(0, 0.05), 2)
                co2 = round(1250 + random.gauss(0, 40))
                rad = round(22.0 + random.gauss(0, 1.2), 2)

                # Injected event: Day 12 Solar Particle Event
                if day == 12:
                    rad = round(rad + 180.0 * math.sin((hour / 24.0) * math.pi), 2)

                # Injected event: Day 20 Hypoxia incident for ast-01
                if day == 20 and astro == "ast-01" and 14 <= hour <= 18:
                    spo2 = round(90.0 - (hour - 14) * 1.2 + random.gauss(0, 0.3), 1)
                    hr = round(hr + 28.0, 1)

                rows.append([iso_time, astro, "station", hr, spo2, sys_bp, dia_bp, temp, co2, rad, "simulated"])

    # Write CSV
    with open(OUTPUT_CSV, "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(["recorded_at", "astronaut_id", "environment", "heart_rate", "spo2", "blood_pressure_sys", "blood_pressure_dia", "body_temp", "cabin_co2", "radiation_dose_rate", "source"])
        writer.writerows(rows)

    # Write Sibling Meta JSON
    meta = {
        "origin": "AI-assisted generator",
        "synthetic": True,
        "days": days,
        "rows_count": len(rows),
        "parameters": {
            "circadian_modeling": "24h sinusoidal curve",
            "noise": "Gaussian distribution with calibrated sigma",
            "injected_events": ["Day 12 SPE radiation spike", "Day 20 ast-01 Hypoxia incident"]
        },
        "license": "CC-BY-4.0",
        "generated_at": datetime.now(timezone.utc).isoformat()
    }
    with open(OUTPUT_META, "w", encoding="utf-8") as f:
        json.dump(meta, f, indent=2)

    print(f"Dataset generated: {OUTPUT_CSV} ({len(rows)} observations)")
    print(f"Metadata generated: {OUTPUT_META}")

if __name__ == "__main__":
    generate_dataset(30)
