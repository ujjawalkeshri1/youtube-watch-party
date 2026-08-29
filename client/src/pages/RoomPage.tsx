import { useState } from 'react';
import { Search } from 'lucide-react';
import type { Role, Room } from '../types/room';
import { useRoomSocket } from '../hooks/useRoomSocket';
import { ParticipantList } from '../components/ParticipantList';
import { ChatPanel } from '../components/ChatPanel';
import { RoomHeader } from '../components/RoomHeader';
import { VideoPlayer } from '../components/VideoPlayer';
import { PlaybackControls } from '../components/PlaybackControls';


interface RoomPageProps {
  room: Room;
  userId: string;
  username: string;
  onRoomUpdate: (room: Room) => void;
  onExit: () => void;
}

export function RoomPage({ room, userId, username, onRoomUpdate, onExit }: RoomPageProps) {
  const [messages, setMessages] = useState<any[]>([]);
  const [videoInput, setVideoInput] = useState('');
  const [error, setError] = useState<string | null>(null);

  const currentParticipant = room.participants.find((p) => p.id === userId);
  const canControl = currentParticipant?.role === 'HOST' || currentParticipant?.role === 'MODERATOR';
  const canManage = currentParticipant?.role === 'HOST';

  const socket = useRoomSocket(room, userId, {
    onStateChange: (updatedRoom) => {
      onRoomUpdate(updatedRoom);
    },
    onChatMessage: (message) => {
      setMessages((prev) => [...prev, message]);
    },
    onError: (errorMsg) => {
      setError(errorMsg);
      setTimeout(() => setError(null), 5000);
    },
  });

  // Handle playback events
  const handlePlay = () => {
    if (canControl) {
      socket.play(room.currentTime);
    }
  };

  const handlePause = () => {
    if (canControl) {
      socket.pause(room.currentTime);
    }
  };

  const handleSeek = (time: number) => {
    if (canControl) {
      socket.seek(time);
    }
  };

  const handleChangeVideo = () => {
    const match = videoInput.match(/(?:v=|youtu\.be\/|embed\/)([\w-]{11})/);
    if (canControl && match) {
      socket.changeVideo(match[1]);
      setVideoInput('');
    }
  };

  // Handle role management
  const handlePromoteParticipant = (participantId: string, newRole: Role) => {
    if (canManage) {
      socket.assignRole(participantId, newRole);
    }
  };

  const handleRemoveParticipant = (participantId: string) => {
    if (canManage) {
      socket.removeParticipant(participantId);
    }
  };

  const handleSendMessage = (text: string) => {
    socket.sendMessage(text);
  };

  return (
    <div className="room-page">
      <RoomHeader
        roomCode={room.code}
        isConnected={socket.isConnected}
        username={username}
        onExit={onExit}
      />

      <main className="room-main">
        <div className="player-section">
          <div className="video-wrapper">
            <VideoPlayer
              videoId={room.videoId}
              isPlaying={room.playState === 'playing'}
              currentTime={room.currentTime}
              onPlay={handlePlay}
              onPause={handlePause}
              onSeek={handleSeek}
              canControl={canControl}
            />
          </div>

          <PlaybackControls
            isPlaying={room.playState === 'playing'}
            currentTime={room.currentTime}
            duration={0}
            onPlay={handlePlay}
            onPause={handlePause}
            onSeek={handleSeek}
            onChangeVideo={() => {
              const input = document.getElementById('video-input') as HTMLInputElement;
              if (input) input.focus();
            }}
            canControl={canControl}
          />

          {canControl && (
            <div className="video-input-section">
              <div className="video-input-form">
                <Search size={18} className="input-icon" />
                <input
                  id="video-input"
                  type="text"
                  value={videoInput}
                  onChange={(e) => setVideoInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleChangeVideo();
                    }
                  }}
                  placeholder="Paste YouTube link..."
                  className="input"
                  disabled={!canControl}
                />
                <button
                  onClick={handleChangeVideo}
                  disabled={!canControl || !videoInput}
                  className="btn btn-secondary"
                >
                  Change
                </button>
              </div>
            </div>
          )}

          {error && <div className="error-banner">{error}</div>}
        </div>

        <aside className="sidebar">
          <ParticipantList
            participants={room.participants}
            currentUserId={userId}
            canManage={canManage}
            onRole={handlePromoteParticipant}
            onRemove={handleRemoveParticipant}
          />

          <ChatPanel messages={messages} onSend={handleSendMessage} />
        </aside>
      </main>
    </div>
  );
}
