"""Unified LLM client for making requests to OpenRouter and Ollama."""

import httpx
import json
from typing import List, Dict, Any, Optional
from .config import OPENROUTER_API_KEY, OPENROUTER_API_URL, OLLAMA_BASE_URL

async def query_model(
    model: str,
    messages: List[Dict[str, str]],
    timeout: float = 300.0,
    system_prompt: Optional[str] = None
) -> Optional[Dict[str, Any]]:
    """
    Query a single model via OpenRouter or Ollama.
    
    Models starting with 'ollama/' will be routed to the local Ollama instance.
    All other models are assumed to be OpenRouter models.

    Args:
        model: Model identifier (e.g., "openai/gpt-4o" or "ollama/llama3")
        messages: List of message dicts with 'role' and 'content'
        timeout: Request timeout in seconds
        system_prompt: Optional system prompt to prepend to messages

    Returns:
        Response dict with 'content' and optional 'reasoning_details', or None if failed
    """
    # Inject system prompt if provided
    final_messages = messages
    if system_prompt:
        final_messages = [{"role": "system", "content": system_prompt}] + messages

    if model.startswith("ollama/"):
        return await _query_ollama(model.replace("ollama/", ""), final_messages, timeout)
    else:
        return await _query_openrouter(model, final_messages, timeout)


async def _query_openrouter(
    model: str,
    messages: List[Dict[str, str]],
    timeout: float
) -> Optional[Dict[str, Any]]:
    """Query OpenRouter API."""
    from .settings import get_settings
    
    settings = get_settings()
    api_key = settings.get("openrouter_api_key") or OPENROUTER_API_KEY
    
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
    }

    payload = {
        "model": model,
        "messages": messages,
    }

    try:
        async with httpx.AsyncClient(timeout=timeout) as client:
            response = await client.post(
                OPENROUTER_API_URL,
                headers=headers,
                json=payload
            )
            response.raise_for_status()

            data = response.json()
            message = data['choices'][0]['message']

            return {
                'content': message.get('content'),
                'reasoning_details': message.get('reasoning_details')
            }

    except Exception as e:
        print(f"Error querying OpenRouter model {model}: {e}")
        return None


import asyncio

_ollama_semaphore = None

def get_ollama_semaphore():
    global _ollama_semaphore
    if _ollama_semaphore is None:
        _ollama_semaphore = asyncio.Semaphore(2)
    return _ollama_semaphore

async def _query_ollama(
    model: str,
    messages: List[Dict[str, str]],
    timeout: float
) -> Optional[Dict[str, Any]]:
    """Query local Ollama instance."""
    from .settings import get_settings
    
    settings = get_settings()
    base_url = settings.get("ollama_base_url")
    
    payload = {
        "model": model,
        "messages": messages,
        "stream": False
    }

    semaphore = get_ollama_semaphore()

    try:
        async with semaphore:
            async with httpx.AsyncClient(timeout=timeout) as client:
                response = await client.post(
                    base_url,
                    json=payload
                )
                response.raise_for_status()

                data = response.json()
                
                # Ollama response format is different from OpenAI/OpenRouter
                # It returns 'message': {'role': 'assistant', 'content': '...'}
                message = data.get('message', {})
                
                return {
                    'content': message.get('content'),
                    'reasoning_details': None # Ollama doesn't typically provide this yet
                }

    except Exception as e:
        print(f"Error querying Ollama model {model}: {e}")
        return None


async def query_models_parallel(
    models: List[str],
    messages: List[Dict[str, str]],
    system_prompts: Optional[List[Optional[str]]] = None
) -> Dict[str, Optional[Dict[str, Any]]]:
    """
    Query multiple models in parallel.

    Args:
        models: List of model identifiers
        messages: List of message dicts to send to each model
        system_prompts: Optional list of system prompts corresponding to models

    Returns:
        Dict mapping model identifier to response dict (or None if failed)
    """
    import asyncio

    if system_prompts is None:
        system_prompts = [None] * len(models)
    
    if len(system_prompts) != len(models):
        raise ValueError("system_prompts length must match models length")

    # Create tasks for all models
    tasks = [
        query_model(model, messages, system_prompt=sp) 
        for model, sp in zip(models, system_prompts)
    ]

    # Wait for all to complete
    responses = await asyncio.gather(*tasks)

    # Map models to their responses
    # Note: If multiple models have the same ID but different system prompts, 
    # this dict will overwrite. However, typically we use unique model IDs or handle this upstream.
    # For the council, we might need to change the key to include persona ID if we want to support same model multiple times.
    # But for now, let's assume unique model IDs or that the caller handles mapping.
    return {model: response for model, response in zip(models, responses)}
