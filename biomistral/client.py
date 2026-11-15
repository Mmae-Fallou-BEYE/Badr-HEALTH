"""Thin, testable wrapper around the local Ollama API."""

from __future__ import annotations

from collections.abc import Mapping
from typing import Any

import ollama

from .config import Settings, get_settings
from .exceptions import (
    InvalidModelOutputError,
    ModelNotFoundError,
    ModelTimeoutError,
    OllamaUnavailableError,
)


def _model_names_match(available: str, requested: str) -> bool:
    if available == requested:
        return True
    if ":" not in requested and available == f"{requested}:latest":
        return True
    if ":" not in available and f"{available}:latest" == requested:
        return True
    return False


class OllamaClient:
    """Client dedicated to BioMistral structured medical reports."""

    def __init__(
        self,
        *,
        model: str | None = None,
        host: str | None = None,
        timeout_s: float | None = None,
        settings: Settings | None = None,
    ) -> None:
        self.settings = settings or get_settings()
        self.model = model or self.settings.model
        self.host = host or self.settings.ollama_host
        timeout = timeout_s if timeout_s is not None else self.settings.timeout_s
        self._client = ollama.Client(host=self.host, timeout=timeout)
        self._options: dict[str, Any] = {
            "temperature": self.settings.temperature,
            "top_p": self.settings.top_p,
            "num_ctx": self.settings.num_ctx,
            "num_predict": self.settings.num_predict,
            "seed": self.settings.seed,
        }
        self._model_info_loaded = False
        self._model_info: dict[str, Any] | None = None

    def model_info(self, *, refresh: bool = False) -> dict[str, Any] | None:
        """Return metadata for the configured model, or ``None`` if absent."""
        if self._model_info_loaded and not refresh:
            return self._model_info

        try:
            response = self._client.list()
        except Exception as exc:  # noqa: BLE001 - boundary conversion
            raise OllamaUnavailableError(
                f"Could not reach Ollama at {self.host}: {exc}",
                details={"host": self.host},
            ) from exc

        self._model_info_loaded = True
        self._model_info = None
        for model in response.models:
            if _model_names_match(model.model, self.model):
                details = model.details
                self._model_info = {
                    "name": model.model,
                    "digest": model.digest,
                    "size": model.size,
                    "family": getattr(details, "family", None),
                    "parameter_size": getattr(details, "parameter_size", None),
                    "quantization": getattr(details, "quantization_level", None),
                }
                break
        return self._model_info

    def healthcheck(self, *, refresh: bool = True) -> dict[str, Any]:
        info = self.model_info(refresh=refresh)
        return {
            "ok": info is not None,
            "host": self.host,
            "model": self.model,
            "model_available": info is not None,
            "model_info": info,
        }

    def ensure_model_available(self) -> dict[str, Any]:
        info = self.model_info()
        if info is None:
            raise ModelNotFoundError(
                f"Model '{self.model}' is not available in Ollama.",
                details={"model": self.model, "host": self.host},
            )
        return info

    def chat_structured(
        self,
        *,
        system_prompt: str,
        user_prompt: str,
        schema: Mapping[str, Any],
        previous_response: str | None = None,
        feedback: str | None = None,
    ) -> str:
        """Call Ollama with a JSON-schema-constrained response format."""
        messages: list[dict[str, str]] = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ]
        if previous_response:
            messages.append({"role": "assistant", "content": previous_response})
        if feedback:
            messages.append({"role": "user", "content": feedback})

        try:
            response = self._client.chat(
                model=self.model,
                messages=messages,
                format=dict(schema),
                options=self._options,
                keep_alive=self.settings.keep_alive,
            )
        except ollama.ResponseError as exc:
            message = str(exc)
            lowered = message.lower()
            if "not found" in lowered or "no such model" in lowered or "pull" in lowered:
                raise ModelNotFoundError(
                    f"Model '{self.model}' is not available in Ollama.",
                    details={"model": self.model, "ollama_error": message},
                ) from exc
            raise OllamaUnavailableError(
                f"Ollama returned an error: {message}",
                details={"model": self.model},
            ) from exc
        except Exception as exc:  # noqa: BLE001 - boundary conversion
            message = str(exc)
            lowered = message.lower()
            if "timeout" in lowered or "timed out" in lowered:
                raise ModelTimeoutError(
                    "Ollama request timed out.",
                    details={"model": self.model, "timeout_s": self.settings.timeout_s},
                ) from exc
            raise OllamaUnavailableError(
                f"Could not communicate with Ollama at {self.host}: {message}",
                details={"host": self.host, "model": self.model},
            ) from exc

        try:
            content = response["message"]["content"]  # type: ignore[index]
        except (KeyError, TypeError):
            content = getattr(getattr(response, "message", None), "content", "")

        if not content or not str(content).strip():
            raise InvalidModelOutputError(
                "Ollama returned an empty response.",
                details={"model": self.model},
            )
        return str(content)

    def close(self) -> None:
        close = getattr(self._client, "close", None)
        if callable(close):
            close()
