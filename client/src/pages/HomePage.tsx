import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { ArrowRight, PlayCircle } from 'lucide-react';
import { api } from '../lib/api';
import { createIdentity, saveIdentity, type Identity } from '../lib/identity';

export function HomePage() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showJoin, setShowJoin] = useState(false);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) return;

    setLoading(true);
    setError('');

    try {
      const identity = createIdentity(username);
      saveIdentity(identity);
      const room = await api.createRoom({ username: identity.username, userId: identity.userId });
      navigate(`/room/${room.code}`, { state: { identity } });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create room');
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || code.length !== 8) return;

    setLoading(true);
    setError('');

    try {
      const identity = createIdentity(username);
      saveIdentity(identity);
      const room = await api.joinRoom(code, { username: identity.username, userId: identity.userId });
      navigate(`/room/${room.code}`, { state: { identity } });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to join room');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="home-page">
      <div className="home-container">
        <div className="home-header">
          <PlayCircle size={56} className="logo-icon" />
          <h1>
            Watch together.
            <br />
            <em>Stay synchronized.</em>
          </h1>
          <p className="subtitle">
            Stream YouTube videos in perfect sync with friends, family, and colleagues—no matter where they are.
          </p>
        </div>

        <div className="home-content">
          <div className="form-card">
            <label htmlFor="username-input" className="label">
              Your name
            </label>
            <input
              id="username-input"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g. Alex"
              maxLength={32}
              className="input"
              autoFocus
              disabled={loading}
            />

            {!showJoin ? (
              <>
                <button
                  onClick={handleCreate}
                  disabled={!username.trim() || loading}
                  className="btn btn-primary btn-large"
                >
                  {loading ? 'Creating...' : 'Create a watch party'}
                  <ArrowRight size={20} />
                </button>

                <div className="divider">
                  <span>Already have a code?</span>
                </div>

                <button
                  onClick={() => setShowJoin(true)}
                  className="btn btn-secondary btn-large"
                  disabled={loading}
                >
                  Join existing party
                </button>
              </>
            ) : (
              <>
                <label htmlFor="code-input" className="label">
                  Room code
                </label>
                <input
                  id="code-input"
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="e.g. ABC12345"
                  maxLength={8}
                  className="input monospace"
                  disabled={loading}
                />

                <button
                  onClick={handleJoin}
                  disabled={!username.trim() || code.length !== 8 || loading}
                  className="btn btn-primary btn-large"
                >
                  {loading ? 'Joining...' : 'Join party'}
                  <ArrowRight size={20} />
                </button>

                <button
                  onClick={() => setShowJoin(false)}
                  className="btn btn-text"
                  disabled={loading}
                >
                  Back to create
                </button>
              </>
            )}

            {error && <div className="error-message">{error}</div>}
          </div>

          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">▶</div>
              <h3>Perfectly synchronized</h3>
              <p>Everyone watches at the exact same moment. Host and moderators control playback.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">👥</div>
              <h3>Manage your room</h3>
              <p>Assign roles, remove participants, and maintain full control as the host.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">💬</div>
              <h3>Live chat</h3>
              <p>React and discuss in real-time while everyone watches together.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🎬</div>
              <h3>YouTube videos</h3>
              <p>Queue any YouTube video. Host can change videos instantly for everyone.</p>
            </div>
          </div>
        </div>

        <footer className="home-footer">
          <p>Watch Party — Synchronized streaming for everyone</p>
        </footer>
      </div>
    </main>
  );
}
