"""JSON-based storage for conversations."""

import json
import os
from datetime import datetime
from typing import List, Dict, Any, Optional
from pathlib import Path
from .config import DATA_DIR


def ensure_data_dir():
    """Ensure the data directory exists."""
    Path(DATA_DIR).mkdir(parents=True, exist_ok=True)


def get_conversation_path(conversation_id: str) -> str:
    """Get the file path for a conversation."""
    return os.path.join(DATA_DIR, f"{conversation_id}.json")


def create_conversation(conversation_id: str, conversation_type: str = "standard") -> Dict[str, Any]:
    """
    Create a new conversation.

    Args:
        conversation_id: Unique identifier for the conversation
        conversation_type: Type of conversation ("standard" or "agentic")

    Returns:
        New conversation dict
    """
    ensure_data_dir()

    conversation = {
        "id": conversation_id,
        "created_at": datetime.utcnow().isoformat(),
        "title": "New Conversation",
        "messages": [],
        "conversation_type": conversation_type
    }

    # Save to file
    path = get_conversation_path(conversation_id)
    with open(path, 'w') as f:
        json.dump(conversation, f, indent=2)

    return conversation


import uuid

def get_conversation(conversation_id: str) -> Optional[Dict[str, Any]]:
    """
    Load a conversation from storage.
    Ensures all messages have IDs and pinned status.
    """
    path = get_conversation_path(conversation_id)

    if not os.path.exists(path):
        return None

    with open(path, 'r') as f:
        data = json.load(f)
        
    # Lazy migration: Ensure all messages have IDs and pinned status
    modified = False
    for msg in data.get("messages", []):
        if "id" not in msg:
            msg["id"] = str(uuid.uuid4())
            modified = True
        if "pinned" not in msg:
            msg["pinned"] = False
            modified = True
            
    if modified:
        save_conversation(data)
        
    return data


def save_conversation(conversation: Dict[str, Any]):
    """
    Save a conversation to storage.

    Args:
        conversation: Conversation dict to save
    """
    ensure_data_dir()

    path = get_conversation_path(conversation['id'])
    with open(path, 'w') as f:
        json.dump(conversation, f, indent=2)


def list_conversations() -> List[Dict[str, Any]]:
    """
    List all conversations (metadata only).

    Returns:
        List of conversation metadata dicts
    """
    ensure_data_dir()

    conversations = []
    for filename in os.listdir(DATA_DIR):
        if filename.endswith('.json'):
            path = os.path.join(DATA_DIR, filename)
            try:
                with open(path, 'r') as f:
                    data = json.load(f)
                    # Return metadata only
                    conversations.append({
                        "id": data["id"],
                        "created_at": data["created_at"],
                        "title": data.get("title", "New Conversation"),
                        "message_count": len(data["messages"]),
                        "conversation_type": data.get("conversation_type", "standard")
                    })
            except Exception:
                continue

    # Sort by creation time, newest first
    conversations.sort(key=lambda x: x["created_at"], reverse=True)

    return conversations


def add_user_message(conversation_id: str, content: str):
    """
    Add a user message to a conversation.

    Args:
        conversation_id: Conversation identifier
        content: User message content
    """
    conversation = get_conversation(conversation_id)
    if conversation is None:
        raise ValueError(f"Conversation {conversation_id} not found")

    conversation["messages"].append({
        "id": str(uuid.uuid4()),
        "role": "user",
        "content": content,
        "pinned": False
    })

    save_conversation(conversation)


def add_assistant_message(
    conversation_id: str,
    stage1: List[Dict[str, Any]],
    stage2: List[Dict[str, Any]],
    stage3: Dict[str, Any],
    metadata: Optional[Dict[str, Any]] = None
):
    """
    Add an assistant message with all 3 stages to a conversation.

    Args:
        conversation_id: Conversation identifier
        stage1: List of individual model responses
        stage2: List of model rankings
        stage3: Final synthesized response
        metadata: Optional metadata including aggregate rankings
    """
    conversation = get_conversation(conversation_id)
    if conversation is None:
        raise ValueError(f"Conversation {conversation_id} not found")

    message = {
        "id": str(uuid.uuid4()),
        "role": "assistant",
        "stage1": stage1,
        "stage2": stage2,
        "stage3": stage3,
        "pinned": False
    }
    
    if metadata:
        message["metadata"] = metadata

    conversation["messages"].append(message)

    save_conversation(conversation)


def toggle_message_pin(conversation_id: str, message_id: str) -> bool:
    """
    Toggle the pinned status of a message.
    
    Args:
        conversation_id: Conversation identifier
        message_id: Message identifier
        
    Returns:
        New pinned status (bool)
    """
    conversation = get_conversation(conversation_id)
    if conversation is None:
        raise ValueError(f"Conversation {conversation_id} not found")
        
    for msg in conversation["messages"]:
        if msg.get("id") == message_id:
            msg["pinned"] = not msg.get("pinned", False)
            save_conversation(conversation)
            return msg["pinned"]
            
    raise ValueError(f"Message {message_id} not found in conversation {conversation_id}")


def update_conversation_title(conversation_id: str, title: str):
    """
    Update the title of a conversation.

    Args:
        conversation_id: Conversation identifier
        title: New title for the conversation
    """
    conversation = get_conversation(conversation_id)
    if conversation is None:
        raise ValueError(f"Conversation {conversation_id} not found")

    conversation["title"] = title
    save_conversation(conversation)
def delete_conversation(conversation_id: str) -> bool:
    """Delete a conversation."""
    file_path = os.path.join(DATA_DIR, f"{conversation_id}.json")
    if os.path.exists(file_path):
        os.remove(file_path)
        return True
    return False
