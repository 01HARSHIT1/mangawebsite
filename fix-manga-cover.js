const { MongoClient } = require('mongodb');

async function fixMangaCover() {
    const client = new MongoClient('mongodb://localhost:27017');
    
    try {
        await client.connect();
        const db = client.db('mangawebsite');
        
        console.log('🔧 Fixing One Piece manga cover image path...');
        
        // Find the One Piece manga
        const onePiece = await db.collection('manga').findOne({ title: 'One Piece' });
        if (!onePiece) {
            console.log('❌ One Piece manga not found');
            return;
        }
        
        console.log(`✅ Found One Piece manga: ${onePiece._id}`);
        console.log(`   Current cover: ${onePiece.coverImage}`);
        
        // Update the cover image to use a default cover or the correct path
        const result = await db.collection('manga').updateOne(
            { _id: onePiece._id },
            { $set: { coverImage: '/manga-covers/default-cover.jpg' } }
        );
        
        if (result.modifiedCount > 0) {
            console.log('✅ Manga cover updated successfully');
            console.log('   New cover: /manga-covers/default-cover.jpg');
        } else {
            console.log('⚠️ No changes made');
        }
        
        // Verify the update
        const updatedManga = await db.collection('manga').findOne({ _id: onePiece._id });
        console.log(`\n📚 Updated manga cover: ${updatedManga.coverImage}`);
        
    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await client.close();
    }
}

fixMangaCover().catch(console.error);
