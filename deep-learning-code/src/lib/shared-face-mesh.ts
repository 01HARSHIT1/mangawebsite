// ⭐ Shared FaceMesh Singleton
// Prevents multiple FaceMesh instances that cause MediaPipe conflicts
// Both Eye Tracking and Auto-Brightness can share the same instance

import { FaceMesh } from '@mediapipe/face_mesh';

type FaceMeshOptions = {
    maxNumFaces?: number;
    refineLandmarks?: boolean;
    minDetectionConfidence?: number;
    minTrackingConfidence?: number;
};

type FaceMeshResultCallback = (results: any) => void;

class SharedFaceMeshManager {
    private static instance: SharedFaceMeshManager | null = null;
    private faceMesh: FaceMesh | null = null;
    private isInitializing = false;
    private initializationPromise: Promise<FaceMesh | null> | null = null;
    private subscribers: Set<FaceMeshResultCallback> = new Set();
    private options: FaceMeshOptions = {
        maxNumFaces: 1,
        refineLandmarks: false,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5,
    };

    private constructor() {
        // Private constructor for singleton
    }

    static getInstance(): SharedFaceMeshManager {
        if (!SharedFaceMeshManager.instance) {
            SharedFaceMeshManager.instance = new SharedFaceMeshManager();
        }
        return SharedFaceMeshManager.instance;
    }

    /**
     * Initialize FaceMesh with error handling and retry logic
     */
    async initialize(options?: FaceMeshOptions): Promise<FaceMesh | null> {
        // If already initialized, return existing instance
        if (this.faceMesh) {
            return this.faceMesh;
        }

        // If currently initializing, wait for that to complete
        if (this.isInitializing && this.initializationPromise) {
            return this.initializationPromise;
        }

        // Start initialization
        this.isInitializing = true;
        this.options = { ...this.options, ...options };

        this.initializationPromise = this._initializeWithRetry(1); // Reduced to 1 retry to prevent resource exhaustion
        const result = await this.initializationPromise;
        this.isInitializing = false;

        return result;
    }

    /**
     * Initialize with retry logic (up to maxRetries attempts)
     */
    private async _initializeWithRetry(maxRetries: number): Promise<FaceMesh | null> {
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                // Clean up any existing instance first
                if (this.faceMesh) {
                    try {
                        this.faceMesh.close?.();
                    } catch (e) {
                        // Ignore cleanup errors
                    }
                    this.faceMesh = null;
                }

                // Create new FaceMesh instance with error handling
                this.faceMesh = new FaceMesh({
                    locateFile: (file) => {
                        // Use CDN with cache busting prevention
                        const baseUrl = `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`;
                        return baseUrl;
                    },
                });

                // Set options
                this.faceMesh.setOptions({
                    maxNumFaces: this.options.maxNumFaces || 1,
                    refineLandmarks: this.options.refineLandmarks ?? false,
                    minDetectionConfidence: this.options.minDetectionConfidence || 0.5,
                    minTrackingConfidence: this.options.minTrackingConfidence || 0.5,
                });

                // Set up results handler that notifies all subscribers
                this.faceMesh.onResults((results) => {
                    // Notify all subscribers
                    this.subscribers.forEach((callback) => {
                        try {
                            callback(results);
                        } catch (error) {
                            // Silently handle subscriber errors
                            console.warn('🎯 Shared FaceMesh: Subscriber error', error);
                        }
                    });
                });

                console.log('✅ Shared FaceMesh: Initialized successfully');
                return this.faceMesh;
            } catch (error) {
                console.warn(`⚠️ Shared FaceMesh: Initialization attempt ${attempt} failed:`, error);
                
                // Clean up failed instance
                if (this.faceMesh) {
                    try {
                        this.faceMesh.close?.();
                    } catch (e) {
                        // Ignore cleanup errors
                    }
                    this.faceMesh = null;
                }

                // If this was the last attempt, return null
                if (attempt === maxRetries) {
                    console.error('❌ Shared FaceMesh: All initialization attempts failed');
                    return null;
                }

                // Wait before retrying (exponential backoff)
                await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
            }
        }

        return null;
    }

    /**
     * Subscribe to FaceMesh results
     */
    subscribe(callback: FaceMeshResultCallback): () => void {
        this.subscribers.add(callback);
        
        // Return unsubscribe function
        return () => {
            this.subscribers.delete(callback);
        };
    }

    /**
     * Send frame to FaceMesh (with error handling)
     */
    async sendFrame(videoElement: HTMLVideoElement): Promise<void> {
        if (!this.faceMesh) {
            return;
        }

        // Check if video is ready
        if (videoElement.readyState < 2) { // HAVE_CURRENT_DATA
            return;
        }

        try {
            // Send frame with promise rejection handling
            await this.faceMesh.send({ image: videoElement }).catch((error) => {
                // Silently handle promise rejections
                // These are often due to MediaPipe internal state issues
            });
        } catch (error) {
            // Silently handle send errors
            // These are often due to MediaPipe internal state issues
        }
    }

    /**
     * Get current FaceMesh instance (may be null if not initialized)
     */
    getFaceMesh(): FaceMesh | null {
        return this.faceMesh;
    }

    /**
     * Check if FaceMesh is initialized
     */
    isReady(): boolean {
        return this.faceMesh !== null;
    }

    /**
     * Cleanup and destroy FaceMesh instance
     */
    cleanup(): void {
        if (this.faceMesh) {
            try {
                this.faceMesh.close?.();
            } catch (error) {
                // Ignore cleanup errors
            }
            this.faceMesh = null;
        }
        this.subscribers.clear();
        this.isInitializing = false;
        this.initializationPromise = null;
    }
}

export const sharedFaceMesh = SharedFaceMeshManager.getInstance();

