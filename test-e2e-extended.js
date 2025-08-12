const fetch = require('node-fetch');

const BASE = process.env.BASE_URL || 'http://localhost:3000';

async function get(path) {
  const res = await fetch(BASE + path);
  let body = null;
  try { body = await res.json(); } catch {}
  return { path, status: res.status, ok: res.ok, body };
}

async function postJson(path, data) {
  const res = await fetch(BASE + path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  let body = null;
  try { body = await res.json(); } catch {}
  return { path, status: res.status, ok: res.ok, body };
}

async function run() {
  const results = [];
  try {
    console.log('Running Extended E2E against:', BASE);

    // Pages
    for (const p of ['/', '/series', '/login', '/upload?type=manga', '/coins/success?amount=100', '/sitemap.xml', '/robots.txt']) {
      const r = await fetch(BASE + p);
      results.push({ path: p, status: r.status, ok: r.status === 200 });
    }

    // APIs (read-only)
    const apiProbes = [
      '/api/manga',
      '/api/manga/search?q=test',
      '/api/manga/suggestions?q=te',
      '/api/manga/recommendations/trending',
    ];
    for (const p of apiProbes) {
      const r = await fetch(BASE + p);
      results.push({ path: p, status: r.status, ok: r.status === 200 });
    }

    // Create manga via JSON
    const create = await postJson('/api/manga', {
      title: 'E2E Extended ' + Date.now(),
      description: 'E2E extended test',
      genre: 'Test',
      chapterNumber: '1',
      tags: 'e2e,extended',
      status: 'Ongoing'
    });
    const createdId = create.body && create.body.manga && create.body.manga._id;
    results.push({ path: '/api/manga [POST]', status: create.status, ok: create.status === 200 && !!createdId, id: createdId });

    // List again and verify created in list
    const list = await get('/api/manga');
    const found = list.body && list.body.manga && createdId && list.body.manga.some(m => m._id === createdId);
    results.push({ path: '/api/manga [GET-after-create]', status: list.status, ok: list.status === 200 && !!found });

    // Manga detail page should render
    if (createdId) {
      const detail = await fetch(BASE + `/manga/${createdId}`);
      results.push({ path: `/manga/${createdId}`, status: detail.status, ok: detail.status === 200 });

      // Chapters list for this manga (may be empty but should be 200)
      const chList = await fetch(BASE + `/api/chapters?mangaId=${createdId}`);
      results.push({ path: `/api/chapters?mangaId=${createdId}`, status: chList.status, ok: chList.status === 200 });
    }

    console.log('E2E EXTENDED SUMMARY');
    for (const r of results) {
      console.log(`${r.ok ? '✓' : '✗'} ${r.path} -> ${r.status}${r.id ? ' id=' + r.id : ''}`);
    }
    const allOk = results.every(r => r.ok);
    process.exit(allOk ? 0 : 1);
  } catch (e) {
    console.error('Extended E2E failed:', e);
    process.exit(1);
  }
}

run();