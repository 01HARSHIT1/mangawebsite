// Real Eye Tracking using MediaPipe Face Mesh
// Detects gaze direction for auto-scrolling

import { FaceMesh } from '@mediapipe/face_mesh';
import { Camera } from '@mediapipe/camera_utils';

export interface GazeDirection {
    direction: 'up' | 'down' | 'left' | 'right' | 'center';
    confidence: number;
    eyePosition?: { x: number; y: number };
}

export class EyeTrackingEngine {
    private faceMesh: FaceMesh | null = null;
    private camera: Camera | null = null;
    private isInitialized = false;
    private gazeHistory: GazeDirection[] = [];
    private readonly historySize = 5;

    async initialize(videoElement: HTMLVideoElement, onResults: (gaze: GazeDirection) => void): Promise<void> {
        if (this.isInitialized) {
            return;
        }

        try {
            // Initialize MediaPipe Face Mesh
            this.faceMesh = new FaceMesh({
                locateFile: (file) => {
                    return `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`;
                }
            });

            this.faceMesh.setOptions({
                maxNumFaces: 1,
                refineLandmarks: true,
                minDetectionConfidence: 0.5,
                minTrackingConfidence: 0.5
            });

            // Process results
            this.faceMesh.onResults((results) => {
                if (results.multiFaceLandmarks && results.multiFaceLandmarks.length > 0) {
                    const gaze = this.detectGaze(results.multiFaceLandmarks[0]);
                    this.gazeHistory.push(gaze);
                    if (this.gazeHistory.length > this.historySize) {
                        this.gazeHistory.shift();
                    }
                    
                    // Use average of recent gaze directions for stability
                    const avgGaze = this.getAverageGaze();
                    onResults(avgGaze);
                }
            });

            // Initialize camera
            this.camera = new Camera(videoElement, {
                onFrame: async () => {
                    if (this.faceMesh) {
                        await this.faceMesh.send({ image: videoElement });
                    }
                },
                width: 640,
                height: 480
            });

            await this.camera.start();
            this.isInitialized = true;
        } catch (error) {
            console.error('Failed to initialize eye tracking:', error);
            throw error;
        }
    }

    private detectGaze(landmarks: any[]): GazeDirection {
        // Face Mesh landmark indices for eyes
        // Left eye: 33, 7, 163, 144, 145, 153, 154, 155, 133, 173, 157, 158, 159, 160, 161, 246
        // Right eye: 362, 382, 381, 380, 374, 373, 390, 249, 263, 466, 388, 387, 386, 385, 384, 398
        
        const leftEyeIndices = [33, 7, 163, 144, 145, 153, 154, 155, 133, 173, 157, 158, 159, 160, 161, 246];
        const rightEyeIndices = [362, 382, 381, 380, 374, 373, 390, 249, 263, 466, 388, 387, 386, 385, 384, 398];
        
        // Get eye center points
        const leftEyeCenter = this.getEyeCenter(landmarks, leftEyeIndices);
        const rightEyeCenter = this.getEyeCenter(landmarks, rightEyeIndices);
        
        // Calculate average eye position
        const eyeX = (leftEyeCenter.x + rightEyeCenter.x) / 2;
        const eyeY = (leftEyeCenter.y + rightEyeCenter.y) / 2;
        
        // Get nose tip (landmark 4) for reference
        const noseTip = landmarks[4];
        
        // Calculate gaze direction based on eye position relative to face center
        const faceCenterX = 0.5; // Normalized coordinates
        const faceCenterY = 0.5;
        
        const deltaX = eyeX - faceCenterX;
        const deltaY = eyeY - faceCenterY;
        
        // Determine direction
        let direction: 'up' | 'down' | 'left' | 'right' | 'center' = 'center';
        const threshold = 0.05; // Sensitivity threshold
        
        if (Math.abs(deltaX) > Math.abs(deltaY)) {
            // Horizontal movement
            if (deltaX > threshold) {
                direction = 'right';
            } else if (deltaX < -threshold) {
                direction = 'left';
            }
        } else {
            // Vertical movement
            if (deltaY > threshold) {
                direction = 'down';
            } else if (deltaY < -threshold) {
                direction = 'up';
            }
        }
        
        // Calculate confidence based on movement magnitude
        const magnitude = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
        const confidence = Math.min(magnitude * 10, 1.0);
        
        return {
            direction,
            confidence,
            eyePosition: { x: eyeX, y: eyeY }
        };
    }

    private getEyeCenter(landmarks: any[], indices: number[]): { x: number; y: number } {
        let sumX = 0;
        let sumY = 0;
        
        indices.forEach(index => {
            if (landmarks[index]) {
                sumX += landmarks[index].x;
                sumY += landmarks[index].y;
            }
        });
        
        return {
            x: sumX / indices.length,
            y: sumY / indices.length
        };
    }

    private getAverageGaze(): GazeDirection {
        if (this.gazeHistory.length === 0) {
            return { direction: 'center', confidence: 0 };
        }
        
        // Count directions
        const directionCounts: { [key: string]: number } = {};
        let totalConfidence = 0;
        
        this.gazeHistory.forEach(gaze => {
            directionCounts[gaze.direction] = (directionCounts[gaze.direction] || 0) + 1;
            totalConfidence += gaze.confidence;
        });
        
        // Get most common direction
        let maxCount = 0;
        let dominantDirection: 'up' | 'down' | 'left' | 'right' | 'center' = 'center';
        
        Object.entries(directionCounts).forEach(([dir, count]) => {
            if (count > maxCount) {
                maxCount = count;
                dominantDirection = dir as any;
            }
        });
        
        const avgConfidence = totalConfidence / this.gazeHistory.length;
        
        return {
            direction: dominantDirection,
            confidence: avgConfidence
        };
    }

    stop(): void {
        if (this.camera) {
            this.camera.stop();
            this.camera = null;
        }
        
        if (this.faceMesh) {
            this.faceMesh.close();
            this.faceMesh = null;
        }
        
        this.isInitialized = false;
        this.gazeHistory = [];
    }

    isReady(): boolean {
        return this.isInitialized;
    }
}

