import React, { useState } from 'react';

// Lightweight markdown-like formatter for code blocks, bold, lists, and inline code
const formatMessageContent = (text) => {
  if (!text) return null;

  // Split by code blocks ```lang ... ```
  const codeBlockRegex = /```([a-zA-Z]*)\n([\s\S]*?)```/g;
  const parts = [];
  let lastIndex = 0;
  let match;

  while ((match = codeBlockRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push({
        type: 'text',
        content: text.substring(lastIndex, match.index),
      });
    }
    parts.push({
      type: 'code',
      language: match[1] || 'plaintext',
      code: match[2],
    });
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    parts.push({
      type: 'text',
      content: text.substring(lastIndex),
    });
  }

  return parts.map((part, index) => {
    if (part.type === 'code') {
      return (
        <div key={index} className="code-block-wrapper">
          <div className="code-block-header">
            <span className="code-language">{part.language}</span>
            <button
              className="copy-code-btn"
              onClick={() => navigator.clipboard.writeText(part.code)}
              type="button"
            >
              Copy
            </button>
          </div>
          <pre>
            <code>{part.code}</code>
          </pre>
        </div>
      );
    }

    // Process paragraphs and inline formats
    const paragraphs = part.content.split('\n\n');
    return paragraphs.map((p, pIdx) => {
      const lines = p.split('\n');
      return (
        <p key={`${index}-${pIdx}`} className="message-paragraph">
          {lines.map((line, lineIdx) => {
            // Check for list items
            const isBullet = line.trim().startsWith('* ') || line.trim().startsWith('- ');
            const cleanedLine = isBullet ? line.trim().substring(2) : line;

            // Simple formatting for bold and inline code
            const formatted = parseInlineFormatting(cleanedLine);

            return (
              <React.Fragment key={lineIdx}>
                {isBullet ? (
                  <span className="bullet-point">
                    <span className="bullet-dot">•</span>
                    {formatted}
                  </span>
                ) : (
                  formatted
                )}
                {lineIdx < lines.length - 1 && !isBullet && <br />}
              </React.Fragment>
            );
          })}
        </p>
      );
    });
  });
};

const parseInlineFormatting = (str) => {
  // Regex for **bold** and `code`
  const tokens = [];
  let buffer = '';
  let i = 0;

  while (i < str.length) {
    if (str.startsWith('**', i)) {
      if (buffer) {
        tokens.push(buffer);
        buffer = '';
      }
      const end = str.indexOf('**', i + 2);
      if (end !== -1) {
        tokens.push(<strong key={i}>{str.substring(i + 2, end)}</strong>);
        i = end + 2;
        continue;
      }
    } else if (str[i] === '`') {
      if (buffer) {
        tokens.push(buffer);
        buffer = '';
      }
      const end = str.indexOf('`', i + 1);
      if (end !== -1) {
        tokens.push(<code key={i} className="inline-code">{str.substring(i + 1, end)}</code>);
        i = end + 1;
        continue;
      }
    }
    buffer += str[i];
    i++;
  }
  if (buffer) tokens.push(buffer);
  return tokens;
};

export const ChatMessage = ({ message }) => {
  const isBot = message.sender === 'bot';
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy message:', err);
    }
  };

  const formattedTime = message.timestamp
    ? new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : '';

  return (
    <div className={`message-row ${isBot ? 'bot-row' : 'user-row'}`}>
      <div className="message-avatar">
        {isBot ? (
          <div className="avatar-bot-icon">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M12 2L14.4 9.6L22 12L14.4 14.4L12 22L9.6 14.4L2 12L9.6 9.6L12 2Z"
                fill="#818CF8"
              />
            </svg>
          </div>
        ) : (
          <div className="avatar-user-icon">
            <span>You</span>
          </div>
        )}
      </div>

      <div className={`message-bubble ${isBot ? 'bot-bubble' : 'user-bubble'} ${message.isError ? 'error-bubble' : ''}`}>
        <div className="message-header-meta">
          <span className="sender-name">{isBot ? 'Gemini 3.6 Flash' : 'You'}</span>
          {formattedTime && <span className="message-time">{formattedTime}</span>}
        </div>

        {/* Uploaded Attachment Display (Photos or PDFs) */}
        {message.attachment && (
          <div className="message-attachment-card">
            {message.attachment.previewUrl ? (
              <img
                src={message.attachment.previewUrl}
                alt="Attachment"
                className="message-attachment-img"
              />
            ) : (
              <div className="message-pdf-card">
                <span className="pdf-icon">📄</span>
                <span className="pdf-name">{message.attachment.fileName || 'PDF Document'}</span>
              </div>
            )}
          </div>
        )}

        <div className="message-content">
          {formatMessageContent(message.text)}
        </div>

        {isBot && !message.isError && (
          <div className="message-footer-actions">
            <button
              type="button"
              className="action-btn copy-message-btn"
              onClick={handleCopy}
              title="Copy response"
            >
              {copied ? (
                <>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2.5">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  <span className="action-text copied-text">Copied!</span>
                </>
              ) : (
                <>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                  </svg>
                  <span className="action-text">Copy</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatMessage;
