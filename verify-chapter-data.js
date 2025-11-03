/**
 * Script to verify Chapter 2 data structure in MongoDB
 * Run: node verify-chapter-data.js
 */

const { MongoClient, ObjectId } = require('mongodb');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://harshit:12345678h@cluster0.k6lii.mongodb.net/mangawebsite?retryWrites=true&w=majority';

async function verifyChapterData() {
    const client = new MongoClient(MONGODB_URI);
    
    try {
        await client.connect();
        console.log('✅ Connected to MongoDB');
        
        const db = client.db();
        
        // Get the most recently created chapter (should be Chapter 2)
        const latestChapter = await db.collection('chapters')
            .find()
            .sort({ createdAt: -1 })
            .limit(1)
            .toArray();
        
        if (latestChapter.length === 0) {
            console.log('❌ No chapters found in database');
            return;
        }
        
        const chapter = latestChapter[0];
        
        console.log('\n📊 LATEST CHAPTER DATA:');
        console.log('========================');
        console.log('Chapter ID:', chapter._id.toString());
        console.log('Manga ID:', chapter.mangaId);
        console.log('Chapter Number:', chapter.chapterNumber);
        console.log('Title:', chapter.title);
        console.log('Subtitle:', chapter.subtitle || 'N/A');
        console.log('Created At:', chapter.createdAt);
        
        console.log('\n📄 PDF FIELDS:');
        console.log('==============');
        console.log('pdfUrl:', chapter.pdfUrl || 'NOT SET');
        console.log('pdfPublicId:', chapter.pdfPublicId || 'NOT SET');
        
        console.log('\n📖 PAGES ARRAY:');
        console.log('===============');
        console.log('Pages count:', chapter.pages?.length || 0);
        
        if (chapter.pages && chapter.pages.length > 0) {
            console.log('\nFirst page structure:');
            console.log(JSON.stringify(chapter.pages[0], null, 2));
        } else {
            console.log('⚠️  No pages array or empty pages array');
        }
        
        console.log('\n🔍 DIAGNOSTIC:');
        console.log('==============');
        
        // Check what the ChapterReader will see
        const hasPdfUrl = chapter.pdfUrl && typeof chapter.pdfUrl === 'string' && chapter.pdfUrl.length > 0;
        const hasPages = chapter.pages && Array.isArray(chapter.pages) && chapter.pages.length > 0;
        const firstPageIsPdf = hasPages && (
            (typeof chapter.pages[0] === 'string' && chapter.pages[0].toLowerCase().endsWith('.pdf')) ||
            (chapter.pages[0]?.imagePath && typeof chapter.pages[0].imagePath === 'string' && chapter.pages[0].imagePath.toLowerCase().endsWith('.pdf'))
        );
        
        console.log('✓ Has pdfUrl:', hasPdfUrl);
        console.log('✓ Has pages array:', hasPages);
        console.log('✓ First page is PDF:', firstPageIsPdf);
        
        if (hasPdfUrl) {
            console.log('\n✅ RESULT: Chapter should display PDF viewer');
            console.log('PDF URL to render:', chapter.pdfUrl);
        } else if (firstPageIsPdf) {
            console.log('\n✅ RESULT: Chapter should display PDF viewer');
            console.log('PDF URL to render:', typeof chapter.pages[0] === 'string' ? chapter.pages[0] : chapter.pages[0].imagePath);
        } else if (hasPages) {
            console.log('\n✅ RESULT: Chapter should display image pages');
        } else {
            console.log('\n❌ RESULT: Chapter will show "No Pages Available"');
            console.log('REASON: No pdfUrl and no pages array found');
        }
        
        // Also check the manga
        const manga = await db.collection('manga').findOne({ _id: new ObjectId(chapter.mangaId) });
        if (manga) {
            console.log('\n📚 MANGA INFO:');
            console.log('==============');
            console.log('Manga Title:', manga.title);
            console.log('Cover Image:', manga.coverImage || 'NOT SET');
        }
        
    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await client.close();
        console.log('\n✅ MongoDB connection closed');
    }
}

verifyChapterData();

