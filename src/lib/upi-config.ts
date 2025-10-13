// UPI Configuration
export const UPI_CONFIG = {
    // Replace with your actual UPI ID
    UPI_ID: process.env.UPI_ID || 'mangareader@paytm',
    
    // Business name for UPI payments
    BUSINESS_NAME: 'MangaReader',
    
    // Payment gateway webhook URL
    WEBHOOK_URL: process.env.WEBHOOK_URL || 'https://mangawebsite.vercel.app/api/upi/webhook',
    
    // UPI payment timeout (in seconds)
    PAYMENT_TIMEOUT: 300, // 5 minutes
};

// Generate UPI payment URL
export function generateUPIPaymentUrl(amount: number, description: string, transactionId: string): string {
    const { UPI_ID, BUSINESS_NAME } = UPI_CONFIG;
    
    return `upi://pay?pa=${UPI_ID}&pn=${BUSINESS_NAME}&am=${amount}&cu=INR&tn=${encodeURIComponent(description)}&tr=${transactionId}`;
}

// Validate UPI ID format
export function isValidUPIId(upiId: string): boolean {
    const upiIdRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+$/;
    return upiIdRegex.test(upiId);
}
