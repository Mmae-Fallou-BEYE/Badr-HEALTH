"""Tests de validation du schéma Supabase BioMistral.

Tests vérifiant :
- présence des tables obligatoires.
- compatibilité avec adapter.py.
- présence des champs nécessaires.
- absence de connexion directe BioMistral → Supabase.
"""

import os
import re

import pytest

# Import officiels depuis biomistral
from biomistral import (
    adapt_supabase_to_astronautdata,
    adapt_conversation_to_astronautdata,
    IAAdapterConfig,
    IAAdapterResult,
)


class TestSupabaseSchemaImport:
    """Tests d'import officiel depuis le package biomistral."""

    def test_official_imports_exist(self) -> None:
        """Les exports officiels sont disponibles."""
        assert adapt_supabase_to_astronautdata is not None
        assert adapt_conversation_to_astronautdata is not None
        assert IAAdapterConfig is not None
        assert IAAdapterResult is not None


class TestSchemaCompatibility:
    """Tests de compatibilité du schéma Supabase avec adapter.py."""

    def test_adapt_supabase_complete(self) -> None:
        """Conversion Supabase complète fonctionne."""
        payload = {
            "astronaut_id": "test-001",
            "mission_id": "mission-mars",
            "mission_day": 5,
            "temperature_c": 38.1,
            "heart_rate_bpm": 108,
            "symptoms": ["headache"],
            "source": "sensor",
        }

        result = adapt_supabase_to_astronautdata(payload)
        assert result.astronaut_data is not None
        assert result.astronaut_data.temperature_c == 38.1
        assert "headache" in result.astronaut_data.symptoms
        assert result.warnings == []

    def test_adapt_supabase_partial(self) -> None:
        """Conversion avec données partielles ne provoque pas de crash."""
        payload = {"temperature_c": 36.8}
        result = adapt_supabase_to_astronautdata(payload)
        assert result.astronaut_data is not None
        assert result.astronaut_data.temperature_c == 36.8

    def test_adapt_conversation_basic(self) -> None:
        """Conversion conversation → AstronautData fonctionne."""
        from biomistral.conversation import ConversationManager

        cm = ConversationManager()
        cm.add_declared_symptom("fatigue")
        result = adapt_conversation_to_astronautdata(cm)
        assert result.astronaut_data is not None
        assert "fatigue" in result.astronaut_data.symptoms


class TestSchemaStructure:
    """Vérification de la structure du schéma Supabase."""

    def test_schema_file_exists(self) -> None:
        """Le fichier schema.sql existe."""
        assert os.path.isfile("/home/bey/Documents/Projects/BioMistral-NASA/supabase/schema.sql")

    def test_rls_file_exists(self) -> None:
        """Le fichier rls.sql existe."""
        assert os.path.isfile("/home/bey/Documents/Projects/BioMistral-NASA/supabase/rls.sql")

    def test_schema_tables(self) -> None:
        """Le schéma contient les tables attendues."""
        with open("/home/bey/Documents/Projects/BioMistral-NASA/supabase/schema.sql", "r") as f:
            content = f.read()

        required_tables = [
            "astronaut_profiles",
            "missions",
            "sensor_measurements",
            "symptom_reports",
            "conversations",
            "medical_analysis_reports",
            "analysis_history",
            "medical_alerts",
        ]

        for table in required_tables:
            pattern = rf"CREATE\s+TABLE\s+{table}\s*\("
            assert re.search(pattern, content, re.IGNORECASE), f"Table {table} manquante dans schema.sql"


class TestNoDirectBioMistralSupabase:
    """Vérification que BioMistral n'a pas d'accès direct à Supabase."""

    def test_no_direct_connection(self) -> None:
        """Vérifier que les imports officiels ne pointent pas vers Supabase."""
        import biomistral
        # biomistral ne doit pas avoir de supabase en attribut direct
        assert not hasattr(biomistral, "supabase"), "biomistral ne doit pas avoir de supabase en attribut direct"

    def test_adapter_no_direct_connection(self) -> None:
        """L'adaptateur ne doit pas contenir de logique de connexion Supabase."""
        from biomistral.adapter import adapt_supabase_to_astronautdata

        # La fonction ne doit prendre qu'un dictionnaire JSON, pas de paramètres de connexion
        result = adapt_supabase_to_astronautdata({
            "astronaut_id": "test",
            "mission_day": 1,
            "temperature_c": 37.0,
        })
        assert result.astronaut_data is not None


class TestIntegrationFlow:
    """Tests d'intégration du flux complet."""

    def test_full_supabase_to_analyzer_flow(self) -> None:
        """Test du flux Supabase → adapter → AstronautData → Analyzer."""
        payload = {
            "astronaut_id": "ast-01",
            "mission_id": "mission-mars",
            "mission_day": 7,
            "temperature_c": 37.5,
            "heart_rate_bpm": 76,
            "blood_pressure": {"systolic": 120, "diastolic": 80},
            "spo2_pct": 98,
            "sleep_hours": 7.0,
            "symptoms": [],
            "source": "sensor",
        }

        result = adapt_supabase_to_astronautdata(payload)
        assert result.astronaut_data is not None
        assert result.astronaut_data.temperature_c == 37.5
        assert result.astronaut_data.heart_rate_bpm == 76
        assert result.astronaut_data.blood_pressure.systolic == 120
        assert result.astronaut_data.symptoms == []

        # Vérifie que requires_review est False pour des valeurs normales
        assert result.requires_review is False

    def test_conversation_to_astronautdata_flow(self) -> None:
        """Test du flux conversation → adapter → AstronautData."""
        from biomistral.conversation import ConversationManager

        cm = ConversationManager()
        cm.add_declared_symptom("headache")
        cm.add_declared_symptom("nausea")
        cm.add_symptom_detail("headache", {"intensity": "7/10", "duration": "2h"})

        result = adapt_conversation_to_astronautdata(cm)
        assert result.astronaut_data is not None
        assert "headache" in result.astronaut_data.symptoms
        assert "nausea" in result.astronaut_data.symptoms
        # Les détails de symptôme doivent être dans notes
        assert "headache" in result.astronaut_data.notes