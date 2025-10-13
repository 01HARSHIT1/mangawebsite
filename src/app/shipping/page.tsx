import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Shipping & Delivery Policy - MangaReader',
  description: 'Learn about our digital content delivery policy. Instant access to manga content with no physical shipping required.',
};

export default function ShippingPolicy() {
  return (
    <main className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow-lg rounded-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">
            Shipping & Delivery Policy
          </h1>
          
          <div className="prose prose-lg max-w-none">
            <p className="text-gray-600 mb-6">
              <strong>Time2fun</strong> specializes in digital manga content delivery. Since we deal exclusively with digital products, there is no physical shipping involved.
            </p>

            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Digital Content Delivery</h2>
            <p className="text-gray-700 mb-4">
              All our manga content is delivered digitally through our online platform. Upon successful payment, you will receive <strong>instant access</strong> to your purchased content without any physical delivery required.
            </p>

            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Processing Orders</h2>
            <p className="text-gray-700 mb-4">
              Our digital content processing is fully automated:
            </p>
            <ul className="list-disc list-inside text-gray-700 mb-6 space-y-2">
              <li><strong>Instant delivery</strong> - Content available immediately after payment</li>
              <li>No processing time required for digital content</li>
              <li>Automatic account activation for premium features</li>
              <li>Email confirmation sent to your registered email address</li>
            </ul>

            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Delivery Time</h2>
            <p className="text-gray-700 mb-4">
              Since we deal with <strong>digital content only</strong>, there is no traditional shipping involved. Your manga content will be available in your account immediately after successful payment processing.
            </p>

            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Access Methods</h2>
            <p className="text-gray-700 mb-4">
              You can access your purchased content through:
            </p>
            <ul className="list-disc list-inside text-gray-700 mb-6 space-y-2">
              <li>Web browser on any device</li>
              <li>Mobile app (when available)</li>
              <li>Your personal library section</li>
              <li>Direct links sent via email</li>
            </ul>

            <h2 className="text-2xl font-semibold text-gray-900 mb-4">No Physical Shipment</h2>
            <p className="text-gray-700 mb-4">
              We do not provide any physical products or shipping services. All our content is digital and accessible online. There are no shipping charges, delivery fees, or physical delivery involved in our service.
            </p>

            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Technical Requirements</h2>
            <p className="text-gray-700 mb-4">
              To access your digital content, you need:
            </p>
            <ul className="list-disc list-inside text-gray-700 mb-6 space-y-2">
              <li>Internet connection</li>
              <li>Web browser (Chrome, Firefox, Safari, Edge)</li>
              <li>Valid account with Time2fun</li>
              <li>Compatible device (computer, tablet, or smartphone)</li>
            </ul>

            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Customer Support</h2>
            <p className="text-gray-700 mb-4">
              If you experience any issues accessing your digital content, please contact our support team:
            </p>
            <ul className="list-disc list-inside text-gray-700 mb-6 space-y-2">
              <li>Email: <strong>harsshitrk0120@gmail.com</strong></li>
              <li>Phone: <strong>+91 7717743862</strong></li>
              <li>Available 24/7 for digital content support</li>
            </ul>

            <div className="bg-green-50 border-l-4 border-green-400 p-4 mt-8">
              <p className="text-green-800">
                <strong>Note:</strong> Since all our content is digital, there are no shipping delays, lost packages, or delivery issues. Your manga content is always available instantly upon purchase.
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
