const { MongoClient } = require('mongodb');
const fs = require('fs');
const path = require('path');

async function updateChapterToPoppler() {
    const uri = 'mongodb://localhost:27017/mangawebsite';
    const client = new MongoClient(uri);

    try {
        await client.connect();
        console.log('🚀 Connected to MongoDB');

        const db = client.db();

        // Find the existing Chapter 1135
        const existingChapter = await db.collection('chapters').findOne({
            chapterNumber: 1135
        });

        if (!existingChapter) {
            console.log('❌ Chapter 1135 not found in database');
            return;
        }

        console.log('✅ Found Chapter 1135:', {
            id: existingChapter._id.toString(),
            title: existingChapter.title,
            currentPages: existingChapter.pages?.length || 0
        });

        // Path to the new Poppler images
        const popplerDir = './public/manga-images/one-piece/chapter-1135-poppler';

        if (!fs.existsSync(popplerDir)) {
            throw new Error(`Poppler images directory not found: ${popplerDir}`);
        }

        // Get all PNG files from the Poppler directory
        const imageFiles = fs.readdirSync(popplerDir)
            .filter(file => file.endsWith('.png'))
            .sort((a, b) => {
                // Sort by page number (page-1.png, page-2.png, etc.)
                const pageNumA = parseInt(a.match(/page-(\d+)\.png/)[1]);
                const pageNumB = parseInt(b.match(/page-(\d+)\.png/)[1]);
                return pageNumA - pageNumB;
            });

        console.log(`📁 Found ${imageFiles.length} Poppler images in: ${popplerDir}`);

        if (imageFiles.length === 0) {
            throw new Error('No PNG images found in Poppler directory');
        }

        // Create new pages array with the Poppler images
        const newPages = imageFiles.map((imageFile, index) => {
            const pageNumber = index + 1;
            const imagePath = `/manga-images/one-piece/chapter-1135-poppler/${imageFile}`;
            const fullImagePath = path.join(popplerDir, imageFile);
            const stats = fs.statSync(fullImagePath);

            return {
                pageNumber: pageNumber,
                imagePath: imagePath,
                format: 'png',
                width: 800,
                height: 1200,
                size: stats.size,
                isRealContent: true,
                toolUsed: 'poppler',
                quality: 'high'
            };
        });

        console.log('🔄 Created new pages array with Poppler images:');
        newPages.forEach(page => {
            console.log(`   Page ${page.pageNumber}: ${(page.size / 1024).toFixed(2)} KB`);
        });

        // Update the chapter with new pages
        const updateResult = await db.collection('chapters').updateOne(
            { _id: existingChapter._id },
            {
                $set: {
                    pages: newPages,
                    imageStorage: 'file_system',
                    totalSize: newPages.reduce((sum, page) => sum + page.size, 0),
                    toolUsed: 'poppler',
                    updatedAt: new Date(),
                    imageQuality: 'high',
                    conversionMethod: 'poppler_pdftoppm'
                }
            }
        );

        if (updateResult.modifiedCount > 0) {
            console.log('✅ Successfully updated Chapter 1135 with Poppler images!');

            // Verify the update
            const updatedChapter = await db.collection('chapters').findOne({
                _id: existingChapter._id
            });

            console.log('\n🎯 Update Summary:');
            console.log(`   Chapter ID: ${updatedChapter._id.toString()}`);
            console.log(`   Total Pages: ${updatedChapter.pages.length}`);
            console.log(`   Total Size: ${(updatedChapter.totalSize / 1024 / 1024).toFixed(2)} MB`);
            console.log(`   Tool Used: ${updatedChapter.toolUsed}`);
            console.log(`   Image Quality: ${updatedChapter.imageQuality}`);
            console.log(`   Conversion Method: ${updatedChapter.conversionMethod}`);

            console.log('\n🔗 Now you can read the real One Piece Chapter 1135 at:');
            console.log(`   http://localhost:3000/manga/${updatedChapter.mangaId}/chapter/${updatedChapter._id.toString()}`);

            return {
                success: true,
                chapterId: updatedChapter._id.toString(),
                mangaId: updatedChapter.mangaId,
                pageCount: updatedChapter.pages.length,
                totalSize: updatedChapter.totalSize
            };

        } else {
            console.log('❌ Failed to update chapter');
            return { success: false };
        }

    } catch (error) {
        console.error('❌ Error updating chapter:', error);
        throw error;
    } finally {
        await client.close();
        console.log('\n🔌 MongoDB connection closed');
    }
}

// Run the update
updateChapterToPoppler()
    .then(result => {
        if (result.success) {
            console.log('\n🎉 Chapter update completed successfully!');
            console.log('✅ Your One Piece Chapter 1135 now has high-quality Poppler images!');
            console.log('📖 You can now read the real manga with proper navigation!');
        } else {
            console.log('\n❌ Chapter update failed');
        }
    })
    .catch(error => {
        console.error('💥 Update failed:', error);
        process.exit(1);
    });






