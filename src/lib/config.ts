// Configuration file for the manga website
export const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
export const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/mangawebsite';
export const NODE_ENV = process.env.NODE_ENV || 'development';
export const PORT = process.env.PORT || 3000;
