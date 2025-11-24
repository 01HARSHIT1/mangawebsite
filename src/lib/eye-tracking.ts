// Real Eye Tracking using MediaPipe Face Mesh
// Detects gaze direction for auto-scrolling

import { FaceMesh } from '@mediapipe/face_mesh';
import { Camera } from '@mediapipe/camera_utils';

export interface GazeDirection {
    direction: 'up' | 'down' | 'left' | 'right' | 'center';
    confidence: number;
    eyePosition?: { x: number; y: number };
    // New: Screen position where user is looking (0-1, normalized to viewport)
    screenPosition?: { x: number; y: number };
    // New: Viewport zone (top, middle, bottom)
    viewportZone?: 'top' | 'middle' | 'bottom';
    // New: Scroll intensity (-1 to 1, negative = scroll up, positive = scroll down)
    scrollIntensity?: number;
    // New: Raw normalized eye position (for calibration)
    normalizedEyePosition?: { x: number; y: number };
}

export interface CalibrationData {
    scrollUp: { normalizedY: number; samples: number[] }; // When user says "scroll up", what normalizedY value
    scrollDown: { normalizedY: number; samples: number[] }; // When user says "scroll down", what normalizedY value
    noScroll: { normalizedY: number; samples: number[] }; // When user says "don't scroll", what normalizedY value
    calibrated: boolean;
}

export class EyeTrackingEngine {
    private faceMesh: FaceMesh | null = null;
    private camera: Camera | null = null;
    private isInitialized = false;
    private gazeHistory: GazeDirection[] = [];
    private readonly historySize = 5;
    private calibrationData: CalibrationData | null = null;
    
    // Load calibration from localStorage
    loadCalibration(): CalibrationData | null {
        if (typeof window === 'undefined') return null;
        try {
            const stored = localStorage.getItem('eyeTrackingCalibration');
            if (stored) {
                const data = JSON.parse(stored) as CalibrationData;
                this.calibrationData = data;
                console.log('👁️ Eye Tracking: Loaded calibration data', data);
                return data;
            }
        } catch (error) {
            console.error('👁️ Eye Tracking: Failed to load calibration', error);
        }
        return null;
    }
    
    // Save calibration to localStorage
    saveCalibration(data: CalibrationData): void {
        if (typeof window === 'undefined') return;
        try {
            localStorage.setItem('eyeTrackingCalibration', JSON.stringify(data));
            this.calibrationData = data;
            console.log('👁️ Eye Tracking: Saved calibration data', data);
        } catch (error) {
            console.error('👁️ Eye Tracking: Failed to save calibration', error);
        }
    }
    
    // Add a calibration sample
    addCalibrationSample(action: 'scrollUp' | 'scrollDown' | 'noScroll', normalizedY: number): void {
        if (!this.calibrationData) {
            this.calibrationData = {
                scrollUp: { normalizedY: 0, samples: [] },
                scrollDown: { normalizedY: 0, samples: [] },
                noScroll: { normalizedY: 0, samples: [] },
                calibrated: false
            };
        }
        
        this.calibrationData[action].samples.push(normalizedY);
        // Keep only last 20 samples per action
        if (this.calibrationData[action].samples.length > 20) {
            this.calibrationData[action].samples.shift();
        }
        
        // Calculate average
        const samples = this.calibrationData[action].samples;
        this.calibrationData[action].normalizedY = samples.reduce((a, b) => a + b, 0) / samples.length;
        
        // Mark as calibrated if we have at least 5 samples for each action
        if (this.calibrationData.scrollUp.samples.length >= 5 &&
            this.calibrationData.scrollDown.samples.length >= 5 &&
            this.calibrationData.noScroll.samples.length >= 5) {
            this.calibrationData.calibrated = true;
        }
        
        this.saveCalibration(this.calibrationData);
        console.log('👁️ Eye Tracking: Added calibration sample', { action, normalizedY, calibration: this.calibrationData });
    }
    
    // Get calibration data
    getCalibration(): CalibrationData | null {
        return this.calibrationData;
    }
    
    // Clear calibration
    clearCalibration(): void {
        this.calibrationData = null;
        if (typeof window !== 'undefined') {
            localStorage.removeItem('eyeTrackingCalibration');
        }
        console.log('👁️ Eye Tracking: Calibration cleared');
    }

