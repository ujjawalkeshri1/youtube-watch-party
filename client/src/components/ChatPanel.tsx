import { Send, SmilePlus } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import type { ChatMessage } from '../types/room';

interface ChatPanelProps {
  messages: ChatMessage[];
  onSend: (message: string) => void;
}

const EMOJIS = ['😂', '🤣', '😭', '❤️', '🔥', '😍', '😎', '🤯', '👀', '🙌', '👏', '💀', '✨', '🎬', '🍿', '🚀', '💯', '🫶', '😈', '🥹', '🤝', '💥', '🎉', '😮'];

export function ChatPanel({ messages, onSend }: ChatPanelProps) {
  const [message, setMessage] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!message.trim()) return;
    onSend(message.trim());
    setMessage('');
    setShowEmojiPicker(false);
  };

  const addEmoji = (emoji: string) => {
    setMessage((current) => `${current}${emoji}`);
  };

  return (
    <section className="side-section chat" style={{ position: 'relative' }}>
      <div className="section-heading">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <h2>Chat</h2>
          <span style={{ fontSize: 10, color: '#34d399', fontWeight: 700 }}>● LIVE</span>
        </div>
        <span style={{ fontSize: 10, color: '#666670' }}>vibe check ✨</span>
      </div>

      <div className="messages">
        {messages.length === 0 ? (
          <div className="empty-message">
            <div style={{ fontSize: 25, marginBottom: 6 }}>🍿</div>
            <div style={{ fontWeight: 700, color: '#bcbcc5' }}>Chat is empty</div>
            <div style={{ marginTop: 4 }}>Break the ice with a vibe.</div>
          </div>
        ) : (
          messages.map((item, index) => (
            <div className="message" key={`${item.sentAt}-${index}`}>
              <div className="message-avatar">{item.username.slice(0, 2).toUpperCase()}</div>
              <div className="message-content">
                <div className="message-header">
                  <strong>{item.username}</strong>
                  <span className="message-time">{new Date(item.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <p className="message-text">{item.message}</p>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {showEmojiPicker && (
        <div style={{ position: 'absolute', right: 58, bottom: 58, zIndex: 10, width: 250, padding: 10, display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 4, background: '#17171b', border: '1px solid #383840', borderRadius: 14, boxShadow: '0 18px 45px rgba(0,0,0,.55)' }}>
          {EMOJIS.map((emoji) => (
            <button key={emoji} type="button" onClick={() => addEmoji(emoji)} aria-label={`Add ${emoji}`} style={{ width: 34, height: 34, borderRadius: 9, fontSize: 19, display: 'grid', placeItems: 'center', background: 'transparent' }}>
              {emoji}
            </button>
          ))}
        </div>
      )}

      <form className="chat-form" onSubmit={submit}>
        <button type="button" title="Add emoji" aria-label="Add emoji" onClick={() => setShowEmojiPicker((open) => !open)} style={{ width: 40, height: 40, flex: '0 0 40px', display: 'grid', placeItems: 'center', borderRadius: 10, color: showEmojiPicker ? '#ff5263' : '#a4a4ad', background: showEmojiPicker ? 'rgba(255,51,71,.1)' : 'transparent' }}>
          <SmilePlus size={18} />
        </button>
        <input
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          placeholder="Drop a message..."
          maxLength={500}
          autoComplete="off"
        />
        <button type="submit" title="Send message" aria-label="Send message" className="send-btn" disabled={!message.trim()}>
          <Send size={18} />
        </button>
      </form>
    </section>
  );
}
