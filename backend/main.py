"""FastAPI backend for QuorumAI."""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import uuid
import json
import asyncio

from . import storage, personas
from .council import run_full_council, generate_conversation_title, stage1_collect_responses, stage2_collect_rankings, stage3_synthesize_final, calculate_aggregate_rankings
from .config import COUNCIL_MODELS, CHAIRMAN_MODEL

app = FastAPI(title="QuorumAI API")

# Enable CORS for local development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class CreateConversationRequest(BaseModel):
    """Request to create a new conversation."""
    council_members: Optional[List[str]] = None  # List of model IDs or Persona IDs
    chairman_id: Optional[str] = None  # Model ID or Persona ID
    conversation_type: str = "standard"  # "standard" or "agentic"


class CreatePersonaRequest(BaseModel):
    name: str
    model_id: str
    system_prompt: str
    avatar_color: str = "#3b82f6"


class SendMessageRequest(BaseModel):
    """Request to send a message in a conversation."""
    content: str


class ConversationMetadata(BaseModel):
    """Conversation metadata for list view."""
    id: str
    created_at: str
    title: str
    message_count: int
    conversation_type: str = "standard"


class Conversation(BaseModel):
    """Full conversation with all messages."""
    id: str
    created_at: str
    title: str
    messages: List[Dict[str, Any]]
    council_config: Optional[Dict[str, Any]] = None  # Store the council configuration used
    conversation_type: str = "standard"


@app.get("/")
async def root():
    """Health check endpoint."""
    return {"status": "ok", "service": "QuorumAI API"}


@app.get("/api/conversations", response_model=List[ConversationMetadata])
async def list_conversations():
    """List all conversations (metadata only)."""
    return storage.list_conversations()


@app.get("/api/models")
async def list_models():
    """List available models."""
    # Combine hardcoded OpenRouter models with local Ollama models
    # For now, we'll just return the ones in config + maybe query ollama
    # But to keep it simple, let's just return the ones in COUNCIL_MODELS for now
    # In a real app, we'd query Ollama and OpenRouter
    
    # Let's try to fetch Ollama models dynamically
    import httpx
    from .config import OLLAMA_BASE_URL
    
    models = []
    
    # Add OpenRouter models with specific providers
    openrouter_models = [
        {"id": "openai/gpt-5.1", "name": "GPT-5.1", "provider": "OpenAI"},
        {"id": "google/gemini-3-pro-preview", "name": "Gemini 3 Pro", "provider": "Google"},
        {"id": "anthropic/claude-sonnet-4.5", "name": "Claude Sonnet 4.5", "provider": "Anthropic"},
        {"id": "x-ai/grok-4", "name": "Grok 4", "provider": "X.AI"},
    ]
    for m in openrouter_models:
        models.append(m)
        
    # Add Ollama models
    try:
        from .settings import get_settings
        settings = get_settings()
        base_url = settings.get("ollama_base_url")
        tags_url = base_url.replace("/api/chat", "/api/tags")
        
        async with httpx.AsyncClient(timeout=2.0) as client:
            response = await client.get(tags_url)
            if response.status_code == 200:
                ollama_models = response.json().get('models', [])
                for m in ollama_models:
                    model_id = f"ollama/{m['name']}"
                    models.append({"id": model_id, "name": m['name'], "provider": "Ollama"})
    except Exception:
        pass
        
    return models


class UpdateSettingsRequest(BaseModel):
    ollama_base_url: str
    openrouter_api_key: Optional[str] = ""
    user_api_key: Optional[str] = ""

@app.get("/api/settings")
async def get_settings():
    """Get current settings."""
    from . import settings
    return settings.get_settings()

@app.post("/api/settings")
async def update_settings(request: UpdateSettingsRequest):
    """Update settings."""
    from . import settings
    return settings.update_settings(request.dict())


@app.get("/api/personas")
async def list_personas():
    """List all personas."""
    return personas.list_personas()


@app.post("/api/personas")
async def create_persona(request: CreatePersonaRequest):
    """Create a new persona."""
    return personas.create_persona(
        request.name,
        request.model_id,
        request.system_prompt,
        request.avatar_color
    )


