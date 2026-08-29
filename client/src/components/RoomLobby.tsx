import { ArrowRight, PlayCircle } from 'lucide-react';
import { useState } from 'react';

interface RoomLobbyProps {
  loading: boolean;
  error: string;
  onCreate: (username: string) => void;
  onJoin: (username: string, code: string) => void;
}

export function RoomLobby({ loading, error, onCreate, onJoin }: RoomLobbyProps) {
  const [username, setUsername] = useState('');
  const [code, setCode] = useState('');
  const [showJoin, setShowJoin] = useState(false);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (username.trim()) {
      onCreate(username);
    }
  };

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (username.trim() && code.length === 8) {
      onJoin(username, code);
    }
  };

  return (
    <main className="lobby">
      <div className="lobby-container">
        <div className="lobby-header">
          <PlayCircle size={48} className="logo-icon" />
          <h1>
            Watch together.
            <br />
            <em>Stay connected.</em>
          </h1>
          <p className="subtitle">
            Synchronized YouTube streaming with friends and family, wherever they are.
          </p>
        </div>

        <div className="lobby-forms">
          <div className="form-section">
            <label htmlFor="username" className="label">
              Your name
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g. Alex"
              maxLength={32}
              className="input"
              autoFocus
            />

            {!showJoin ? (
              <>
                <button
                  onClick={handleCreate}
                  disabled={!username.trim() || loading}
                  className="btn btn-primary"
                >
                  {loading ? 'Creating room...' : 'Create a watch party'}
                  <ArrowRight size={18} />
                </button>

                <div className="divider">
                  <span>or</span>
                </div>

                <button
                  onClick={() => setShowJoin(true)}
                  className="btn btn-secondary"
                >
                  Join an existing party
                </button>
              </>
            ) : (
              <>
                <label htmlFor="code" className="label">
                  Room code
                </label>
                <input
                  id="code"
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="e.g. ABC12345"
                  maxLength={8}
                  className="input monospace"
                />

                <button
                  onClick={handleJoin}
                  disabled={!username.trim() || code.length !== 8 || loading}
                  className="btn btn-primary"
                >
                  {loading ? 'Joining...' : 'Join party'}
                  <ArrowRight size={18} />
                </button>

                <button
                  onClick={() => setShowJoin(false)}
                  className="btn btn-text"
                >
                  Back
                </button>
              </>
            )}

            {error && <div className="error-message">{error}</div>}
          </div>

          <div className="features">
            <div className="feature">
              <div className="feature-icon">▶</div>
              <div>
                <h3>Synchronized playback</h3>
                <p>Everyone watches at the same time, perfectly in sync</p>
              </div>
            </div>
            <div className="feature">
              <div className="feature-icon">👥</div>
              <div>
                <h3>Manage participants</h3>
                <p>Host controls permissions and participant roles</p>
              </div>
            </div>
            <div className="feature">
              <div className="feature-icon">💬</div>
              <div>
                <h3>Room chat</h3>
                <p>React and discuss in real-time with everyone watching</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
