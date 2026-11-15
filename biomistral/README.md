# BioMistral AI Module — NASA Space Apps

Module local d'analyse médicale pour astronautes en missions longues. Il reçoit
des données JSON, interroge **BioMistral-7B-GGUF** via **Ollama**, valide la
réponse et produit un rapport structuré exploitable par l'interface.

> Outil d'aide à la décision. Il ne remplace jamais un médecin ou un flight
> surgeon.

## Architecture

```text
Données JSON
   -> validation Pydantic
   -> canonicalisation
   -> red flags déterministes (dépistage, sans diagnostic)
   -> prompt JSON canonique
   -> Ollama / BioMistral (sortie contrainte par JSON Schema)
   -> validation structurelle
   -> grounding anti-hallucination + retries
   -> rapport + red_flags + métadonnées + disclaimer
```

```text
biomistral/
├── config.py       # variables d'environnement et options Ollama
├── schemas.py      # contrats Pydantic + JSON Schema
├── red_flags.py    # règles de dépistage déterministes pré-modèle
├── prompts.py      # prompts médicaux, sans raisonnement interne
├── client.py       # client Ollama, healthcheck, sortie structurée
├── validator.py    # extraction JSON, normalisation, validation
├── grounding.py    # ancrage des preuves, anti-hallucination, assainissement
├── analyzer.py     # orchestration et retries
├── report.py       # enveloppe finale et disclaimer
├── __main__.py     # CLI
└── __init__.py     # API publique
```

## Installation

```bash
source env/bin/activate
pip install -r requirements-dev.txt
```

Le modèle doit être disponible dans Ollama :

```bash
ollama list
ollama ps
```

## Configuration

Les variables sont lues depuis l'environnement (voir `.env.example`) :

```bash
export OLLAMA_HOST=http://127.0.0.1:11434
export BIOMISTRAL_MODEL=m/biomistral
```

Aucun secret n'est nécessaire : Ollama reste local.

## CLI

```bash
# Vérifier Ollama et le modèle
./env/bin/python -m biomistral --healthcheck --pretty

# Analyser un fichier
./env/bin/python -m biomistral \
  --input examples/astronaut_febrile.json \
  --pretty

# Écrire le rapport dans un fichier
./env/bin/python -m biomistral \
  --input examples/astronaut_normal.json \
  --output reports/normal.json --pretty

# Mode strict : code retour 2 si avertissements ou needs_review
./env/bin/python -m biomistral \
  --input examples/astronaut_febrile.json --strict
```

## API Python

```python
from biomistral import analyze_astronaut_data

payload = {
    "mission_day": 124,
    "temperature": 38.1,
    "heart_rate": 108,
    "blood_pressure": "142/92",
    "spo2": 96,
    "sleep_hours": 4.8,
    "mood": "Moderate stress",
    "radiation_daily": 0.19,
    "radiation_cumulative": 41.3,
}

envelope = analyze_astronaut_data(payload)
print(envelope["report"]["risk_level"])
print(envelope["red_flags"]["highest_severity"])
print(envelope["validation"]["needs_review"])
```

Pour injecter un client ou tester sans Ollama :

```python
from biomistral import Analyzer, OllamaClient

analyzer = Analyzer(client=OllamaClient())
result = analyzer.analyze(payload)
print(result.to_dict())
```

Les erreurs sont typées et sérialisables :

```python
from biomistral import BiomistralError, analyze_astronaut_data

try:
    analyze_astronaut_data(payload)
except BiomistralError as exc:
    print(exc.to_dict())
```

## Contrat d'entrée

Noms canoniques avec unités, avec alias compatibles pour la base de données :

| Canonique | Alias accepté |
|---|---|
| `temperature_c` | `temperature` |
| `heart_rate_bpm` | `heart_rate` |
| `blood_pressure` (`{"systolic": 142, "diastolic": 92}` ou `"142/92"`) | `bp` |
| `spo2_pct` | `spo2` |
| `sleep_hours` | `sleep_duration`, `sleep_duration_hours` |
| `radiation_daily_msv` | `radiation_daily` |
| `radiation_cumulative_msv` | `radiation_cumulative` |

