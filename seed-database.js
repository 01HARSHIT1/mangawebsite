#!/usr/bin/env node

/**
 * Database Seeding Script for Manga Website
 * Populates the database with sample manga data
 */

const { MongoClient } = require('mongodb');

const uri = 'mongodb://admin:password123@127.0.0.1:27017/mangawebsite?authSource=admin';

const sampleManga = [
    {
        _id: '1',
        title: 'Dragon Chronicles',
        creator: 'Akira Yamamoto',
        description: 'An epic fantasy adventure following a young dragon rider on a quest to save the world from ancient evil. Join Kai as he discovers his destiny and battles through mystical realms filled with magic, danger, and legendary creatures.',
        genres: ['Fantasy', 'Adventure', 'Action'],
        status: 'Ongoing',
        coverImage: '/placeholder-page-1.svg',
        views: 15420,
        likes: 892,
        bookmarks: 234,
        rating: 4.8,
        chapters: 25,
        createdAt: new Date('2024-01-15'),
        updatedAt: new Date('2024-01-20'),
        featured: true,
        trending: true,
        topRated: true
    },
    {
        _id: '2',
        title: 'Tokyo High School',
        creator: 'Yuki Tanaka',
        description: 'A slice-of-life story about friendship, love, and growing up in modern Tokyo. Follow the daily adventures of high school students as they navigate relationships, dreams, and the challenges of youth.',
        genres: ['Romance', 'Slice of Life', 'Drama'],
        status: 'Ongoing',
        coverImage: '/placeholder-page-2.svg',
        views: 8930,
        likes: 445,
        bookmarks: 156,
        rating: 4.6,
        chapters: 18,
        createdAt: new Date('2024-01-10'),
        updatedAt: new Date('2024-01-19'),
        featured: false,
        trending: true,
        topRated: true
    },
    {
        _id: '3',
        title: 'Cyber Ninja',
        creator: 'Hiroshi Sato',
        description: 'In a dystopian future where technology and ancient martial arts collide, a young ninja must master both blade and code to protect humanity from digital demons and cyber threats.',
        genres: ['Sci-Fi', 'Action', 'Cyberpunk'],
        status: 'Ongoing',
        coverImage: '/placeholder-page-3.svg',
        views: 12750,
        likes: 678,
        bookmarks: 198,
        rating: 4.7,
        chapters: 22,
        createdAt: new Date('2024-01-08'),
        updatedAt: new Date('2024-01-18'),
        featured: true,
        trending: true,
        topRated: false
    },
    {
        _id: '4',
        title: 'Magic Academy Chronicles',
        creator: 'Luna Moonwhisper',
        description: 'Welcome to Arcanum Academy, where young mages learn to harness their magical abilities. Follow Elena as she discovers her rare gift and uncovers dark secrets hidden within the academy walls.',
        genres: ['Fantasy', 'Magic', 'School'],
        status: 'Ongoing',
        coverImage: '/placeholder-page-4.svg',
        views: 9840,
        likes: 521,
        bookmarks: 167,
        rating: 4.5,
        chapters: 16,
        createdAt: new Date('2024-01-12'),
        updatedAt: new Date('2024-01-17'),
        featured: false,
        trending: false,
        topRated: true
    },
    {
        _id: '5',
        title: 'Space Pirates Odyssey',
        creator: 'Captain Stardust',
        description: 'Join the crew of the Stellar Raven as they sail through the cosmos in search of legendary treasure. A thrilling space adventure filled with alien encounters, cosmic battles, and interstellar mysteries.',
        genres: ['Sci-Fi', 'Adventure', 'Space'],
        status: 'Completed',
        coverImage: '/placeholder-page-5.svg',
        views: 7650,
        likes: 389,
        bookmarks: 145,
        rating: 4.4,
        chapters: 35,
        createdAt: new Date('2023-12-01'),
        updatedAt: new Date('2024-01-15'),
        featured: true,
        trending: false,
        topRated: true
    },
    {
        _id: '6',
        title: 'Cooking Master',
        creator: 'Chef Yamada',
        description: 'Follow the culinary journey of Ryo, a young chef with extraordinary taste buds and cooking skills. Watch as he competes in cooking battles and creates dishes that touch people\'s hearts.',
        genres: ['Cooking', 'Comedy', 'Slice of Life'],
        status: 'Ongoing',
        coverImage: '/placeholder-page-1.svg',
        views: 6420,
        likes: 312,
        bookmarks: 98,
        rating: 4.3,
        chapters: 12,
        createdAt: new Date('2024-01-05'),
        updatedAt: new Date('2024-01-16'),
        featured: false,
        trending: true,
        topRated: false
    }
];

