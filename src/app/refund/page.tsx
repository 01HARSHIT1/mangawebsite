import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Cancellation & Refund Policy - MangaReader',
  description: 'Learn about our refund and cancellation policy for digital manga content. 7-day refund policy with full support.',
};

export default function RefundPolicy() {
  return (
    <main className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow-lg rounded-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">
            Cancellation & Refund Policy
          </h1>
          
          <div className="prose prose-lg max-w-none">
            <p className="text-gray-600 mb-6">
              <strong>Time2fun</strong> follows a transparent and customer-friendly refund and cancellation policy for all digital manga content and premium services.
            </p>

            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Refund Eligibility</h2>
            <p className="text-gray-700 mb-4">
              We offer a <strong>7-day refund policy</strong> for all purchases made on our platform. If you are not satisfied with your digital manga purchase or premium subscription, you can request a full refund within 7 days of your purchase date.
            </p>

            <h2 className="text-2xl font-semibold text-gray-900 mb-4">How to Request a Refund</h2>
            <p className="text-gray-700 mb-4">
              To initiate a <strong>return request</strong>, please contact our support team using the following methods:
            </p>
            <ul className="list-disc list-inside text-gray-700 mb-6 space-y-2">
              <li>Email: <strong>harsshitrk0120@gmail.com</strong></li>
              <li>Phone: <strong>+91 7717743862</strong></li>
              <li>Include your order number and reason for refund</li>
            </ul>

            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Refund Processing</h2>
            <p className="text-gray-700 mb-4">
              Once your <strong>cancellation request</strong> is received, our team will review it within 24-48 hours. Approved refunds will be processed back to your original payment method within 5-7 business days.
            </p>

            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Non-Refundable Items</h2>
            <p className="text-gray-700 mb-4">
              The following items are not eligible for refunds:
            </p>
            <ul className="list-disc list-inside text-gray-700 mb-6 space-y-2">
              <li>Digital content that has been fully consumed or downloaded</li>
              <li>Premium subscriptions after 7 days of activation</li>
              <li>Coins or virtual currency that has been used</li>
            </ul>

            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Contact Support</h2>
            <p className="text-gray-700 mb-4">
              For any questions regarding our refund policy or to submit a <strong>refund request</strong>, please contact our customer support team. We are committed to resolving all refund-related issues promptly and fairly.
            </p>

            <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mt-8">
              <p className="text-blue-800">
                <strong>Note:</strong> This refund policy applies to all digital manga content and services provided by Time2fun. For any disputes or concerns, please contact our support team immediately.
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
