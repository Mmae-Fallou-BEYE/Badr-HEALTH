// Generated with AI assistance (Antigravity). Reviewed by the team.
/*
 * Badr Health — ESP32 Sensor Telemetry Ingestion Firmware
 * NASA Space Apps Challenge Dakar 2026
 *
 * Interfaces:
 * - MAX30102 Optical PPG (I2C: SDA GPIO 21, SCL GPIO 22) -> Heart Rate & SpO2
 * - BME280 Environmental Sensor (I2C) -> Cabin Temp, Pressure, Humidity
 *
 * Transmits JSON payload over WiFi via HTTPS POST to the Badr Health
 * central ingestion REST endpoint (Supabase / local gateway).
 */

#include <WiFi.h>
#include <HTTPClient.h>
#include <Wire.h>
#include <ArduinoJson.h>

// WiFi Configuration
const char* WIFI_SSID = "MISSION_HABITAT_WIFI";
const char* WIFI_PASSWORD = "PROTECTED_HABITAT_KEY";

// Ingestion Endpoint & Authentication
const char* INGEST_URL = "https://your-project.supabase.co/rest/v1/readings";
const char* ANON_KEY = "YOUR_SUPABASE_ANON_KEY";
const char* DEVICE_KEY = "esp32-vitals-board-01";
const char* ASTRONAUT_ID = "ast-01"; // Callsign: CYGNUS-1

unsigned long lastTelemetryMillis = 0;
const unsigned long TELEMETRY_INTERVAL_MS = 3000; // 3 seconds transmission rate

void setup() {
  Serial.begin(115200);
  delay(1000);
  Serial.println("\n[BADR HEALTH] Initializing ESP32 Biometric Ingestion Board...");

  // Initialize I2C Bus
  Wire.begin(21, 22);

  // Connect to Habitat Wireless Network
  Serial.printf("[WIFI] Connecting to %s", WIFI_SSID);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 20) {
    delay(500);
    Serial.print(".");
    attempts++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.printf("\n[WIFI] Connected! IP Address: %s\n", WiFi.localIP().toString().c_str());
  } else {
    Serial.println("\n[WIFI] Offline mode: Falling back to local serial output.");
  }
}

void postTelemetry(const char* metric, float value, const char* unit, const char* source) {
  if (WiFi.status() != WL_CONNECTED) return;

  HTTPClient http;
  http.begin(INGEST_URL);
  http.addHeader("Content-Type", "application/json");
  http.addHeader("apikey", ANON_KEY);
  http.addHeader("Authorization", String("Bearer ") + ANON_KEY);
  http.addHeader("x-device-key", DEVICE_KEY);

  StaticJsonDocument<256> doc;
  doc["astronaut_id"] = ASTRONAUT_ID;
  doc["metric"] = metric;
  doc["value"] = value;
  doc["unit"] = unit;
  doc["source"] = source;

  String jsonString;
  serializeJson(doc, jsonString);

  int httpCode = http.POST(jsonString);
  if (httpCode > 0) {
    Serial.printf("[INGEST] %s: %.1f %s -> HTTP %d\n", metric, value, unit, httpCode);
  } else {
    Serial.printf("[INGEST ERROR] %s: %s\n", metric, http.errorToString(httpCode).c_str());
  }
  http.end();
}

void loop() {
  unsigned long now = millis();
  if (now - lastTelemetryMillis >= TELEMETRY_INTERVAL_MS) {
    lastTelemetryMillis = now;

    // Simulated sensor readings for hardware bench test
    // (Replace with actual MAX30102 / BME280 driver reads)
    float heartRate = 68.0 + (random(-30, 30) / 10.0);
    float spo2 = 98.0 + (random(-10, 10) / 10.0);
    if (spo2 > 100.0) spo2 = 100.0;

    Serial.printf("[SENSOR READ] HR: %.1f bpm | SpO2: %.1f %%\n", heartRate, spo2);

    // Transmit to Central Database
    postTelemetry("heart_rate", heartRate, "bpm", "sensor");
    postTelemetry("spo2", spo2, "%", "sensor");
  }
}
