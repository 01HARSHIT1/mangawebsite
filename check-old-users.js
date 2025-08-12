const { MongoClient } = require('mongodb');

async function checkOldUsers() {
    const uri = 'mongodb://localhost:27017/mangawebsite';
    const client = new MongoClient(uri);
    
    try {
        await client.connect();
        const db = client.db();
        const users = db.collection('users');
        
        // Check for users with isVerified: false
        const unverifiedUsers = await users.find({ isVerified: false }).toArray();
        console.log('Users with isVerified: false:');
        unverifiedUsers.forEach(u => {
            console.log(`- ${u.email} (${u.role}) - Created: ${u.createdAt}`);
        });
        
        // Check for users with isVerified: true
        const verifiedUsers = await users.find({ isVerified: true }).toArray();
        console.log('\nUsers with isVerified: true:');
        verifiedUsers.forEach(u => {
            console.log(`- ${u.email} (${u.role}) - Created: ${u.createdAt}`);
        });
        
        // Check all users
        const allUsers = await users.find({}).toArray();
        console.log(`\nTotal users: ${allUsers.length}`);
        console.log(`Verified: ${verifiedUsers.length}`);
        console.log(`Unverified: ${unverifiedUsers.length}`);
        
    } catch (error) {
        console.error('Error checking users:', error);
    } finally {
        await client.close();
    }
}

checkOldUsers(); 