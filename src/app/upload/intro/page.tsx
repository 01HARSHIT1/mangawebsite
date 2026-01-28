import { Suspense } from 'react';
import UploadIntroClient from './UploadIntroClient';

export const dynamic = 'force-dynamic';

export default function UploadIntroPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-white" />}>
            <UploadIntroClient />
        </Suspense>
    );
}