@app.delete("/api/personas/{persona_id}")
async def delete_persona(persona_id: str):
    """Delete a persona."""
    success = personas.delete_persona(persona_id)
    if not success:
        raise HTTPException(status_code=404, detail="Persona not found")
    return {"status": "success"}


@app.delete("/api/conversations/{conversation_id}")
async def delete_conversation(conversation_id: str):
    """Delete a conversation."""
    success = storage.delete_conversation(conversation_id)
    if not success:
        raise HTTPException(status_code=404, detail="Conversation not found")
    return {"status": "success"}


@app.post("/api/conversations/{conversation_id}/messages/{message_id}/toggle_pin")
async def toggle_message_pin(conversation_id: str, message_id: str):
    """Toggle the pinned status of a message."""
    try:
        new_status = storage.toggle_message_pin(conversation_id, message_id)
        return {"status": "success", "pinned": new_status}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@app.post("/api/conversations", response_model=Conversation)
async def create_conversation(request: CreateConversationRequest):
    """Create a new conversation."""
    conversation_id = str(uuid.uuid4())
    
    # Resolve council members and chairman
    # If not provided, use defaults from config
    
    final_council_members = []
    final_chairman = None
    
    if request.council_members:
        for member_id in request.council_members:
            # Check if it's a persona
            persona = personas.get_persona(member_id)
            if persona:
                final_council_members.append({
                    "model_id": persona['model_id'],
                    "name": persona['name'],
                    "system_prompt": persona['system_prompt'],
                    "type": "persona",
                    "id": persona['id']
                })
            else:
                # Assume it's a raw model ID
                final_council_members.append({
                    "model_id": member_id,
                    "name": member_id,
                    "system_prompt": None,
                    "type": "model",
                    "id": member_id
                })
    else:
        # Use default config
        for model_id in COUNCIL_MODELS:
            final_council_members.append({
                "model_id": model_id,
                "name": model_id,
                "system_prompt": None,
                "type": "model",
                "id": model_id
            })
            
    if request.chairman_id:
        # Check if it's a persona
        persona = personas.get_persona(request.chairman_id)
        if persona:
            final_chairman = {
                "model_id": persona['model_id'],
                "name": persona['name'],
                "system_prompt": persona['system_prompt'],
                "type": "persona",
                "id": persona['id']
            }
        else:
            final_chairman = {
                "model_id": request.chairman_id,
                "name": request.chairman_id,
                "system_prompt": None,
                "type": "model",
                "id": request.chairman_id
            }
    else:
        # Use default config
        final_chairman = {
            "model_id": CHAIRMAN_MODEL,
            "name": CHAIRMAN_MODEL,
            "system_prompt": None,
            "type": "model",
            "id": CHAIRMAN_MODEL
        }
        
    council_config = {
        "members": final_council_members,
        "chairman": final_chairman
    }
    
    conversation = storage.create_conversation(conversation_id, request.conversation_type)
    
    # Store config in conversation (need to update storage.py or just inject it here if storage supports extra fields)
    # storage.create_conversation just creates a dict. We can add to it.
    conversation["council_config"] = council_config
    storage.save_conversation(conversation) # Helper to save back
    
    return conversation


@app.get("/api/conversations/{conversation_id}", response_model=Conversation)
async def get_conversation(conversation_id: str):
    """Get a specific conversation with all its messages."""
    conversation = storage.get_conversation(conversation_id)
    if conversation is None:
        raise HTTPException(status_code=404, detail="Conversation not found")
    return conversation