Les champs absents ne sont jamais inventés. Ils apparaissent dans
`input.missing_fields` et le prompt demande au modèle de signaler l'incertitude.

## Contrat de sortie (Option B)

Chaque anomalie et chaque risque cite une preuve structurée
`{"field": "...", "value": "..."}`. Chaque phrase de `overall_assessment` cite
une mesure fournie ou indique explicitement une incertitude.

Les `red_flags` sont un bloc **distinct** du rapport BioMistral. Ils ne sont
jamais fusionnés avec `detected_abnormalities` ou `possible_risks`.

Pour garder l'exemple lisible, un seul flag est affiché ; le cas fébrile réel en
produit quatre (température, fréquence cardiaque, tension et sommeil).

```json
{
  "schema_version": "1.1",
  "model": {"name": "m/biomistral", "digest": "...", "prompt_version": "1.1"},
  "input": {"hash": "...", "missing_fields": []},
  "red_flags": {
    "rule_set_version": "1.0",
    "highest_severity": "Warning",
    "evaluated_fields": [
      "temperature_c",
      "heart_rate_bpm",
      "blood_pressure",
      "spo2_pct",
      "sleep_hours"
    ],
    "flags": [
      {
        "code": "TEMP_HIGH_WARNING",
        "severity": "Warning",
        "field": "temperature_c",
        "observed": "38.1",
        "unit": "C",
        "threshold": ">= 38.0 C",
        "message": "Temperature is above the fever screening threshold. Verify the measurement and clinical context."
      }
    ],
    "note": "Deterministic screening only; not a diagnosis."
  },
  "report": {
    "overall_assessment": "The astronaut has a temperature of 38.1 C, a heart rate of 108 bpm and a blood pressure of 142/92 mmHg. Sleep duration was 4.8 hours, and these findings require medical review. Insufficient data are available to establish a cause.",
    "detected_abnormalities": [
      {
        "parameter": "temperature_c",
        "observed": "38.1 C",
        "interpretation": "elevated above typical resting range",
        "evidence": {
          "field": "temperature_c",
          "value": "38.1"
        }
      }
    ],
    "possible_risks": [
      {
        "risk": "possible heat-related illness",
        "basis": [
          {
            "field": "temperature_c",
            "value": "38.1"
          }
        ],
        "uncertainty": "Moderate"
      }
    ],
    "recommendations": ["Recheck vital signs", "Notify the flight surgeon"],
    "risk_level": "Moderate",
    "contact_flight_surgeon": {
      "decision": "Yes",
      "reason": "Fever 38.1 C with heart rate 108 bpm requires review."
    }
  },
  "validation": {
    "attempts": 1,
    "warnings": [],
    "needs_review": false
  },
  "disclaimer": "AI-assisted analysis for decision support only..."
}
```

## Règles de dépistage déterministes (red flags)

Avant chaque appel à BioMistral, `evaluate_red_flags()` applique des seuils fixes
aux données déjà validées et canonicalisées. Cette couche :

- est pure et ne modifie jamais les mesures ;
- ne produit ni diagnostic, ni cause, ni niveau de risque final ;
- ne remplit jamais `detected_abnormalities`, `possible_risks` ou `risk_level` ;
- transmet au modèle un bloc `SCREENING_FLAGS` sans valeurs de seuil ;
- expose les flags dans `red_flags`, séparément du rapport ;
- force `needs_review: true` si un flag `Critical` est présent, sans modifier le
  rapport généré par BioMistral.

