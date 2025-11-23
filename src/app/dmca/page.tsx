export const dynamic = 'force-dynamic';

export default function DMCAPage() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white py-16 px-4">
            <div className="max-w-4xl mx-auto">
                <h1 className="text-4xl font-bold mb-8">DMCA Policy</h1>
                
                <div className="bg-slate-800/50 rounded-lg p-8 space-y-6">
                    <section>
                        <h2 className="text-2xl font-semibold mb-4">Digital Millennium Copyright Act (DMCA) Notice</h2>
                        <p className="text-gray-300 leading-relaxed">
                            We respect the intellectual property rights of others and expect our users to do the same. 
                            In accordance with the Digital Millennium Copyright Act (DMCA), we will respond to clear 
                            notices of alleged copyright infringement.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold mb-4">Filing a DMCA Takedown Notice</h2>
                        <p className="text-gray-300 leading-relaxed mb-4">
                            If you believe that content on our platform infringes your copyright, please provide the following information:
                        </p>
                        <ul className="list-disc list-inside space-y-2 text-gray-300 ml-4">
                            <li>Identification of the copyrighted work claimed to have been infringed</li>
                            <li>Identification of the material that is claimed to be infringing</li>
                            <li>Your contact information (name, address, phone, email)</li>
                            <li>A statement that you have a good faith belief that use of the material is not authorized</li>
                            <li>A statement that the information in the notification is accurate</li>
                            <li>Your physical or electronic signature</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold mb-4">Contact Information</h2>
                        <p className="text-gray-300">
                            Please send DMCA notices to our designated agent at:
                        </p>
                        <div className="bg-slate-900/50 rounded p-4 mt-4">
                            <p className="text-gray-300">
                                <strong>Email:</strong> dmca@mangareader.com
                            </p>
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
}

