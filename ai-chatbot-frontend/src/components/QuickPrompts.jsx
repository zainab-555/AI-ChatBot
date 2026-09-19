import React from 'react';

const SUGGESTIONS = [
  {
    icon: '⚡',
    title: 'Explain Concepts',
    prompt: 'Explain quantum computing in simple terms for a beginner.',
  },
  {
    icon: '💻',
    title: 'Write Code',
    prompt: 'Write a JavaScript function to find duplicate items in an array with high performance.',
  },
  {
    icon: '🚀',
    title: 'Brainstorm Ideas',
    prompt: 'Give me 5 unique, modern SaaS app ideas that leverage AI.',
  },
  {
    icon: '📝',
    title: 'Summarize & Draft',
    prompt: 'Draft an engaging email announcing a new web application release.',
  },
];

export const QuickPrompts = ({ onSelectPrompt }) => {
  return (
    <div className="welcome-container">
      <div className="welcome-badge">
        <span className="sparkle-icon">✨</span>
        <span>Next-Gen Conversational AI</span>
      </div>

      <h2 className="welcome-title">How can I help you today?</h2>
      <p className="welcome-description">
        Ask questions, generate ideas, analyze code, or brainstorm with Google Gemini 1.5 Flash.
      </p>

      <div className="quick-prompts-grid">
        {SUGGESTIONS.map((item, index) => (
          <button
            key={index}
            type="button"
            className="quick-prompt-card"
            onClick={() => onSelectPrompt(item.prompt)}
          >
            <div className="card-header-icon">
              <span className="card-icon">{item.icon}</span>
              <span className="card-title">{item.title}</span>
            </div>
            <p className="card-text">{item.prompt}</p>
          </button>
        ))}
      </div>
    </div>
  );
};

export default QuickPrompts;
