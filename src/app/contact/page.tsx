import ContactForm from '@/components/ContactForm';

export default function ContactPage() {
    return (
        <div className="min-h-screen bg-gray-900 text-white py-12">
            <div className="max-w-4xl mx-auto px-4">
                <div className="text-center mb-12">
                    <h1 className="text-4xl font-bold mb-4">Get in Touch</h1>
                    <p className="text-xl text-gray-400">
                        Have questions, feedback, or need support? We're here to help!
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2">
                        <ContactForm />
                    </div>

                    <div className="space-y-6">
                        <div className="bg-gray-800 rounded-lg p-6">
                            <h3 className="text-lg font-semibold mb-4">Contact Information</h3>
                            <div className="space-y-3 text-gray-300">
                                <p>📧 Email: support@mangawebsite.com</p>
                                <p>🌐 Website: www.mangawebsite.com</p>
                                <p>⏰ Response Time: Within 24 hours</p>
                            </div>
                        </div>

                        <div className="bg-gray-800 rounded-lg p-6">
                            <h3 className="text-lg font-semibold mb-4">Common Questions</h3>
                            <div className="space-y-3 text-sm text-gray-300">
                                <div>
                                    <p className="font-medium">How do I upload manga?</p>
                                    <p>Visit the upload page and follow the step-by-step guide.</p>
                                </div>
                                <div>
                                    <p className="font-medium">How do I become a creator?</p>
                                    <p>Upload your first manga and request creator status.</p>
                                </div>
                                <div>
                                    <p className="font-medium">How do I report content?</p>
                                    <p>Use the report button on any manga, chapter, or user profile.</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-gray-800 rounded-lg p-6">
                            <h3 className="text-lg font-semibold mb-4">Support Hours</h3>
                            <div className="space-y-2 text-gray-300">
                                <p>Monday - Friday: 9:00 AM - 6:00 PM</p>
                                <p>Saturday: 10:00 AM - 4:00 PM</p>
                                <p>Sunday: Closed</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
} 