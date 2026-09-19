import React, { useRef, useEffect } from 'react';

export const ChatInput = ({
  input,
  setInput,
  onSend,
  isLoading,
  attachment,
  setAttachment,
  onOpenCamera,
  inputRef,
}) => {
  const localRef = useRef(null);
  const textareaRef = inputRef || localRef;
  const fileInputRef = useRef(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const scrollHeight = textareaRef.current.scrollHeight;
      textareaRef.current.style.height = `${Math.min(scrollHeight, 160)}px`;
    }
  }, [input]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!isLoading && (input.trim() || attachment)) {
        onSend();
      }
    }
  };

  const handleFileClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 10MB limit check
    if (file.size > 10 * 1024 * 1024) {
      alert('File size exceeds 10MB limit. Please select a smaller file.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result;
      const base64 = dataUrl.split(',')[1];
      setAttachment({
        fileName: file.name,
        mimeType: file.type || 'application/octet-stream',
        base64,
        previewUrl: file.type.startsWith('image/') ? dataUrl : null,
        fileSize: file.size,
      });
    };
    reader.readAsDataURL(file);

    // Reset input so user can choose the same file again if desired
    e.target.value = '';
  };

  const removeAttachment = () => {
    setAttachment(null);
  };

  const canSend = !isLoading && (input.trim().length > 0 || !!attachment);

  return (
    <div className="chat-input-container">
      {/* Attachment Preview Card */}
      {attachment && (
        <div className="attachment-preview-bar">
          <div className="attachment-chip">
            {attachment.previewUrl ? (
              <img src={attachment.previewUrl} alt="Preview" className="chip-thumbnail" />
            ) : (
              <span className="chip-file-icon">📄</span>
            )}
            <div className="chip-meta">
              <span className="chip-name">{attachment.fileName}</span>
              <span className="chip-size">
                {attachment.fileSize
                  ? `${(attachment.fileSize / 1024).toFixed(1)} KB`
                  : 'Document'}
              </span>
            </div>
            <button
              type="button"
              className="chip-remove-btn"
              onClick={removeAttachment}
              title="Remove attachment"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      <div className="input-box-wrapper">
        {/* Hidden File Input */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/png,image/jpeg,image/webp,image/gif,application/pdf"
          style={{ display: 'none' }}
        />

        {/* Action Buttons: Camera & File Upload */}
        <div className="input-actions-left">
          <button
            type="button"
            className="tool-btn"
            onClick={onOpenCamera}
            disabled={isLoading}
            title="Take photo using camera"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="tool-icon">
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
              <circle cx="12" cy="13" r="4" />
            </svg>
          </button>

          <button
            type="button"
            className="tool-btn"
            onClick={handleFileClick}
            disabled={isLoading}
            title="Upload photo or PDF document"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="tool-icon">
              <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
            </svg>
          </button>
        </div>

        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={
            attachment
              ? 'Add a question about this file or press send...'
              : 'Ask Gemini or attach photo / PDF... (Enter to send)'
          }
          rows={1}
          disabled={isLoading}
          className="chat-textarea"
        />

        <button
          type="button"
          onClick={onSend}
          disabled={!canSend}
          className={`send-button ${canSend ? 'active' : ''}`}
          title="Send message"
        >
          {isLoading ? (
            <div className="button-spinner" />
          ) : (
            <svg
              className="send-icon"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          )}
        </button>
      </div>

      <div className="input-footer-hint">
        <span>Supports Camera, Photos (JPG/PNG) & PDFs. Powered by Google Gemini 3.6 Flash.</span>
      </div>
    </div>
  );
};

export default ChatInput;
