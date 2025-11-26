import json
import os
from pathlib import Path
from typing import Dict, Any
from .config import OLLAMA_BASE_URL as DEFAULT_OLLAMA_URL

SETTINGS_FILE = "data/settings.json"

def get_settings() -> Dict[str, Any]:
    """Get current settings."""
    if not os.path.exists(SETTINGS_FILE):
        return {
            "ollama_base_url": DEFAULT_OLLAMA_URL
        }
    
    try:
        with open(SETTINGS_FILE, "r") as f:
            return json.load(f)
    except Exception:
        return {
            "ollama_base_url": DEFAULT_OLLAMA_URL
        }

def update_settings(new_settings: Dict[str, Any]) -> Dict[str, Any]:
    """Update settings."""
    current = get_settings()
    current.update(new_settings)
    
    # Ensure directory exists
    os.makedirs(os.path.dirname(SETTINGS_FILE), exist_ok=True)
    
    with open(SETTINGS_FILE, "w") as f:
        json.dump(current, f, indent=2)
        
    return current
