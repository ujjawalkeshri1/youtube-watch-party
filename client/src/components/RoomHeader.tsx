import { Copy, CheckCircle2, Wifi, WifiOff } from 'lucide-react';
import { useState } from 'react';

interface RoomHeaderProps {
  roomCode: string;
  isConnected: boolean;
  username: string;
  onExit?: () => void;
}

export function RoomHeader({ roomCode, isConnected, username, onExit }: RoomHeaderProps) {
  const [copied, setCopied] = useState(false);

  const handleCopyInvite = async () => {
    const url = `${window.location.origin}?join=${roomCode}`;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <header className="room-header">
      <div className="header-left">
        <div className="logo">watchparty</div>
        <div className="room-info">
          <span className="room-code">Room {roomCode}</span>
          <div className={`status ${isConnected ? 'connected' : 'disconnected'}`}>
            {isConnected ? (
              <>
                <Wifi size={14} />
                Connected
              </>
            ) : (
              <>
                <WifiOff size={14} />
                Disconnected
              </>
            )}
          </div>
        </div>
      </div>

      <div className="header-right">
        <button onClick={handleCopyInvite} className="copy-invite-btn" title="Copy invite link">
          {copied ? (
            <>
              <CheckCircle2 size={18} />
              Copied!
            </>
          ) : (
            <>
              <Copy size={18} />
              Invite
            </>
          )}
        </button>

        <div className="user-menu">
          <span className="username">{username}</span>
          <button onClick={onExit} className="exit-btn">
            Exit
          </button>
        </div>
      </div>
    </header>
  );
}
