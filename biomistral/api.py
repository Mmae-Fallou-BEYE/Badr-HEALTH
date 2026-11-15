# Generated with AI assistance; bridges the supplied BioMistral module to Badr Health.
"""Loopback-only HTTP bridge between Badr Health and the BioMistral analyzer."""

from __future__ import annotations

import json
import logging
import threading
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from typing import Any
from urllib.parse import urlsplit

from pydantic import ValidationError as PydanticValidationError

from . import (
    Analyzer,
    AstronautData,
    BiomistralError,
    ConfigurationError,
    InputValidationError,
    ModelNotFoundError,
    ModelTimeoutError,
    OllamaUnavailableError,
)
from .config import get_settings
from .conversation import ConversationManager
from .schemas import CORE_FIELDS

LOG = logging.getLogger("biomistral.api")
DEFAULT_PORT = 8765
MAX_REQUEST_BYTES = 64 * 1024
ALLOWED_ORIGINS = {
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:4173",
    "http://127.0.0.1:4173",
    "http://localhost:3004",
    "http://127.0.0.1:3004",
}



def build_intake_payload(
    data: dict[str, Any],
    *,
    symptom: str = "",
    duration: str = "",
    intensity: int | None = None,
) -> dict[str, Any]:
    """Combine the current telemetry snapshot with optional guided-intake details."""
    allowed_fields = set(AstronautData.model_fields)
    unknown_fields = sorted(set(data) - allowed_fields)
    if unknown_fields:
        raise InputValidationError(
            "The request contains unsupported fields.",
            details={"fields": unknown_fields},
        )
    try:
        validated_data = AstronautData.model_validate(data).model_dump(
            mode="json",
            exclude_none=True,
        )
    except PydanticValidationError as error:
        details = [
            {
                "field": ".".join(str(part) for part in item["loc"]),
                "message": item["msg"],
                "type": item["type"],
            }
            for item in error.errors(include_url=False)
        ]
        raise InputValidationError(
            "Invalid astronaut data.",
            details=details,
        ) from error

    if not isinstance(symptom, str) or len(symptom) > 500:
        raise InputValidationError("Symptom text must be at most 500 characters.")
    if not isinstance(duration, str) or len(duration) > 128:
        raise InputValidationError("Symptom duration must be at most 128 characters.")
    if intensity is not None and (
        isinstance(intensity, bool) or not isinstance(intensity, int) or not 0 <= intensity <= 10
    ):
        raise InputValidationError("Symptom intensity must be an integer from 0 to 10.")

    sensor_fields = set(CORE_FIELDS) - {"mission_day"}
    core_data = {
        key: value
        for key, value in validated_data.items()
        if key in sensor_fields and value is not None
    }
    manager = ConversationManager(initial_data=core_data)
    normalized_symptom = symptom.strip()
    if normalized_symptom:
        manager.add_declared_symptom(normalized_symptom)
        details: dict[str, Any] = {}
        if duration.strip():
            details["duration"] = duration.strip()
        if intensity is not None:
            details["intensity"] = intensity
        if details:
            manager.add_symptom_detail(normalized_symptom, details)

    managed_data = manager.to_astronaut_data().model_dump(
        mode="json",
        exclude_none=True,
    )
    extra_data = {
        key: value
        for key, value in validated_data.items()
        if key not in sensor_fields and key not in {"symptoms", "notes"}
    }
    if validated_data.get("notes"):
        extra_data["notes"] = validated_data["notes"]

    if not manager.state.declared_symptoms:
        managed_data.pop("symptoms", None)
    return {**extra_data, **managed_data}


def _error_status(error: BiomistralError) -> int:
    if isinstance(error, InputValidationError):
        return 400
    if isinstance(error, ModelTimeoutError):
        return 504
    if isinstance(error, (OllamaUnavailableError, ModelNotFoundError, ConfigurationError)):
        return 503
    return 502


class BioMistralHTTPServer(ThreadingHTTPServer):
    daemon_threads = True
    allow_reuse_address = True

    def __init__(
        self,
        port: int,
        analyzer: Analyzer,
    ) -> None:
        super().__init__(("127.0.0.1", port), BioMistralRequestHandler)
        self.analyzer = analyzer
        self.analysis_lock = threading.Lock()


