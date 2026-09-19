import React, { useState } from 'react';

export const AuthModal = ({ isOpen, onClose, onLogin }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    const profile = {
      name: name.trim(),
      email: email.trim() || `${name.trim().toLowerCase()}@example.com`,
      avatar: name.trim().charAt(0).toUpperCase(),
      plan: 'Gemini Pro',
      isLoggedIn: true,
    };

    localStorage.setItem('gemini_user_profile', JSON.stringify(profile));
    onLogin(profile);
    onClose();
  };

  const handleGuest = () => {
    const guestProfile = {
      name: 'Guest User',
      email: 'guest@aichatbot.local',
      avatar: 'G',
      plan: 'Free Tier',
      isLoggedIn: false,
    };
    localStorage.setItem('gemini_user_profile', JSON.stringify(guestProfile));
    onLogin(guestProfile);
    onClose();
  };

  return (
    <div className="auth-modal-backdrop" onClick={onClose}>
      <div className="auth-modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="auth-modal-header">
          <div className="auth-brand-row">
            <div className="auth-avatar-logo">✨</div>
            <h3>Sign in to Nexus AI</h3>
          </div>
          <button type="button" className="close-modal-btn" onClick={onClose}>
            ✕
          </button>
        </div>

        <p className="auth-description">
          Save your conversation history, customize your AI preferences, and access Gemini 3.6 Flash.
        </p>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="user-name">Your Name</label>
            <input
              id="user-name"
              type="text"
              placeholder="e.g. Alex Sharma"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoFocus
              className="auth-input"
            />
          </div>

          <div className="form-group">
            <label htmlFor="user-email">Email (Optional)</label>
            <input
              id="user-email"
              type="email"
              placeholder="alex@gmail.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="auth-input"
            />
          </div>

          <div className="auth-buttons-col">
            <button type="submit" className="auth-submit-btn">
              Continue
            </button>
            <button type="button" className="auth-guest-btn" onClick={handleGuest}>
              Continue as Guest
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AuthModal;
