import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { parseYouTubeVideoId } from '../src/utils/youtube.ts';

describe('parseYouTubeVideoId', () => {
  const id = 'dQw4w9WgXcQ';

  it('accepts a raw video id', () => {
    assert.equal(parseYouTubeVideoId(id), id);
  });

  it('parses watch, short, embed, live, and youtu.be URLs', () => {
    assert.equal(parseYouTubeVideoId(`https://www.youtube.com/watch?v=${id}&t=12s`), id);
    assert.equal(parseYouTubeVideoId(`https://youtu.be/${id}`), id);
    assert.equal(parseYouTubeVideoId(`https://www.youtube.com/shorts/${id}`), id);
    assert.equal(parseYouTubeVideoId(`https://www.youtube.com/embed/${id}`), id);
    assert.equal(parseYouTubeVideoId(`https://www.youtube.com/live/${id}`), id);
    assert.equal(parseYouTubeVideoId(`youtube.com/watch?v=${id}`), id);
  });

  it('rejects invalid input', () => {
    assert.equal(parseYouTubeVideoId(''), null);
    assert.equal(parseYouTubeVideoId('https://example.com/watch?v=abc'), null);
    assert.equal(parseYouTubeVideoId('not a url'), null);
  });
});