@app.post("/api/conversations/{conversation_id}/message")
async def send_message(conversation_id: str, request: SendMessageRequest):
    """
    Send a message and run the 3-stage council process.
    Returns the complete response with all stages.
    """
    # Check if conversation exists
    conversation = storage.get_conversation(conversation_id)
    if conversation is None:
        raise HTTPException(status_code=404, detail="Conversation not found")

    # Check if this is the first message
    is_first_message = len(conversation["messages"]) == 0

    # Add user message
    storage.add_user_message(conversation_id, request.content)

    # If this is the first message, generate a title
    if is_first_message:
        # We need to resolve chairman first to use it for titling
        council_config = conversation.get("council_config")
        chairman_id = None
        if council_config:
            chairman_id = council_config["chairman"]["model_id"]
        else:
             chairman_id = CHAIRMAN_MODEL

        title = await generate_conversation_title(request.content, model_id=chairman_id)
        storage.update_conversation_title(conversation_id, title)

    # Get council config from conversation
    council_config = conversation.get("council_config")
    
    # Fallback for old conversations
    if not council_config:
        council_members = [{"model_id": m, "name": m} for m in COUNCIL_MODELS]
        chairman = {"model_id": CHAIRMAN_MODEL, "name": CHAIRMAN_MODEL}
    else:
        council_members = council_config["members"]
        chairman = council_config["chairman"]

    # Run the 3-stage council process
    stage1_results, stage2_results, stage3_result, metadata = await run_full_council(
        request.content,
        council_members,
        chairman
    )

    # Add assistant message with all stages
    storage.add_assistant_message(
        conversation_id,
        stage1_results,
        stage2_results,
        stage3_result,
        metadata
    )

    # Return the complete response with metadata
    return {
        "stage1": stage1_results,
        "stage2": stage2_results,
        "stage3": stage3_result,
        "metadata": metadata
    }


@app.post("/api/conversations/{conversation_id}/message/stream")
async def send_message_stream(conversation_id: str, request: SendMessageRequest):
    """
    Send a message and stream the 3-stage council process.
    Returns Server-Sent Events as each stage completes.
    """
    # Check if conversation exists
    conversation = storage.get_conversation(conversation_id)
    if conversation is None:
        raise HTTPException(status_code=404, detail="Conversation not found")

    # Check if this is the first message
    is_first_message = len(conversation["messages"]) == 0

    async def event_generator():
        try:
            # Add user message
            storage.add_user_message(conversation_id, request.content)

            # Start title generation in parallel (don't await yet)
            title_task = None
            # We need council config to know the chairman model
            council_config = conversation.get("council_config")
            
            # Fallback for old conversations
            if not council_config:
                council_members = [{"model_id": m, "name": m} for m in COUNCIL_MODELS]
                chairman = {"model_id": CHAIRMAN_MODEL, "name": CHAIRMAN_MODEL}
            else:
                council_members = council_config["members"]
                chairman = council_config["chairman"]

            if is_first_message:
                title_task = asyncio.create_task(generate_conversation_title(request.content, model_id=chairman['model_id']))

            # Run the council process
            if conversation.get("conversation_type") == "agentic":
                from .council import run_agentic_council
                async for event in run_agentic_council(request.content, council_members, chairman, conversation_id):
                    yield event
            else:
                # Stage 1: Collect responses
                yield f"data: {json.dumps({'type': 'stage1_start'})}\n\n"
                stage1_results = await stage1_collect_responses(request.content, council_members)
                yield f"data: {json.dumps({'type': 'stage1_complete', 'data': stage1_results})}\n\n"

                # Stage 2: Collect rankings
                yield f"data: {json.dumps({'type': 'stage2_start'})}\n\n"
                stage2_results, label_to_model = await stage2_collect_rankings(request.content, stage1_results, council_members)
                aggregate_rankings = calculate_aggregate_rankings(stage2_results, label_to_model)
                metadata = {'label_to_model': label_to_model, 'aggregate_rankings': aggregate_rankings}
                yield f"data: {json.dumps({'type': 'stage2_complete', 'data': stage2_results, 'metadata': metadata})}\n\n"

                # Stage 3: Synthesize final answer
                yield f"data: {json.dumps({'type': 'stage3_start'})}\n\n"
                stage3_result = await stage3_synthesize_final(request.content, stage1_results, stage2_results, chairman)
                yield f"data: {json.dumps({'type': 'stage3_complete', 'data': stage3_result})}\n\n"

                # Add assistant message with all stages
                storage.add_assistant_message(
                    conversation_id,
                    stage1_results,
                    stage2_results,
                    stage3_result,
                    metadata
                )

                # Send completion event
                yield f"data: {json.dumps({'type': 'complete'})}\n\n"

            # Wait for title generation if it was started
            if title_task:
                title = await title_task
                storage.update_conversation_title(conversation_id, title)
                yield f"data: {json.dumps({'type': 'title_complete', 'data': {'title': title}})}\n\n"

        except Exception as e:
            # Send error event
            yield f"data: {json.dumps({'type': 'error', 'message': str(e)})}\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
        }
    )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host="0.0.0.0", port=8001, reload=True)
