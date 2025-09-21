// MongoDB initialization script
db = db.getSiblingDB('mangawebsite');

// Create collections
db.createCollection('users');
db.createCollection('manga');
db.createCollection('chapters');
db.createCollection('payments');
db.createCollection('ads');
db.createCollection('reports');
db.createCollection('error_logs');
db.createCollection('performance_logs');

// Create indexes for better performance
db.users.createIndex({ email: 1 }, { unique: true });
db.users.createIndex({ username: 1 });
db.users.createIndex({ role: 1 });
db.users.createIndex({ isBanned: 1 });
db.users.createIndex({ createdAt: -1 });

db.manga.createIndex({ uploaderId: 1 });
db.manga.createIndex({ createdAt: -1 });
db.manga.createIndex({ likes: -1, views: -1 });
db.manga.createIndex({ genre: 1 });
db.manga.createIndex({ status: 1 });
db.manga.createIndex({ title: 'text', description: 'text' });

db.chapters.createIndex({ mangaId: 1 });
db.chapters.createIndex({ mangaId: 1, chapterNumber: -1 });
db.chapters.createIndex({ publishDate: 1 });
db.chapters.createIndex({ createdAt: -1 });
db.chapters.createIndex({ title: 'text' });

db.payments.createIndex({ userId: 1 });
db.payments.createIndex({ timestamp: -1 });
db.payments.createIndex({ type: 1 });
db.payments.createIndex({ mangaId: 1 });
db.payments.createIndex({ episodeId: 1 });

db.ads.createIndex({ active: 1 });
db.ads.createIndex({ location: 1 });
db.ads.createIndex({ startDate: 1, endDate: 1 });
db.ads.createIndex({ priority: -1 });

print('MongoDB initialization completed successfully!');