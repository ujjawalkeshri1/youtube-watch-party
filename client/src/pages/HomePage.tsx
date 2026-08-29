import { useEffect } from 'react';
import { ArrowRight, Link2, MessageCircle, PlayCircle, Sparkles, Users } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';

export function HomePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const notice = searchParams.get('notice');
  const joinCode = searchParams.get('join');

  useEffect(() => {
    if (joinCode) navigate(`/join/${joinCode.toUpperCase()}`, { replace: true });
  }, [joinCode, navigate]);

  return (
    <main className="home-page">
      <div className="home-floaters" aria-hidden="true">
        <span className="floater f1">😂</span>
        <span className="floater f2">🍿</span>
        <span className="floater f3">🔥</span>
        <span className="floater f4">😭</span>
        <span className="floater f5">💀</span>
        <span className="floater f6">❤️</span>
        <span className="floater f7">🎬</span>
        <span className="floater f8">✨</span>
        <span className="cinema-chip c1">▶ MOVIE NIGHT</span>
        <span className="cinema-chip c2">LIVE • TOGETHER</span>
        <span className="cinema-chip c3">🎥 SYNC'D</span>
      </div>

      <div className="home-container">
        <div className="home-kicker"><Sparkles size={13} /> YOUR INTERNET LIVING ROOM</div>

        <div className="home-header">
          <PlayCircle size={54} className="logo-icon" />
          <h1>Watch together.<br /><em>Stay in sync.</em></h1>
          <p className="subtitle">Movie nights, chaos, reactions and questionable opinions — all in one private room.</p>
        </div>

        <div className="home-content">
          <div className="form-card home-cta-card">
            {notice && <div className="error-message">{notice}</div>}
            <button className="btn btn-primary btn-large" onClick={() => navigate('/create')}>
              Create a watch party <ArrowRight size={19} />
            </button>
            <div className="divider"><span>or pull up with an invite</span></div>
            <button className="btn btn-secondary btn-large join-screen-btn" onClick={() => navigate('/join')}>
              Join screen <ArrowRight size={18} />
            </button>
          </div>
        </div>

        <div className="home-features">
          <div><Users size={18} /><span>Watch with friends</span></div>
          <div><Link2 size={18} /><span>One tap invite</span></div>
          <div><MessageCircle size={18} /><span>Emoji-powered chat</span></div>
        </div>

        <div className="home-vibe-row">
          <span>🎬 sync'd playback</span><span>•</span><span>🔥 live reactions</span><span>•</span><span>🍿 zero awkward silence</span>
        </div>
      </div>
    </main>
  );
}
