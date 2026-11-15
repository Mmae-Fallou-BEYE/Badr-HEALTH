"""Runtime configuration for the BioMistral AI module."""

from __future__ import annotations

import os
from dataclasses import dataclass
from functools import lru_cache

from .exceptions import ConfigurationError

DEFAULT_OLLAMA_HOST = "http://127.0.0.1:11434"
DEFAULT_MODEL = "m/biomistral"


def _env_str(name: str, default: str) -> str:
    value = os.getenv(name)
    return value.strip() if value is not None and value.strip() else default


def _env_float(name: str, default: float) -> float:
    raw = os.getenv(name)
    if raw is None or not raw.strip():
        return default
    try:
        return float(raw)
    except ValueError as exc:
        raise ConfigurationError(f"{name} must be a number, got {raw!r}.") from exc


def _env_int(name: str, default: int) -> int:
    raw = os.getenv(name)
    if raw is None or not raw.strip():
        return default
    try:
        return int(raw)
    except ValueError as exc:
        raise ConfigurationError(f"{name} must be an integer, got {raw!r}.") from exc


@dataclass(frozen=True, slots=True)
class Settings:
    """Immutable settings, normally built from environment variables."""

    ollama_host: str = DEFAULT_OLLAMA_HOST
    model: str = DEFAULT_MODEL
    timeout_s: float = 180.0
    max_attempts: int = 2
    temperature: float = 0.0
    top_p: float = 0.9
    num_ctx: int = 4096
    num_predict: int = 500
    keep_alive: str = "10m"
    seed: int = 42

    @classmethod
    def from_env(cls) -> "Settings":
        settings = cls(
            ollama_host=_env_str("OLLAMA_HOST", DEFAULT_OLLAMA_HOST),
            model=_env_str("BIOMISTRAL_MODEL", DEFAULT_MODEL),
            timeout_s=_env_float("BIOMISTRAL_TIMEOUT_S", 180.0),
            max_attempts=_env_int("BIOMISTRAL_MAX_ATTEMPTS", 2),
            temperature=_env_float("BIOMISTRAL_TEMPERATURE", 0.0),
            top_p=_env_float("BIOMISTRAL_TOP_P", 0.9),
            num_ctx=_env_int("BIOMISTRAL_NUM_CTX", 4096),
            num_predict=_env_int("BIOMISTRAL_NUM_PREDICT", 500),
            keep_alive=_env_str("BIOMISTRAL_KEEP_ALIVE", "10m"),
            seed=_env_int("BIOMISTRAL_SEED", 42),
        )
        settings.validate()
        return settings

    def validate(self) -> None:
        if self.timeout_s <= 0:
            raise ConfigurationError("BIOMISTRAL_TIMEOUT_S must be greater than 0.")
        if not 1 <= self.max_attempts <= 5:
            raise ConfigurationError("BIOMISTRAL_MAX_ATTEMPTS must be between 1 and 5.")
        if not 0.0 <= self.temperature <= 2.0:
            raise ConfigurationError("BIOMISTRAL_TEMPERATURE must be between 0 and 2.")
        if not 0.0 < self.top_p <= 1.0:
            raise ConfigurationError("BIOMISTRAL_TOP_P must be between 0 and 1.")
        if self.num_ctx < 2048:
            raise ConfigurationError("BIOMISTRAL_NUM_CTX must be at least 2048.")
        if self.num_predict < 64:
            raise ConfigurationError("BIOMISTRAL_NUM_PREDICT must be at least 64.")


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    return Settings.from_env()
