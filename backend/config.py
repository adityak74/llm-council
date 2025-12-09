"""Configuration for the QuorumAI."""

import os
from dotenv import load_dotenv

load_dotenv()

# OpenRouter API key
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")

# Council members - list of OpenRouter model identifiers
COUNCIL_MODELS = [
    "ollama/gpt-oss:20b",
    "ollama/amsaravi/medgemma-4b-it:q8",
]

# Chairman model - synthesizes final response
CHAIRMAN_MODEL = "ollama/gpt-oss:20b"

# OpenRouter API endpoint
OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions"

# Data directory for conversation storage
DATA_DIR = "data/conversations"

# Ollama Configuration
OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434/api/chat")

# Example of how to specify models:
# "openai/gpt-4" -> OpenRouter
# "ollama/llama3" -> Ollama
