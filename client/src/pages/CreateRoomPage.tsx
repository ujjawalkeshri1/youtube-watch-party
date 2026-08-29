import { FormEvent, useState } from 'react';
import { ArrowLeft, ArrowRight, Link2, UserRound } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { getIdentity, upsertIdentity } from '../lib/identity';
import { parseYouTubeVideoId } from '../lib/youtube';

export function CreateRoomPage() {
  const navigate = useNavigate();
  const existing = getIdentity();
  const [username, setUsername] = useState(existing?.username ?? '');
  const [name, setName] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!parseYouTubeVideoId(videoUrl)) {
      setError('Please enter a valid YouTube video URL.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const identity = upsertIdentity(username);
      const created = await api.createRoom({ username: identity.username, userId: identity.userId, name: name.trim(), videoUrl: videoUrl.trim() });
      navigate(`/room/${created.room.code}`);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to create the room.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="auth-page">
      <div className="auth-shell">
        <button className="back-link" type="button" onClick={() => navigate('/')}><ArrowLeft size={17} /> Back to home</button>
        <div className="auth-brand">watch<span>party</span></div>
        <section className="auth-card">
          <div className="auth-card-heading">
            <div className="step-pill">NEW ROOM</div>
            <h1>Create your watch party</h1>
            <p>Set up a room, add a YouTube video, and invite your friends.</p>
          </div>
          <form onSubmit={submit}>
            <div className="field-group">
              <label htmlFor="create-username">Your name</label>
              <div className="field-with-icon"><UserRound size={18} /><input id="create-username" value={username} maxLength={32} onChange={(event) => setUsername(event.target.value)} placeholder="How should friends see you?" required /></div>
            </div>
            <div className="field-group">
              <label htmlFor="party-name">Party name</label>
              <input id="party-name" value={name} maxLength={80} onChange={(event) => setName(event.target.value)} placeholder="Friday Movie Night" required />
            </div>
            <div className="field-group">
              <label htmlFor="video-url">YouTube video</label>
              <div className="field-with-icon"><Link2 size={18} /><input id="video-url" value={videoUrl} onChange={(event) => setVideoUrl(event.target.value)} placeholder="Paste a YouTube link" required /></div>
              <span className="field-hint">You can change the video later as host.</span>
            </div>
            {error && <div className="form-error">{error}</div>}
            <button className="primary-action" type="submit" disabled={loading || !username.trim() || !name.trim() || !videoUrl.trim()}>{loading ? 'Creating room…' : 'Create watch party'}<ArrowRight size={19} /></button>
          </form>
        </section>
        <p className="auth-footnote">No account required · Share the room link with your friends</p>
      </div>
    </main>
  );
}
