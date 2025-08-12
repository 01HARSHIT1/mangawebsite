const { MongoClient } = require('mongodb');

async function checkUser() {
    const uri = 'mongodb://localhost:27017/mangawebsite';
    const client = new MongoClient(uri);
    
    try {
        await client.connect();
        const db = client.db();
        const users = db.collection('users');
        
        // Check the newviewer user
        const user = await users.findOne({ email: 'newviewer@example.com' });
        if (user) {
            console.log('User found:');
            console.log('Email:', user.email);
            console.log('Nickname:', user.nickname);
            console.log('Role:', user.role);
            console.log('isVerified:', user.isVerified);
            console.log('Created:', user.createdAt);
        } else {
            console.log('User not found');
        }
        
        // Check all users
        const allUsers = await users.find({}).toArray();
        console.log('\nAll users:');
        allUsers.forEach(u => {
            console.log(`- ${u.email} (${u.role}) - Verified: ${u.isVerified}`);
        });
        
    } catch (error) {
        console.error('Error checking user:', error);
    } finally {
        await client.close();
    }
}

checkUser(); 