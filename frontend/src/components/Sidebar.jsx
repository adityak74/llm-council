import { useState, useEffect } from 'react';
import './Sidebar.css';

export default function Sidebar({
  conversations,
  currentConversationId,
  onSelectConversation,
  onNewConversation,
  onManagePersonas
}) {
  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <h1>LLM Council</h1>
        <div className="sidebar-actions">
          <button className="new-chat-btn" onClick={onNewConversation}>
            + New Council
          </button>
          <button className="manage-personas-btn" onClick={onManagePersonas}>
            Personas
          </button>
        </div>
      </div>

      <div className="conversations-list">
        {conversations.map((conv) => (
          <div
            key={conv.id}
            className={`conversation-item ${conv.id === currentConversationId ? 'active' : ''
              }`}
            onClick={() => onSelectConversation(conv.id)}
          >
            <div className="conversation-title">{conv.title}</div>
            <div className="conversation-meta">
              {new Date(conv.created_at).toLocaleDateString()} • {conv.message_count} msgs
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
