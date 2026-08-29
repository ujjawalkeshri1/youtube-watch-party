import { FormEvent, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { api } from '../lib/api';
import { getIdentity, upsertIdentity } from '../lib/identity';

export function JoinRoomPage() {
  const navigate = useNavigate();
  const { code: codeParam } = useParams();
  const existing = getIdentity();
  const [username, setUsername] = useState(existing?.username ?? '');
  const [code, setCode] = useState((codeParam ?? '').toUpperCase());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (code.length !== 8) {
      setError('Enter an 8-character room code.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const identity = upsertIdentity(username);
      const joined = await api.joinRoom(code, {
        username: identity.username,
        userId: identity.userId,
      });
      navigate(`/room/${joined.room.code}`);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to join room.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="home-page">
      <div className="home-container">
        <div className="home-header">
          <h1>Join Existing Party</h1>
          <p className="subtitle">Enter the room code and the name others will see.</p>
        </div>
        <form className="form-card" onSubmit={submit}>
          <label className="label" htmlFor="join-username">
            Your name
          </label>
          <input
            id="join-username"
            className="input"
            value={username}
            maxLength={32}
            onChange={(event) => setUsername(event.target.value)}
            required
          />

          <label className="label" htmlFor="join-code">
            Room code
          </label>
          <input
            id="join-code"
            className="input monospace"
            value={code}
            maxLength={8}
            onChange={(event) => setCode(event.target.value.toUpperCase())}
            required
          />

          {error && <div className="error-message">{error}</div>}

          <button className="btn btn-primary btn-large" type="submit" disabled={loading || !username.trim() || code.length !== 8}>
            {loading ? 'Joining...' : 'Join Room'}
            <ArrowRight size={20} />
          </button>
          <button className="btn btn-text" type="button" onClick={() => navigate('/')}>
            <ArrowLeft size={16} /> Back
          </button>
        </form>
      </div>
    </main>
  );
}
