import json
import os
from pathlib import Path
from typing import Dict, Any
from .config import OLLAMA_BASE_URL as DEFAULT_OLLAMA_URL

SETTINGS_FILE = "data/settings.json"

def get_settings() -> Dict[str, Any]:
    """Get current settings."""
    defaults = {
        "ollama_base_url": DEFAULT_OLLAMA_URL,
        "openrouter_api_key": "",
        "user_api_key": ""
    }

    if not os.path.exists(SETTINGS_FILE):
        return defaults
    
    try:
        with open(SETTINGS_FILE, "r") as f:
            data = json.load(f)
            # Merge with defaults to ensure all keys exist
            return {**defaults, **data}
    except Exception:
        return defaults

def update_settings(new_settings: Dict[str, Any]) -> Dict[str, Any]:
    """Update settings."""
    current = get_settings()
    current.update(new_settings)
    
    # Ensure directory exists
    os.makedirs(os.path.dirname(SETTINGS_FILE), exist_ok=True)
    
    with open(SETTINGS_FILE, "w") as f:
        json.dump(current, f, indent=2)
        
    return current
