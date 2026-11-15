"""Conversation layer for astronaut medical data collection.

This module is responsible for managing the interaction with the astronaut
and collecting medical data through a structured conversation. It does NOT
produce medical reports, make diagnoses, or interpret data.

It gradually builds a validated AstronautData object that can then be passed
to the existing Analyzer pipeline (red flags, BioMistral call, grounding, report).
"""

from __future__ import annotations

from collections.abc import Mapping
from dataclasses import dataclass, field
from typing import Any

from .schemas import AstronautData


@dataclass
class ConversationState:
    """Tracks the state of the medical conversation."""

    # Collected declared symptoms (free text from astronaut)
    declared_symptoms: list[str] = field(default_factory=list)

    # Collected sensor measurements (populated if provided upfront)
    sensor_data: dict[str, Any] = field(default_factory=dict)

    # Track which core fields have been provided/collected
    collected_fields: set[str] = field(default_factory=set)

    # Fields still missing (core measurements)
    missing_fields: set[str] = field(default_factory=lambda: {
        "temperature_c",
        "heart_rate_bpm",
        "blood_pressure",
        "spo2_pct",
        "sleep_hours",
    })

    # Flag to indicate if conversation is complete
    complete: bool = False

    # Follow-up questions already asked (to avoid repetition)
    asked_questions: dict[str, bool] = field(
        default_factory=lambda: {
            "duration": False,
            "intensity": False,
            "fever": False,
            "vision": False,
        }
    )

    # Additional symptom details (localization, intensity, etc.)
    symptom_details: dict[str, dict[str, Any]] = field(default_factory=dict)


