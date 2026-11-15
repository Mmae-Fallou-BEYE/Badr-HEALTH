"""Tests pour le module adapter biomistral.

Tests de conversion Supabase ➜ AstronautData et conversation ➜ AstronautData.
"""

from __future__ import annotations

import pytest

from biomistral.adapter import (
    IAAdapterConfig,
    IAAdapterResult,
    adapt_supabase_to_astronautdata,
    adapt_conversation_to_astronautdata,
)
from biomistral.schemas import AstronautData
from biomistral.conversation import ConversationManager, ConversationState


class TestIAAdapterConfig:
    """Tests de la configuration de l'adaptateur."""

    def test_default_config(self) -> None:
        """Configuration par défaut fonctionne."""
        config = IAAdapterConfig()
        assert config.add_conversation_context is True
        assert config.validate_ranges is True
        assert config.include_sensor_fields is True
        assert config.include_declared_fields is True

    def test_custom_config(self) -> None:
        """Configuration personnalisée."""
        config = IAAdapterConfig(
            add_conversation_context=False,
            validate_ranges=False,
            include_sensor_fields=False,
            include_declared_fields=False,
        )
        assert config.add_conversation_context is False
        assert config.validate_ranges is False
        assert config.include_sensor_fields is False
        assert config.include_declared_fields is False


class TestIAAdapterResult:
    """Tests du résultat d'adaptation."""

    def test_result_creation(self) -> None:
        """Résultat peut être créé avec les champs requis."""
        result = IAAdapterResult(
            astronaut_data=AstronautData.model_validate({}),
            requires_review=False,
        )
        assert result.astronaut_data is not None
        assert result.requires_review is False

    def test_result_with_warnings(self) -> None:
        """Résultat peut contenir des warnings."""
        result = IAAdapterResult(
            astronaut_data=AstronautData.model_validate({}),
            warnings=["Test warning"],
            requires_review=True,
        )
        assert "Test warning" in result.warnings
        assert result.requires_review is True


class TestAdaptSupabaseComplete:
    """Tests de conversion Supabase complète."""

    def test_conversion_avec_tous_les_champs(self) -> None:
        """Conversion avec capteurs, symptômes et métadonnées."""
        payload = {
            "astronaut_id": "astronaut-001",
            "mission_id": "mission-mars-2024",
            "mission_day": 12,
            "temperature_c": 38.1,
            "heart_rate_bpm": 108,
            "blood_pressure": {"systolic": 142, "diastolic": 92},
            "spo2_pct": 96,
            "sleep_hours": 4.8,
            "symptoms": ["headache", "nausea"],
            "fatigue_level": "7/10",
            "stress_level": "elevated",
            "source": "sensor",
        }

        result = adapt_supabase_to_astronautdata(payload)

        assert result.astronaut_data is not None
        assert result.astronaut_data.temperature_c == 38.1
        assert result.astronaut_data.heart_rate_bpm == 108
        assert "headache" in result.astronaut_data.symptoms
        assert "nausea" in result.astronaut_data.symptoms
        assert result.warnings == []
        # temp 38.1 < 39.0 et HR 108 < 130 donc requires_review = False
        assert result.requires_review is False

    def test_conversion_partielle_capteurs_uniquement(self) -> None:
        """Conversion avec seulement les données capteurs."""
        payload = {
            "astronaut_id": "astronaut-002",
            "mission_day": 5,
            "temperature_c": 37.5,
            "heart_rate_bpm": 76,
            "blood_pressure": {"systolic": 118, "diastolic": 80},
            "spo2_pct": 98,
            "sleep_hours": 7.0,
            "source": "sensor",
        }

        result = adapt_supabase_to_astronautdata(payload)

        assert result.astronaut_data is not None
        assert result.astronaut_data.temperature_c == 37.5
        assert result.astronaut_data.heart_rate_bpm == 76
        assert result.astronaut_data.symptoms == []
        assert result.warnings == []

    def test_conversion_symptomes_uniquement(self) -> None:
        """Conversion avec seulement des symptômes déclarés."""
        payload = {
            "astronaut_id": "astronaut-003",
            "mission_day": 8,
            "symptoms": ["fatigue", "dizziness"],
            "fatigue_level": "6/10",
            "stress_level": "moderate",
            "source": "astronaut",
        }

        result = adapt_supabase_to_astronautdata(payload)

        assert result.astronaut_data is not None
        assert "fatigue" in result.astronaut_data.symptoms
        assert "dizziness" in result.astronaut_data.symptoms
        assert result.astronaut_data.fatigue_level == "6/10"
        assert result.astronaut_data.stress_level == "moderate"


