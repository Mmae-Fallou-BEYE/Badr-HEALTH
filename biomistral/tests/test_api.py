"""Tests for the AI-assisted Badr Health API adapter."""

from __future__ import annotations

import json
import threading
from urllib.error import HTTPError
from urllib.request import Request, urlopen

import pytest

from biomistral.api import BioMistralHTTPServer, build_intake_payload
from biomistral.exceptions import InputValidationError


def test_build_intake_payload_preserves_known_data_and_symptom_details() -> None:
    payload = build_intake_payload(
        {
            "mission_day": 42,
            "heart_rate_bpm": 108,
            "spo2_pct": 96,
            "radiation_cumulative_msv": 41.3,
        },
        symptom="Headache",
        duration="since this morning",
        intensity=5,
    )

    assert payload["mission_day"] == 42
    assert payload["heart_rate_bpm"] == 108
    assert payload["spo2_pct"] == 96
    assert payload["radiation_cumulative_msv"] == 41.3
    assert payload["symptoms"] == ["Headache"]
    assert "headache" in payload["notes"].lower()
    assert "since this morning" in payload["notes"]
    assert "intensité 5" in payload["notes"]
    assert "temperature_c" not in payload


def test_build_intake_payload_does_not_invent_optional_measurements() -> None:
    payload = build_intake_payload(
        {"mission_day": 7},
        symptom="",
    )

    assert payload == {"mission_day": 7}


@pytest.mark.parametrize(
    ("kwargs", "message"),
    [
        ({"symptom": "x" * 501}, "Symptom text"),
        ({"duration": "x" * 129}, "Symptom duration"),
        ({"intensity": 11}, "intensity"),
        ({"intensity": True}, "intensity"),
    ],
)
def test_build_intake_payload_rejects_invalid_intake(
    kwargs: dict[str, object],
    message: str,
) -> None:
    with pytest.raises(InputValidationError, match=message):
        build_intake_payload({}, **kwargs)


def test_build_intake_payload_rejects_unrecognized_fields() -> None:
    with pytest.raises(InputValidationError, match="unsupported fields"):
        build_intake_payload({"made_up_measurement": 123})


def test_build_intake_payload_rejects_invalid_measurements() -> None:
    with pytest.raises(InputValidationError, match="Invalid astronaut data"):
        build_intake_payload({"heart_rate_bpm": 999})


class FakeResult:
    def to_dict(self) -> dict[str, str]:
        return {"result": "valid"}


class FakeAnalyzer:
    def __init__(self) -> None:
        self.payload: dict[str, object] | None = None

    def analyze(self, payload: dict[str, object]) -> FakeResult:
        self.payload = payload
        return FakeResult()

    def healthcheck(self) -> dict[str, object]:
        return {"ok": True, "model_available": True, "model": "test-model"}


def test_local_api_routes_guided_intake_to_analyzer() -> None:
    analyzer = FakeAnalyzer()
    server = BioMistralHTTPServer(0, analyzer)  # type: ignore[arg-type]
    thread = threading.Thread(target=server.serve_forever, daemon=True)
    thread.start()
    try:
        body = json.dumps(
            {
                "data": {"mission_day": 42, "heart_rate_bpm": 108},
                "symptom": "Headache",
                "duration": "since this morning",
                "intensity": 5,
            }
        ).encode("utf-8")
        request = Request(
            f"http://127.0.0.1:{server.server_port}/api/intake/analyze",
            data=body,
            headers={
                "Content-Type": "application/json",
                "Origin": "http://localhost:3000",
            },
            method="POST",
        )
        with urlopen(request, timeout=5) as response:
            assert response.status == 200
            assert response.headers["Access-Control-Allow-Origin"] == "http://localhost:3000"
            assert json.load(response) == {"result": "valid"}
        assert analyzer.payload is not None
        assert analyzer.payload["mission_day"] == 42
        assert analyzer.payload["heart_rate_bpm"] == 108
        assert analyzer.payload["symptoms"] == ["Headache"]
    finally:
        server.shutdown()
        server.server_close()
        thread.join(timeout=5)


def test_local_api_rejects_untrusted_origins() -> None:
    server = BioMistralHTTPServer(0, FakeAnalyzer())  # type: ignore[arg-type]
    thread = threading.Thread(target=server.serve_forever, daemon=True)
    thread.start()
    try:
        request = Request(
            f"http://127.0.0.1:{server.server_port}/api/health",
            headers={"Origin": "https://example.invalid"},
        )
        with pytest.raises(HTTPError) as error:
            urlopen(request, timeout=5)
        assert error.value.code == 403
    finally:
        server.shutdown()
        server.server_close()
        thread.join(timeout=5)
