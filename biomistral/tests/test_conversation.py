"""Tests for the conversation layer module.

Tests the ConversationManager and related functionality:
- Symptom collection
- Follow-up question generation
- AstronautData transformation
- Separation of sensor data vs declared symptoms
- Conversation state tracking
"""

from __future__ import annotations

import pytest

from biomistral.conversation import ConversationManager, build_conversation_from_payload
from biomistral.schemas import AstronautData


class TestConversationState:
    """Test conversation state tracking."""

    def test_initially_no_symptoms(self) -> None:
        """Conversation starts with no declared symptoms."""
        cm = ConversationManager()
        assert cm.state.declared_symptoms == []

    def test_add_declared_symptom(self) -> None:
        """Adding declared symptoms works correctly."""
        cm = ConversationManager()
        cm.add_declared_symptom("malaise")
        cm.add_declared_symptom("nausées")
        assert "malaise" in cm.state.declared_symptoms
        assert "nausées" in cm.state.declared_symptoms
        assert len(cm.state.declared_symptoms) == 2

    def test_add_declared_symptom_no_duplicates(self) -> None:
        """Adding the same symptom twice doesn't create duplicates."""
        cm = ConversationManager()
        cm.add_declared_symptom("fatigue")
        cm.add_declared_symptom("fatigue")
        assert cm.state.declared_symptoms.count("fatigue") == 1

    def test_add_symptom_detail(self) -> None:
        """Adding details for a declared symptom works."""
        cm = ConversationManager()
        cm.add_declared_symptom("malaise")
        cm.add_symptom_detail("malaise", {"intensity": "7/10", "duration": "2h"})
        assert "malaise" in cm.state.symptom_details
        assert cm.state.symptom_details["malaise"]["intensity"] == "7/10"
        assert cm.state.symptom_details["malaise"]["duration"] == "2h"

    def test_should_ask_followup_fresh(self) -> None:
        """Fresh questions should be marked as not yet asked."""
        cm = ConversationManager()
        assert cm.should_ask_followup("headache", "Depuis quand?") is True

    def test_should_ask_followup_already_asked(self) -> None:
        """Already-asked questions should be remembered."""
        cm = ConversationManager()
        cm.mark_question_asked("headache", "Depuis quand?")
        assert cm.should_ask_followup("headache", "Depuis quand?") is False

    def test_get_next_question(self) -> None:
        """Getting the next question works."""
        cm = ConversationManager()
        q = cm.get_next_question()
        assert q is not None
        assert "Depuis quand" in q or "since" in q.lower()


class TestConversationTransformation:
    """Test transforming conversation state to AstronautData."""

    def test_to_astronaut_data_basic(self) -> None:
        """Basic transformation to AstronautData includes symptoms."""
        cm = ConversationManager()
        cm.add_declared_symptom("malaise")
        cm.add_declared_symptom("nausées")
        astronaut = cm.to_astronaut_data()
        assert "malaise" in astronaut.symptoms
        assert "nausées" in astronaut.symptoms

    def test_to_astronaut_data_canonical(self) -> None:
        """Transformed data has symptoms in canonical dict."""
        cm = ConversationManager()
        cm.add_declared_symptom("vertiges")
        astronaut = cm.to_astronaut_data()
        canonical = astronaut.to_canonical_dict()
        assert "symptoms" in canonical

    def test_to_astronaut_data_with_sensor_data(self) -> None:
        """Transformation includes sensor data when provided."""
        cm = ConversationManager()
        # Simulate sensor data being collected
        cm.state.sensor_data["temperature_c"] = 38.1
        cm.state.sensor_data["heart_rate_bpm"] = 108
        cm.add_declared_symptom("malaise")
        astronaut = cm.to_astronaut_data()
        assert astronaut.temperature_c == 38.1
        assert astronaut.heart_rate_bpm == 108
        assert "malaise" in astronaut.symptoms

    def test_build_conversation_from_payload(self) -> None:
        """Building from a payload works correctly."""
        payload = {
            "temperature_c": 37.5,
            "heart_rate_bpm": 88,
            "symptoms": ["malaise"],
        }
        cm = build_conversation_from_payload(payload)
        assert cm.state.declared_symptoms == ["malaise"]
        assert cm.state.sensor_data.get("temperature_c") == 37.5


