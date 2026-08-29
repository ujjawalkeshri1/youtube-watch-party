import { FormEvent, useState } from 'react';
import { ArrowLeft, ArrowRight, KeyRound, UserRound } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
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
    if (code.length !== 8) { setError('Enter the 8-character room code.'); return; }
    setLoading(true); setError('');
    try {
      const identity = upsertIdentity(username);
      const joined = await api.joinRoom(code, { username: identity.username, userId: identity.userId });
      navigate(`/room/${joined.room.code}`);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to join the room.');
    } finally { setLoading(false); }
  };

  return (
    <main className="auth-page">
      <div className="auth-shell">
        <button className="back-link" type="button" onClick={() => navigate('/')}><ArrowLeft size={17} /> Back to home</button>
        <div className="auth-brand">watch<span>party</span></div>
        <section className="auth-card">
          <div className="auth-card-heading">
            <div className="step-pill">JOIN ROOM</div>
            <h1>Join a watch party</h1>
            <p>Enter the invite code your friend shared with you.</p>
          </div>
          <form onSubmit={submit}>
            <div className="field-group">
              <label htmlFor="join-username">Your name</label>
              <div className="field-with-icon"><UserRound size={18} /><input id="join-username" value={username} maxLength={32} onChange={(event) => setUsername(event.target.value)} placeholder="How should friends see you?" required /></div>
            </div>
            <div className="field-group">
              <label htmlFor="join-code">Room code</label>
              <div className="field-with-icon"><KeyRound size={18} /><input id="join-code" className="room-code-input" value={code} maxLength={8} onChange={(event) => setCode(event.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))} placeholder="ABC12345" required /></div>
              <span className="field-hint">The code is 8 characters long.</span>
            </div>
            {error && <div className="form-error">{error}</div>}
            <button className="primary-action" type="submit" disabled={loading || !username.trim() || code.length !== 8}>{loading ? 'Joining room…' : 'Join watch party'}<ArrowRight size={19} /></button>
          </form>
        </section>
        <p className="auth-footnote">No account required · Your display name can be changed anytime</p>
      </div>
    </main>
  );
}