class BioMistralRequestHandler(BaseHTTPRequestHandler):
    server: BioMistralHTTPServer
    server_version = "BadrHealthBioMistral/1.0"

    def _local_host_matches(self) -> bool:
        host_header = self.headers.get("Host", "")
        hostname, separator, port = host_header.partition(":")
        return (
            separator == ":"
            and hostname.lower() in {"localhost", "127.0.0.1"}
            and port.isdigit()
            and int(port) == self.server.server_port
        )

    def _origin_is_allowed(self) -> bool:
        origin = self.headers.get("Origin")
        return origin is None or origin in ALLOWED_ORIGINS

    def _send_json(self, status: int, payload: dict[str, Any]) -> None:
        encoded = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        origin = self.headers.get("Origin")
        if origin in ALLOWED_ORIGINS:
            self.send_header("Access-Control-Allow-Origin", origin)
            self.send_header("Vary", "Origin")
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(encoded)))
        self.send_header("Cache-Control", "no-store")
        self.send_header("X-Content-Type-Options", "nosniff")
        self.end_headers()
        self.wfile.write(encoded)

    def _check_local_request(self) -> bool:
        if not self._local_host_matches():
            self._send_json(403, {"error": {"code": "LOCAL_ONLY", "message": "Requests must use localhost."}})
            return False
        if not self._origin_is_allowed():
            self._send_json(403, {"error": {"code": "ORIGIN_NOT_ALLOWED", "message": "This site is not allowed to use the local AI service."}})
            return False
        return True

    def _read_json(self) -> dict[str, Any] | None:
        content_type = self.headers.get("Content-Type", "")
        if not content_type.lower().startswith("application/json"):
            self._send_json(
                415,
                {"error": {"code": "JSON_REQUIRED", "message": "Content-Type must be application/json."}},
            )
            return None

        raw_length = self.headers.get("Content-Length")
        if raw_length is None or not raw_length.isdigit():
            self._send_json(
                411,
                {"error": {"code": "LENGTH_REQUIRED", "message": "Content-Length is required."}},
            )
            return None
        content_length = int(raw_length)
        if content_length > MAX_REQUEST_BYTES:
            self._send_json(
                413,
                {"error": {"code": "REQUEST_TOO_LARGE", "message": "Request body exceeds 64 KiB."}},
            )
            return None

        try:
            value = json.loads(self.rfile.read(content_length).decode("utf-8"))
        except (UnicodeDecodeError, json.JSONDecodeError):
            self._send_json(
                400,
                {"error": {"code": "INVALID_JSON", "message": "Request body must be valid UTF-8 JSON."}},
            )
            return None
        if not isinstance(value, dict):
            self._send_json(
                400,
                {"error": {"code": "INVALID_INPUT", "message": "Request body must be a JSON object."}},
            )
            return None
        return value

    def do_OPTIONS(self) -> None:
        if not self._check_local_request():
            return
        origin = self.headers.get("Origin")
        if origin is None:
            self.send_error(400, "Origin header is required for preflight requests.")
            return
        self.send_response(204)
        self.send_header("Access-Control-Allow-Origin", origin)
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.send_header("Access-Control-Max-Age", "600")
        self.send_header("Vary", "Origin")
        self.end_headers()

    def do_GET(self) -> None:
        if not self._check_local_request():
            return
        if urlsplit(self.path).path != "/api/health":
            self._send_json(404, {"error": {"code": "NOT_FOUND", "message": "Endpoint not found."}})
            return

        try:
            health = self.server.analyzer.healthcheck()
        except BiomistralError as error:
            self._send_json(_error_status(error), error.to_dict())
            return
        except Exception:
            LOG.exception("BioMistral health check failed unexpectedly.")
            self._send_json(
                500,
                {"error": {"code": "INTERNAL_ERROR", "message": "AI service health check failed."}},
            )
            return

        status = 200 if health.get("ok") and health.get("model_available") else 503
        if status != 200:
            self._send_json(
                status,
                {
                    "error": {
                        "code": "MODEL_NOT_FOUND",
                        "message": "The configured BioMistral model is not available in local Ollama.",
                    },
                    "health": health,
                },
            )
            return
        self._send_json(status, health)

    def do_POST(self) -> None:
        if not self._check_local_request():
            return
        path = urlsplit(self.path).path
        if path not in {"/api/analyze", "/api/intake/analyze"}:
            self._send_json(404, {"error": {"code": "NOT_FOUND", "message": "Endpoint not found."}})
            return

        request = self._read_json()
        if request is None:
            return
        allowed_request_fields = (
            {"data", "symptom", "duration", "intensity"}
            if path == "/api/intake/analyze"
            else {"data"}
        )
        unexpected_fields = sorted(set(request) - allowed_request_fields)
        if unexpected_fields:
            self._send_json(
                400,
                {
                    "error": {
                        "code": "INVALID_INPUT",
                        "message": "The request contains unsupported fields.",
                        "details": {"fields": unexpected_fields},
                    }
                },
            )
            return
        data = request.get("data")
        if not isinstance(data, dict):
            self._send_json(
                400,
                {"error": {"code": "INVALID_INPUT", "message": "'data' must be a JSON object."}},
            )
            return

        try:
            if path == "/api/intake/analyze":
                payload = build_intake_payload(
                    data,
                    symptom=request.get("symptom", ""),
                    duration=request.get("duration", ""),
                    intensity=request.get("intensity"),
                )
            else:
                unknown_fields = sorted(set(data) - set(AstronautData.model_fields))
                if unknown_fields:
                    raise InputValidationError(
                        "The request contains unsupported fields.",
                        details={"fields": unknown_fields},
                    )
                payload = data
            with self.server.analysis_lock:
                result = self.server.analyzer.analyze(payload)
        except BiomistralError as error:
            self._send_json(_error_status(error), error.to_dict())
            return
        except Exception:
            LOG.exception("BioMistral analysis failed unexpectedly.")
            self._send_json(
                500,
                {"error": {"code": "INTERNAL_ERROR", "message": "AI analysis failed unexpectedly."}},
            )
            return

        self._send_json(200, result.to_dict())

    def log_message(self, format: str, *args: Any) -> None:
        LOG.info("%s - %s", self.address_string(), format % args)


def main() -> int:
    logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
    try:
        settings = get_settings()
        ollama_hostname = urlsplit(settings.ollama_host).hostname
        if ollama_hostname not in {"127.0.0.1", "localhost", "::1"}:
            raise ConfigurationError("OLLAMA_HOST must point to a local Ollama server.")
    except (ValueError, BiomistralError) as error:
        LOG.error("Invalid BioMistral API configuration: %s", error)
        return 2

    server = BioMistralHTTPServer(DEFAULT_PORT, Analyzer(settings=settings))
    LOG.info("BioMistral API listening on http://127.0.0.1:%s/api", DEFAULT_PORT)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        LOG.info("Stopping BioMistral API.")
    finally:
        server.server_close()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