class ConversationManager:
    """Manages the medical conversation with an astronaut.

    Responsibilities:
    - Track conversation state
    - Collect declared symptoms from the astronaut
    - Ask follow-up clarification questions
    - Build a validated AstronautData object when enough info is gathered
    - Never produce medical reports or interpretations
    """

    # Standard follow-up questions for common symptoms
    FOLLOWUP_QUESTIONS = {
        "headache": [
            "Since when do you have the headache?",
            "What is the intensity on a scale of 0-10?",
            "Is the pain continuous or intermittent?",
            "Do you have fever?",
            "Do you have vision problems?",
        ],
        "nausea": [
            "Since when do you feel nauseous?",
            "Have you been vomiting?",
            "Did it start after a meal?",
            "Do you have headache?",
        ],
        "fatigue": [
            "Since when have you been feeling fatigued?",
            "Does it affect your daily tasks?",
            "Are you getting enough sleep?",
            "Do you have other symptoms?",
        ],
    }

    def __init__(self, initial_data: Mapping[str, Any] | None = None) -> None:
        """Initialize conversation manager.

        Args:
            initial_data: Optional existing AstronautData or dict with partial data.
        """
        self.state = ConversationState()

        if initial_data is not None:
            self._apply_initial_data(initial_data)

    def _apply_initial_data(self, data: Mapping[str, Any]) -> None:
        """Apply any initial data provided (from sensor readings, etc.)."""
        # Handle declared symptoms
        if "symptoms" in data:
            symptoms = data["symptoms"]
            if isinstance(symptoms, str):
                symptoms = [s.strip() for s in symptoms.split(",") if s.strip()]
            self.state.declared_symptoms = [
                s for s in symptoms if s and s not in self.state.declared_symptoms
            ]

        # Handle sensor / canonical fields
        for key in list(self.state.missing_fields):
            if key in data:
                self.state.collected_fields.add(key)
                self.state.missing_fields.discard(key)
                self.state.sensor_data[key] = data[key]

    def add_declared_symptom(self, symptom: str) -> None:
        """Add a symptom declared by the astronaut.

        Args:
            symptom: The symptom text as provided by the astronaut.
        """
        symptom = symptom.strip()
        if symptom and symptom not in self.state.declared_symptoms:
            self.state.declared_symptoms.append(symptom)

    def add_symptom_detail(self, symptom: str, detail: dict[str, Any]) -> None:
        """Add details for a declared symptom (localization, intensity, etc.).

        Args:
            symptom: The symptom name.
            detail: Dictionary with detail key-value pairs (e.g., intensity, duration).
        """
        symptom_key = symptom.lower().strip()
        self.state.symptom_details[symptom_key] = detail

    def should_ask_followup(self, symptom: str, question: str) -> bool:
        """Determine if a follow-up question should be asked.

        Args:
            symptom: Type of symptom (e.g., "headache", "nausea").
            question: The specific question text.

        Returns:
            True if the question should be asked (not already asked).
        """
        key = f"{symptom}:{question.lower().strip()}"
        if key not in self.state.asked_questions:
            self.state.asked_questions[key] = False
        return not self.state.asked_questions.get(key, False)

    def mark_question_asked(self, symptom: str, question: str) -> None:
        """Mark a follow-up question as already asked.

        Args:
            symptom: Type of symptom.
            question: The question text.
        """
        key = f"{symptom}:{question.lower().strip()}"
        self.state.asked_questions[key] = True

    def get_next_question(self, symptom: str | None = None) -> str | None:
        """Get the next follow-up question to ask the astronaut.

        Args:
            symptom: Optional symptom type to get targeted questions for.

        Returns:
            A question string, or None if no more questions are needed.
        """
        # Try targeted questions for the given symptom
        if symptom and symptom.lower() in self.FOLLOWUP_QUESTIONS:
            questions = self.FOLLOWUP_QUESTIONS[symptom.lower()]
            for q in questions:
                # Use a simple key format for tracking
                key = f"{symptom.lower()}:{q.lower().strip()}"
                if not self.state.asked_questions.get(key, False):
                    return q

        # Default generic questions if no targeted ones apply
        generic = [
            "Depuis quand avez-vous ce symptôme ?",
            "Comment décrivez-vous l'intensité ?",
            "Avez-vous de la fièvre ?",
            "Avez-vous d'autres symptômes ?",
        ]

        for q in generic:
            # Track using a generic key
            key = f"general:{q.lower().strip()}"
            if not self.state.asked_questions.get(key, False):
                return q

        return None

    def update_from_response(
        self,
        key: str,
        value: Any,
        *,
        is_symptom: bool = False,
        symptom_name: str | None = None,
    ) -> None:
        """Process a response from the astronaut and update state.

        Args:
            key: The field name (canonical or symptom).
            value: The value provided.
            is_symptom: Whether this is a declared symptom.
            symptom_name: Name of the symptom if is_symptom is True.
        """
        if is_symptom and symptom_name:
            self.add_declared_symptom(symptom_name)
            self.add_symptom_detail(symptom_name, {key: value})
            # Remove from missing if it was a core field
            if symptom_name in self.state.missing_fields:
                self.state.missing_fields.discard(symptom_name)
                self.state.collected_fields.add(symptom_name)
        elif key in self.state.missing_fields:
            self.state.missing_fields.discard(key)
            self.state.collected_fields.add(key)
            self.state.sensor_data[key] = value

    def is_complete(self) -> bool:
        """Check if the conversation has enough data to proceed.

        A conversation is considered complete if:
        - All core sensor fields have been collected, OR
        - The astronaut has indicated they have no more information to provide

        Returns:
            True if the conversation can proceed to analysis.
        """
        # Complete if all core fields are collected
        if self.state.missing_fields:
            return False
        return True

    def to_astronaut_data(self) -> AstronautData:
        """Build and return an AstronautData object from the conversation state.

        This method consolidates all collected information (sensor data + declared
        symptoms) into a single AstronautData instance that can be passed to the
        Analyzer pipeline.

        Returns:
            A validated AstronautData instance.
        """
        # Base payload from sensor data
        payload: dict[str, Any] = {}

        # Add sensor measurements
        for key, value in self.state.sensor_data.items():
            payload[key] = value

        # Add declared symptoms as a free-text list
        if self.state.declared_symptoms:
            payload["symptoms"] = self.state.declared_symptoms

        # Add symptom details as notes if available
        if self.state.symptom_details:
            notes_parts: list[str] = []
            for symptom, details in self.state.symptom_details.items():
                parts: list[str] = []
                if "intensity" in details:
                    parts.append(f"intensité {details['intensity']}")
                if "duration" in details:
                    parts.append(f"durée {details['duration']}")
                if parts:
                    notes_parts.append(f"{symptom}: {'; '.join(parts)}")
            if notes_parts:
                payload["notes"] = " ; ".join(notes_parts)

        # Ensure all core fields are at least None (for validation)
        for key in ["temperature_c", "heart_rate_bpm", "blood_pressure", "spo2_pct", "sleep_hours"]:
            if key not in payload:
                payload[key] = None

        return AstronautData.model_validate(payload)

    def request_symptom_declaration(self) -> str | None:
        """Request the astronaut to declare symptoms.

        Returns:
            A prompt string asking the astronaut to declare symptoms, or None
            if no more symptom collection is needed.
        """
        if self.state.declared_symptoms and self.is_complete():
            return None

        if not self.state.declared_symptoms:
            return "Quels symptômes ressentez-vous actuellement ? (Vous pouvez en citer plusieurs)"

        # Ask if they want to add more symptoms
        return "Avez-vous d'autres symptômes à déclarer ?"

    def request_clarification(self, symptom: str) -> str | None:
        """Request clarification about a specific symptom.

        Args:
            symptom: The symptom to get clarification about.

        Returns:
            A clarification question, or None if no more questions.
        """
        question = self.get_next_question(symptom)
        if question is None:
            return None
        return f"Concernant {symptom} : {question}"


def build_conversation_from_payload(
    payload: Mapping[str, Any],
) -> ConversationManager:
    """Build a ConversationManager from an initial payload (e.g., from sensors).

    Args:
        payload: Initial data, typically from sensor readings or partial astronaut input.

    Returns:
        A ConversationManager instance initialized with the provided data.
    """
    manager = ConversationManager(initial_data=payload)
    # Ensure missing fields are tracked
    for key in manager.state.missing_fields:
        if key not in manager.state.sensor_data and key not in payload:
            pass  # Will be tracked as missing
    return manager