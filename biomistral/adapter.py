"""Adapter Supabase / conversation → BioMistral pipeline.

Responsable uniquede transformation des données externes vers le format
interne AstronautData utilisé par le Analyzer. Ne parle jamais à Ollama,
ne fait aucun diagnostic, ne modifie aucune donnée reçue.

Architecture :
    Supabase
      |
    adapter.py
      |
    AstronautData
      |
    Analyzer
      |
    Red Flags → BioMistral → Medical Report
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any

from .schemas import AstronautData
from .conversation import ConversationManager, ConversationState


@dataclass
class IAAdapterConfig:
    """Configuration contrôlant le comportement de l'adaptateur."""
    add_conversation_context: bool = True
    validate_ranges: bool = True
    include_sensor_fields: bool = True
    include_declared_fields: bool = True


@dataclass
class IAAdapterResult:
    """Résultat de l'adaptation Supabase / conversation → AstronautData."""
    astronaut_data: AstronautData
    conversation_state: ConversationState | None = None
    warnings: list[str] = field(default_factory=list)
    requires_review: bool = False


def _validate_and_clean_temperature(value: Any) -> float | None:
    """Valide et nettoie une valeur de température."""
    if value is None:
        return None
    try:
        v = float(value)
        if 25.0 <= v <= 45.0:
            return v
    except (ValueError, TypeError):
        pass
    return None


def _validate_and_clean_heart_rate(value: Any) -> int | None:
    """Valide et nettoie une valeur de fréquence cardiaque."""
    if value is None:
        return None
    try:
        v = int(value)
        if 20 <= v <= 250:
            return v
    except (ValueError, TypeError):
        pass
    return None


def _validate_blood_pressure(value: Any) -> dict | None:
    """Valide un objet tension artérielle {systolic, diastolic}."""
    if value is None:
        return None
    if isinstance(value, dict):
        try:
            s = int(value.get("systolic", 0))
            d = int(value.get("diastolic", 0))
            if 40 <= s <= 300 and 20 <= d <= 200:
                return {"systolic": s, "diastolic": d}
        except (ValueError, TypeError, KeyError):
            pass
    elif isinstance(value, str):
        try:
            parts = value.strip().split("/")
            if len(parts) == 2:
                s = int(parts[0])
                d = int(parts[1])
                if 40 <= s <= 300 and 20 <= d <= 200:
                    return {"systolic": s, "diastolic": d}
        except (ValueError, TypeError):
            pass
    return None


def _validate_and_clean_spo2(value: Any) -> float | None:
    """Valide et nettoie une valeur SpO2."""
    if value is None:
        return None
    try:
        v = float(value)
        if 0.0 <= v <= 100.0:
            return v
    except (ValueError, TypeError):
        pass
    return None


def _validate_and_clean_sleep_hours(value: Any) -> float | None:
    """Valide et nettoie une valeur de sommeil."""
    if value is None:
        return None
    try:
        v = float(value)
        if 0.0 <= v <= 24.0:
            return v
    except (ValueError, TypeError):
        pass
    return None


def _validate_and_clean_exercise_minutes(value: Any) -> int | None:
    """Valide et nettoie des minutes d'exercice."""
    if value is None:
        return None
    try:
        v = int(value)
        if 0 <= v <= 1440:
            return v
    except (ValueError, TypeError):
        pass
    return None


def _validate_and_clean_radiation(value: Any) -> float | None:
    """Valide et nettoie une valeur de radiation."""
    if value is None:
        return None
    try:
        v = float(value)
        if 0.0 <= v <= 1000.0:
            return v
    except (ValueError, TypeError):
        pass
    return None


