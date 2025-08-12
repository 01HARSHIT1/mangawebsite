const { MongoClient } = require('mongodb');

async function checkVerification() {
    const uri = 'mongodb://localhost:27017/mangawebsite';
    const client = new MongoClient(uri);
    
    try {
        await client.connect();
        const db = client.db();
        const users = db.collection('users');
        
        // Check the testverification user
        const user = await users.findOne({ email: 'testverification@example.com' });
        if (user) {
            console.log('User found:');
            console.log('Email:', user.email);
            console.log('Nickname:', user.nickname);
            console.log('Role:', user.role);
            console.log('isVerified:', user.isVerified);
            console.log('Created:', user.createdAt);
            console.log('_id:', user._id);
        } else {
            console.log('User not found');
        }
        
        // Check all recent users
        const allUsers = await users.find({}).sort({ createdAt: -1 }).limit(5).toArray();
        console.log('\nRecent users:');
        allUsers.forEach(u => {
            console.log(`- ${u.email} (${u.role}) - Verified: ${u.isVerified} - Created: ${u.createdAt}`);
        });
        
    } catch (error) {
        console.error('Error checking verification:', error);
    } finally {
        await client.close();
    }
}

checkVerification(); 