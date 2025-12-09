import { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Avatar, AvatarImage, AvatarFallback } from './ui/Avatar';
import { ScrollArea } from './ui/ScrollArea';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from './ui/Tooltip';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from './ui/Select';
import Stage1 from './Stage1';
import Stage2 from './Stage2';
import Stage3 from './Stage3';
import NewConversationDialog from './NewConversationDialog';
import { api } from '../api';
import './ChatInterface.css';

export default function ChatInterface({
  conversation,
  onSendMessage,
  isLoading,
  onReRun,
  onTogglePin,
  onQuickStart
}) {
  const [input, setInput] = useState('');
  const [showAllMessages, setShowAllMessages] = useState(false);
  const messagesEndRef = useRef(null);

  // Quick Start State
  const [qsType, setQsType] = useState('standard');
  const [qsModels, setQsModels] = useState([]);
  const [qsPersonas, setQsPersonas] = useState([]);
  const [qsSelectedMembers, setQsSelectedMembers] = useState([]);
  const [qsChairman, setQsChairman] = useState('');
  const [qsIsLoadingData, setQsIsLoadingData] = useState(false);
  const [isConfigDialogOpen, setIsConfigDialogOpen] = useState(false);

  useEffect(() => {
    if (!conversation) {
      loadQuickStartData();
    }
  }, [conversation]);

  const loadQuickStartData = async () => {
    setQsIsLoadingData(true);
    try {
      const [pData, mData] = await Promise.all([
        api.listPersonas(),
        api.listModels()
      ]);
      setQsPersonas(pData);
      setQsModels(mData);

      // Default selection: First 3 models
      const defaults = mData.slice(0, 3).map(m => m.id);
      setQsSelectedMembers(defaults);
      if (defaults.length > 0) {
        setQsChairman(defaults[0]);
      }
    } catch (e) {
      console.error("Failed to load quick start data", e);
    } finally {
      setQsIsLoadingData(false);
    }
  };

  const handleTogglePin = (messageId) => {
    if (onTogglePin) {
      onTogglePin(messageId);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [conversation]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (input.trim() && !isLoading) {
      if (!conversation && onQuickStart) {
        // Quick Start
        onQuickStart(input, qsType, qsSelectedMembers, qsChairman);
      } else {
        // Normal Send
        onSendMessage(input);
      }
      setInput('');
    }
  };

  const handleKeyDown = (e) => {
    // Submit on Enter (without Shift)
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleConfigConfirm = (members, chairman, type) => {
    setQsSelectedMembers(members);
    setQsChairman(chairman);
    setQsType(type);
    setIsConfigDialogOpen(false);
  };

  if (!conversation) {
    return (
      <div className="chat-interface empty-state-container">
        <div className="empty-state-content">
          <div className="welcome-header">
            <div className="welcome-avatar-container">
              <img src="/logo.png" alt="QuorumAI" className="welcome-logo" />
            </div>
            <h2>Welcome to QuorumAI</h2>
          </div>

          <form className="quick-start-form" onSubmit={handleSubmit}>
            <textarea
              className="quick-input"
              placeholder="Ask anything to start a new council..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={1}
            />

            <div className="quick-actions">
              <div className="quick-config">
                <Select value={qsType} onValueChange={setQsType}>
                  <SelectTrigger className="quick-select">
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="standard">Standard Council</SelectItem>
                    <SelectItem value="agentic">Agentic Council</SelectItem>
                  </SelectContent>
                </Select>

                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div
                        className="members-badge clickable"
                        onClick={() => setIsConfigDialogOpen(true)}
                      >
                        {qsSelectedMembers.length} Members
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      Click to configure council members
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>

              <button
                type="submit"
                className="quick-send-btn"
                disabled={!input.trim() || qsIsLoadingData}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="22" y1="2" x2="11" y2="13"></line>
                  <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                </svg>
              </button>
            </div>
          </form>

          <NewConversationDialog
            isOpen={isConfigDialogOpen}
            onClose={() => setIsConfigDialogOpen(false)}
            onStart={handleConfigConfirm}
            confirmText="Update Configuration"
            initialSelectedMembers={qsSelectedMembers}
            initialSelectedChairman={qsChairman}
            initialConversationType={qsType}
          />
        </div>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="chat-interface">
        <ScrollArea className="messages-scroll-area">
          <div className="messages-container">
            {conversation.messages.length === 0 ? (
              <div className="empty-state">
                <h2>Start a conversation</h2>
                <p>Ask a question to consult QuorumAI</p>
              </div>
            ) : (
              <>
                {conversation.messages.length > 5 && (
                  <div className="show-more-container">
                    <button
                      className="show-more-btn"
                      onClick={() => setShowAllMessages(!showAllMessages)}
                    >
                      {showAllMessages
                        ? 'Show less'
                        : `Show ${conversation.messages.length - 5} previous messages`}
                    </button>
                  </div>
                )}
                {(showAllMessages ? conversation.messages : conversation.messages.slice(-5)).map((msg) => (
                  <div key={conversation.messages.indexOf(msg)} className={`message-group ${msg.pinned ? 'pinned' : ''}`}>
                    {msg.role === 'user' ? (
                      <div className="user-message">
                        <div className="message-header-row">
                          <Avatar className="message-avatar user">
                            <AvatarFallback>U</AvatarFallback>
                          </Avatar>
                          <button
                            className={`pin-btn ${msg.pinned ? 'active' : ''}`}
                            onClick={() => handleTogglePin(msg.id)}
                            title={msg.pinned ? "Unpin message" : "Pin message"}
                          >
                            {msg.pinned ? '★' : '☆'}
                          </button>
                        </div>
                        <div className="message-content">
                          <div className="markdown-content">
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="assistant-message">
                        <div className="message-header">
                          <div className="header-left">
                            <Avatar className="message-avatar assistant">
                              <AvatarFallback>AI</AvatarFallback>
                            </Avatar>
                            <span className="message-label">QuorumAI</span>
                          </div>
                          <button
                            className={`pin-btn ${msg.pinned ? 'active' : ''}`}
                            onClick={() => handleTogglePin(msg.id)}
                            title={msg.pinned ? "Unpin message" : "Pin message"}
                          >
                            {msg.pinned ? '★' : '☆'}
                          </button>
                        </div>


                        {/* Stage 1 */}
                        {msg.loading?.stage1 && (
                          <div className="stage-loading">
                            <div className="spinner"></div>
                            <span>
                              {conversation?.council_config?.members
                                ? `Council Members (${conversation.council_config.members.map(m => m.name).join(', ')}) are researching...`
                                : "Council Members are researching..."}
                            </span>
                          </div>
                        )}
                        {msg.stage1 && <Stage1 responses={msg.stage1} />}

                        {/* Stage 2 */}
                        {msg.loading?.stage2 && (
                          <div className="stage-loading">
                            <div className="spinner"></div>
                            <span>
                              {conversation?.council_config?.members
                                ? "Council is debating and ranking responses..."
                                : "Council is ranking responses..."}
                            </span>
                          </div>
                        )}
                        {msg.stage2 && (
                          <Stage2
                            rankings={msg.stage2}
                            labelToModel={msg.metadata?.label_to_model}
                            aggregateRankings={msg.metadata?.aggregate_rankings}
                          />
                        )}

                        {/* Stage 3 */}
                        {msg.loading?.stage3 && (
                          <div className="stage-loading">
                            <div className="spinner"></div>
                            <span>
                              {conversation?.council_config?.chairman
                                ? `Chairman (${conversation.council_config.chairman.name}) is synthesizing...`
                                : "Chairman is synthesizing..."}
                            </span>
                          </div>
                        )}
                        {msg.stage3 && <Stage3 finalResponse={msg.stage3} />}
                      </div>
                    )}
                  </div>
                ))}
              </>
            )}

            {/* Removed global loading indicator - stages show their own loading states */}

            {/* Re-run button (Standard Council only) */}
            {!isLoading && conversation.messages.length > 0 && conversation.conversation_type !== 'agentic' && onReRun && (
              <div className="rerun-container">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button className="rerun-btn" onClick={onReRun}>
                      ↺ Re-run Council
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>Restart the debate with the same prompt</TooltipContent>
                </Tooltip>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {(conversation.messages.length === 0 || conversation.conversation_type === 'agentic') && (
          <form className="input-form" onSubmit={handleSubmit}>
            <textarea
              className="message-input"
              placeholder={
                conversation.messages.length === 0
                  ? "Ask your question... (Shift+Enter for new line, Enter to send)"
                  : "Provide guidance or ask a follow-up question..."
              }
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isLoading}
              rows={3}
            />
            <button
              type="submit"
              className="send-button"
              disabled={!input.trim() || isLoading}
            >
              Send
            </button>
          </form>
        )}
      </div>
    </TooltipProvider>
  );
}
