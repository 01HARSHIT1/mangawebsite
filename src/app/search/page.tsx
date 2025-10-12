import { Metadata } from 'next';
import AdvancedSearch from '@/components/AdvancedSearch';
import SmartRecommendations from '@/components/SmartRecommendations';

export const metadata: Metadata = {
    title: 'Search & Discover Manga - Manga Reader',
    description: 'Find your next favorite manga with advanced search, filters, and personalized recommendations.',
    openGraph: {
        title: 'Search & Discover Manga - Manga Reader',
        description: 'Find your next favorite manga with advanced search, filters, and personalized recommendations.',
        type: 'website',
    },
};

export default function SearchPage() {
    return (
        <div className="container mx-auto px-4 py-8 max-w-7xl">
            <div className="mb-8">
                <h1 className="text-4xl font-bold text-white mb-2">Discover Manga</h1>
                <p className="text-gray-400 text-lg">
                    Find your next favorite series with advanced search and smart recommendations
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">         {/* Advanced Search */}
                <div className="lg:col-span-2">
                    <AdvancedSearch />
                </div>

                {/* Smart Recommendations */}
                <div className="lg:col-span-1">
                    <SmartRecommendations />
                </div>
            </div>

            {/* Additional Discovery Sections */}
            <div className="mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">               {/* Popular Genres */}
                <div className="bg-gray-900 rounded-2xl shadow-xl p-6">
                    <h3 className="text-xl font-bold text-white mb-4">Popular Genres</h3>
                    <div className="space-y-2">
                        {['Action', 'Romance,Fantasy', 'Comedy', 'Drama, orror'].map((genre) => (
                            <a
                                key={genre}
                                href={`/series?genre=${genre.toLowerCase()}`}
                                className="block text-gray-300 hover:text-white transition-colors"
                            >
                                {genre}
                            </a>
                        ))}
                    </div>
                </div>

                {/* Latest Updates */}
                <div className="bg-gray-900 rounded-2xl shadow-xl p-6">
                    <h3 className="text-xl font-bold text-white mb-4">Latest Updates</h3>
                    <div className="space-y-2">
                        <p className="text-gray-400 text-sm">
                            Check back soon for the latest chapter updates and new releases!
                        </p>
                    </div>
                </div>

                {/* Top Rated */}
                <div className="bg-gray-900 rounded-2xl shadow-xl p-6">
                    <h3 className="text-xl font-bold text-white mb-4">Top Rated</h3>
                    <div className="space-y-2">
                        <p className="text-gray-400 text-sm">
                            Discover the highest-rated manga series based on community ratings.
                        </p>
                    </div>
                </div>

                {/* New Releases */}
                <div className="bg-gray-900 rounded-2xl shadow-xl p-6">
                    <h3 className="text-xl font-bold text-white mb-4">New Releases</h3>
                    <div className="space-y-2">
                        <p className="text-gray-400 text-sm">
                            Explore the newest manga series and fresh content.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
} 