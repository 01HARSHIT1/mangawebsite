const { MongoClient } = require('mongodb');

async function fixOldUsers() {
    const uri = 'mongodb://localhost:27017/mangawebsite';
    const client = new MongoClient(uri);
    
    try {
        await client.connect();
        const db = client.db();
        const users = db.collection('users');
        
        // Update all users with isVerified: false to isVerified: true
        const result = await users.updateMany(
            { isVerified: false },
            { $set: { isVerified: true } }
        );
        
        console.log('Update result:', result);
        console.log(`Updated ${result.modifiedCount} users`);
        
        // Check the updated users
        const updatedUsers = await users.find({ isVerified: true }).toArray();
        console.log('\nAll users are now verified:');
        updatedUsers.forEach(u => {
            console.log(`- ${u.email} (${u.role}) - Verified: ${u.isVerified}`);
        });
        
    } catch (error) {
        console.error('Error fixing users:', error);
    } finally {
        await client.close();
    }
}

fixOldUsers(); 