// Simple in-memory database for development
interface User {
    _id: string;
    email: string;
    username: string;
    password: string;
    role: 'user' | 'creator' | 'admin';
    isCreator: boolean;
    createdAt: Date;
    updatedAt: Date;
}

interface Manga {
    _id: string;
    title: string;
    creator: string;
    creatorId: string;
    description: string;
    status: string;
    genres: string[];
    coverImage: string;
    views: number;
    likes: number;
    createdAt: Date;
    updatedAt: Date;
}

interface Chapter {
    _id: string;
    mangaId: string;
    chapterNumber: number;
    title: string;
    subtitle: string;
    pages: any[];
    status: string;
    imageStorage: string;
    totalSize: number;
    toolUsed: string;
    quality: string;
    imageSource: string;
    createdAt: Date;
    updatedAt: Date;
}

class MockDatabase {
    private users: User[] = [];
    private manga: Manga[] = [];
    private chapters: Chapter[] = [];
    private nextUserId = 1;
    private nextMangaId = 1;
    private nextChapterId = 1;

    // Users
    async createUser(userData: Omit<User, '_id' | 'createdAt' | 'updatedAt'>): Promise<User> {
        const user: User = {
            _id: this.nextUserId.toString(),
            ...userData,
            createdAt: new Date(),
            updatedAt: new Date()
        };
        this.users.push(user);
        this.nextUserId++;
        return user;
    }

    async findUserByEmail(email: string): Promise<User | null> {
        return this.users.find(user => user.email === email) || null;
    }

    async findUserByUsername(username: string): Promise<User | null> {
        return this.users.find(user => user.username === username) || null;
    }

    async findUserById(id: string): Promise<User | null> {
        return this.users.find(user => user._id === id) || null;
    }

    async updateUser(id: string, updates: Partial<User>): Promise<User | null> {
        const userIndex = this.users.findIndex(user => user._id === id);
        if (userIndex === -1) return null;
        
        this.users[userIndex] = { ...this.users[userIndex], ...updates, updatedAt: new Date() };
        return this.users[userIndex];
    }

    // Manga
    async createManga(mangaData: Omit<Manga, '_id' | 'createdAt' | 'updatedAt'>): Promise<Manga> {
        const manga: Manga = {
            _id: this.nextMangaId.toString(),
            ...mangaData,
            createdAt: new Date(),
            updatedAt: new Date()
        };
        this.manga.push(manga);
        this.nextMangaId++;
        return manga;
    }

    async findMangaByTitleAndCreator(title: string, creatorId: string): Promise<Manga | null> {
        return this.manga.find(m => m.title === title && m.creatorId === creatorId) || null;
    }

    async findMangaById(id: string): Promise<Manga | null> {
        return this.manga.find(m => m._id === id) || null;
    }

    // Chapters
    async createChapter(chapterData: Omit<Chapter, '_id' | 'createdAt' | 'updatedAt'>): Promise<Chapter> {
        const chapter: Chapter = {
            _id: this.nextChapterId.toString(),
            ...chapterData,
            createdAt: new Date(),
            updatedAt: new Date()
        };
        this.chapters.push(chapter);
        this.nextChapterId++;
        return chapter;
    }

    async findChapterByMangaAndNumber(mangaId: string, chapterNumber: number): Promise<Chapter | null> {
        return this.chapters.find(c => c.mangaId === mangaId && c.chapterNumber === chapterNumber) || null;
    }

    async updateChapter(id: string, updates: Partial<Chapter>): Promise<Chapter | null> {
        const chapterIndex = this.chapters.findIndex(chapter => chapter._id === id);
        if (chapterIndex === -1) return null;
        
        this.chapters[chapterIndex] = { ...this.chapters[chapterIndex], ...updates, updatedAt: new Date() };
        return this.chapters[chapterIndex];
    }

    // Get all data (for debugging)
    getAllUsers(): User[] {
        return [...this.users];
    }

    getAllManga(): Manga[] {
        return [...this.manga];
    }

    getAllChapters(): Chapter[] {
        return [...this.chapters];
    }
}

// Create a singleton instance
const mockDb = new MockDatabase();

export default mockDb;
