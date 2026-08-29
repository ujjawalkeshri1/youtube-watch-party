import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowRight, PlayCircle, Users, MessageCircle, Link2 } from 'lucide-react';

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
      <div className="home-container">
        <div className="home-header">
          <PlayCircle size={54} className="logo-icon" />
          <h1>Watch together.<br /><em>Stay in sync.</em></h1>
          <p className="subtitle">Create a private YouTube room, invite your friends, and enjoy every moment together in real time.</p>
        </div>

        <div className="home-content">
          <div className="form-card">
            {notice && <div className="error-message">{notice}</div>}
            <button className="btn btn-primary btn-large" onClick={() => navigate('/create')}>Create a watch party <ArrowRight size={19} /></button>
            <div className="divider"><span>or join with an invite</span></div>
            <button className="btn btn-secondary btn-large" onClick={() => navigate('/join')}>Join existing party</button>
          </div>
        </div>

        <div className="home-features">
          <div><Users size={18} /><span>Watch with friends</span></div>
          <div><Link2 size={18} /><span>One simple invite</span></div>
          <div><MessageCircle size={18} /><span>Live room chat</span></div>
        </div>
      </div>
    </main>
  );
}
