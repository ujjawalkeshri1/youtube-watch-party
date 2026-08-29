import { BrowserRouter, Routes, Route, useSearchParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { RoomLobby } from './components/RoomLobby';
import { RoomPage } from './pages/RoomPage';
import { HomePage } from './pages/HomePage';
import { api } from './lib/api';
import { createIdentity, getIdentity, saveIdentity, type Identity } from './lib/identity';
import type { Room } from './types/room';

function AppRoutes() {
  const [identity, setIdentity] = useState<Identity | null>(getIdentity());
  const [room, setRoom] = useState<Room | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const joinCode = searchParams.get('join');
    if (joinCode && !room) {
      navigate(`/room/${joinCode}`);
    }
  }, [searchParams, room, navigate]);

  const enter = async (
    username: string,
    action: (nextIdentity: Identity) => Promise<Room>
  ) => {
    setLoading(true);
    setError('');
    try {
      const nextIdentity =
        identity?.username === username.trim() ? identity : createIdentity(username);
      saveIdentity(nextIdentity);
      setIdentity(nextIdentity);
      const nextRoom = await action(nextIdentity);
      setRoom(nextRoom);
      navigate(`/room/${nextRoom.code}`);
    } catch (caught) {
      const msg = caught instanceof Error ? caught.message : 'Something went wrong.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route
        path="/room/:code"
        element={
          room && identity ? (
            <RoomPage
              room={room}
              userId={identity.userId}
              username={identity.username}
              onRoomUpdate={setRoom}
              onExit={() => {
                setRoom(null);
                navigate('/');
              }}
            />
          ) : (
            <RoomLobby
              loading={loading}
              error={error}
              onCreate={(username) => enter(username, (next) => api.createRoom(next))}
              onJoin={(username, code) => enter(username, (next) => api.joinRoom(code, next))}
            />
          )
        }
      />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}
