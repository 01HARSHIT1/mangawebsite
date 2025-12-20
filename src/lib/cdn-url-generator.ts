// CDN URL Generation and Signed URLs for Secure Media Delivery
// Supports Cloudinary, AWS CloudFront, and generic CDN

import { v2 as cloudinary } from 'cloudinary';
import crypto from 'crypto';

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

interface SignedURLParams {
    url: string;
    expiresIn?: number; // seconds
    userId?: string;
    episodeId?: string;
    seriesId?: string;
}

interface CDNConfig {
    provider: 'cloudinary' | 'cloudfront' | 'generic';
    baseUrl?: string;
    secretKey?: string;
    keyPairId?: string; // For CloudFront
    privateKey?: string; // For CloudFront
}

export class CDNUrlGenerator {
    private config: CDNConfig;

    constructor(config?: CDNConfig) {
        this.config = config || {
            provider: (process.env.CDN_PROVIDER as any) || 'cloudinary',
            baseUrl: process.env.CDN_BASE_URL,
            secretKey: process.env.CDN_SECRET_KEY,
            keyPairId: process.env.CLOUDFRONT_KEY_PAIR_ID,
            privateKey: process.env.CLOUDFRONT_PRIVATE_KEY
        };
    }

    // Generate signed URL for secure media access
    async generateSignedURL(params: SignedURLParams): Promise<string> {
        const { url, expiresIn = 3600, userId, episodeId, seriesId } = params;

        switch (this.config.provider) {
            case 'cloudinary':
                return this.generateCloudinarySignedURL(url, expiresIn);
            case 'cloudfront':
                return this.generateCloudFrontSignedURL(url, expiresIn);
            case 'generic':
                return this.generateGenericSignedURL(url, expiresIn, userId, episodeId, seriesId);
            default:
                return url; // Return original URL if no signing configured
        }
    }

    // Generate Cloudinary signed URL
    private async generateCloudinarySignedURL(url: string, expiresIn: number): Promise<string> {
        try {
            // Cloudinary automatically signs URLs when using the SDK
            // For manual signing, extract public_id and generate signature
            const publicIdMatch = url.match(/\/v\d+\/(.+?)(?:\.[^.]+)?$/);
            if (!publicIdMatch) {
                return url; // Return original if can't parse
            }

            const publicId = publicIdMatch[1];
            const timestamp = Math.floor(Date.now() / 1000) + expiresIn;
            const signature = cloudinary.utils.api_sign_request(
                {
                    public_id: publicId,
                    timestamp: timestamp
                },
                this.config.secretKey || process.env.CLOUDINARY_API_SECRET || ''
            );

            // Reconstruct signed URL
            const baseUrl = url.split('/v')[0];
            return `${baseUrl}/v${timestamp}/${publicId}?signature=${signature}`;
        } catch (error) {
            console.error('Error generating Cloudinary signed URL:', error);
            return url;
        }
    }

    // Generate AWS CloudFront signed URL
    private generateCloudFrontSignedURL(url: string, expiresIn: number): Promise<string> {
        return new Promise((resolve, reject) => {
            try {
                if (!this.config.privateKey || !this.config.keyPairId) {
                    console.warn('CloudFront credentials not configured');
                    resolve(url);
                    return;
                }

                // Parse CloudFront URL
                const urlObj = new URL(url);
                const resource = `${urlObj.protocol}//${urlObj.host}${urlObj.pathname}`;
                const expires = Math.floor(Date.now() / 1000) + expiresIn;

                // Create policy
                const policy = JSON.stringify({
                    Statement: [{
                        Resource: resource,
                        Condition: {
                            DateLessThan: {
                                'AWS:EpochTime': expires
                            }
                        }
                    }]
                });

                // Sign policy
                const sign = crypto.createSign('RSA-SHA1');
                sign.update(policy);
                const signature = sign.sign(this.config.privateKey, 'base64');

                // Generate signed URL
                const signedUrl = new URL(url);
                signedUrl.searchParams.set('Expires', expires.toString());
                signedUrl.searchParams.set('Signature', signature);
                signedUrl.searchParams.set('Key-Pair-Id', this.config.keyPairId!);

                resolve(signedUrl.toString());
            } catch (error) {
                console.error('Error generating CloudFront signed URL:', error);
                reject(error);
            }
        });
    }

