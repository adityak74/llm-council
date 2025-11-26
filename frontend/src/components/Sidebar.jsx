import { useState, useEffect } from 'react';
import './Sidebar.css';

export default function Sidebar({
  conversations,
  currentConversationId,
  onSelectConversation,
  onNewConversation,
  onManagePersonas,
  onDeleteConversation,
  onOpenSettings
}) {
  const handleDelete = (e, id) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this conversation?')) {
      onDeleteConversation(id);
    }
  };

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
          <button className="settings-btn" onClick={onOpenSettings}>
            Settings
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
            <div className="conversation-content">
              <div className="conversation-title">{conv.title}</div>
              <div className="conversation-meta">
                {new Date(conv.created_at).toLocaleDateString()} • {conv.message_count} msgs
              </div>
            </div>
            <button
              className="delete-conv-btn"
              onClick={(e) => handleDelete(e, conv.id)}
              title="Delete conversation"
            >
              &times;
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
