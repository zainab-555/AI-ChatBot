import React, { useState, useEffect, useRef } from 'react';
import ChatHeader from './components/ChatHeader';
import ChatMessage from './components/ChatMessage';
import ChatInput from './components/ChatInput';
import QuickPrompts from './components/QuickPrompts';
import CameraModal from './components/CameraModal';
import Sidebar from './components/Sidebar';
import AuthModal from './components/AuthModal';
import {
  sendChatMessage,
  fetchSessions,
  fetchSessionMessages,
  deleteSession,
  checkServerHealth,
} from './services/api';
import './App.css';

function App() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [attachment, setAttachment] = useState(null);

  // Session & Sidebar states
  const [sessions, setSessions] = useState([]);
  const [activeSessionId, setActiveSessionId] = useState(null);
  const [activeSessionTitle, setActiveSessionTitle] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // User Profile & Modal states
  const [user, setUser] = useState(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  const messagesEndRef = useRef(null);
  const chatContainerRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading, attachment]);

  // Load saved user from localStorage
  useEffect(() => {
    try {
      const savedUser = localStorage.getItem('gemini_user_profile');
      if (savedUser) {
        setUser(JSON.parse(savedUser));
      }
    } catch (e) {
      console.warn('Could not parse user profile:', e);
    }
  }, []);

  // Fetch all chat sessions
  const loadSessionsList = async () => {
    const list = await fetchSessions();
    setSessions(list);
    return list;
  };

  // Initial load
  useEffect(() => {
    const init = async () => {
      const healthy = await checkServerHealth();
      setIsConnected(healthy);

      if (healthy) {
        const list = await loadSessionsList();
        // Load the most recent session if available
        if (list && list.length > 0 && !activeSessionId) {
          handleSelectSession(list[0].sessionId, list[0].title);
        }
      }
    };

    init();

    const interval = setInterval(async () => {
      const healthy = await checkServerHealth();
      setIsConnected(healthy);
    }, 15000);

    return () => clearInterval(interval);
  }, []);

  // Switch to a chosen conversation session
  const handleSelectSession = async (sessionId, title) => {
    setActiveSessionId(sessionId);
    setActiveSessionTitle(title || null);
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const rawMessages = await fetchSessionMessages(sessionId);
      if (rawMessages && rawMessages.length > 0) {
        const formatted = [];
        rawMessages.forEach((item, index) => {
          formatted.push({
            id: `msg-user-${item._id || index}`,
            sender: 'user',
            text: item.prompt,
            timestamp: item.createdAt,
            attachment: item.attachment
              ? {
                  fileName: item.attachment.fileName,
                  mimeType: item.attachment.fileType,
                }
              : null,
          });
          formatted.push({
            id: `msg-bot-${item._id || index}`,
            sender: 'bot',
            text: item.response,
            timestamp: item.createdAt,
          });
        });
        setMessages(formatted);
      } else {
        setMessages([]);
      }
    } catch (err) {
      console.error('Failed to load session messages:', err);
    } finally {
      setIsLoading(false);
      // On mobile screens, close sidebar after picking
      if (window.innerWidth < 768) {
        setIsSidebarOpen(false);
      }
    }
  };

  // Start a fresh New Chat
  const handleNewChat = () => {
    setActiveSessionId(null);
    setActiveSessionTitle(null);
    setMessages([]);
    setAttachment(null);
    setInput('');
    setErrorMessage(null);

    // Immediate focus for typing
    setTimeout(() => {
      inputRef.current?.focus();
    }, 50);

    if (window.innerWidth < 768) {
      setIsSidebarOpen(false);
    }
  };

  // Delete a chat session
  const handleDeleteSession = async (sessionIdToDelete) => {
    await deleteSession(sessionIdToDelete);
    setSessions((prev) => prev.filter((s) => s.sessionId !== sessionIdToDelete));

    if (activeSessionId === sessionIdToDelete) {
      handleNewChat();
    }
  };

  const handleSendMessage = async (promptToSend) => {
    const promptText = (promptToSend || input).trim();
    const currentAttachment = attachment;

    if ((!promptText && !currentAttachment) || isLoading) return;

    setErrorMessage(null);

    const userMessageId = `user-${Date.now()}`;
    const newUserMessage = {
      id: userMessageId,
      sender: 'user',
      text: promptText || (currentAttachment ? `Attached: ${currentAttachment.fileName}` : ''),
      timestamp: new Date().toISOString(),
      attachment: currentAttachment
        ? {
            fileName: currentAttachment.fileName,
            mimeType: currentAttachment.mimeType,
            previewUrl: currentAttachment.previewUrl,
          }
        : null,
    };

    setMessages((prev) => [...prev, newUserMessage]);
    setInput('');
    setAttachment(null);
    setIsLoading(true);

    try {
      // Connect to backend route http://localhost:5000/api/chat using Axios
      const data = await sendChatMessage(
        promptText,
        currentAttachment,
        activeSessionId,
        activeSessionTitle
      );

      const botMessage = {
        id: `bot-${Date.now()}`,
        sender: 'bot',
        text: data.response,
        timestamp: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, botMessage]);
      setIsConnected(true);

      // If a new session was created, sync state and refresh sessions in sidebar
      if (data.sessionId && data.sessionId !== activeSessionId) {
        setActiveSessionId(data.sessionId);
        setActiveSessionTitle(data.sessionTitle || promptText.substring(0, 30));
      }
      loadSessionsList();
    } catch (err) {
      console.error('Chat error:', err);
      const isConnectionError =
        err.message.includes('Could not connect') || err.message.includes('Network Error');

      if (isConnectionError) {
        setIsConnected(false);
      }

      const errorBotMessage = {
        id: `err-${Date.now()}`,
        sender: 'bot',
        text: `⚠️ **Error**: ${err.message}\n\nPlease verify that your Node.js Express server is running on \`http://localhost:5000\` and that \`GEMINI_API_KEY\` is configured in your \`.env\` file.`,
        timestamp: new Date().toISOString(),
        isError: true,
      };

      setMessages((prev) => [...prev, errorBotMessage]);
      setErrorMessage(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearChat = () => {
    if (window.confirm('Are you sure you want to clear current view?')) {
      setMessages([]);
      setErrorMessage(null);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('gemini_user_profile');
    setUser(null);
  };

  return (
    <div className="app-layout">
      {/* Background ambient glowing orbs */}
      <div className="ambient-orb orb-1" />
      <div className="ambient-orb orb-2" />

      {/* Camera Capture Modal */}
      <CameraModal
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onCapture={(capturedData) => setAttachment(capturedData)}
      />

      {/* User Login/Sign In Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onLogin={(profile) => setUser(profile)}
      />

      <div className="chat-app-wrapper">
        {/* ChatGPT Style Collapsible Sidebar */}
        <Sidebar
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          sessions={sessions}
          activeSessionId={activeSessionId}
          onSelectSession={handleSelectSession}
          onNewChat={handleNewChat}
          onDeleteSession={handleDeleteSession}
          user={user}
          onOpenAuth={() => setIsAuthModalOpen(true)}
          onLogout={handleLogout}
        />

        {/* Main Chat Interface */}
        <div className="chat-main-column">
          <ChatHeader
            isConnected={isConnected}
            onClearChat={handleClearChat}
            messageCount={messages.length}
            onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)}
            activeSessionTitle={activeSessionTitle}
            onOpenAuth={() => setIsAuthModalOpen(true)}
            user={user}
            onNewChat={handleNewChat}
          />

          {!isConnected && (
            <div className="offline-banner">
              <span className="offline-icon">⚠️</span>
              <span>
                Backend server not detected on <code>http://localhost:5000</code>. Please run{' '}
                <code>npm start</code> in <code>ai-chatbot-backend</code>.
              </span>
            </div>
          )}

          <main className="chat-messages-area" ref={chatContainerRef}>
            {messages.length === 0 ? (
              <QuickPrompts onSelectPrompt={(prompt) => handleSendMessage(prompt)} />
            ) : (
              <div className="messages-list">
                {messages.map((msg) => (
                  <ChatMessage key={msg.id} message={msg} />
                ))}

                {isLoading && (
                  <div className="message-row bot-row loading-row">
                    <div className="message-avatar">
                      <div className="avatar-bot-icon pulsing">
                        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path
                            d="M12 2L14.4 9.6L22 12L14.4 14.4L12 22L9.6 14.4L2 12L9.6 9.6L12 2Z"
                            fill="#818CF8"
                          />
                        </svg>
                      </div>
                    </div>
                    <div className="message-bubble bot-bubble typing-bubble">
                      <div className="typing-dots">
                        <span className="dot dot-1" />
                        <span className="dot dot-2" />
                        <span className="dot dot-3" />
                      </div>
                      <span className="typing-label">
                        {attachment ? 'Gemini is analyzing file...' : 'Gemini is thinking...'}
                      </span>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>
            )}
          </main>

          <ChatInput
            input={input}
            setInput={setInput}
            onSend={() => handleSendMessage()}
            isLoading={isLoading}
            attachment={attachment}
            setAttachment={setAttachment}
            onOpenCamera={() => setIsCameraOpen(true)}
            inputRef={inputRef}
          />
        </div>
      </div>
    </div>
  );
}

export default App;
