// UPI Configuration
export const UPI_CONFIG = {
    // Your personal UPI ID for direct payments
    PERSONAL_UPI_ID: 'harsshitrk0120@oksbi',
    
    // Business name for UPI payments
    BUSINESS_NAME: 'MangaReader',
    
    // Payment gateway webhook URL
    WEBHOOK_URL: process.env.WEBHOOK_URL || 'https://mangawebsite.vercel.app/api/upi/webhook',
    
    // UPI payment timeout (in seconds)
    PAYMENT_TIMEOUT: 300, // 5 minutes
    
    // Razorpay configuration
    RAZORPAY_KEY_ID: process.env.RAZORPAY_KEY_ID,
    RAZORPAY_KEY_SECRET: process.env.RAZORPAY_KEY_SECRET,
};

// Generate UPI payment URL using personal UPI ID
export function generateUPIPaymentUrl(amount: number, description: string, transactionId: string): string {
    const { PERSONAL_UPI_ID, BUSINESS_NAME } = UPI_CONFIG;
    
    return `upi://pay?pa=${PERSONAL_UPI_ID}&pn=${BUSINESS_NAME}&am=${amount}&cu=INR&tn=${encodeURIComponent(description)}&tr=${transactionId}`;
}

// Generate Razorpay QR code
export async function generateRazorpayQR(amount: number, description: string, userId: string) {
    const Razorpay = require('razorpay');
    
    const razorpay = new Razorpay({
        key_id: UPI_CONFIG.RAZORPAY_KEY_ID,
        key_secret: UPI_CONFIG.RAZORPAY_KEY_SECRET,
    });

    try {
        const qr = await razorpay.qrCodes.create({
            type: "upi_qr",
            name: `MangaReader - ${description}`,
            usage: "single_use",
            fixed_amount: true,
            payment_amount: Math.round(amount * 100), // Convert to paise
            close_by: Math.floor(Date.now() / 1000) + 300, // 5 minutes
            notes: {
                userId: userId,
                description: description,
                amount: amount
            }
        });

        return {
            success: true,
            qrCodeId: qr.id,
            imageUrl: qr.image_url,
            vpa: qr.vpa,
            amount: qr.payment_amount,
            status: qr.status
        };
    } catch (error) {
        console.error('Razorpay QR creation failed:', error);
        return {
            success: false,
            error: error.message || 'Failed to create Razorpay QR'
        };
    }
}

// Validate UPI ID format
export function isValidUPIId(upiId: string): boolean {
    const upiIdRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+$/;
    return upiIdRegex.test(upiId);
}
