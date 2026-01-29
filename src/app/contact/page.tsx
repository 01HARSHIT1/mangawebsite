import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Contact Us - RealmVerse Support',
  description: 'Get in touch with RealmVerse support team. Email: harsshitrk0120@gmail.com, Phone: +91 7717743862',
};

export default function ContactPage() {
  return (
    <main className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow-lg rounded-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">
            Contact Us
          </h1>

          <div className="prose prose-lg max-w-none">
            <p className="text-gray-600 mb-6">
              We're here to help! Get in touch with the <strong>Time2fun</strong> support team for any questions, concerns, or assistance with your manga reading experience.
            </p>

            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Get in Touch</h2>
            <p className="text-gray-700 mb-4">
              Our dedicated support team is available to assist you with any issues related to your account, payments, content access, or general inquiries.
            </p>

            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Contact Information</h2>
            <div className="bg-gray-50 rounded-lg p-6 mb-6">
              <div className="space-y-4">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-500">Email Address</p>
                    <p className="text-lg text-gray-900"><strong>harsshitrk0120@gmail.com</strong></p>
                  </div>
                </div>

                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-500">Phone Number</p>
                    <p className="text-lg text-gray-900"><strong>+91 7717743862</strong></p>
                  </div>
                </div>

                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-500">Business Name</p>
                    <p className="text-lg text-gray-900"><strong>Time2fun</strong></p>
                  </div>
                </div>
              </div>
            </div>

            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Support Hours</h2>
            <p className="text-gray-700 mb-4">
              Our customer support team is available:
            </p>
            <ul className="list-disc list-inside text-gray-700 mb-6 space-y-2">
              <li><strong>24/7</strong> for urgent technical issues</li>
              <li><strong>Monday to Friday</strong> - 9:00 AM to 6:00 PM IST</li>
              <li><strong>Saturday</strong> - 10:00 AM to 4:00 PM IST</li>
              <li><strong>Sunday</strong> - Emergency support only</li>
            </ul>

            <h2 className="text-2xl font-semibold text-gray-900 mb-4">What We Can Help With</h2>
            <p className="text-gray-700 mb-4">
              Our support team can assist you with:
            </p>
            <ul className="list-disc list-inside text-gray-700 mb-6 space-y-2">
              <li>Account registration and login issues</li>
              <li>Payment and billing questions</li>
              <li>Content access and download problems</li>
              <li>Technical support for the platform</li>
              <li>Refund and cancellation requests</li>
              <li>General inquiries about our services</li>
            </ul>

            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Response Time</h2>
            <p className="text-gray-700 mb-4">
              We aim to respond to all inquiries within:
            </p>
            <ul className="list-disc list-inside text-gray-700 mb-6 space-y-2">
              <li><strong>Email</strong> - Within 24 hours</li>
              <li><strong>Phone calls</strong> - Immediate response during business hours</li>
              <li><strong>Urgent issues</strong> - Within 2-4 hours</li>
            </ul>

            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Business Address</h2>
            <p className="text-gray-700 mb-4">
              <strong>Time2fun</strong><br />
              Digital Content Platform<br />
              India<br />
              <em>Note: We operate as a digital platform and do not have a physical storefront.</em>
            </p>

            <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mt-8">
              <p className="text-blue-800">
                <strong>Quick Tip:</strong> For faster support, please include your account email and a detailed description of the issue when contacting us. This helps us provide more accurate and timely assistance.
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
} 