import { Metadata } from 'next';
import UserProfile from '@/components/UserProfile';

interface UserPageProps {
    params: {
        userId: string;
    };
}

export async function generateMetadata({ params }: UserPageProps): Promise<Metadata> {
    try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/users/${params.userId}`);
        if (res.ok) {
            const data = await res.json();
            const user = data.user;
            return {
                title: `${user.nickname} - Manga Reader`,
                description: user.bio || `View ${user.nickname}'s profile and reading activity`,
                openGraph: {
                    title: `${user.nickname} - Manga Reader`,
                    description: user.bio || `View ${user.nickname}'s profile and reading activity`,
                    type: 'profile',
                },
            };
        }
    } catch (error) {
        console.error('Error generating metadata:', error);
    }

    return {
        title: 'User Profile - Manga Reader',
        description: 'View user profile and reading activity',
    };
}

export default function UserPage({ params }: UserPageProps) {
    return (
        <div className="container mx-auto px-4 py-8 max-w-4xl">
            <div className="mb-6">
                <h1 className="text-3xl font-bold text-white mb-2">User Profile</h1>
                <p className="text-gray-400">Discover reading habits and achievements</p>
            </div>

            <UserProfile userId={params.userId} />
        </div>
    );
} 