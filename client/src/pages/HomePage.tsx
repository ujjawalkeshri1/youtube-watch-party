import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowRight, PlayCircle } from 'lucide-react';

export function HomePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const notice = searchParams.get('notice');
  const joinCode = searchParams.get('join');

  useEffect(() => {
    if (joinCode) {
      navigate(`/join/${joinCode.toUpperCase()}`, { replace: true });
    }
  }, [joinCode, navigate]);

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
            Stream YouTube videos in sync with friends. Create a party, share the code, and watch together.
          </p>
        </div>

        <div className="home-content">
          <div className="form-card">
            {notice && <div className="error-message">{notice}</div>}

            <button className="btn btn-primary btn-large" onClick={() => navigate('/create')}>
              Create a watch party
              <ArrowRight size={20} />
            </button>

            <div className="divider">
              <span>Already have a code?</span>
            </div>

            <button className="btn btn-secondary btn-large" onClick={() => navigate('/join')}>
              Join existing party
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
