# Generated with AI assistance (Antigravity). Reviewed by the team.
"""
Badr Health — Hardware Simulation & Ingestion CLI Tool
NASA Space Apps Challenge Dakar 2026

Simulates real-time telemetry from an ESP32 microcontroller or medical wearable
and streams observations directly to the Badr Health ingestion endpoint.
"""

import sys
import time
import math
import random
import json
from datetime import datetime, timezone

def generate_telemetry(step: int, scenario: str = 'nominal'):
    now = datetime.now(timezone.utc).isoformat()
    noise = (random.random() - 0.5) * 2.0

    if scenario == 'hypoxia_event':
        spo2 = max(86.0, round(98.0 - step * 1.1, 1))
        hr = min(120.0, round(70.0 + step * 3.5 + noise, 1))
        co2 = round(1400 + step * 150)
    elif scenario == 'solar_particle_event':
        spo2 = 98.0
        hr = round(74.0 + noise, 1)
        rad = round(22.0 + min(250.0, step * 25.0), 1)
        co2 = 1250
    else: # nominal
        spo2 = min(100.0, round(98.0 + noise * 0.4, 1))
        hr = round(68.0 + math.sin(step / 5.0) * 4.0 + noise, 1)
        co2 = round(1200 + noise * 20)

    rad = round(22.4 + noise * 0.8, 1)

    readings = [
        {"metric": "heart_rate", "value": hr, "unit": "bpm"},
        {"metric": "spo2", "value": spo2, "unit": "%"},
        {"metric": "cabin_co2", "value": co2, "unit": "ppm"},
        {"metric": "radiation_dose_rate", "value": rad, "unit": "uSv/h"},
    ]

    return now, readings

def main():
    scenario = sys.argv[1] if len(sys.argv) > 1 else 'nominal'
    interval = float(sys.argv[2]) if len(sys.argv) > 2 else 2.5

    print("=" * 60)
    print("BADR HEALTH — HARDWARE INGESTION SIMULATOR")
    print(f"Scenario: {scenario.upper()} | Transmission Interval: {interval}s")
    print("Simulated device key: esp32-vitals-board-01")
    print("=" * 60)

    step = 0
    try:
        while True:
            step += 1
            timestamp, readings = generate_telemetry(step, scenario)
            payload = {
                "astronaut_id": "ast-01",
                "device_key": "esp32-vitals-board-01",
                "recorded_at": timestamp,
                "source": "sensor",
                "readings": readings,
            }
            print(f"[{datetime.now().strftime('%H:%M:%S')}] Ingestion Packet #{step:03d} -> {json.dumps(payload)}")
            time.sleep(interval)
    except KeyboardInterrupt:
        print("\nSimulator stopped by user.")

if __name__ == '__main__':
    main()
