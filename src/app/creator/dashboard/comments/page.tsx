import { Suspense } from 'react';

export const dynamic = 'force-dynamic';

export default function CommentsPage() {
    return (
        <Suspense fallback={
            <div className="flex items-center justify-center min-h-screen bg-slate-900">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
                    <p className="text-gray-400">Loading comments...</p>
                </div>
            </div>
        }>
            <CommentsPageClient />
        </Suspense>
    );
}

function CommentsPageClient() {
    const CommentModeration = require('@/components/creator/CommentModerationPage').default;
    return <CommentModeration />;
}