    async initialize(videoElement: HTMLVideoElement, onResults: (gaze: GazeDirection) => void): Promise<void> {
        if (this.isInitialized) {
            return;
        }

        // Load calibration data
        this.loadCalibration();

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
        // Enhanced gaze detection that calculates screen position and viewport zones
        // This allows smooth, proportional scrolling based on where user is looking
        
        // Key eye landmarks
        const leftEyeLeft = landmarks[33];
        const leftEyeRight = landmarks[133];
        const rightEyeLeft = landmarks[362];
        const rightEyeRight = landmarks[263];
        
        // Calculate eye centers
        const leftEyeCenter = {
            x: (leftEyeLeft.x + leftEyeRight.x) / 2,
            y: (leftEyeLeft.y + leftEyeRight.y) / 2
        };
        const rightEyeCenter = {
            x: (rightEyeLeft.x + rightEyeRight.x) / 2,
            y: (rightEyeLeft.y + rightEyeRight.y) / 2
        };
        
        // Average eye position (normalized 0-1 in MediaPipe coordinates)
        const eyeX = (leftEyeCenter.x + rightEyeCenter.x) / 2;
        const eyeY = (leftEyeCenter.y + rightEyeCenter.y) / 2;
        
        // Get face bounding box
        const faceMinX = Math.min(...landmarks.map(l => l.x));
        const faceMaxX = Math.max(...landmarks.map(l => l.x));
        const faceMinY = Math.min(...landmarks.map(l => l.y));
        const faceMaxY = Math.max(...landmarks.map(l => l.y));
        
        const faceWidth = faceMaxX - faceMinX;
        const faceHeight = faceMaxY - faceMinY;
        const faceCenterX = (faceMinX + faceMaxX) / 2;
        const faceCenterY = (faceMinY + faceMaxY) / 2;
        
        // Normalize eye position relative to face center
        // This gives us how far the eyes have moved from face center
        const normalizedX = (eyeX - faceCenterX) / faceWidth;
        const normalizedY = (eyeY - faceCenterY) / faceHeight;
        
        // Use calibration data if available, otherwise use default thresholds
        let viewportZone: 'top' | 'middle' | 'bottom' = 'middle';
        let scrollIntensity = 0;
        let clampedScreenY = 0.5; // Default center
        let clampedScreenX = 0.5; // Default center
        
        if (this.calibrationData && this.calibrationData.calibrated) {
            // Use calibrated thresholds
            const scrollUpY = this.calibrationData.scrollUp.normalizedY;
            const scrollDownY = this.calibrationData.scrollDown.normalizedY;
            const noScrollY = this.calibrationData.noScroll.normalizedY;
            
            // Determine which action based on calibrated values
            // Find which calibrated value is closest to current normalizedY
            const distToUp = Math.abs(normalizedY - scrollUpY);
            const distToDown = Math.abs(normalizedY - scrollDownY);
            const distToNoScroll = Math.abs(normalizedY - noScrollY);
            
            const minDist = Math.min(distToUp, distToDown, distToNoScroll);
            
            if (minDist === distToUp) {
                // Closest to scroll up position
                viewportZone = 'top';
                // Calculate intensity based on distance from no-scroll zone
                const range = Math.abs(scrollUpY - noScrollY);
                if (range > 0) {
                    scrollIntensity = -Math.min(1, Math.abs(normalizedY - noScrollY) / range);
                } else {
                    scrollIntensity = -0.5;
                }
            } else if (minDist === distToDown) {
                // Closest to scroll down position
                viewportZone = 'bottom';
                // Calculate intensity based on distance from no-scroll zone
                const range = Math.abs(scrollDownY - noScrollY);
                if (range > 0) {
                    scrollIntensity = Math.min(1, Math.abs(normalizedY - noScrollY) / range);
                } else {
                    scrollIntensity = 0.5;
                }
            } else {
                // Closest to no-scroll position
                viewportZone = 'middle';
                scrollIntensity = 0;
            }
            
            // Map normalizedY to screen position for display
            // Use calibrated values to map
            const minY = Math.min(scrollUpY, scrollDownY, noScrollY);
            const maxY = Math.max(scrollUpY, scrollDownY, noScrollY);
            const rangeY = maxY - minY;
            if (rangeY > 0) {
                clampedScreenY = (normalizedY - minY) / rangeY;
            } else {
                clampedScreenY = 0.5;
            }
            clampedScreenY = Math.max(0, Math.min(1, clampedScreenY));
            
            // Calculate screen X position
            clampedScreenX = 0.5 + (normalizedX * 2);
            clampedScreenX = Math.max(0, Math.min(1, clampedScreenX));
        } else {
            // Default behavior (no calibration)
            // Map eye movement to screen position
            const screenX = 0.5 + (normalizedX * 2);
            const screenY = 0.5 + (normalizedY * 2);
            
            clampedScreenX = Math.max(0, Math.min(1, screenX));
            clampedScreenY = Math.max(0, Math.min(1, screenY));
            
            // Default thresholds
            const TOP_ZONE_THRESHOLD = 0.3;
            const BOTTOM_ZONE_THRESHOLD = 0.7;
            
            if (clampedScreenY < TOP_ZONE_THRESHOLD) {
                viewportZone = 'top';
                scrollIntensity = -((TOP_ZONE_THRESHOLD - clampedScreenY) / TOP_ZONE_THRESHOLD);
            } else if (clampedScreenY > BOTTOM_ZONE_THRESHOLD) {
                viewportZone = 'bottom';
                scrollIntensity = (clampedScreenY - BOTTOM_ZONE_THRESHOLD) / (1 - BOTTOM_ZONE_THRESHOLD);
            } else {
                viewportZone = 'middle';
                scrollIntensity = 0;
            }
        }
        
        const finalScreenX = Math.max(0, Math.min(1, clampedScreenX));
        
        // Determine direction for backward compatibility
        let direction: 'up' | 'down' | 'left' | 'right' | 'center' = 'center';
        const verticalThreshold = 0.02;
        const horizontalThreshold = 0.05;
        
        if (Math.abs(normalizedY) > verticalThreshold) {
            direction = normalizedY > 0 ? 'down' : 'up';
        } else if (Math.abs(normalizedX) > horizontalThreshold) {
            direction = normalizedX > 0 ? 'right' : 'left';
        }
        
        // Calculate confidence based on how far from center
        const distanceFromCenter = Math.sqrt(normalizedX ** 2 + normalizedY ** 2);
        const confidence = Math.min(distanceFromCenter * 10, 1.0);
        
        return {
            direction,
            confidence,
            eyePosition: { x: eyeX, y: eyeY },
            screenPosition: { x: finalScreenX, y: clampedScreenY },
            viewportZone,
            scrollIntensity,
            normalizedEyePosition: { x: normalizedX, y: normalizedY }
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
        
        // Get the most recent gaze (for calibration and real-time accuracy)
        const latestGaze = this.gazeHistory[this.gazeHistory.length - 1];
        
        // Count directions for averaging
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
        
        // Return latest gaze with averaged direction and confidence
        return {
            ...latestGaze,
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

