// Mock data for development when MongoDB is not available

export const mockManga = [
    {
        _id: '1',
        title: 'Dragon Chronicles',
        creator: 'Akira Yamamoto',
        description: 'An epic fantasy adventure following a young dragon rider on a quest to save the world from ancient evil.',
        genres: ['Fantasy', 'Adventure', 'Action'],
        status: 'Ongoing',
        coverImage: '/placeholder-page-1.svg',
        views: 15420,
        likes: 892,
        createdAt: new Date('2024-01-15').toISOString(),
        rating: 4.8,
        chapters: 25
    },
    {
        _id: '2',
        title: 'Tokyo High School',
        creator: 'Yuki Tanaka',
        description: 'A slice-of-life story about friendship, love, and growing up in modern Tokyo.',
        genres: ['Romance', 'Slice of Life', 'Drama'],
        status: 'Ongoing',
        coverImage: '/placeholder-page-2.svg',
        views: 8930,
        likes: 567,
        createdAt: new Date('2024-02-01').toISOString(),
        rating: 4.5,
        chapters: 18
    },
    {
        _id: '3',
        title: 'Cyber Ninja',
        creator: 'Kenji Sato',
        description: 'In a dystopian future, a cyber-enhanced ninja fights against corporate tyranny.',
        genres: ['Sci-Fi', 'Action', 'Thriller'],
        status: 'Completed',
        coverImage: '/placeholder-page-3.svg',
        views: 23450,
        likes: 1234,
        createdAt: new Date('2023-11-20').toISOString(),
        rating: 4.9,
        chapters: 42
    },
    {
        _id: '4',
        title: 'Magic Academy',
        creator: 'Luna Mizuki',
        description: 'A young witch discovers her true powers at a prestigious magic academy.',
        genres: ['Fantasy', 'Comedy', 'School Life'],
        status: 'Ongoing',
        coverImage: '/placeholder-page-4.svg',
        views: 12100,
        likes: 678,
        createdAt: new Date('2024-01-30').toISOString(),
        rating: 4.6,
        chapters: 20
    },
    {
        _id: '5',
        title: 'Samurai Spirit',
        creator: 'Hiroshi Nakamura',
        description: 'The last samurai in modern Japan struggles to preserve ancient traditions.',
        genres: ['Historical', 'Action', 'Drama'],
        status: 'Ongoing',
        coverImage: '/placeholder-page-5.svg',
        views: 18750,
        likes: 945,
        createdAt: new Date('2023-12-10').toISOString(),
        rating: 4.7,
        chapters: 30
    },
    {
        _id: '6',
        title: 'Space Pirates',
        creator: 'Rei Cosmos',
        description: 'A ragtag crew of space pirates searches for the legendary treasure of the galaxy.',
        genres: ['Sci-Fi', 'Adventure', 'Comedy'],
        status: 'Ongoing',
        coverImage: '/placeholder-page-1.svg',
        views: 9870,
        likes: 456,
        createdAt: new Date('2024-02-15').toISOString(),
        rating: 4.4,
        chapters: 15
    },
    {
        _id: '7',
        title: 'Demon Hunter',
        creator: 'Kage Yami',
        description: 'A young demon hunter must confront his own dark heritage to save humanity.',
        genres: ['Horror', 'Action', 'Supernatural'],
        status: 'Ongoing',
        coverImage: '/placeholder-page-2.svg',
        views: 21300,
        likes: 1156,
        createdAt: new Date('2023-10-05').toISOString(),
        rating: 4.8,
        chapters: 35
    },
    {
        _id: '8',
        title: 'Cooking Dreams',
        creator: 'Chef Momo',
        description: 'A passionate young chef works to become the world\'s greatest culinary master.',
        genres: ['Slice of Life', 'Comedy', 'Drama'],
        status: 'Ongoing',
        coverImage: '/placeholder-page-3.svg',
        views: 7650,
        likes: 432,
        createdAt: new Date('2024-03-01').toISOString(),
        rating: 4.3,
        chapters: 12
    }
];

