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
  onOpenSettings
}) {
  const { theme, toggleTheme } = useTheme();



  return (
    <TooltipProvider>
      <div className="sidebar">
        <div className="sidebar-header">
          <h1>LLM Council</h1>
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

            <div className="theme-toggle-container">
              <span className="theme-label">🌙</span>
              <Switch
                checked={theme === 'dark'}
                onCheckedChange={toggleTheme}
              />
            </div>
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
      </div>
    </TooltipProvider>
  );
}
