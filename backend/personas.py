"""Persona management for Quorum."""

import json
import os
import uuid
from typing import List, Dict, Optional
from pydantic import BaseModel

PERSONAS_FILE = "data/personas.json"

class Persona(BaseModel):
    id: str
    name: str
    model_id: str  # The underlying model (e.g., "ollama/gpt-oss:20b")
    system_prompt: str
    avatar_color: str = "#3b82f6"  # Default blue


def _ensure_data_dir():
    os.makedirs(os.path.dirname(PERSONAS_FILE), exist_ok=True)
    if not os.path.exists(PERSONAS_FILE):
        with open(PERSONAS_FILE, "w") as f:
            json.dump([], f)


def list_personas() -> List[Dict]:
    _ensure_data_dir()
    try:
        with open(PERSONAS_FILE, "r") as f:
            return json.load(f)
    except Exception:
        return []


def get_persona(persona_id: str) -> Optional[Dict]:
    personas = list_personas()
    for p in personas:
        if p["id"] == persona_id:
            return p
    return None


def create_persona(name: str, model_id: str, system_prompt: str, avatar_color: str = "#3b82f6") -> Dict:
    personas = list_personas()
    
    new_persona = {
        "id": str(uuid.uuid4()),
        "name": name,
        "model_id": model_id,
        "system_prompt": system_prompt,
        "avatar_color": avatar_color
    }
    
    personas.append(new_persona)
    
    with open(PERSONAS_FILE, "w") as f:
        json.dump(personas, f, indent=2)
        
    return new_persona


def delete_persona(persona_id: str) -> bool:
    personas = list_personas()
    initial_len = len(personas)
    personas = [p for p in personas if p["id"] != persona_id]
    
    if len(personas) < initial_len:
        with open(PERSONAS_FILE, "w") as f:
            json.dump(personas, f, indent=2)
        return True
    return False