| Code | Condition | Sévérité |
|---|---|---|
| `TEMP_ELEVATED_INFO` | `37.5 ≤ T < 38.0 °C` | Info |
| `TEMP_HIGH_WARNING` | `38.0 ≤ T < 39.0 °C` | Warning |
| `TEMP_HIGH_CRITICAL` | `T ≥ 39.0 °C` | Critical |
| `TEMP_LOW_WARNING` | `35.0 ≤ T < 36.0 °C` | Warning |
| `TEMP_LOW_CRITICAL` | `T < 35.0 °C` | Critical |
| `HR_HIGH_WARNING` | `100 < HR < 130 bpm` | Warning |
| `HR_HIGH_CRITICAL` | `HR ≥ 130 bpm` | Critical |
| `HR_LOW_WARNING` | `40 ≤ HR < 50 bpm` | Warning |
| `HR_LOW_CRITICAL` | `HR < 40 bpm` | Critical |
| `BP_BORDERLINE_INFO` | `130 ≤ SBP < 140` ou `80 ≤ DBP < 90 mmHg` | Info |
| `BP_HIGH_WARNING` | `140 ≤ SBP < 180` ou `90 ≤ DBP < 120 mmHg` | Warning |
| `BP_HIGH_CRITICAL` | `SBP ≥ 180` ou `DBP ≥ 120 mmHg` | Critical |
| `BP_LOW_WARNING` | `80 ≤ SBP < 90` ou `50 ≤ DBP < 60 mmHg` | Warning |
| `BP_LOW_CRITICAL` | `SBP < 80` ou `DBP < 50 mmHg` | Critical |
| `SPO2_LOW_WARNING` | `90 ≤ SpO2 < 95 %` | Warning |
| `SPO2_CRITICAL` | `SpO2 < 90 %` | Critical |
| `SLEEP_INSUFFICIENT_INFO` | `6.0 ≤ sommeil < 7.0 h` | Info |
| `SLEEP_SHORT_WARNING` | `sommeil < 6.0 h` | Warning |

Les niveaux `Info`, `Warning` et `Critical` sont propres au dépistage : ce ne sont
pas les valeurs `Low`, `Moderate`, `High` du rapport. Les seuils par défaut sont
des valeurs de dépistage adulte, injectables via `RedFlagThresholds` et à faire
valider par un flight surgeon. Une valeur absente ne produit aucun flag ; une
liste vide ne signifie pas que l'astronaute est normal.

La v1 couvre uniquement température, fréquence cardiaque, pression artérielle,
SpO2 et sommeil. Les règles radiation, exercice, humeur et stress restent
désactivées ou informatives.

## Sécurité et grounding

Le schéma JSON garantit la forme, pas la véracité. Le module applique donc :

- séparation stricte : `red_flags` = dépistage déterministe, `report` = analyse
  BioMistral, `grounding` = contrôle post-modèle ;
- sortie contrainte par JSON Schema dans Ollama ;
- validation Pydantic stricte ;
- vérification que chaque preuve structurée `{"field", "value"}` existe dans les
  données ;
- rejet des nombres absents de l'entrée ;
- rejet des mentions d'antécédents, médicaments, allergies ou diagnostics non
  fournis ;
- rejet des liens de causalité non fournis et des tensions artérielles inversées ;
- citation d'une mesure fournie (ou d'une incertitude explicite) dans chaque
  phrase de `overall_assessment` ;
- rejet des recommandations prescriptives ;
- cohérence `High` → contact flight surgeon `Yes` ;
- `needs_review: true` si un flag `Critical` est détecté, sans modification du
  rapport ;
- retry avec feedback, puis assainissement et `needs_review: true` si nécessaire.

Le prompt interdit explicitement le raisonnement interne et demande uniquement
des justifications médicales concises fondées sur les observations.

## Tests

```bash
# Tests unitaires, sans Ollama
./env/bin/pytest

# Tests ciblés des règles de dépistage
./env/bin/pytest tests/test_red_flags.py -q

# Test d'intégration réel (lent, ~30-150 s selon les retries)
BIOMISTRAL_RUN_INTEGRATION=1 ./env/bin/pytest -m integration -s
```

## Performance

Le modèle tourne actuellement **sur CPU**. Une analyse complète prend environ
30 à 60 secondes, et jusqu'à environ 150 secondes avec un retry. L'interface doit
donc traiter l'appel de façon asynchrone et éviter les analyses concurrentes :
le module ne met pas en file d'attente les requêtes adressées à Ollama.

## Fichiers existants

`test_biomistral.py`, `test_biomistral_backup.py` et `prompts.py` n'ont pas été
modifiés. Le nouveau module vit dans `biomistral/`.
