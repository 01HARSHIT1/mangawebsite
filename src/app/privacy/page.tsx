"use client";
import Link from 'next/link';

export default function PrivacyPage() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white">
            <div className="max-w-4xl mx-auto px-4 py-16">
                <div className="text-center mb-12">
                    <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                        Privacy Policy
                    </h1>
                    <p className="text-gray-300">Last updated: {new Date().toLocaleDateString()}</p>
                </div>

                <div className="bg-slate-800/50 rounded-3xl p-8 backdrop-blur-sm space-y-8">
                    <section>
                        <h2 className="text-2xl font-bold text-purple-400 mb-4">1. Information We Collect</h2>
                        <div className="text-gray-300 leading-relaxed space-y-3">
                            <p><strong>Personal Information:</strong> When you create an account, we collect:</p>
                            <ul className="list-disc list-inside ml-4 space-y-2">
                                <li>Email address</li>
                                <li>Username</li>
                                <li>Profile information (optional)</li>
                                <li>Content you upload (manga, comments, etc.)</li>
                            </ul>
                            <p><strong>Usage Information:</strong> We automatically collect information about how you use our service:</p>
                            <ul className="list-disc list-inside ml-4 space-y-2">
                                <li>Pages visited and time spent</li>
                                <li>Reading history and preferences</li>
                                <li>Device and browser information</li>
                                <li>IP address and location data</li>
                            </ul>
                        </div>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-purple-400 mb-4">2. How We Use Your Information</h2>
                        <div className="text-gray-300 leading-relaxed space-y-3">
                            <p>We use the information we collect to:</p>
                            <ul className="list-disc list-inside ml-4 space-y-2">
                                <li>Provide and maintain our service</li>
                                <li>Personalize your experience and recommendations</li>
                                <li>Communicate with you about updates and features</li>
                                <li>Analyze usage patterns to improve our platform</li>
                                <li>Prevent fraud and ensure platform security</li>
                                <li>Comply with legal obligations</li>
                            </ul>
                        </div>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-purple-400 mb-4">3. Information Sharing</h2>
                        <div className="text-gray-300 leading-relaxed space-y-3">
                            <p>We do not sell, trade, or rent your personal information to third parties. We may share information in these limited circumstances:</p>
                            <ul className="list-disc list-inside ml-4 space-y-2">
                                <li><strong>With your consent:</strong> When you explicitly agree to share information</li>
                                <li><strong>Service providers:</strong> Trusted partners who help us operate our platform</li>
                                <li><strong>Legal requirements:</strong> When required by law or to protect our rights</li>
                                <li><strong>Business transfers:</strong> In case of merger, acquisition, or sale of assets</li>
                            </ul>
                        </div>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-purple-400 mb-4">4. Data Security</h2>
                        <div className="text-gray-300 leading-relaxed space-y-3">
                            <p>We implement appropriate security measures to protect your personal information:</p>
                            <ul className="list-disc list-inside ml-4 space-y-2">
                                <li>Encryption of sensitive data in transit and at rest</li>
                                <li>Regular security audits and updates</li>
                                <li>Limited access to personal information on a need-to-know basis</li>
                                <li>Secure authentication and password policies</li>
                            </ul>
                            <p>However, no method of transmission over the internet is 100% secure, and we cannot guarantee absolute security.</p>
                        </div>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-purple-400 mb-4">5. Cookies and Tracking</h2>
                        <div className="text-gray-300 leading-relaxed space-y-3">
                            <p>We use cookies and similar technologies to:</p>
                            <ul className="list-disc list-inside ml-4 space-y-2">
                                <li>Remember your login status and preferences</li>
                                <li>Analyze site traffic and usage patterns</li>
                                <li>Provide personalized content and recommendations</li>
                                <li>Improve our services and user experience</li>
                            </ul>
                            <p>You can control cookie settings through your browser, but some features may not work properly if cookies are disabled.</p>
                        </div>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-purple-400 mb-4">6. Your Rights and Choices</h2>
                        <div className="text-gray-300 leading-relaxed space-y-3">
                            <p>You have the following rights regarding your personal information:</p>
                            <ul className="list-disc list-inside ml-4 space-y-2">
                                <li><strong>Access:</strong> Request a copy of your personal data</li>
                                <li><strong>Correction:</strong> Update or correct inaccurate information</li>
                                <li><strong>Deletion:</strong> Request deletion of your account and data</li>
                                <li><strong>Portability:</strong> Receive your data in a structured format</li>
                                <li><strong>Opt-out:</strong> Unsubscribe from marketing communications</li>
                            </ul>
                            <p>To exercise these rights, please contact us through our support channels.</p>
                        </div>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-purple-400 mb-4">7. Data Retention</h2>
                        <p className="text-gray-300 leading-relaxed">
                            We retain your personal information for as long as necessary to provide our services and fulfill the purposes outlined in this policy.
                            When you delete your account, we will remove your personal information within 30 days, except where we are required to retain it for legal purposes.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-purple-400 mb-4">8. Children's Privacy</h2>
                        <p className="text-gray-300 leading-relaxed">
                            Our service is not directed to children under 13. We do not knowingly collect personal information from children under 13.
                            If you are a parent or guardian and believe your child has provided us with personal information, please contact us.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-purple-400 mb-4">9. International Data Transfers</h2>
                        <p className="text-gray-300 leading-relaxed">
                            Your information may be transferred to and processed in countries other than your country of residence.
                            We ensure appropriate safeguards are in place to protect your personal information in accordance with this privacy policy.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-purple-400 mb-4">10. Changes to This Policy</h2>
                        <p className="text-gray-300 leading-relaxed">
                            We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new policy on this page
                            and updating the "last updated" date. We encourage you to review this policy periodically.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-purple-400 mb-4">11. Contact Us</h2>
                        <p className="text-gray-300 leading-relaxed">
                            If you have any questions about this Privacy Policy or our data practices, please contact us at{' '}
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
