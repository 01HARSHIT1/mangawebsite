"use client";
import Link from 'next/link';

export default function TermsPage() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white">
            <div className="max-w-4xl mx-auto px-4 py-16">
                <div className="text-center mb-12">
                    <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                        Terms of Service
                    </h1>
                    <p className="text-gray-300">Last updated: {new Date().toLocaleDateString()}</p>
                </div>

                <div className="bg-slate-800/50 rounded-3xl p-8 backdrop-blur-sm space-y-8">
                    <section>
                        <h2 className="text-2xl font-bold text-purple-400 mb-4">1. Acceptance of Terms</h2>
                        <p className="text-gray-300 leading-relaxed">
                            By accessing and using MangaReader, you accept and agree to be bound by the terms and provision of this agreement.
                            If you do not agree to abide by the above, please do not use this service.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-purple-400 mb-4">2. User Accounts</h2>
                        <div className="text-gray-300 leading-relaxed space-y-3">
                            <p>When you create an account with us, you must provide information that is accurate, complete, and current at all times.</p>
                            <p>You are responsible for safeguarding the password and for maintaining the security of your account.</p>
                            <p>You agree not to disclose your password to any third party and to take sole responsibility for activities under your account.</p>
                        </div>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-purple-400 mb-4">3. Content Guidelines</h2>
                        <div className="text-gray-300 leading-relaxed space-y-3">
                            <p><strong>Prohibited Content:</strong> Users may not upload content that is:</p>
                            <ul className="list-disc list-inside ml-4 space-y-2">
                                <li>Copyrighted material without proper authorization</li>
                                <li>Inappropriate, offensive, or harmful content</li>
                                <li>Spam, malware, or malicious code</li>
                                <li>Content that violates any applicable laws or regulations</li>
                            </ul>
                            <p><strong>Original Content:</strong> We encourage original manga creation and respect intellectual property rights.</p>
                        </div>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-purple-400 mb-4">4. Creator Rights and Responsibilities</h2>
                        <div className="text-gray-300 leading-relaxed space-y-3">
                            <p>As a creator on MangaReader, you retain ownership of your original content.</p>
                            <p>By uploading content, you grant MangaReader a non-exclusive license to display, distribute, and promote your work on our platform.</p>
                            <p>Creators are responsible for ensuring they have the right to upload and share their content.</p>
                        </div>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-purple-400 mb-4">5. User Conduct</h2>
                        <div className="text-gray-300 leading-relaxed space-y-3">
                            <p>Users agree to use MangaReader in a respectful and lawful manner. Prohibited activities include:</p>
                            <ul className="list-disc list-inside ml-4 space-y-2">
                                <li>Harassment, bullying, or threatening other users</li>
                                <li>Attempting to hack, exploit, or damage the platform</li>
                                <li>Creating multiple accounts to circumvent restrictions</li>
                                <li>Using automated tools to scrape or download content</li>
                            </ul>
                        </div>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-purple-400 mb-4">6. Privacy and Data Protection</h2>
                        <p className="text-gray-300 leading-relaxed">
                            Your privacy is important to us. Please review our Privacy Policy, which also governs your use of the Service,
                            to understand our practices regarding the collection and use of your personal information.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-purple-400 mb-4">7. Termination</h2>
                        <p className="text-gray-300 leading-relaxed">
                            We may terminate or suspend your account immediately, without prior notice or liability, for any reason whatsoever,
                            including without limitation if you breach the Terms of Service.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-purple-400 mb-4">8. Disclaimer</h2>
                        <p className="text-gray-300 leading-relaxed">
                            The information on this website is provided on an "as is" basis. To the fullest extent permitted by law,
                            MangaReader excludes all representations, warranties, conditions and terms.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-purple-400 mb-4">9. Changes to Terms</h2>
                        <p className="text-gray-300 leading-relaxed">
                            We reserve the right to update or change our Terms of Service at any time. Any changes will be posted on this page
                            with an updated revision date.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-purple-400 mb-4">10. Contact Information</h2>
                        <p className="text-gray-300 leading-relaxed">
                            If you have any questions about these Terms of Service, please contact us at{' '}
                            <Link href="/contact" className="text-purple-400 hover:text-purple-300 underline">
                                our contact page
                            </Link>.
                        </p>
                    </section>
                </div>

                <div className="text-center mt-12">
                    <Link
                        href="/"
                        className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold py-3 px-8 rounded-xl transition-all duration-300"
                    >
                        Back to Home
                    </Link>
                </div>
            </div>
        </div>
    );
}
