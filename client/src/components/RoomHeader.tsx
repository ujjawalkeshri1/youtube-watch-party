import { CheckCircle2, Copy, LogOut } from 'lucide-react';
import { useState } from 'react';

interface RoomHeaderProps {
  roomName?: string;
  roomCode: string;
  isConnected: boolean;
  username: string;
  onExit?: () => void;
  leaving?: boolean;
}

export function RoomHeader({ roomName, roomCode, isConnected, username, onExit, leaving }: RoomHeaderProps) {
  const [copied, setCopied] = useState(false);
  const handleCopyInvite = async () => {
    const url = `${window.location.origin}/join/${roomCode}`;
    try { await navigator.clipboard.writeText(url); setCopied(true); window.setTimeout(() => setCopied(false), 1800); } catch { /* clipboard unavailable */ }
  };
  return (
    <header className="room-header">
      <div className="header-left">
        <div className="logo">watchparty<span className="logo-dot" /></div>
        <div className="room-info">
          {roomName && <span className="room-name">{roomName}</span>}
          <span className="room-code">ROOM {roomCode}</span>
          <div className={`status ${isConnected ? 'connected' : 'disconnected'}`}><span className="status-pulse" />{isConnected ? 'LIVE' : 'RECONNECTING'}</div>
        </div>
      </div>
      <div className="header-right">
        <button type="button" onClick={handleCopyInvite} className="copy-invite-btn" title="Copy invite link">
          {copied ? <><CheckCircle2 size={16} /> Copied</> : <><Copy size={16} /> Invite</>}
        </button>
        <div className="user-menu">
          <span className="username"><span className="user-avatar-mini">{username.slice(0, 1).toUpperCase()}</span>{username}</span>
          <button type="button" onClick={onExit} className="exit-btn" disabled={leaving}><LogOut size={15} />{leaving ? 'Leaving…' : 'Leave'}</button>
        </div>
      </div>
    </header>
  );
}
