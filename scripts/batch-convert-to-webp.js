// Batch convert all images in public/uploads/ to .webp and update DB references
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const { MongoClient, ObjectId } = require('mongodb');

const UPLOADS_DIR = path.join(__dirname, '../public/uploads');
const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/mangawebsite';

async function convertImageToWebp(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    if (!['.jpg', '.jpeg', '.png'].includes(ext)) return null;
    const webpPath = filePath.replace(ext, '.webp');
    if (fs.existsSync(webpPath)) return webpPath; // Already converted
    await sharp(filePath).webp({ quality: 80 }).toFile(webpPath);
    return webpPath;
}

async function main() {
    // 1. Convert all images in uploads dir
    const files = fs.readdirSync(UPLOADS_DIR);
    const imgMap = {};
    for (const file of files) {
        const ext = path.extname(file).toLowerCase();
        if (['.jpg', '.jpeg', '.png'].includes(ext)) {
            const absPath = path.join(UPLOADS_DIR, file);
            const webpPath = await convertImageToWebp(absPath);
            if (webpPath) {
                imgMap[`/uploads/${file}`] = `/uploads/${path.basename(webpPath)}`;
                console.log(`Converted: ${file} -> ${path.basename(webpPath)}`);
            }
        }
    }
    // 2. Update DB references
    const client = new MongoClient(MONGO_URI);
    await client.connect();
    const db = client.db();
    // Manga covers
    const manga = await db.collection('manga').find({ coverImage: { $in: Object.keys(imgMap) } }).toArray();
    for (const m of manga) {
        await db.collection('manga').updateOne({ _id: m._id }, { $set: { coverImage: imgMap[m.coverImage] } });
        console.log(`Updated manga cover: ${m.title}`);
    }
    // Chapter pages
    const chapters = await db.collection('chapters').find({ pages: { $exists: true, $ne: [] } }).toArray();
    for (const ch of chapters) {
        let updated = false;
        const newPages = (ch.pages || []).map(p => {
            if (imgMap[p]) { updated = true; return imgMap[p]; } else { return p; }
        });
        if (updated) {
            await db.collection('chapters').updateOne({ _id: ch._id }, { $set: { pages: newPages } });
            console.log(`Updated chapter: ${ch._id}`);
        }
    }
    // User avatars
    const users = await db.collection('users').find({ avatarUrl: { $in: Object.keys(imgMap) } }).toArray();
    for (const u of users) {
        await db.collection('users').updateOne({ _id: u._id }, { $set: { avatarUrl: imgMap[u.avatarUrl] } });
        console.log(`Updated avatar for user: ${u._id}`);
    }
    await client.close();
    console.log('Batch conversion complete. Originals are kept for now.');
}

main().catch(e => { console.error(e); process.exit(1); }); 