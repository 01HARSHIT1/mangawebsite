/**
 * Client-safe Cloudinary URL optimization (STEP 5 - optimize images).
 * Use for list/cover images: resize + auto format/quality so covers load fast.
 * Does not require env or server - works on full Cloudinary URLs only.
 */
const CLOUDINARY_UPLOAD = '/upload/';
const COVER_TRANSFORM = 'q_auto,f_auto,w_400,c_limit/'; // cover: 400px width, auto format/quality

export function getOptimizedCoverUrl(url: string | { secure_url?: string } | undefined, width = 400): string {
    if (!url) return '/placeholder.svg';
    const raw = typeof url === 'string' ? url : url?.secure_url || '';
    if (!raw || !raw.includes('cloudinary.com') || !raw.includes(CLOUDINARY_UPLOAD)) {
        return raw || '/placeholder.svg';
    }
    const transform = `q_auto,f_auto,w_${width},c_limit/`;
    if (raw.includes(CLOUDINARY_UPLOAD) && !raw.includes('q_auto')) {
        return raw.replace(CLOUDINARY_UPLOAD, CLOUDINARY_UPLOAD + transform);
    }
    return raw;
}