def _extract_sensor_data(payload: dict[str, Any]) -> dict[str, Any]:
    """Extrait et valide les données capteurs d'un payload Supabase."""
    sensor_data: dict[str, Any] = {}

    if payload.get("temperature_c") is not None:
        sensor_data["temperature_c"] = _validate_and_clean_temperature(
            payload["temperature_c"]
        )
    if payload.get("heart_rate_bpm") is not None:
        sensor_data["heart_rate_bpm"] = _validate_and_clean_heart_rate(
            payload["heart_rate_bpm"]
        )
    if payload.get("blood_pressure") is not None:
        sensor_data["blood_pressure"] = _validate_blood_pressure(
            payload["blood_pressure"]
        )
    if payload.get("spo2_pct") is not None:
        sensor_data["spo2_pct"] = _validate_and_clean_spo2(payload["spo2_pct"])
    if payload.get("sleep_hours") is not None:
        sensor_data["sleep_hours"] = _validate_and_clean_sleep_hours(payload["sleep_hours"])
    if payload.get("radiation_daily_msv") is not None:
        sensor_data["radiation_daily_msv"] = _validate_and_clean_radiation(
            payload["radiation_daily_msv"]
        )
    if payload.get("exercise_minutes") is not None:
        sensor_data["exercise_minutes"] = _validate_and_clean_exercise_minutes(
            payload["exercise_minutes"]
        )

    return sensor_data


def _extract_declared_data(payload: dict[str, Any]) -> dict[str, Any]:
    """Extrait et valide les données déclarées par l'astronaute."""
    declared_data: dict[str, Any] = {}

    symptoms = payload.get("symptoms")
    if symptoms is not None:
        if isinstance(symptoms, list):
            # Normaliser : garder seulement les chaînes non vides
            cleaned = [str(s).strip() for s in symptoms if str(s).strip()]
            if cleaned:
                declared_data["symptoms"] = cleaned

    for field in ["fatigue_level", "stress_level", "pain_localization", "pain_intensity"]:
        if payload.get(field) is not None:
            declared_data[field] = str(payload[field]).strip()

    notes = payload.get("notes")
    if notes is not None and str(notes).strip():
        declared_data["notes"] = str(notes).strip()

    return declared_data


def _extract_metadata(payload: dict[str, Any]) -> dict[str, Any]:
    """Extrait les métadonnées de mission."""
    metadata: dict[str, Any] = {}

    if payload.get("astronaut_id") is not None:
        metadata["astronaut_id"] = str(payload["astronaut_id"]).strip()
    if payload.get("mission_id") is not None:
        metadata["mission_id"] = str(payload["mission_id"]).strip()
    if payload.get("mission_day") is not None:
        try:
            md = int(payload["mission_day"])
            if 1 <= md <= 100000:
                metadata["mission_day"] = md
        except (ValueError, TypeError):
            pass
    if payload.get("timestamp") is not None:
        metadata["timestamp"] = str(payload["timestamp"]).strip()
    if payload.get("source") is not None:
        metadata["source"] = str(payload["source"]).strip()

    return metadata


def adapt_supabase_to_astronautdata(
    payload: dict[str, Any],
    *,
    config: IAAdapterConfig | None = None,
) -> IAAdapterResult:
    """Transforme les données en provenance de SupABASE vers AstronautData.

    Args:
        payload: Dictionnaire JSON venant de la table sensor_measurements
                 ou symptom_reports de Supabase.
        config: Options de configuration (valeurs par défaut si None).

    Returns:
        IAAdapterResult contenant AstronautData valide, l'état de conversation
        le cas échéant, des warnings le cas échéant et un flag needs_review.
    """
    if config is None:
        config = IAAdapterConfig()

    warnings: list[str] = []

    # 1. Extraire les trois catégories de données
    sensor_data = _extract_sensor_data(payload) if config.include_sensor_fields else {}
    declared_data = _extract_declared_data(payload) if config.include_declared_fields else {}
    metadata = _extract_metadata(payload)

    # 2. Compter ce qui a été fourni
    sensor_fields_provided = sum(1 for v in sensor_data.values() if v is not None)
    declared_fields_provided = len([v for v in declared_data.values() if v is not None])

    # 3. Construire le payload AstronautData
    base_payload: dict[str, Any] = {}

    # Données capteurs
    for key, value in sensor_data.items():
        base_payload[key] = value

    # Données déclarées
    base_payload.update(declared_data)

    # Métadonnées
    base_payload["mission_day"] = metadata.get("mission_day")
    base_payload["astronaut_id"] = metadata.get("astronaut_id")
    base_payload["timestamp"] = metadata.get("timestamp")

    # 4. Créer AstronautData
    try:
        astronaut_data = AstronautData.model_validate(base_payload)
    except Exception as exc:
        warnings.append(f"Impossible de valider AstronautData : {exc}")
        # Fallback : créer avec des None
        astronaut_data = AstronautData()

    # 5. Déterminer requires_review
    requires_review = False
    if config.validate_ranges:
        # Flag si température critique fournie
        if astronaut_data.temperature_c is not None and astronaut_data.temperature_c >= 39.0:
            requires_review = True
        # Flag si fréquence cardiaque critique
        if astronaut_data.heart_rate_bpm is not None and astronaut_data.heart_rate_bpm >= 130:
            requires_review = True

    # 6. Gestion contexte conversationnel (optionnel)
    conversation_state: ConversationState | None = None
    if config.add_conversation_context:
        # Essayer de récupérer un état conversation existant
        # Si le payload contient des infos conversation, on peut les retransmettre
        if payload.get("source") == "conversation" and declared_data.get("symptoms"):
            cs = ConversationState()
            for s in declared_data["symptoms"]:
                cs.add_declared_symptom(s)
            # Conserver les autres champs de conversation si présents
            conversation_state = cs

    # 7. Compiler les warnings
    if sensor_fields_provided == 0 and declared_fields_provided == 0:
        warnings.append("Aucune donnée fournie dans le payload Supabase")

    if declared_fields_provided > 0 and sensor_fields_provided == 0:
        warnings.append("Aucune donnée capteur fournie : analyse sur symptômes seulement")

    return IAAdapterResult(
        astronaut_data=astronaut_data,
        conversation_state=conversation_state,
        warnings=warnings,
        requires_review=requires_review,
    )


