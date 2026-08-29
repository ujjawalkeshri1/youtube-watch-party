import { Flame, Heart, Laugh, MessageCircle, Send, Sparkles, X, Zap } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import type { ChatMessage } from '../types/room';

interface ChatPanelProps { messages: ChatMessage[]; onSend: (message: string) => void; }
const QUICK_REACTIONS = [
  { label: 'LOL', value: '😂', Icon: Laugh },
  { label: 'CRY', value: '😭', Icon: Sparkles },
  { label: 'DEAD', value: '💀', Icon: Zap },
  { label: 'FIRE', value: '🔥', Icon: Flame },
  { label: 'LOVE', value: '❤️', Icon: Heart },
  { label: 'WOW', value: '🤯', Icon: Sparkles },
];

export function ChatPanel({ messages, onSend }: ChatPanelProps) {
  const [message, setMessage] = useState('');
  const [pickerOpen, setPickerOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    const text = message.trim();
    if (!text) return;
    onSend(text); setMessage('');
  };
  const addReaction = (value: string) => {
    setMessage((current) => `${current}${value}`);
    setPickerOpen(false);
  };

  return (
    <section className="side-section chat">
      <div className="section-heading chat-heading">
        <div className="chat-title"><span className="chat-icon"><MessageCircle size={15} /></span><h2>Live chat</h2><span className="live-badge"><i /> LIVE</span></div>
        <span className="vibe-label"><Sparkles size={11} /> good vibes</span>
      </div>
      <div className="messages">
        {messages.length === 0 ? (
          <div className="chat-empty"><div className="chat-empty-icon"><MessageCircle size={20} /></div><strong>The room is quiet</strong><span>Start the conversation.</span></div>
        ) : messages.map((item, index) => (
          <div className="message" key={`${item.sentAt}-${index}`}>
            <div className="message-avatar">{item.username.slice(0, 2).toUpperCase()}</div>
            <div className="message-content">
              <div className="message-header"><strong>{item.username}</strong><span className="message-time">{new Date(item.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span></div>
              <p className="message-text">{item.message}</p>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <div className="chat-composer-wrap">
        {pickerOpen && (
          <div className="emoji-popover">
            <div className="emoji-popover-head"><span>Quick reactions</span><button type="button" onClick={() => setPickerOpen(false)} aria-label="Close reactions"><X size={14} /></button></div>
            <div className="reaction-grid">
              {QUICK_REACTIONS.map(({ label, value, Icon }) => (
                <button key={label} type="button" className="reaction-option" onClick={() => addReaction(value)} title={label}><Icon size={15} /><span>{label}</span></button>
              ))}
            </div>
          </div>
        )}
        <form className="chat-form" onSubmit={submit}>
          <button type="button" className={`emoji-trigger ${pickerOpen ? 'active' : ''}`} onClick={() => setPickerOpen((open) => !open)} title="Reactions" aria-label="Reactions"><Sparkles size={17} /></button>
          <input value={message} onChange={(event) => setMessage(event.target.value)} placeholder="Write a message…" maxLength={500} autoComplete="off" />
          <button type="submit" title="Send message" aria-label="Send message" className="send-btn"><Send size={17} /></button>
        </form>
      </div>
    </section>
  );
}
