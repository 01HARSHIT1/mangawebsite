'use client';

import ErrorPage from '@/components/ErrorPage';

interface GlobalErrorProps {
    error: Error & { digest?: string };
    reset: () => void;
}

export default function GlobalError({ error, reset }: GlobalErrorProps) {
    return (
        <html>
            <body>
                <ErrorPage
                    statusCode={500}
                    title="Something went wrong!"
                    message="An unexpected error occurred. Please try refreshing the page or contact support if the problem persists."
                    showHomeButton={true}
                    showSearchButton={false}
                    showBackButton={false}
                />
            </body>
        </html>
    );
} 