def adapt_conversation_to_astronautdata(
    conversation_manager: ConversationManager,
    *,
    include_sensor_placeholder: bool = False,
) -> IAAdapterResult:
    """Transforme l'état de conversation.py vers AstronautData.

    Permet de passer du mode conversationnel au pipeline médical.

    Interface :
        conversation.py
          ↓
        adapt_conversation_to_astronautdata()
          ↓
        AstronautData
          ↓
        Analyzer
    """
    # 1. Récupérer les symptômes déclarés dans la conversation
    declared_symptoms = conversation_manager.state.declared_symptoms.copy()

    # 2. Construire le payload AstronautData
    base_payload: dict[str, Any] = {}

    # Ajouter les symptômes si présents
    if declared_symptoms:
        base_payload["symptoms"] = declared_symptoms

    # Ajouter les détails de symptômes si disponibles
    if conversation_manager.state.symptom_details:
        notes_parts: list[str] = []
        for symptom, details in conversation_manager.state.symptom_details.items():
            parts: list[str] = []
            if "intensity" in details:
                parts.append(f"intensité {details['intensity']}")
            if "duration" in details:
                parts.append(f"durée {details['duration']}")
            if parts:
                notes_parts.append(f"{symptom}: {'; '.join(parts)}")
        if notes_parts:
            base_payload["notes"] = " ; ".join(notes_parts)

    # 3. Ajouter un placeholder pour les données capteurs si demandé
    if include_sensor_placeholder:
        # Marquer que les données capteurs sont manquantes/inconnues
        base_payload["temperature_c"] = None
        base_payload["heart_rate_bpm"] = None
        base_payload["blood_pressure"] = None
        base_payload["spo2_pct"] = None
        base_payload["sleep_hours"] = None

    # 4. Créer AstronautData
    try:
        astronaut_data = AstronautData.model_validate(base_payload)
    except Exception as exc:
        # Fallback minimal
        astronaut_data = AstronautData()
        if "symptoms" not in astronaut_data.model_fields_set:
            astronaut_data.symptoms = declared_symptoms or []

    # 5. Vérifier requires_review basique
    requires_review = (
        astronaut_data.temperature_c is not None
        and astronaut_data.temperature_c >= 39.0
    ) or astronaut_data.heart_rate_bpm is not None and astronaut_data.heart_rate_bpm >= 130

    return IAAdapterResult(
        astronaut_data=astronaut_data,
        conversation_state=conversation_manager.state if include_sensor_placeholder else None,
        warnings=["Données capteurs manquantes - analyse sur déclarations uniquement"]
        if not include_sensor_placeholder and not declared_symptoms
        else [],
        requires_review=requires_review,
    )