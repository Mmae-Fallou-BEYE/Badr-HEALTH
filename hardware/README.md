# ESP32 Sensor Hardware Architecture — Badr Health

This directory provides the embedded firmware template and wiring instructions for hardware telemetry ingestion into **Badr Health** for the NASA Space Apps Challenge Dakar 2026.

---

## 1. Supported Physical Hardware
- **Microcontroller**: ESP32 DevKit v1 (30 or 38 pin)
- **Pulse Oximeter & Heart Rate**: MAX30102 via I2C bus
- **Environmental Habitat Sensor**: BME280 / SCD41 via I2C bus

---

## 2. Wiring Pinout Diagram

| Sensor Pin | ESP32 GPIO Pin | Description |
|---|---|---|
| `VCC` | `3V3` | 3.3V Regulated Power |
| `GND` | `GND` | Common Ground |
| `SDA` | `GPIO 21` | I2C Serial Data line |
| `SCL` | `GPIO 22` | I2C Serial Clock line |
| `INT` | `GPIO 19` (Optional) | Interrupt on sample ready |

---

## 3. Flash Instructions
1. Open `hardware/esp32_vitals.ino` in Arduino IDE or PlatformIO.
2. Install required libraries via Library Manager:
   - `ArduinoJson` (v6 or v7)
   - `SparkFun MAX3010x Pulse and Proximity Sensor Library`
   - `Adafruit BME280 Library`
3. Configure your local habitat WiFi credentials (`WIFI_SSID` & `WIFI_PASSWORD`).
4. Set `INGEST_URL` to your live Supabase REST endpoint (or local mock server).
5. Select Board **ESP32 Dev Module**, choose the USB COM port, and click **Upload**.
6. Open Serial Monitor at **115200 baud** to verify telemetry transmission.
