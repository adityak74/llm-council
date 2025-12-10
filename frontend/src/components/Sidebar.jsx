import { useState, useEffect, useRef } from 'react';
import { useTheme } from '../ThemeContext';
import { Switch } from './ui/Switch';
import { AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from './ui/AlertDialog';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from './ui/Tooltip';
import { ScrollArea } from './ui/ScrollArea';
import './Sidebar.css';

export default function Sidebar({
  conversations,
  currentConversationId,
  onSelectConversation,
  onNewConversation,
  onManagePersonas,
  onDeleteConversation,
  onOpenSettings,

  onToggleSidebar,
  isOpen = true
}) {
  const { theme, toggleTheme } = useTheme();
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    const saved = localStorage.getItem('sidebarWidth');
    return saved ? parseInt(saved, 10) : 260;
  });
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef(null);

  useEffect(() => {
    localStorage.setItem('sidebarWidth', sidebarWidth.toString());
  }, [sidebarWidth]);

  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e) => {
      const newWidth = e.clientX;
      if (newWidth >= 200 && newWidth <= 400) {
        setSidebarWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing]);

  const handleResizeStart = () => {
    setIsResizing(true);
  };

  return (
    <TooltipProvider>
      <div
        ref={sidebarRef}
        className={`sidebar ${!isOpen ? 'collapsed' : ''}`}
        style={{ width: isOpen ? `${sidebarWidth}px` : '0' }}
      >
        <div className="sidebar-header">
          <div className="header-top">
            <button className="collapse-btn" onClick={onToggleSidebar} title="Close sidebar">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="9" y1="3" x2="9" y2="21"></line>
              </svg>
            </button>
            <h1>Quorum</h1>
          </div>
          <div className="sidebar-logo-container">
            <img src="/logo.png" alt="Quorum Logo" className="sidebar-logo" />
          </div>
          <div className="sidebar-actions">
            <Tooltip>
              <TooltipTrigger asChild>
                <button className="new-chat-btn" onClick={onNewConversation}>
                  + New Council
                </button>
              </TooltipTrigger>
              <TooltipContent>Start a new conversation</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <button className="manage-personas-btn" onClick={onManagePersonas}>
                  Personas
                </button>
              </TooltipTrigger>
              <TooltipContent>Manage AI Personas</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <button className="settings-btn" onClick={onOpenSettings}>
                  Settings
                </button>
              </TooltipTrigger>
              <TooltipContent>Configure Settings</TooltipContent>
            </Tooltip>


          </div>
        </div>

        <ScrollArea className="conversations-list-scroll">
          <div className="conversations-list">
            {conversations.map((conv) => (
              <div
                key={conv.id}
                className={`conversation-item ${conv.id === currentConversationId ? 'active' : ''
                  }`}
                onClick={() => onSelectConversation(conv.id)}
              >
                <div className="conversation-content">
                  <div className="conversation-title">
                    {conv.conversation_type === 'agentic' && (
                      <span className="agentic-icon" title="Agentic Council">⚡</span>
                    )}
                    {conv.title}
                  </div>
                  <div className="conversation-meta">
                    {new Date(conv.created_at).toLocaleDateString()} • {conv.message_count} msgs
                  </div>
                </div>

                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <button
                      className="delete-conv-btn"
                      onClick={(e) => e.stopPropagation()}
                      title="Delete conversation"
                    >
                      &times;
                    </button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Conversation</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to delete "{conv.title}"? This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={() => onDeleteConversation(conv.id)}>Delete</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            ))}
          </div>
        </ScrollArea>
        {isOpen && (
          <div
            className="resize-handle"
            onMouseDown={handleResizeStart}
            style={{ cursor: isResizing ? 'col-resize' : 'col-resize' }}
          />
        )}
      </div>
    </TooltipProvider>
  );
}
