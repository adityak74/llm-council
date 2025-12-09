import { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import ChatInterface from './components/ChatInterface';
import PersonaManager from './components/PersonaManager';
import NewConversationDialog from './components/NewConversationDialog';
import SettingsPage from './components/SettingsPage';
import SettingsDialog from './components/SettingsDialog';
import { ThemeProvider } from './ThemeContext';
import { ToastProvider, ToastViewport } from './components/ui/Toast';
import { api } from './api';
import './App.css';

function App() {
  const [conversations, setConversations] = useState([]);
  const [currentConversationId, setCurrentConversationId] = useState(null);
  const [currentConversation, setCurrentConversation] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // Dialog states
  const [isPersonaManagerOpen, setIsPersonaManagerOpen] = useState(false);
  const [isNewConversationDialogOpen, setIsNewConversationDialogOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Load conversations on mount
  useEffect(() => {
    loadConversations();
  }, []);

  // Load conversation details when selected
  useEffect(() => {
    if (currentConversationId) {
      loadConversation(currentConversationId);
    }
  }, [currentConversationId]);

  const loadConversations = async () => {
    try {
      const convs = await api.listConversations();
      setConversations(convs);
    } catch (error) {
      console.error('Failed to load conversations:', error);
    }
  };

  const loadConversation = async (id) => {
    try {
      const conv = await api.getConversation(id);
      setCurrentConversation(conv);
    } catch (error) {
      console.error('Failed to load conversation:', error);
    }
  };

  const handleStartNewConversation = async (councilMembers, chairmanId, conversationType) => {
    try {
      setIsNewConversationDialogOpen(false);
      const newConv = await api.createConversation(councilMembers, chairmanId, conversationType);
      setConversations([
        { id: newConv.id, created_at: newConv.created_at, message_count: 0 },
        ...conversations,
      ]);
      setCurrentConversationId(newConv.id);
    } catch (error) {
      console.error('Failed to create conversation:', error);
    }
  };

  const handleSelectConversation = (id) => {
    setCurrentConversationId(id);
  };

  const handleReRun = async () => {
    if (!currentConversationId || !currentConversation) return;

    // Find the user message (first message)
    const userMessage = currentConversation.messages.find(m => m.role === 'user');
    if (!userMessage) return;

    const content = userMessage.content;
    setIsLoading(true);

    try {
      // Reset to just the user message
      setCurrentConversation((prev) => ({
        ...prev,
        messages: [userMessage],
      }));

      // Create a partial assistant message
      const assistantMessage = {
        role: 'assistant',
        stage1: null,
        stage2: null,
        stage3: null,
        metadata: null,
        loading: {
          stage1: false,
          stage2: false,
          stage3: false,
        },
      };

      // Add the partial assistant message
      setCurrentConversation((prev) => ({
        ...prev,
        messages: [...prev.messages, assistantMessage],
      }));

      // Send message with streaming
      // Create a wrapper that captures the conversation ID
      const handleStreamEventWithId = (eventType, event) => {
        // Add conversationId to the event for the complete handler
        if (eventType === 'complete' || eventType === 'title_complete') {
          event.conversationId = currentConversationId;
        }
        handleStreamEvent(eventType, event);
      };
      await api.sendMessageStream(currentConversationId, content, handleStreamEventWithId);
    } catch (error) {
      console.error('Failed to re-run conversation:', error);
      setIsLoading(false);
    }
  };

  // Extracted stream event handler to avoid duplication
  const handleStreamEvent = (eventType, event) => {
    console.log('[SSE Event]', eventType, event); // Debug logging
    switch (eventType) {
      case 'stage1_start':
        console.log('[stage1_start] Setting loading.stage1 = true');
        setCurrentConversation((prev) => {
          console.log('[stage1_start] Current conversation:', prev);
          const messages = [...prev.messages];
          const lastMsg = messages[messages.length - 1];
          console.log('[stage1_start] Last message:', lastMsg);
          // Ensure we are updating an assistant message
          if (lastMsg.role === 'assistant') {
            // Create new objects to trigger React re-render
            messages[messages.length - 1] = {
              ...lastMsg,
              loading: { ...lastMsg.loading, stage1: true }
            };
            console.log('[stage1_start] Set loading.stage1 = true');
          } else {
            console.warn('[stage1_start] Last message is not assistant:', lastMsg.role);
          }
          return { ...prev, messages };
        });
        break;

      case 'stage1_complete':
        setCurrentConversation((prev) => {
          const messages = [...prev.messages];
          const lastMsg = messages[messages.length - 1];
          if (lastMsg.role === 'assistant') {
            // Create new objects to trigger React re-render
            messages[messages.length - 1] = {
              ...lastMsg,
              stage1: event.data,
              loading: { ...lastMsg.loading, stage1: false }
            };
          }
          return { ...prev, messages };
        });
        break;

      case 'stage2_start':
        setCurrentConversation((prev) => {
          const messages = [...prev.messages];
          const lastMsg = messages[messages.length - 1];
          if (lastMsg.role === 'assistant') {
            messages[messages.length - 1] = {
              ...lastMsg,
              loading: { ...lastMsg.loading, stage2: true }
            };
          }
          return { ...prev, messages };
        });
        break;

      case 'stage2_complete':
        setCurrentConversation((prev) => {
          const messages = [...prev.messages];
          const lastMsg = messages[messages.length - 1];
          if (lastMsg.role === 'assistant') {
            messages[messages.length - 1] = {
              ...lastMsg,
              stage2: event.data,
              metadata: event.metadata,
              loading: { ...lastMsg.loading, stage2: false }
            };
          }
          return { ...prev, messages };
        });
        break;

      case 'stage3_start':
        setCurrentConversation((prev) => {
          const messages = [...prev.messages];
          const lastMsg = messages[messages.length - 1];
          if (lastMsg.role === 'assistant') {
            messages[messages.length - 1] = {
              ...lastMsg,
              loading: { ...lastMsg.loading, stage3: true }
            };
          }
          return { ...prev, messages };
        });
        break;

      case 'stage3_complete':
        setCurrentConversation((prev) => {
          const messages = [...prev.messages];
          const lastMsg = messages[messages.length - 1];
          if (lastMsg.role === 'assistant') {
            messages[messages.length - 1] = {
              ...lastMsg,
              stage3: event.data,
              loading: { ...lastMsg.loading, stage3: false }
            };
          }
          return { ...prev, messages };
        });
        break;

      case 'title_complete':
        console.log('[title_complete] Reloading conversations...');
        loadConversations();
        // Optimistically update current conversation title
        setCurrentConversation((prev) => {
          if (!prev) return prev;
          console.log('[title_complete] Updating title to:', event.data.title);
          return {
            ...prev,
            title: event.data.title
          };
        });
        break;

      case 'complete':
        console.log('[Complete Event] Reloading conversations and current conversation...', event.conversationId || currentConversationId);
        loadConversations();
        // Reload current conversation to show newly saved messages
        // Use conversationId from event if available, otherwise fall back to currentConversationId
        const convId = event.conversationId || currentConversationId;
        if (convId) {
          console.log('[Complete Event] Calling loadConversation for:', convId);
          loadConversation(convId);
        } else {
          console.warn('[Complete Event] No conversationId available, skipping reload');
        }
        setIsLoading(false);
        break;

      case 'error':
        console.error('Stream error:', event.message);
        setIsLoading(false);
        break;

      default:
        // Handle new message types for Agentic Council
        // If we receive a full message object, append it
        if (event.role) {
          setCurrentConversation((prev) => {
            // Check if this message already exists (by some ID or just append?)
            // Since we don't have IDs for messages in the stream event usually, we just append.
            // But wait, for the FIRST message of the stream, we already optimistically added it.
            // For agentic council, subsequent messages (follow-ups and new rounds) need to be appended.

            // Logic:
            // 1. If it's a user message (follow-up), append it.
            // 2. If it's an assistant message (new round), append it.
            // 3. BUT, we need to handle the optimistic assistant message we added at start.

            // Actually, the backend for Agentic Council yields full message objects at the end of each round.
            // But we also have the granular stage events.
            // The stage events update the *last* message.
            // So when a new round starts, we need to append a new empty assistant message?
            // Or does the backend yield a "new_round" event?

            // Let's look at backend logic:
            // It yields "data: {json.dumps(message_data)}" where message_data has role, stage1, etc.
            // This is a COMPLETE message.

            // If we receive a complete message, we should probably replace the last message if it matches, or append if it's new.
            // But we are also receiving granular updates.

            // Let's adjust the strategy:
            // For Agentic Council, the backend yields granular events for the current round.
            // Then it yields the full message.
            // Then it yields a user message (follow-up).
            // Then it starts yielding granular events for the NEXT round.

            // So when we get a user message (follow-up), we append it.
            // Then we need to prepare for the next assistant message.

            const messages = [...prev.messages];
            const lastMsg = messages[messages.length - 1];

            if (event.role === 'user') {
              // This is a follow-up question
              return {
                ...prev,
                messages: [...messages, event]
              };
            } else if (event.role === 'assistant') {
              // This is a completed assistant message.
              // We might have already updated it via granular events.
              // So we can just ensure it's up to date.
              // OR, if this is a NEW round (implied because we just got a user message), we append it.

              // If the last message is a user message, we need to add a new assistant message.
              if (lastMsg.role === 'user') {
                return {
                  ...prev,
                  messages: [...messages, {
                    ...event,
                    loading: { stage1: false, stage2: false, stage3: false }
                  }]
                };
              } else {
                // Update the existing assistant message
                messages[messages.length - 1] = {
                  ...messages[messages.length - 1],
                  ...event,
                  loading: { stage1: false, stage2: false, stage3: false }
                };
                return { ...prev, messages };
              }
            }
            return prev;
          });

          // If we just added a user message, we should also optimistically add the NEXT assistant message container
          // so granular events have something to update.
          if (event.role === 'user') {
            setCurrentConversation((prev) => ({
              ...prev,
              messages: [...prev.messages, {
                role: 'assistant',
                stage1: null,
                stage2: null,
                stage3: null,
                metadata: null,
                loading: {
                  stage1: false,
                  stage2: false,
                  stage3: false,
                },
              }]
            }));
          }
        } else {
          console.log('Unknown event type:', eventType);
        }
    }
  };

  // Updated to accept optional conversationId to avoid race conditions with state updates
  const handleSendMessage = async (content, conversationId = null) => {
    const targetId = conversationId || currentConversationId;
    if (!targetId) return;

    setIsLoading(true);
    try {
      // Optimistically add user message to UI
      const userMessage = { role: 'user', content };
      setCurrentConversation((prev) => ({
        ...prev,
        messages: [...prev.messages, userMessage],
      }));

      // Create a partial assistant message
      const assistantMessage = {
        role: 'assistant',
        stage1: null,
        stage2: null,
        stage3: null,
        metadata: null,
        loading: {
          stage1: false,
          stage2: false,
          stage3: false,
        },
      };

      // Add the partial assistant message
      setCurrentConversation((prev) => ({
        ...prev,
        messages: [...prev.messages, assistantMessage],
      }));

      // Send message with streaming
      // Create a wrapper that captures the conversation ID
      const handleStreamEventWithId = (eventType, event) => {
        // Add conversationId to the event for the complete handler
        if (eventType === 'complete' || eventType === 'title_complete') {
          event.conversationId = targetId;
        }
        handleStreamEvent(eventType, event);
      };
      await api.sendMessageStream(targetId, content, handleStreamEventWithId);
    } catch (error) {
      console.error('Failed to send message:', error);
      // Remove optimistic messages on error
      setCurrentConversation((prev) => ({
        ...prev,
        messages: prev.messages.slice(0, -2),
      }));
      setIsLoading(false);
    }
  };

  const handleDeleteConversation = async (id) => {
    try {
      await api.deleteConversation(id);

      // Remove from list
      const updatedConversations = conversations.filter(c => c.id !== id);
      setConversations(updatedConversations);

      // If deleted conversation was active, select another one or clear
      if (currentConversationId === id) {
        if (updatedConversations.length > 0) {
          setCurrentConversationId(updatedConversations[0].id);
        } else {
          setCurrentConversationId(null);
          setCurrentConversation(null);
        }
      }
    } catch (error) {
      console.error('Failed to delete conversation:', error);
    }
  };

  return (
    <ThemeProvider>
      <ToastProvider>
        <div className={`app-container ${isSidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
          <Sidebar
            conversations={conversations}
            currentConversationId={currentConversationId}
            onSelectConversation={handleSelectConversation}
            onNewConversation={() => setIsNewConversationDialogOpen(true)}
            onManagePersonas={() => {
              setIsPersonaManagerOpen(true);
              setIsSettingsOpen(true);
            }}
            onDeleteConversation={handleDeleteConversation}
            onOpenSettings={() => {
              setIsPersonaManagerOpen(false);
              setIsSettingsOpen(true);
            }}
            onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
            isOpen={isSidebarOpen}
          />

          {!isSidebarOpen && (
            <button
              className="sidebar-toggle-btn"
              onClick={() => setIsSidebarOpen(true)}
              title="Open sidebar"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="9" y1="3" x2="9" y2="21"></line>
              </svg>
            </button>
          )}

          {false ? (
            <PersonaManager onClose={() => setIsPersonaManagerOpen(false)} />
          ) : (
            <ChatInterface
              conversation={currentConversation}
              onSendMessage={handleSendMessage}
              isLoading={isLoading}
              onReRun={handleReRun}
              onTogglePin={async (messageId) => {
                try {
                  const result = await api.toggleMessagePin(currentConversationId, messageId);
                  // Update local state
                  setCurrentConversation(prev => ({
                    ...prev,
                    messages: prev.messages.map(msg =>
                      msg.id === messageId ? { ...msg, pinned: result.pinned } : msg
                    )
                  }));
                } catch (error) {
                  console.error('Failed to toggle pin:', error);
                }
              }}
              onQuickStart={async (message, type, members, chairmanId) => {
                try {
                  // 1. Create Conversation
                  // Use passed chairmanId, or default to first member if not provided
                  const finalChairmanId = chairmanId || (members.length > 0 ? members[0] : null);

                  const newConv = await api.createConversation(members, finalChairmanId, type);

                  // 2. Update List and Set Current
                  const convList = await api.listConversations();
                  setConversations(convList);
                  setCurrentConversationId(newConv.id);

                  // Set initial state for optimistic UI
                  setCurrentConversation({
                    ...newConv,
                    messages: [] // Start empty, handleSendMessage will add user msg
                  });

                  // 3. Send Message using shared logic - Pass the ID explicitly!
                  await handleSendMessage(message, newConv.id);

                } catch (error) {
                  console.error('Quick start failed:', error);
                  toast({
                    title: "Error",
                    description: "Failed to start conversation.",
                    type: "error"
                  });
                }
              }}
            />
          )}

          <NewConversationDialog
            isOpen={isNewConversationDialogOpen}
            onClose={() => setIsNewConversationDialogOpen(false)}
            onStart={handleStartNewConversation}
          />

          <SettingsPage
            isOpen={isSettingsOpen}
            onClose={() => setIsSettingsOpen(false)}
            initialTab={isPersonaManagerOpen ? 'personas' : 'general'}
          />

          <ToastViewport />

          <ToastViewport />
        </div>
      </ToastProvider>
    </ThemeProvider>
  );
}

export default App;
