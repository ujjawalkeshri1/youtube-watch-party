import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import type { ChatMessage, Role, Room } from '../types/room';
import { api } from '../lib/api';
import { getIdentity } from '../lib/identity';
import { parseYouTubeVideoId } from '../lib/youtube';
import { useRoomSocket } from '../hooks/useRoomSocket';
import { ParticipantList } from '../components/ParticipantList';
import { ChatPanel } from '../components/ChatPanel';
import { RoomHeader } from '../components/RoomHeader';
import { VideoPlayer } from '../components/VideoPlayer';
import { PlaybackControls } from '../components/PlaybackControls';

export function RoomPage() {
  const { code } = useParams();
  const navigate = useNavigate();
  const identity = getIdentity();
  const [room, setRoom] = useState<Room | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [videoInput, setVideoInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [duration, setDuration] = useState(0);
  const [liveTime, setLiveTime] = useState(0);
  const [leaving, setLeaving] = useState(false);

  // Always enter a room at the top. This prevents browser scroll restoration
  // from opening the room halfway down and hiding the header/video metadata.
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, [code]);

  useEffect(() => {
    if (!code) return;
    if (!identity?.userId || !identity.username) { navigate(`/join/${code.toUpperCase()}`, { replace: true }); return; }
    let cancelled = false;
    const load = async () => {
      setLoading(true); setLoadError(null);
      try {
        const joined = await api.joinRoom(code, { username: identity.username, userId: identity.userId });
        if (!cancelled) { setRoom(joined.room); setLiveTime(joined.room.currentTime); }
      } catch (caught) { if (!cancelled) setLoadError(caught instanceof Error ? caught.message : 'Room not found.'); }
      finally { if (!cancelled) setLoading(false); }
    };
    void load();
    return () => { cancelled = true; };
  }, [code, identity?.userId, identity?.username, navigate]);

  const onKicked = useCallback(() => navigate('/?notice=' + encodeURIComponent('You were removed from the room.'), { replace: true }), [navigate]);
  const onRoomEnded = useCallback((reason?: string) => navigate('/?notice=' + encodeURIComponent(reason || 'The host ended the watch party.'), { replace: true }), [navigate]);

  const socket = useRoomSocket(room?.code, identity?.userId, {
    onStateChange: (nextRoom) => { setRoom(nextRoom); setLiveTime(nextRoom.currentTime); },
    onChatMessage: (message) => setMessages((prev) => [...prev, message]),
    onChatHistory: setMessages,
    onError: (errorMsg) => { setError(errorMsg); setTimeout(() => setError(null), 5000); },
    onKicked,
    onRoomEnded,
    onSessionReplaced: () => setError('This party is open in another tab. This tab is no longer connected.'),
  });

  const currentParticipant = useMemo(() => room?.participants.find((participant) => participant.userId === identity?.userId), [room, identity?.userId]);
  // The Room's hostUserId is the single source of truth for the UI. The server
  // independently authorizes playback events as HOST, so participants cannot
  // gain playback access by changing client state.
  const isHost = Boolean(identity?.userId && room?.hostUserId === identity.userId);
  const canManage = isHost;
  const handlePlay = (time?: number) => { if (isHost) socket.play(time ?? liveTime); };
  const handlePause = (time?: number) => { if (isHost) socket.pause(time ?? liveTime); };
  const handleSeek = (time: number) => { if (isHost) socket.seek(time); };
  const handleChangeVideo = () => {
    const videoId = parseYouTubeVideoId(videoInput);
    if (!videoId) { setError('Invalid YouTube URL.'); return; }
    if (isHost) { socket.changeVideo(videoId); setVideoInput(''); setDuration(0); setLiveTime(0); }
  };
  const handlePromoteParticipant = (participantId: string, newRole: Role) => { if (canManage) socket.assignRole(participantId, newRole); };
  const handleRemoveParticipant = (participantId: string) => { if (canManage) socket.removeParticipant(participantId); };
  const handleTransferHost = (participantId: string) => { if (canManage) socket.transferHost(participantId); };
  const handleExit = async () => {
    if (leaving) return;
    setLeaving(true);
    await socket.leaveRoom();
    navigate('/');
  };

  if (!identity?.userId) return null;
  if (loading) return <main className="home-page"><div className="home-container"><p>Loading room...</p></div></main>;
  if (loadError || !room) return <main className="home-page"><div className="home-container"><div className="form-card"><h1>Unable to join room</h1><div className="error-message">{loadError || 'Room not found.'}</div><Link className="btn btn-primary" to="/join">Try another code</Link><Link className="btn btn-text" to="/">Back home</Link></div></div></main>;

  return (
    <div className="room-page">
      <RoomHeader roomName={room.name} roomCode={room.code} isConnected={socket.isConnected} username={identity.username} onExit={handleExit} leaving={leaving} />
      <main className="room-main">
        <div className="player-section">
          <div className="video-wrapper">
            <VideoPlayer videoId={room.videoId} isPlaying={room.playState === 'playing'} currentTime={room.currentTime} canControl={isHost} onPlay={handlePlay} onPause={handlePause} onSeek={handleSeek} onTimeUpdate={setLiveTime} onDuration={setDuration} onError={setError} />
          </div>
          {isHost && <PlaybackControls isPlaying={room.playState === 'playing'} currentTime={liveTime || room.currentTime} duration={duration} onPlay={() => handlePlay()} onPause={() => handlePause()} onSeek={handleSeek} canControl />}
          {isHost && <div className="video-input-section"><label className="label" htmlFor="video-input">Current video</label><div className="video-input-form"><input id="video-input" type="text" value={videoInput} onChange={(event) => setVideoInput(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') { event.preventDefault(); handleChangeVideo(); } }} placeholder="Paste a YouTube URL to change video" className="input" /><button onClick={handleChangeVideo} disabled={!videoInput} className="btn btn-secondary">Change Video</button></div></div>}
          {error && <div className="error-banner">{error}</div>}
        </div>
        <aside className="sidebar">
          <ParticipantList participants={room.participants} currentUserId={identity.userId} canManage={canManage} onRole={handlePromoteParticipant} onRemove={handleRemoveParticipant} onTransferHost={handleTransferHost} />
          <ChatPanel messages={messages} onSend={socket.sendMessage} />
        </aside>
      </main>
    </div>
  );
}
