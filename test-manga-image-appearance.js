const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');
const FormData = require('form-data');

async function testMangaImageAppearance() {
    console.log('🧪 TEST: Manga Image Appearance');
    let allPassed = true;
    const imagePath = path.join(__dirname, 'public', 'uploads', 'cover_1754564877937_133885044432222875.jpg');
    const pdfPath = path.join(__dirname, 'public', 'uploads', 'clu107u346af1us4pk05n2cyb.pdf');
    if (!fs.existsSync(imagePath) || !fs.existsSync(pdfPath)) {
        console.log('❌ Test image or PDF not found.');
        return;
    }
    // 1. Upload manga
    const form = new FormData();
    form.append('title', 'Image Test Manga');
    form.append('description', 'Testing image appearance');
    form.append('genre', 'Test');
    form.append('chapterNumber', '1');
    form.append('tags', 'test,image');
    form.append('status', 'Ongoing');
    form.append('coverImage', fs.createReadStream(imagePath));
    form.append('pdfFile', fs.createReadStream(pdfPath));
    let mangaId = null;
    let coverImageUrl = null;
    try {
        const res = await fetch('http://localhost:3000/api/manga', { method: 'POST', body: form });
        const data = await res.json();
        if (res.ok && data.manga && data.manga.coverImage) {
            mangaId = data.manga._id;
            coverImageUrl = data.manga.coverImage;
            console.log('   ✓ Manga uploaded, cover image URL:', coverImageUrl);
        } else {
            console.log('❌ Manga upload failed:', data);
            allPassed = false;
        }
    } catch (err) {
        console.log('❌ Manga upload error:', err.message);
        allPassed = false;
    }
    if (!mangaId || !coverImageUrl) return;
    // 2. Check series pages (all pages)
    let foundOnPage = null;
    try {
        // First, get total pages from API
        const apiRes = await fetch('http://localhost:3000/api/manga?limit=16&page=1');
        const apiData = await apiRes.json();
        const totalPages = apiData.pagination?.totalPages || 1;
        for (let page = 1; page <= totalPages; page++) {
            const seriesRes = await fetch(`http://localhost:3000/series?page=${page}`);
            const html = await seriesRes.text();
            // Print all cover image URLs found on this page
            const regex = /<img[^>]+src=["']([^"'>]+)["']/g;
            let match;
            const urls = [];
            while ((match = regex.exec(html)) !== null) {
                urls.push(match[1]);
            }
            console.log(`-- Series page ${page} found cover image URLs:`, urls);
            if (html.includes(coverImageUrl)) {
                foundOnPage = page;
                break;
            }
        }
        if (foundOnPage) {
            console.log(`   ✓ Cover image appears in series page HTML (page ${foundOnPage})`);
        } else {
            console.log('❌ Cover image NOT found in any series page HTML');
            allPassed = false;
        }
    } catch (err) {
        console.log('❌ Error fetching series pages:', err.message);
        allPassed = false;
    }
    // 3. Check manga detail page
    try {
        const detailRes = await fetch(`http://localhost:3000/manga/${mangaId}`);
        const html = await detailRes.text();
        if (html.includes(coverImageUrl)) {
            console.log('   ✓ Cover image appears in manga detail page HTML');
        } else {
            console.log('❌ Cover image NOT found in manga detail page HTML');
            allPassed = false;
        }
    } catch (err) {
        console.log('❌ Error fetching manga detail page:', err.message);
        allPassed = false;
    }
    // 4. Check image URL directly
    try {
        const imgRes = await fetch(`http://localhost:3000${coverImageUrl}`);
        if (imgRes.status === 200 && imgRes.headers.get('content-type').startsWith('image/')) {
            console.log('   ✓ Cover image URL is accessible and returns image/*');
        } else {
            console.log('❌ Cover image URL not accessible or not image/*:', imgRes.status, imgRes.headers.get('content-type'));
            allPassed = false;
        }
    } catch (err) {
        console.log('❌ Error fetching cover image URL:', err.message);
        allPassed = false;
    }
    // Final result
    if (allPassed) {
        console.log('\n✅ ALL IMAGE APPEARANCE TESTS PASSED!');
    } else {
        console.log('\n❌ SOME IMAGE APPEARANCE TESTS FAILED.');
    }
}

testMangaImageAppearance();
