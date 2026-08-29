import { FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight } from 'lucide-react';
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
      setError('Invalid YouTube URL.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const identity = upsertIdentity(username);
      const created = await api.createRoom({
        username: identity.username,
        userId: identity.userId,
        name: name.trim(),
        videoUrl: videoUrl.trim(),
      });
      navigate(`/room/${created.room.code}`);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to create room.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="home-page">
      <div className="home-container">
        <div className="home-header">
          <h1>Create Watch Party</h1>
          <p className="subtitle">Name the party and paste the YouTube video everyone will watch.</p>
        </div>
        <form className="form-card" onSubmit={submit}>
          <label className="label" htmlFor="create-username">
            Your name
          </label>
          <input
            id="create-username"
            className="input"
            value={username}
            maxLength={32}
            onChange={(event) => setUsername(event.target.value)}
            required
          />

          <label className="label" htmlFor="party-name">
            Party name
          </label>
          <input
            id="party-name"
            className="input"
            value={name}
            maxLength={80}
            placeholder="My Friday Watch Party"
            onChange={(event) => setName(event.target.value)}
            required
          />

          <label className="label" htmlFor="video-url">
            YouTube video
          </label>
          <input
            id="video-url"
            className="input"
            value={videoUrl}
            placeholder="https://www.youtube.com/watch?v=..."
            onChange={(event) => setVideoUrl(event.target.value)}
            required
          />

          {error && <div className="error-message">{error}</div>}

          <button className="btn btn-primary btn-large" type="submit" disabled={loading || !username.trim() || !name.trim() || !videoUrl.trim()}>
            {loading ? 'Creating...' : 'Create Watch Party'}
            <ArrowRight size={20} />
          </button>
          <button className="btn btn-text" type="button" onClick={() => navigate('/')}>
            <ArrowLeft size={16} /> Back
          </button>
        </form>
      </div>
    </main>
  );
}
