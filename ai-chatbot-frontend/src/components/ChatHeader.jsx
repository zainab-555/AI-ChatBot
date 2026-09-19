import React from 'react';

export const ChatHeader = ({
  isConnected,
  onClearChat,
  messageCount,
  onToggleSidebar,
  activeSessionTitle,
  onOpenAuth,
  user,
  onNewChat,
}) => {
  return (
    <header className="chat-header">
      <div className="header-left-group">
        <button
          type="button"
          className="sidebar-toggle-btn"
          onClick={onToggleSidebar}
          title="Toggle sidebar (Chat history)"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>

        <div className="header-branding">
          <div className="avatar-wrapper">
            <div className="ai-avatar">
              <svg
                className="ai-avatar-icon"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M12 2L14.4 9.6L22 12L14.4 14.4L12 22L9.6 14.4L2 12L9.6 9.6L12 2Z"
                  fill="url(#gemini-grad)"
                />
                <defs>
                  <linearGradient id="gemini-grad" x1="2" y1="2" x2="22" y2="22" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#6366F1" />
                    <stop offset="0.5" stopColor="#8B5CF6" />
                    <stop offset="1" stopColor="#EC4899" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
            <span className={`status-indicator ${isConnected ? 'online' : 'offline'}`} />
          </div>

          <div className="header-info">
            <div className="header-title-row">
              <h1 className="header-title">Nexus AI</h1>
              <span className="model-badge">gemini-3.6-flash</span>
            </div>
            <p className="header-subtitle">
              {activeSessionTitle ? (
                <span className="active-chat-title">{activeSessionTitle}</span>
              ) : isConnected ? (
                <span className="status-text-online">Backend Connected • Port 5000</span>
              ) : (
                <span className="status-text-offline">Backend Offline (check port 5000)</span>
              )}
            </p>
          </div>
        </div>
      </div>

      <div className="header-actions">
        <button
          type="button"
          className="header-btn header-new-chat-btn"
          onClick={onNewChat}
          title="Start fresh new conversation"
        >
          <span className="plus-symbol">＋</span>
          <span>New Chat</span>
        </button>
        {user ? (
          <button
            type="button"
            className="user-badge-btn"
            onClick={onOpenAuth}
            title="User Profile"
          >
            <span className="user-mini-avatar">{user.avatar || 'U'}</span>
            <span className="user-mini-name">{user.name.split(' ')[0]}</span>
          </button>
        ) : (
          <button
            type="button"
            className="header-btn login-nav-btn"
            onClick={onOpenAuth}
            title="Sign in"
          >
            Sign in
          </button>
        )}

        {messageCount > 0 && (
          <button
            type="button"
            className="header-btn clear-btn"
            onClick={onClearChat}
            title="Clear current view"
          >
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
            </svg>
            <span className="btn-label">Clear</span>
          </button>
        )}
      </div>
    </header>
  );
};

export default ChatHeader;
