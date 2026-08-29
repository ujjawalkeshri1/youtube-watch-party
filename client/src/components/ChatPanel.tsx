import { Send } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import type { ChatMessage } from '../types/room';

interface ChatPanelProps {
  messages: ChatMessage[];
  onSend: (message: string) => void;
}

export function ChatPanel({ messages, onSend }: ChatPanelProps) {
  const [message, setMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (message.trim()) {
      onSend(message);
      setMessage('');
    }
  };

  return (
    <section className="side-section chat">
      <div className="section-heading">
        <h2>Chat</h2>
      </div>

      <div className="messages">
        {messages.length === 0 ? (
          <p className="empty-message">No messages yet. Say hello!</p>
        ) : (
          messages.map((item, index) => (
            <div className="message" key={`${item.sentAt}-${index}`}>
              <div className="message-avatar">{item.username.slice(0, 2).toUpperCase()}</div>
              <div className="message-content">
                <div className="message-header">
                  <strong>{item.username}</strong>
                  <span className="message-time">
                    {new Date(item.sentAt).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
                <p className="message-text">{item.message}</p>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      <form className="chat-form" onSubmit={submit}>
        <input
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          placeholder="Send a message..."
          maxLength={500}
          autoComplete="off"
        />
        <button type="submit" title="Send message" aria-label="Send message" className="send-btn">
          <Send size={18} />
        </button>
      </form>
    </section>
  );
}