class TestAdaptSupabasePartials:
    """Tests de conversion avec données partielles."""

    def test_conversion_temperature_uniquement(self) -> None:
        """Seule la température fournie, les autres champs sont None."""
        payload = {
            "astronaut_id": "astronaut-004",
            "mission_day": 3,
            "temperature_c": 36.8,
        }

        result = adapt_supabase_to_astronautdata(payload)

        assert result.astronaut_data is not None
        assert result.astronaut_data.temperature_c == 36.8
        assert result.astronaut_data.heart_rate_bpm is None
        assert result.astronaut_data.blood_pressure is None
        assert result.astronaut_data.symptoms == []

    def test_conversion_ayload_vide(self) -> None:
        """Payload vide ou quasi vide ne provoque pas de crash."""
        payload = {}
        result = adapt_supabase_to_astronautdata(payload)

        assert result.astronaut_data is not None
        # Pas de crash, tous les champs restent par défaut None/empty


class TestAdaptSupabaseSeparation:
    """Tests de séparation des sources de données."""

    def test_sensor_vs_declared_separation(self) -> None:
        """Vérifier que sensor_data et declared_data sont bien séparés."""
        payload = {
            "astronaut_id": "astronaut-005",
            "mission_day": 10,
            "temperature_c": 38.0,
            "symptoms": ["headache"],
        }

        result = adapt_supabase_to_astronautdata(payload)

        assert result.astronaut_data is not None
        # La température doit être présente
        assert result.astronaut_data.temperature_c == 38.0
        # Les symptômes doivent être présents
        assert "headache" in result.astronaut_data.symptoms
        # Pas de mélange inattendu


class TestAdaptConversation:
    """Tests d'adaptation conversationnelle."""

    def test_conversation_symptoms_to_astronautdata(self) -> None:
        """Les symptômes de conversation deviennent des symptômes AstronautData."""
        cm = ConversationManager()
        cm.add_declared_symptom("fatigue")
        cm.add_declared_symptom("nausea")

        result = adapt_conversation_to_astronautdata(cm)

        assert result.astronaut_data is not None
        assert "fatigue" in result.astronaut_data.symptoms
        assert "nausea" in result.astronaut_data.symptoms

    def test_conversation_with_placeholder(self) -> None:
        """Avec placeholder capteurs, AstronautData a les champs à None."""
        cm = ConversationManager()
        cm.add_declared_symptom("headache")

        result = adapt_conversation_to_astronautdata(cm, include_sensor_placeholder=True)

        assert result.astronaut_data is not None
        assert result.astronaut_data.symptoms == ["headache"]
        # Les champs capteurs doivent être None
        assert result.astronaut_data.temperature_c is None
        assert result.astronaut_data.heart_rate_bpm is None

    def test_conversation_no_symptoms(self) -> None:
        """Sans symptômes, pas de crash."""
        cm = ConversationManager()

        result = adapt_conversation_to_astronautdata(cm)

        assert result.astronaut_data is not None
        # Doit quand même être un AstronautData valide


class TestAdapterIntegration:
    """Tests d'intégration de l'adaptateur."""

    def test_adapter_not_call_ollama(self) -> None:
        """L'adaptateur ne doit jamais appeler Ollama/BioMistral."""
        payload = {
            "astronaut_id": "test",
            "mission_day": 1,
            "temperature_c": 37.0,
        }

        result = adapt_supabase_to_astronautdata(payload)
        # Le résultat doit contenir un AstronautData, pas de modèle IA
        assert result.astronaut_data is not None
        # Vérifier que le résultat n'a pas de champ model/info IA
        assert not hasattr(result, "model") or result.model is None

    def test_adapter_preserves_data_integrity(self) -> None:
        """L'adaptateur ne doit pas modifier les données reçues."""
        original_payload = {
            "astronaut_id": "preserve-001",
            "mission_day": 7,
            "temperature_c": 37.2,
            "heart_rate_bpm": 80,
            "symptoms": ["mild fatigue"],
        }

        result = adapt_supabase_to_astronautdata(original_payload)

        # Vérifier que les valeurs sont préservées
        assert result.astronaut_data.temperature_c == 37.2
        assert result.astronaut_data.heart_rate_bpm == 80
        assert "mild fatigue" in result.astronaut_data.symptoms

    def test_adapter_warnings_for_missing_data(self) -> None:
        """L'adaptateur doit avertir quand les données manquent."""
        payload = {}  # Payload complètement vide

        result = adapt_supabase_to_astronautdata(payload)

        assert result.warnings != []
        assert "Aucune donnée fournie" in result.warnings[0]