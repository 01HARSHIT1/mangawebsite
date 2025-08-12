const fetch = require('node-fetch');

const BASE = process.env.BASE_URL || 'http://localhost:3002';

async function expectStatus(path, expected = 200) {
  const res = await fetch(BASE + path);
  const ok = res.status === expected;
  return { path, status: res.status, ok };
}

async function run() {
  const results = [];
  try {
    // Basic pages
    results.push(await expectStatus('/'));
    results.push(await expectStatus('/series'));
    results.push(await expectStatus('/login'));
    results.push(await expectStatus('/upload?type=manga'));
    results.push(await expectStatus('/coins/success?amount=100'));
    results.push(await expectStatus('/sitemap.xml'));
    results.push(await expectStatus('/robots.txt'));

    // API list
    let res = await fetch(BASE + '/api/manga');
    const listStatus = res.status;
    const initial = listStatus === 200 ? await res.json() : null;
    results.push({ path: '/api/manga [GET]', status: listStatus, ok: listStatus === 200 });

    // Create manga via JSON
    const payload = {
      title: 'E2E Test Manga ' + Date.now(),
      description: 'E2E test description',
      genre: 'Test',
      chapterNumber: '1',
      tags: 'e2e,test',
      status: 'Ongoing'
    };
    res = await fetch(BASE + '/api/manga', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const createStatus = res.status;
    let created = null;
    try { created = await res.json(); } catch {}
    const createdId = created && created.manga && created.manga._id ? created.manga._id : null;
    results.push({ path: '/api/manga [POST]', status: createStatus, ok: createStatus === 200 && !!createdId, id: createdId });

    // Verify list includes new manga
    res = await fetch(BASE + '/api/manga');
    const list2Status = res.status;
    let list2 = null;
    try { list2 = await res.json(); } catch {}
    const found = list2 && list2.manga && createdId && list2.manga.some(m => m._id === createdId);
    results.push({ path: '/api/manga [GET-after-create]', status: list2Status, ok: list2Status === 200 && found });

    // Fetch manga detail page
    if (createdId) {
      const detail = await fetch(BASE + `/manga/${createdId}`);
      results.push({ path: `/manga/${createdId}`, status: detail.status, ok: detail.status === 200 });
    }

    // Output summary
    const allOk = results.every(r => r.ok);
    console.log('E2E SUMMARY');
    for (const r of results) {
      console.log(`${r.ok ? '✓' : '✗'} ${r.path} -> ${r.status}${r.id ? ' id=' + r.id : ''}`);
    }
    process.exit(allOk ? 0 : 1);
  } catch (e) {
    console.error('E2E test failed:', e);
    process.exit(1);
  }
}

run();