export const mockChapters = [
    {
        _id: 'ch1',
        mangaId: '1',
        chapterNumber: 1,
        title: 'The Beginning',
        subtitle: 'A new adventure starts',
        pages: [
            {
                pageNumber: 1,
                imagePath: '/placeholder-page-1.svg',
                format: 'svg',
                width: 800,
                height: 1200,
                size: 50000,
                isRealContent: false,
                toolUsed: 'placeholder',
                quality: 'demo'
            },
            {
                pageNumber: 2,
                imagePath: '/placeholder-page-2.svg',
                format: 'svg',
                width: 800,
                height: 1200,
                size: 50000,
                isRealContent: false,
                toolUsed: 'placeholder',
                quality: 'demo'
            },
            {
                pageNumber: 3,
                imagePath: '/placeholder-page-3.svg',
                format: 'svg',
                width: 800,
                height: 1200,
                size: 50000,
                isRealContent: false,
                toolUsed: 'placeholder',
                quality: 'demo'
            }
        ],
        status: 'published',
        createdAt: new Date('2024-01-15').toISOString()
    }
];

export const mockUsers = [
    {
        _id: 'user1',
        email: 'demo@mangareader.com',
        username: 'DemoUser',
        role: 'user',
        isCreator: false,
        createdAt: new Date('2024-01-01').toISOString()
    },
    {
        _id: 'creator1',
        email: 'creator@mangareader.com',
        username: 'MangaCreator',
        role: 'creator',
        isCreator: true,
        creatorProfile: {
            displayName: 'Amazing Creator',
            bio: 'I love creating manga!',
            socialLinks: {
                twitter: '@mangacreator',
                website: 'https://example.com'
            }
        },
        createdAt: new Date('2023-12-01').toISOString()
    }
];

export const mockNotifications = [
    {
        _id: 'notif1',
        userId: 'user1',
        type: 'new_chapter',
        title: 'New Chapter Available!',
        message: 'Dragon Chronicles Chapter 26 is now available to read.',
        read: false,
        createdAt: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
        data: {
            mangaId: '1',
            chapterId: 'ch26',
            mangaTitle: 'Dragon Chronicles',
            chapterTitle: 'Chapter 26'
        }
    },
    {
        _id: 'notif2',
        userId: 'user1',
        type: 'like',
        title: 'Someone liked your comment!',
        message: 'Your comment on Tokyo High School received a like.',
        read: false,
        createdAt: new Date(Date.now() - 7200000).toISOString(), // 2 hours ago
        data: {
            mangaId: '2',
            mangaTitle: 'Tokyo High School'
        }
    },
    {
        _id: 'notif3',
        userId: 'user1',
        type: 'tip',
        title: 'You received a tip!',
        message: 'Someone tipped you 50 coins for your amazing manga.',
        read: true,
        createdAt: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
        data: {
            amount: 50,
            fromUser: 'Anonymous Reader'
        }
    }
];

// Helper function to simulate API delay
export const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Mock API responses
export const getMockManga = async (params: {
    sort?: string;
    page?: number;
    limit?: number;
    search?: string;
    genre?: string;
    status?: string;
}) => {
    await delay(500); // Simulate network delay

    let filteredManga = [...mockManga];

    // Apply filters
    if (params.search) {
        const searchLower = params.search.toLowerCase();
        filteredManga = filteredManga.filter(manga =>
            manga.title.toLowerCase().includes(searchLower) ||
            manga.creator.toLowerCase().includes(searchLower) ||
            manga.description.toLowerCase().includes(searchLower)
        );
    }

    if (params.genre) {
        filteredManga = filteredManga.filter(manga =>
            manga.genres.includes(params.genre!)
        );
    }

    if (params.status) {
        filteredManga = filteredManga.filter(manga =>
            manga.status.toLowerCase() === params.status!.toLowerCase()
        );
    }

    // Apply sorting
    switch (params.sort) {
        case 'trending':
        case 'featured':
            filteredManga.sort((a, b) => b.views - a.views);
            break;
        case 'top':
            filteredManga.sort((a, b) => (b.rating || 0) - (a.rating || 0));
            break;
        case 'newest':
            filteredManga.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
            break;
        case 'oldest':
            filteredManga.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
            break;
        default:
            // Default to trending
            filteredManga.sort((a, b) => b.views - a.views);
    }

    // Apply pagination
    const page = params.page || 1;
    const limit = params.limit || 20;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedManga = filteredManga.slice(startIndex, endIndex);

    return {
        manga: paginatedManga,
        pagination: {
            page,
            limit,
            total: filteredManga.length,
            pages: Math.ceil(filteredManga.length / limit),
            hasNext: endIndex < filteredManga.length
        }
    };
};
