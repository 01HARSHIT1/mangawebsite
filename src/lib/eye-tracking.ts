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
            console.log('👁️ Eye Tracking Engine: Initializing MediaPipe Face Mesh...');
            
            // Initialize MediaPipe Face Mesh with better error handling
            this.faceMesh = new FaceMesh({
                locateFile: (file) => {
                    // Use CDN for MediaPipe files
                    const cdnUrl = `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`;
                    console.log('👁️ Eye Tracking Engine: Loading MediaPipe file:', file, 'from', cdnUrl);
                    return cdnUrl;
                }
            });

            console.log('👁️ Eye Tracking Engine: Setting Face Mesh options...');
            this.faceMesh.setOptions({
                maxNumFaces: 1,
                refineLandmarks: true,
                minDetectionConfidence: 0.5,
                minTrackingConfidence: 0.5
            });
            
            console.log('👁️ Eye Tracking Engine: Face Mesh options set successfully');

            // Process results
            console.log('👁️ Eye Tracking Engine: Setting up results handler...');
            this.faceMesh.onResults((results) => {
                if (results.multiFaceLandmarks && results.multiFaceLandmarks.length > 0) {
                    const gaze = this.detectGaze(results.multiFaceLandmarks[0]);
                    this.gazeHistory.push(gaze);
                    if (this.gazeHistory.length > this.historySize) {
                        this.gazeHistory.shift();
                    }
                    
                    // Use average of recent gaze directions for stability
                    const avgGaze = this.getAverageGaze();
                    
                    // Only log significant gaze changes to avoid console spam
                    if (avgGaze.confidence > 0.3) {
                        console.log('👁️ Eye Tracking Engine: Gaze detected', {
                            direction: avgGaze.direction,
                            confidence: avgGaze.confidence.toFixed(2)
                        });
                    }
                    
                    onResults(avgGaze);
                } else {
                    // No face detected - return center with low confidence
                    onResults({ direction: 'center', confidence: 0 });
                }
            });
            
            console.log('👁️ Eye Tracking Engine: Results handler set up');

            // Initialize camera
            console.log('👁️ Eye Tracking Engine: Initializing camera...');
            this.camera = new Camera(videoElement, {
                onFrame: async () => {
                    if (this.faceMesh) {
                        try {
                            await this.faceMesh.send({ image: videoElement });
                        } catch (error) {
                            console.error('👁️ Eye Tracking Engine: Error processing frame:', error);
                        }
                    }
                },
                width: 640,
                height: 480
            });

            console.log('👁️ Eye Tracking Engine: Starting camera...');
            await this.camera.start();
            this.isInitialized = true;
            console.log('👁️ Eye Tracking Engine: ✅ Initialization complete! Camera is running.');
        } catch (error: any) {
            console.error('👁️ Eye Tracking Engine: ❌ Failed to initialize:', error);
            console.error('👁️ Eye Tracking Engine: Error details:', {
                name: error?.name,
                message: error?.message,
                stack: error?.stack?.substring(0, 200)
            });
            throw error;
        }
    }

    private detectGaze(landmarks: any[]): GazeDirection {
        // Enhanced gaze detection using eye landmarks and iris position
        // More accurate for manga reading scenarios
        
        // Key eye landmarks for better accuracy
        // Left eye corners: 33 (left), 133 (right)
        // Right eye corners: 362 (left), 263 (right)
        // Eye centers: 468 (left), 473 (right) - if available
        const leftEyeLeft = landmarks[33];
        const leftEyeRight = landmarks[133];
        const rightEyeLeft = landmarks[362];
        const rightEyeRight = landmarks[263];
        
        // Calculate eye centers more accurately
        const leftEyeCenter = {
            x: (leftEyeLeft.x + leftEyeRight.x) / 2,
            y: (leftEyeLeft.y + leftEyeRight.y) / 2
        };
        const rightEyeCenter = {
            x: (rightEyeLeft.x + rightEyeRight.x) / 2,
            y: (rightEyeLeft.y + rightEyeRight.y) / 2
        };
        
        // Average eye position
        const eyeX = (leftEyeCenter.x + rightEyeCenter.x) / 2;
        const eyeY = (leftEyeCenter.y + rightEyeCenter.y) / 2;
        
        // Get face bounding box for normalization
        const faceMinX = Math.min(...landmarks.map(l => l.x));
        const faceMaxX = Math.max(...landmarks.map(l => l.x));
        const faceMinY = Math.min(...landmarks.map(l => l.y));
        const faceMaxY = Math.max(...landmarks.map(l => l.y));
        
        const faceWidth = faceMaxX - faceMinX;
        const faceHeight = faceMaxY - faceMinY;
        const faceCenterX = (faceMinX + faceMaxX) / 2;
        const faceCenterY = (faceMinY + faceMaxY) / 2;
        
        // Normalize eye position relative to face
        const normalizedX = (eyeX - faceCenterX) / faceWidth;
        const normalizedY = (eyeY - faceCenterY) / faceHeight;
        
        // Enhanced thresholds for manga reading (more sensitive for scrolling)
        const verticalThreshold = 0.02; // More sensitive for up/down (manga scrolling) - lowered from 0.03
        const horizontalThreshold = 0.05; // Less sensitive for left/right
        
        // Determine direction with priority for vertical (manga reading)
        let direction: 'up' | 'down' | 'left' | 'right' | 'center' = 'center';
        
        // Prioritize vertical movement for manga scrolling
        // Note: In MediaPipe coordinates, Y increases downward
        // normalizedY > 0 means eye is BELOW face center (looking down)
        // normalizedY < 0 means eye is ABOVE face center (looking up)
        if (Math.abs(normalizedY) > verticalThreshold) {
            if (normalizedY > 0) {
                // Eye is below center = looking down = should scroll DOWN
                direction = 'down';
            } else {
                // Eye is above center = looking up = should scroll UP
                direction = 'up';
            }
        } else if (Math.abs(normalizedX) > horizontalThreshold) {
            if (normalizedX > 0) {
                direction = 'right';
            } else {
                direction = 'left';
            }
        }
        
        // Calculate confidence based on movement magnitude and consistency
        const verticalMagnitude = Math.abs(normalizedY);
        const horizontalMagnitude = Math.abs(normalizedX);
        const maxMagnitude = Math.max(verticalMagnitude, horizontalMagnitude);
        
        // Higher confidence for stronger movements - increased multiplier for better sensitivity
        const confidence = Math.min(maxMagnitude * 20, 1.0); // Increased from 15 to 20
        
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

