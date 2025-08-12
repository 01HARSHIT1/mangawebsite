const { MongoClient } = require('mongodb');

async function debugLogin() {
    const uri = 'mongodb://localhost:27017/mangawebsite';
    const client = new MongoClient(uri);

    try {
        await client.connect();
        const db = client.db();
        const users = db.collection('users');

        // Test the exact query that the login API uses
        const testEmail = 'finaltest2@example.com';
        const user = await users.findOne({
            $or: [
                { nickname: testEmail.toLowerCase() },
                { email: testEmail.toLowerCase() }
            ]
        });

        console.log('Query result for email:', testEmail);
        if (user) {
            console.log('User found:');
            console.log('- Email:', user.email);
            console.log('- Nickname:', user.nickname);
            console.log('- Role:', user.role);
            console.log('- isVerified:', user.isVerified);
            console.log('- _id:', user._id);
        } else {
            console.log('No user found');
        }

        // Check all users with similar emails
        const allUsers = await users.find({}).toArray();
        console.log('\nAll users in database:');
        allUsers.forEach(u => {
            console.log(`- ${u.email} (${u.role}) - Verified: ${u.isVerified} - ID: ${u._id}`);
        });

    } catch (error) {
        console.error('Error debugging login:', error);
    } finally {
        await client.close();
    }
}

debugLogin(); 