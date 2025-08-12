const { MongoClient } = require('mongodb');

async function fixUser() {
    const uri = 'mongodb://localhost:27017/mangawebsite';
    const client = new MongoClient(uri);
    
    try {
        await client.connect();
        const db = client.db();
        const users = db.collection('users');
        
        // Update the newviewer user to ensure it's verified
        const result = await users.updateOne(
            { email: 'newviewer@example.com' },
            { 
                $set: { 
                    isVerified: true,
                    role: 'viewer'
                } 
            }
        );
        
        console.log('Update result:', result);
        
        // Check the user again
        const user = await users.findOne({ email: 'newviewer@example.com' });
        if (user) {
            console.log('User after update:');
            console.log('Email:', user.email);
            console.log('Role:', user.role);
            console.log('isVerified:', user.isVerified);
        }
        
    } catch (error) {
        console.error('Error fixing user:', error);
    } finally {
        await client.close();
    }
}

fixUser(); 