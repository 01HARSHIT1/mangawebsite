const { MongoClient } = require('mongodb');
const bcrypt = require('bcryptjs');

async function createAdmin() {
    const uri = 'mongodb://localhost:27017/mangawebsite';
    const client = new MongoClient(uri);
    
    try {
        await client.connect();
        const db = client.db();
        const users = db.collection('users');
        
        // Check if admin already exists
        const existingAdmin = await users.findOne({ role: 'admin' });
        if (existingAdmin) {
            console.log('Admin account already exists');
            return;
        }
        
        // Create admin account
        const hashedPassword = await bcrypt.hash('Trust@K123', 12);
        await users.insertOne({
            email: 'admin@example.com',
            password: hashedPassword,
            nickname: 'Admin',
            dateOfBirth: '1990-01-01',
            role: 'admin',
            isVerified: true,
            createdAt: new Date(),
            lastLogin: new Date()
        });
        
        console.log('Admin account created successfully');
        console.log('Email: admin@example.com');
        console.log('Password: Trust@K123');
        
    } catch (error) {
        console.error('Error creating admin:', error);
    } finally {
        await client.close();
    }
}

createAdmin(); 