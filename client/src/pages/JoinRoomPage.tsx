import { FormEvent, useEffect, useState } from 'react';
import { ArrowLeft, ArrowRight, Clipboard, KeyRound, UserRound, Sparkles } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../lib/api';
import { getIdentity, upsertIdentity } from '../lib/identity';

function normalizeRoomCode(value: string) {
  const trimmed = value.trim();
  try {
    const url = new URL(trimmed);
    const match = url.pathname.match(/\/join\/([A-Za-z0-9]{8})/i);
    if (match) return match[1].toUpperCase();
  } catch {
    // Treat non-URL input as a room code.
  }
  const match = trimmed.match(/(?:^|\s)([A-Za-z0-9]{8})(?:\s|$)/);
  return (match?.[1] ?? trimmed).toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8);
}

export function JoinRoomPage() {
  const navigate = useNavigate();
  const { code: codeParam } = useParams();
  const existing = getIdentity();
  const [username, setUsername] = useState(existing?.username ?? '');
  const [code, setCode] = useState(normalizeRoomCode(codeParam ?? ''));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [pasted, setPasted] = useState(false);

  useEffect(() => { if (codeParam) setCode(normalizeRoomCode(codeParam)); }, [codeParam]);
  const handleCodeChange = (value: string) => { setPasted(false); setCode(normalizeRoomCode(value)); setError(''); };
  const pasteInvite = async () => {
    try {
      const text = await navigator.clipboard.readText();
      const nextCode = normalizeRoomCode(text);
      setCode(nextCode); setPasted(true);
      setError(nextCode.length === 8 ? '' : 'That does not look like a valid watch party invite.');
      window.setTimeout(() => setPasted(false), 1600);
    } catch { setError('Clipboard access was blocked. Paste the invite into the room code field.'); }
  };
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const cleanCode = normalizeRoomCode(code);
    if (cleanCode.length !== 8) { setError('Enter an 8-character room code or paste the full invite link.'); return; }
    if (!username.trim()) { setError('Add a display name so your friends know it is you.'); return; }
    setLoading(true); setError('');
    try {
      const identity = upsertIdentity(username);
      const joined = await api.joinRoom(cleanCode, { username: identity.username, userId: identity.userId });
      navigate(`/room/${joined.room.code}`);
    } catch (caught) { setError(caught instanceof Error ? caught.message : 'Could not join that room. Check the invite and try again.'); }
    finally { setLoading(false); }
  };

  return (
    <main className="auth-page">
      <div className="auth-shell">
        <button className="back-link" type="button" onClick={() => navigate('/')}><ArrowLeft size={17} /> Back to home</button>
        <div className="auth-brand">watch<span>party</span></div>
        <section className="auth-card">
          <div className="auth-card-heading">
            <div className="step-pill"><Sparkles size={11} style={{ marginRight: 5 }} /> JOIN THE VIBE</div>
            <h1>Pull up to the party.</h1>
            <p>Drop the room code or paste the invite your friend sent. No account, no drama.</p>
          </div>
          <form onSubmit={submit}>
            <div className="field-group">
              <label htmlFor="join-username">Your display name</label>
              <div className="field-with-icon"><UserRound size={18} /><input id="join-username" value={username} maxLength={32} onChange={(event) => { setUsername(event.target.value); setError(''); }} placeholder="How should friends see you?" required /></div>
            </div>
            <div className="field-group">
              <label htmlFor="join-code">Room code or invite link</label>
              <div className="field-with-icon">
                <KeyRound size={18} />
                <input id="join-code" className="room-code-input" value={code} maxLength={180} onChange={(event) => handleCodeChange(event.target.value)} placeholder="7532008E or paste invite link" required />
                <button type="button" onClick={pasteInvite} title="Paste invite" aria-label="Paste invite" style={{ color: pasted ? '#34d399' : '#8e8e98', display: 'grid', placeItems: 'center' }}><Clipboard size={17} /></button>
              </div>
              <span className="field-hint">Paste either <strong>7532008E</strong> or the full <strong>/join/</strong> link.</span>
            </div>
            {error && <div className="form-error">{error}</div>}
            <button className="primary-action" type="submit" disabled={loading || !username.trim() || code.length !== 8}>{loading ? 'Joining…' : 'Join the party'}<ArrowRight size={19} /></button>
          </form>
          <div className="join-capabilities"><span>SYNCED PLAYBACK</span><i /> <span>LIVE CHAT</span><i /> <span>FULLSCREEN</span></div>
        </section>
        <p className="auth-footnote">Your display name is saved locally · You can change it anytime</p>
      </div>
    </main>
  );
}