class TestConversationClarification:
    """Test clarification question generation."""

    def test_generate_headache_questions(self) -> None:
        """Generates appropriate questions for headache."""
        cm = ConversationManager()
        q = cm.get_next_question("headache")
        assert q is not None
        # Should ask at least one headache-specific question

    def test_generate_generic_questions(self) -> None:
        """Generates generic questions when no symptom type given."""
        cm = ConversationManager()
        q = cm.get_next_question()
        assert q is not None

    def test_track_asked_questions(self) -> None:
        """Tracks which questions have been asked."""
        cm = ConversationManager()
        assert cm.should_ask_followup("nausea", "Depuis quand?") is True
        cm.mark_question_asked("nausea", "Depuis quand?")
        assert cm.should_ask_followup("nausea", "Depuis quand?") is False


class TestConversationCompleteness:
    """Test conversation completeness checking."""

    def test_complete_when_all_fields_collected(self) -> None:
        """Conversation is complete when all core fields are collected."""
        cm = ConversationManager()
        # Manually collect all core fields
        cm.state.collected_fields = {
            "temperature_c",
            "heart_rate_bpm",
            "blood_pressure",
            "spo2_pct",
            "sleep_hours",
        }
        cm.state.missing_fields.clear()
        assert cm.is_complete() is True

    def test_not_complete_when_fields_missing(self) -> None:
        """Conversation is not complete when fields are missing."""
        cm = ConversationManager()
        assert cm.is_complete() is False

    def test_request_symptom_declaration_no_symptoms(self) -> None:
        """Requesting symptoms when none declared returns prompt."""
        cm = ConversationManager()
        prompt = cm.request_symptom_declaration()
        assert prompt is not None
        assert "symptômes" in prompt

    def test_request_symptom_declaration_when_complete(self) -> None:
        """Requesting symptoms when conversation is complete returns None."""
        cm = ConversationManager()
        cm.add_declared_symptom("malaise")
        # Force complete by manipulating state
        cm.state.missing_fields.clear()
        cm.state.collected_fields = {"temperature_c", "heart_rate_bpm", "blood_pressure", "spo2_pct", "sleep_hours"}
        prompt = cm.request_symptom_declaration()
        assert prompt is None


class TestConversationIntegration:
    """Integration-style tests for the conversation flow."""

    def test_full_symptom_collection_flow(self) -> None:
        """Test the full flow of symptom collection and data transformation."""
        cm = ConversationManager()

        # Request initial symptoms
        prompt = cm.request_symptom_declaration()
        assert prompt is not None

        # Add declared symptoms
        cm.add_declared_symptom("malaise")
        cm.add_declared_symptom("nausées")

        # Ask for clarification
        q = cm.get_next_question("malaise")
        assert q is not None

        # Mark question as asked
        cm.mark_question_asked("malaise", q)

        # Get next question (should be different or None)
        q2 = cm.get_next_question("malaise")
        # May be None if all questions asked

        # Build AstronautData
        astronaut = cm.to_astronaut_data()
        assert "malaise" in astronaut.symptoms

    def test_sensor_data_preserved_through_conversation(self) -> None:
        """Sensor data is preserved and passed through to AstronautData."""
        payload = {
            "temperature_c": 36.8,
            "heart_rate_bpm": 76,
            "blood_pressure": {"systolic": 120, "diastolic": 80},
            "spo2_pct": 98,
            "sleep_hours": 7.5,
        }
        cm = build_conversation_from_payload(payload)
        cm.add_declared_symptom("fatigue")
        astronaut = cm.to_astronaut_data()

        assert astronaut.temperature_c == 36.8
        assert astronaut.heart_rate_bpm == 76
        assert "fatigue" in astronaut.symptoms