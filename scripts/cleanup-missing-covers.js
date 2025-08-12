// Cleanup script: remove coverImage fields for missing files
const fs = require('fs');
const path = require('path');
const { MongoClient } = require('mongodb');

const UPLOADS_DIR = path.join(__dirname, '../public/uploads');
const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/mangawebsite';

async function cleanMangaCovers() {
    const client = new MongoClient(MONGO_URI);
    await client.connect();
    const db = client.db();
    const mangaList = await db.collection('manga').find({ coverImage: { $exists: true, $ne: '' } }).toArray();
    for (const manga of mangaList) {
        const coverPath = manga.coverImage.startsWith('/uploads/') ? manga.coverImage : `/uploads/${manga.coverImage}`;
        const filePath = path.join(UPLOADS_DIR, path.basename(coverPath));
        if (!fs.existsSync(filePath)) {
            await db.collection('manga').updateOne({ _id: manga._id }, { $unset: { coverImage: "" } });
            console.log(`Removed missing coverImage for: ${manga.title}`);
        }
    }
    client.close();
}

cleanMangaCovers().catch(err => {
    console.error('Cleanup failed:', err);
    process.exit(1);
}); 