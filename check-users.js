const { MongoClient } = require('mongodb');

async function checkUsers() {
    try {
        // Connect to MongoDB
        const client = new MongoClient(process.env.MONGODB_URI || 'mongodb://localhost:27017/mangawebsite');
        await client.connect();

        const db = client.db();
        const users = db.collection('users');

        // Get all users
        const allUsers = await users.find({}).toArray();

        console.log('=== Existing Users ===');
        console.log(`Total users: ${allUsers.length}`);

        // Show last 10 users for debugging
        allUsers.slice(-10).forEach((user, index) => {
            console.log(`${allUsers.length - 9 + index}. Email: "${user.email}" | Nickname: "${user.nickname}" | Role: ${user.role}`);
        });

        // Test some common email patterns
        const testEmails = [
            'test@example.com',
            'user@test.com',
            'newuser@example.com',
            'testuser@example.com',
            'user123@example.com'
        ];

        const testNicknames = [
            'testuser',
            'newuser',
            'user123',
            'test',
            'user'
        ];

        console.log('\n=== Testing Common Patterns ===');

        for (const email of testEmails) {
            const existingEmail = await users.findOne({
                email: { $regex: new RegExp(`^${email}$`, 'i') }
            });
            console.log(`Email "${email}": ${existingEmail ? 'EXISTS' : 'AVAILABLE'}`);
        }

        for (const nickname of testNicknames) {
            const existingNickname = await users.findOne({
                nickname: { $regex: new RegExp(`^${nickname}$`, 'i') }
            });
            console.log(`Nickname "${nickname}": ${existingNickname ? 'EXISTS' : 'AVAILABLE'}`);
        }

        await client.close();
    } catch (error) {
        console.error('Error:', error);
    }
}

checkUsers(); 