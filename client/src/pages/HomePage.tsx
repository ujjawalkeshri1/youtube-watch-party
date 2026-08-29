import { FormEvent, useEffect, useState } from 'react';
import { ArrowRight, Link2, MessageCircle, PlayCircle, Sparkles, Users } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';

function getJoinCode(value: string) {
  const trimmed = value.trim();
  try {
    const url = new URL(trimmed);
    const match = url.pathname.match(/\/join\/([A-Za-z0-9]{8})/i);
    if (match) return match[1].toUpperCase();
  } catch {
    // Plain room code input.
  }
  return trimmed.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8);
}

export function HomePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const notice = searchParams.get('notice');
  const joinCode = searchParams.get('join');
  const [quickJoin, setQuickJoin] = useState('');
  const [joinError, setJoinError] = useState('');

  useEffect(() => {
    if (joinCode) navigate(`/join/${joinCode.toUpperCase()}`, { replace: true });
  }, [joinCode, navigate]);

  const quickJoinRoom = (event: FormEvent) => {
    event.preventDefault();
    const code = getJoinCode(quickJoin);
    if (code.length !== 8) {
      setJoinError('Drop an 8-character room code or invite link.');
      return;
    }
    navigate(`/join/${code}`);
  };

  return (
    <main className="home-page">
      <div className="home-container">
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, marginBottom: 20, padding: '7px 12px', border: '1px solid rgba(255,51,71,.25)', borderRadius: 999, background: 'rgba(255,51,71,.07)', color: '#ff8994', fontSize: 11, fontWeight: 700, letterSpacing: '.08em' }}>
          <Sparkles size={13} /> YOUR INTERNET LIVING ROOM
        </div>
        <div className="home-header">
          <PlayCircle size={54} className="logo-icon" />
          <h1>Watch together.<br /><em>Stay in sync.</em></h1>
          <p className="subtitle">Movie nights, chaos, reactions and questionable opinions — all in one private room.</p>
        </div>

        <div className="home-content">
          <div className="form-card" style={{ boxShadow: '0 30px 100px rgba(255,51,71,.13)' }}>
            {notice && <div className="error-message">{notice}</div>}
            <button className="btn btn-primary btn-large" onClick={() => navigate('/create')}>Create a watch party <ArrowRight size={19} /></button>

            <div className="divider"><span>or pull up with an invite</span></div>

            <form onSubmit={quickJoinRoom} style={{ display: 'flex', gap: 9 }}>
              <input
                value={quickJoin}
                onChange={(event) => { setQuickJoin(event.target.value); setJoinError(''); }}
                placeholder="Room code / invite link"
                maxLength={180}
                aria-label="Room code or invite link"
                style={{ flex: 1, minWidth: 0, height: 54, padding: '0 15px', border: '1px solid #29292f', background: '#0d0d10', borderRadius: 12, fontSize: 13 }}
              />
              <button className="btn btn-secondary" type="submit" style={{ width: 54, minWidth: 54 }} title="Join room" aria-label="Join room">
                <ArrowRight size={19} />
              </button>
            </form>
            {joinError && <div style={{ marginTop: 8, color: '#ff8994', fontSize: 11, textAlign: 'left' }}>{joinError}</div>}

            <button className="btn btn-secondary btn-large" onClick={() => navigate('/join')} style={{ marginTop: 10 }}>Open join screen</button>
          </div>
        </div>

        <div className="home-features">
          <div><Users size={18} /><span>Watch with friends</span></div>
          <div><Link2 size={18} /><span>One tap invite</span></div>
          <div><MessageCircle size={18} /><span>Emoji-powered chat</span></div>
        </div>

        <div style={{ marginTop: 28, display: 'flex', justifyContent: 'center', gap: 10, flexWrap: 'wrap', color: '#5f5f69', fontSize: 11 }}>
          <span>🎬 sync'd playback</span><span>•</span><span>🔥 live reactions</span><span>•</span><span>🍿 zero awkward silence</span>
        </div>
      </div>
    </main>
  );
}
