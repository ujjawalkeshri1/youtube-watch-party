import { useEffect } from 'react';
import { ArrowRight, Clapperboard, Link2, MessageCircle, PlayCircle, Sparkles, Users } from 'lucide-react';
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
      <div className="cinema-background" aria-hidden="true">
        <div className="film-orbit orbit-a"><span>NOW PLAYING</span><b>▶</b></div>
        <div className="film-orbit orbit-b"><span>WATCH TOGETHER</span><b>✦</b></div>
        <div className="poster poster-a"><small>FRIDAY</small><strong>MOVIE<br />NIGHT</strong><i>01</i></div>
        <div className="poster poster-b"><small>ROOM</small><strong>SYNC<br />MODE</strong><i>02</i></div>
        <div className="poster poster-c"><small>GOOD VIBES</small><strong>PLAY<br />IT.</strong><i>03</i></div>
        <div className="film-strip strip-a" />
        <div className="film-strip strip-b" />
        <span className="spark spark-a">✦</span><span className="spark spark-b">✧</span><span className="spark spark-c">+</span>
      </div>

      <div className="home-container">
        <div className="home-kicker"><Sparkles size={13} /> THE INTERNET'S LIVING ROOM</div>

        <div className="home-header">
          <div className="brand-mark"><PlayCircle size={22} /><span>watch<span>party</span></span></div>
          <h1>Watch together.<br /><em>Stay in sync.</em></h1>
          <p className="subtitle">Movie nights, chaos, reactions and questionable opinions — all in one private room.</p>
        </div>

        <div className="home-content">
          <div className="form-card home-cta-card">
            {notice && <div className="error-message">{notice}</div>}
            <button className="btn btn-primary btn-large" onClick={() => navigate('/create')}>
              <Clapperboard size={18} /> Create a watch party <ArrowRight size={18} />
            </button>
            <div className="divider"><span>or pull up with an invite</span></div>
            <button className="btn btn-secondary btn-large join-screen-btn" onClick={() => navigate('/join')}>
              Join screen <ArrowRight size={18} />
            </button>
            <div className="cta-note"><span className="live-dot" /> No account. No downloads. Just press play.</div>
          </div>
        </div>

        <div className="home-features">
          <div><Users size={17} /><span><b>Friends</b> in the room</span></div>
          <div><Link2 size={17} /><span><b>One link</b> to invite</span></div>
          <div><MessageCircle size={17} /><span><b>Live chat</b> + reactions</span></div>
        </div>

        <div className="home-vibe-row">
          <span>SYNCED PLAYBACK</span><i /> <span>LIVE CHAT</span><i /> <span>GOOD VIBES ONLY</span>
        </div>
      </div>
    </main>
  );
}