const sampleUsers = [
    {
        _id: 'user1',
        username: 'manga_lover_01',
        email: 'user1@example.com',
        role: 'reader',
        status: 'active',
        createdAt: new Date('2024-01-10'),
        bookmarks: ['1', '2', '3']
    },
    {
        _id: 'user2',
        username: 'akira_yamamoto',
        email: 'akira@example.com',
        role: 'creator',
        status: 'active',
        createdAt: new Date('2024-01-05'),
        creatorProfile: {
            displayName: 'Akira Yamamoto',
            bio: 'Fantasy manga creator with over 5 years of experience.',
            socialLinks: {
                twitter: '@akira_manga'
            }
        }
    }
];

const sampleChapters = [
    {
        _id: 'chapter1',
        mangaId: '1',
        title: 'The Awakening',
        chapterNumber: 1,
        pages: [
            '/placeholder-page-1.svg',
            '/placeholder-page-2.svg',
            '/placeholder-page-3.svg',
            '/placeholder-page-4.svg',
            '/placeholder-page-5.svg'
        ],
        views: 1250,
        likes: 89,
        createdAt: new Date('2024-01-15'),
        published: true
    },
    {
        _id: 'chapter2',
        mangaId: '1',
        title: 'First Flight',
        chapterNumber: 2,
        pages: [
            '/placeholder-page-2.svg',
            '/placeholder-page-3.svg',
            '/placeholder-page-4.svg',
            '/placeholder-page-5.svg',
            '/placeholder-page-1.svg'
        ],
        views: 1180,
        likes: 76,
        createdAt: new Date('2024-01-16'),
        published: true
    }
];

async function seedDatabase() {
    let client;

    try {
        console.log('🌱 Starting database seeding...');

        // Connect to MongoDB
        client = new MongoClient(uri);
        await client.connect();
        console.log('✅ Connected to MongoDB');

        const db = client.db('mangawebsite');

        // Clear existing data (optional)
        console.log('🧹 Clearing existing data...');
        await db.collection('manga').deleteMany({});
        await db.collection('users').deleteMany({});
        await db.collection('chapters').deleteMany({});

        // Insert sample manga
        console.log('📚 Inserting sample manga...');
        await db.collection('manga').insertMany(sampleManga);
        console.log(`✅ Inserted ${sampleManga.length} manga`);

        // Insert sample users
        console.log('👥 Inserting sample users...');
        await db.collection('users').insertMany(sampleUsers);
        console.log(`✅ Inserted ${sampleUsers.length} users`);

        // Insert sample chapters
        console.log('📖 Inserting sample chapters...');
        await db.collection('chapters').insertMany(sampleChapters);
        console.log(`✅ Inserted ${sampleChapters.length} chapters`);

        // Create indexes for better performance
        console.log('🔍 Creating database indexes...');
        await db.collection('manga').createIndex({ title: 'text', description: 'text' });
        await db.collection('manga').createIndex({ genres: 1 });
        await db.collection('manga').createIndex({ featured: 1 });
        await db.collection('manga').createIndex({ trending: 1 });
        await db.collection('manga').createIndex({ topRated: 1 });
        await db.collection('manga').createIndex({ views: -1 });
        await db.collection('manga').createIndex({ rating: -1 });
        await db.collection('manga').createIndex({ createdAt: -1 });

        await db.collection('users').createIndex({ email: 1 }, { unique: true });
        await db.collection('users').createIndex({ username: 1 }, { unique: true });

        await db.collection('chapters').createIndex({ mangaId: 1 });
        await db.collection('chapters').createIndex({ chapterNumber: 1 });

        console.log('✅ Database indexes created');

        console.log('\n🎉 DATABASE SEEDING COMPLETED SUCCESSFULLY!');
        console.log('📊 Summary:');
        console.log(`   • ${sampleManga.length} manga added`);
        console.log(`   • ${sampleUsers.length} users added`);
        console.log(`   • ${sampleChapters.length} chapters added`);
        console.log(`   • Database indexes created`);
        console.log('\n🌐 Your website now has content to display!');
        console.log('   Visit http://localhost:3000 to see the populated homepage');

    } catch (error) {
        console.error('❌ Error seeding database:', error);
        process.exit(1);
    } finally {
        if (client) {
            await client.close();
            console.log('🔌 Database connection closed');
        }
    }
}

// Run seeding if this script is executed directly
if (require.main === module) {
    seedDatabase().then(() => {
        console.log('✅ Seeding process completed');
        process.exit(0);
    }).catch((error) => {
        console.error('💥 Fatal error:', error);
        process.exit(1);
    });
}

module.exports = { seedDatabase, sampleManga, sampleUsers, sampleChapters };