    // Generate generic signed URL (HMAC-based)
    private generateGenericSignedURL(
        url: string,
        expiresIn: number,
        userId?: string,
        episodeId?: string,
        seriesId?: string
    ): Promise<string> {
        return new Promise((resolve) => {
            try {
                if (!this.config.secretKey) {
                    resolve(url);
                    return;
                }

                const expires = Math.floor(Date.now() / 1000) + expiresIn;
                const urlObj = new URL(url);

                // Create signature payload
                const payload = {
                    url: urlObj.pathname,
                    expires,
                    userId: userId || '',
                    episodeId: episodeId || '',
                    seriesId: seriesId || ''
                };

                const payloadString = JSON.stringify(payload);
                const signature = crypto
                    .createHmac('sha256', this.config.secretKey)
                    .update(payloadString)
                    .digest('hex');

                // Add signature to URL
                urlObj.searchParams.set('expires', expires.toString());
                urlObj.searchParams.set('signature', signature);
                if (userId) urlObj.searchParams.set('userId', userId);
                if (episodeId) urlObj.searchParams.set('episodeId', episodeId);
                if (seriesId) urlObj.searchParams.set('seriesId', seriesId);

                resolve(urlObj.toString());
            } catch (error) {
                console.error('Error generating generic signed URL:', error);
                resolve(url);
            }
        });
    }

    // Generate CDN URL with transformations (Cloudinary)
    generateCDNUrl(
        publicId: string,
        transformations?: {
            width?: number;
            height?: number;
            quality?: string;
            format?: string;
            crop?: string;
        }
    ): string {
        if (this.config.provider === 'cloudinary') {
            return cloudinary.url(publicId, {
                secure: true,
                ...transformations
            });
        }

        // For other CDNs, construct URL manually
        if (this.config.baseUrl) {
            let url = `${this.config.baseUrl}/${publicId}`;
            if (transformations) {
                const params = new URLSearchParams();
                if (transformations.width) params.set('w', transformations.width.toString());
                if (transformations.height) params.set('h', transformations.height.toString());
                if (transformations.quality) params.set('q', transformations.quality);
                if (transformations.format) params.set('f', transformations.format);
                if (params.toString()) {
                    url += `?${params.toString()}`;
                }
            }
            return url;
        }

        return publicId;
    }

    // Verify signed URL
    verifySignedURL(url: string): boolean {
        try {
            const urlObj = new URL(url);
            const signature = urlObj.searchParams.get('signature');
            const expires = urlObj.searchParams.get('expires');

            if (!signature || !expires) {
                return false;
            }

            // Check expiration
            const expiresTime = parseInt(expires);
            if (Date.now() / 1000 > expiresTime) {
                return false;
            }

            // Verify signature (implementation depends on provider)
            // For now, just check expiration
            return true;
        } catch (error) {
            console.error('Error verifying signed URL:', error);
            return false;
        }
    }

    // Generate HLS manifest URL with signed segments
    async generateHLSManifestURL(
        baseManifestUrl: string,
        expiresIn: number = 3600
    ): Promise<string> {
        // In production, you would:
        // 1. Fetch the manifest
        // 2. Sign each segment URL
        // 3. Return modified manifest

        // For now, just sign the manifest URL itself
        return this.generateSignedURL({
            url: baseManifestUrl,
            expiresIn
        });
    }
}

// Export singleton instance
export const cdnUrlGenerator = new CDNUrlGenerator();

