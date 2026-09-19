import React, { useState } from 'react';

export const Sidebar = ({
  isOpen,
  onClose,
  sessions,
  activeSessionId,
  onSelectSession,
  onNewChat,
  onDeleteSession,
  user,
  onOpenAuth,
  onLogout,
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredSessions = sessions.filter((s) =>
    (s.title || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpen && <div className="sidebar-backdrop" onClick={onClose} />}

      <aside className={`chat-sidebar ${isOpen ? 'open' : ''}`}>
        {/* Sidebar Header */}
        <div className="sidebar-header">
          <div className="sidebar-brand">
            <div className="sidebar-brand-icon">
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M12 2L14.4 9.6L22 12L14.4 14.4L12 22L9.6 14.4L2 12L9.6 9.6L12 2Z"
                  fill="url(#sidebar-gemini-grad)"
                />
                <defs>
                  <linearGradient id="sidebar-gemini-grad" x1="2" y1="2" x2="22" y2="22" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#6366F1" />
                    <stop offset="0.5" stopColor="#8B5CF6" />
                    <stop offset="1" stopColor="#EC4899" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
            <span className="sidebar-brand-name">Nexus AI</span>
          </div>

          <button
            type="button"
            className="sidebar-close-btn"
            onClick={onClose}
            title="Close sidebar"
          >
            ✕
          </button>
        </div>

        {/* + New Chat Button */}
        <div className="new-chat-container">
          <button type="button" className="new-chat-btn" onClick={onNewChat}>
            <span className="plus-icon">＋</span>
            <span className="new-chat-text">New Chat</span>
          </button>
        </div>

        {/* Search Chats Input */}
        {sessions.length > 3 && (
          <div className="sidebar-search-box">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="sidebar-search-input"
            />
          </div>
        )}

        {/* Conversation Sessions List */}
        <div className="sidebar-sessions-list">
          <div className="sessions-section-title">
            <span>Recent Chats</span>
            <span className="sessions-count">{sessions.length}</span>
          </div>

          {sessions.length === 0 ? (
            <div className="empty-sessions">
              <span>💬</span>
              <p>No past chats yet. Start a new conversation!</p>
            </div>
          ) : filteredSessions.length === 0 ? (
            <div className="empty-sessions">
              <p>No matching chats found.</p>
            </div>
          ) : (
            filteredSessions.map((session) => {
              const isActive = session.sessionId === activeSessionId;
              return (
                <div
                  key={session.sessionId}
                  className={`session-item ${isActive ? 'active' : ''}`}
                  onClick={() => onSelectSession(session.sessionId)}
                >
                  <span className="session-icon">💬</span>
                  <span className="session-title" title={session.title}>
                    {session.title || 'Untitled Conversation'}
                  </span>

                  <button
                    type="button"
                    className="session-delete-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (window.confirm('Delete this conversation?')) {
                        onDeleteSession(session.sessionId);
                      }
                    }}
                    title="Delete conversation"
                  >
                    🗑️
                  </button>
                </div>
              );
            })
          )}
        </div>

        {/* Bottom User Profile Section */}
        <div className="sidebar-user-footer">
          {user ? (
            <div className="user-profile-card">
              <div className="user-avatar-bubble">
                {user.avatar || 'U'}
              </div>
              <div className="user-profile-info">
                <span className="user-display-name">{user.name}</span>
                <span className="user-tier-badge">{user.plan || 'Gemini Pro'}</span>
              </div>
              <button
                type="button"
                className="user-logout-btn"
                onClick={onLogout}
                title="Log out"
              >
                ⎋
              </button>
            </div>
          ) : (
            <button type="button" className="sidebar-login-btn" onClick={onOpenAuth}>
              <span className="login-icon">👤</span>
              <span>Sign in / Profile</span>
            </button>
          )}
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
