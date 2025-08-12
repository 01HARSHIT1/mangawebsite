const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');
const FormData = require('form-data');
const puppeteer = require('puppeteer');

async function uploadManga() {
  const imagePath = path.join(__dirname, 'public', 'uploads', 'cover_1754564877937_133885044432222875.jpg');
  const pdfPath = path.join(__dirname, 'public', 'uploads', 'clu107u346af1us4pk05n2cyb.pdf');
  if (!fs.existsSync(imagePath) || !fs.existsSync(pdfPath)) {
    throw new Error('Test image or PDF not found.');
  }
  const form = new FormData();
  form.append('title', 'Image Test Manga');
  form.append('description', 'Testing image appearance');
  form.append('genre', 'Test');
  form.append('chapterNumber', '1');
  form.append('tags', 'test,image');
  form.append('status', 'Ongoing');
  form.append('coverImage', fs.createReadStream(imagePath));
  form.append('pdfFile', fs.createReadStream(pdfPath));
  const res = await fetch('http://localhost:3000/api/manga', { method: 'POST', body: form });
  const data = await res.json();
  if (res.ok && data.manga && data.manga.coverImage) {
    return { mangaId: data.manga._id, coverImageUrl: data.manga.coverImage };
  } else {
    throw new Error('Manga upload failed: ' + JSON.stringify(data));
  }
}

(async () => {
  console.log('🧪 Puppeteer Test: Manga Image on Series Page');
  let browser;
  try {
    // 1. Upload manga
    const { mangaId, coverImageUrl } = await uploadManga();
    console.log('   ✓ Manga uploaded, cover image URL:', coverImageUrl);

    // 2. Launch Puppeteer
    browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.goto('http://localhost:3000/series', { waitUntil: 'networkidle0' });

    // 3. Wait for images to load
    await page.waitForSelector('img');
    // 4. Get all image srcs
    const imageSrcs = await page.$$eval('img', imgs => imgs.map(img => img.getAttribute('src')));
    console.log('   Found image srcs on series page:', imageSrcs);
    // 5. Check for the uploaded cover image
    const found = imageSrcs.some(src => src && src.includes(coverImageUrl));
    if (found) {
      console.log('\n✅ PASS: Uploaded cover image appears on the series page!');
    } else {
      console.log('\n❌ FAIL: Uploaded cover image NOT found on the series page.');
    }
    await browser.close();
  } catch (err) {
    if (browser) await browser.close();
    console.error('❌ Test failed:', err.message);
  }
})();


