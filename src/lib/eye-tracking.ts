// Real Eye Tracking using MediaPipe Face Mesh
// Detects gaze direction for auto-scrolling
// Enhanced with Deep Learning (TensorFlow.js) + Statistical Pattern Matching
// Professional-grade intent detection with 5-zone system and fixation time

import { FaceMesh } from '@mediapipe/face_mesh';
import { Camera } from '@mediapipe/camera_utils';
import { EyeTrackingMLModel } from './eye-tracking-ml';
import { EyeTrackingIntentDetector } from './eye-tracking-intent';

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
    scrollUp: { 
        normalizedY: number; // Average
        samples: number[]; // All samples
        mean: number; // Statistical mean
        stdDev: number; // Standard deviation for range detection
        min: number; // Min value from samples
        max: number; // Max value from samples
    };
    scrollDown: { 
        normalizedY: number;
        samples: number[];
        mean: number;
        stdDev: number;
        min: number;
        max: number;
    };
    noScroll: { 
        normalizedY: number;
        samples: number[];
        mean: number;
        stdDev: number;
        min: number;
        max: number;
    };
    calibrated: boolean;
}

// DEFAULT/MASTER CALIBRATION - Loaded from master-calibration-data.json
// This file is updated once with your calibration samples and used for all users
let DEFAULT_MASTER_CALIBRATION: CalibrationData = {
    scrollUp: {
        normalizedY: 0,
        samples: [],
        mean: 0,
        stdDev: 0,
        min: 0,
        max: 0
    },
    scrollDown: {
        normalizedY: 0,
        samples: [],
        mean: 0,
        stdDev: 0,
        min: 0,
        max: 0
    },
    noScroll: {
        normalizedY: 0,
        samples: [],
        mean: 0,
        stdDev: 0,
        min: 0,
        max: 0
    },
    calibrated: false
};

// Import master calibration data (Next.js will bundle this at build time)
import masterCalibrationData from './master-calibration-data.json';

// Load master calibration from JSON file
function loadMasterCalibrationFromFile(): CalibrationData | null {
    try {
        const calibrationData = masterCalibrationData as CalibrationData;
        if (calibrationData && calibrationData.calibrated) {
            DEFAULT_MASTER_CALIBRATION = calibrationData;
            console.log('👁️ Eye Tracking: ✅ Loaded master calibration from JSON file');
            return calibrationData;
        }
    } catch (error) {
        console.log('👁️ Eye Tracking: Master calibration file not found or not calibrated yet');
    }
    return null;
}

// Initialize with imported data on module load
if (masterCalibrationData && (masterCalibrationData as CalibrationData).calibrated) {
    DEFAULT_MASTER_CALIBRATION = masterCalibrationData as CalibrationData;
    console.log('👁️ Eye Tracking: ✅ Master calibration loaded and ready');
}

export class EyeTrackingEngine {
    private faceMesh: FaceMesh | null = null;
    private camera: Camera | null = null;
    private isInitialized = false;
    private gazeHistory: GazeDirection[] = [];
    private readonly historySize = 7; // Increased for better smoothing
    private calibrationData: CalibrationData | null = null;
    // Smoothing for normalizedY to reduce jitter (reduced for real-time response)
    private normalizedYHistory: number[] = [];
    private readonly smoothingHistorySize = 3; // Reduced from 5 to 3 for faster, real-time response
    // Zone stability - require multiple frames in same zone before changing
    private currentZone: 'top' | 'middle' | 'bottom' | null = null;
    private zoneConfidence: number = 0;
    private readonly zoneStabilityThreshold = 1; // Require 1 frame for faster response (reduced from 3)
    // Deep Learning Model (TensorFlow.js)
    private mlModel: EyeTrackingMLModel | null = null;
    private mlModelReady = false;
    
    // Professional Eye Tracking: Intent Detection System
    private intentDetector: EyeTrackingIntentDetector | null = null;
    
    // Initialize intent detector (lazy initialization)
    private getIntentDetector(): EyeTrackingIntentDetector {
        if (!this.intentDetector) {
            this.intentDetector = new EyeTrackingIntentDetector();
        }
        return this.intentDetector;
    }
    
    // Calculate statistics helper (static for use in default calibration)
    private static calculateStatistics(samples: number[]): { mean: number; stdDev: number; min: number; max: number } {
        if (samples.length === 0) {
            return { mean: 0, stdDev: 0, min: 0, max: 0 };
        }
        
        const mean = samples.reduce((a, b) => a + b, 0) / samples.length;
        const variance = samples.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / samples.length;
        const stdDev = Math.sqrt(variance);
        const min = Math.min(...samples);
        const max = Math.max(...samples);
        
        return { mean, stdDev, min, max };
    }
    
    // Set master/default calibration from samples (call this once with your samples)
    static setMasterCalibration(samples: {
        scrollUp: number[];
        scrollDown: number[];
        noScroll: number[];
    }): CalibrationData {
        const scrollUpStats = this.calculateStatistics(samples.scrollUp);
        const scrollDownStats = this.calculateStatistics(samples.scrollDown);
        const noScrollStats = this.calculateStatistics(samples.noScroll);
        
        const masterCalibration: CalibrationData = {
            scrollUp: {
                normalizedY: scrollUpStats.mean,
                samples: samples.scrollUp,
                mean: scrollUpStats.mean,
                stdDev: scrollUpStats.stdDev,
                min: scrollUpStats.min,
                max: scrollUpStats.max
            },
            scrollDown: {
                normalizedY: scrollDownStats.mean,
                samples: samples.scrollDown,
                mean: scrollDownStats.mean,
                stdDev: scrollDownStats.stdDev,
                min: scrollDownStats.min,
                max: scrollDownStats.max
            },
            noScroll: {
                normalizedY: noScrollStats.mean,
                samples: samples.noScroll,
                mean: noScrollStats.mean,
                stdDev: noScrollStats.stdDev,
                min: noScrollStats.min,
                max: noScrollStats.max
            },
            calibrated: true
        };
        
        // Update the default/master calibration
        DEFAULT_MASTER_CALIBRATION = masterCalibration;
        
        console.log('👁️ Eye Tracking: ✅ Master calibration set for all users!', {
            scrollUp: { mean: scrollUpStats.mean.toFixed(4), stdDev: scrollUpStats.stdDev.toFixed(4), range: `${scrollUpStats.min.toFixed(3)}-${scrollUpStats.max.toFixed(3)}` },
            scrollDown: { mean: scrollDownStats.mean.toFixed(4), stdDev: scrollDownStats.stdDev.toFixed(4), range: `${scrollDownStats.min.toFixed(3)}-${scrollDownStats.max.toFixed(3)}` },
            noScroll: { mean: noScrollStats.mean.toFixed(4), stdDev: noScrollStats.stdDev.toFixed(4), range: `${noScrollStats.min.toFixed(3)}-${noScrollStats.max.toFixed(3)}` }
        });
        
        return masterCalibration;
    }
    
    // Get master/default calibration
    static getMasterCalibration(): CalibrationData {
        return DEFAULT_MASTER_CALIBRATION;
    }
    
    // Export calibration data for hardcoding (call this to get the values)
    static exportCalibrationForHardcoding(): string {
        if (typeof window === 'undefined') {
            return JSON.stringify(DEFAULT_MASTER_CALIBRATION, null, 2);
        }
        
        // Try to get from localStorage first
        try {
            const stored = localStorage.getItem('eyeTrackingCalibration');
            if (stored) {
                const data = JSON.parse(stored) as CalibrationData;
                if (data.calibrated) {
                    return JSON.stringify(data, null, 2);
                }
            }
        } catch (error) {
            console.error('Failed to export calibration:', error);
        }
        
        // Fallback to master calibration
        return JSON.stringify(DEFAULT_MASTER_CALIBRATION, null, 2);
    }
    
    // Initialize ML Model
    async initializeMLModel(): Promise<void> {
        if (typeof window === 'undefined') {
            return; // Server-side: skip ML model
        }
        
        try {
            this.mlModel = new EyeTrackingMLModel();
            
            // Try to load existing model
            const loaded = await this.mlModel.loadModel();
            
            if (!loaded && this.calibrationData && this.calibrationData.calibrated) {
                // Train new model if calibration data is available
                console.log('👁️ ML: Training new model from calibration data...');
                await this.mlModel.trainModel({
                    scrollUp: this.calibrationData.scrollUp.samples,
                    scrollDown: this.calibrationData.scrollDown.samples,
                    noScroll: this.calibrationData.noScroll.samples
                }, (epoch, logs) => {
                    if (epoch % 20 === 0) {
                        console.log(`👁️ ML: Training progress - Epoch ${epoch + 1}, Loss: ${logs?.loss?.toFixed(4)}`);
                    }
                });
                
                // Save trained model
                await this.mlModel.saveModel();
            }
            
            this.mlModelReady = this.mlModel.isReady();
            console.log('👁️ ML: Model ready:', this.mlModelReady);
        } catch (error) {
            console.warn('👁️ ML: Failed to initialize ML model, using statistical approach only:', error);
            this.mlModelReady = false;
        }
    }
    
    // Load calibration from localStorage, or use default master calibration
    loadCalibration(): CalibrationData | null {
        // First, ensure master calibration is loaded from file
        if (!DEFAULT_MASTER_CALIBRATION.calibrated) {
            loadMasterCalibrationFromFile();
        }
        
        if (typeof window === 'undefined') {
            // Server-side: return master calibration
            return DEFAULT_MASTER_CALIBRATION.calibrated ? DEFAULT_MASTER_CALIBRATION : null;
        }
        
        try {
            // First, try to load user's personal calibration
            const stored = localStorage.getItem('eyeTrackingCalibration');
            if (stored) {
                const userData = JSON.parse(stored) as CalibrationData;
                
                // IMPROVED: Merge user feedback with master calibration for better accuracy
                // Combine samples from master calibration and user feedback
                let mergedData: CalibrationData = {
                    scrollUp: {
                        normalizedY: 0,
                        samples: [],
                        mean: 0,
                        stdDev: 0,
                        min: 0,
                        max: 0
                    },
                    scrollDown: {
                        normalizedY: 0,
                        samples: [],
                        mean: 0,
                        stdDev: 0,
                        min: 0,
                        max: 0
                    },
                    noScroll: {
                        normalizedY: 0,
                        samples: [],
                        mean: 0,
                        stdDev: 0,
                        min: 0,
                        max: 0
                    },
                    calibrated: false
                };
                
                // Merge samples: master calibration + user feedback
                ['scrollUp', 'scrollDown', 'noScroll'].forEach((action) => {
                    const masterSamples = DEFAULT_MASTER_CALIBRATION.calibrated 
                        ? DEFAULT_MASTER_CALIBRATION[action as keyof CalibrationData]?.samples || []
                        : [];
                    const userSamples = userData[action as keyof CalibrationData]?.samples || [];
                    
                    // Combine all samples (master + user feedback)
                    const allSamples = [...masterSamples, ...userSamples];
                    
                    if (allSamples.length > 0) {
                        const stats = this.calculateStatistics(allSamples);
                        mergedData[action as keyof CalibrationData] = {
                            normalizedY: stats.mean,
                            samples: allSamples,
                            mean: stats.mean,
                            stdDev: stats.stdDev,
                            min: stats.min,
                            max: stats.max
                        };
                    } else if (userData[action as keyof CalibrationData]?.samples?.length > 0) {
                        // Fallback to user data if no master samples
                        const userAction = userData[action as keyof CalibrationData];
                        const stats = this.calculateStatistics(userAction.samples);
                        mergedData[action as keyof CalibrationData] = {
                            normalizedY: stats.mean,
                            samples: userAction.samples,
                            mean: stats.mean,
                            stdDev: stats.stdDev,
                            min: stats.min,
                            max: stats.max
                        };
                    }
                });
                
                // Mark as calibrated if we have samples
                mergedData.calibrated = (
                    mergedData.scrollUp.samples.length >= 5 &&
                    mergedData.scrollDown.samples.length >= 5 &&
                    mergedData.noScroll.samples.length >= 5
                );
                
                this.calibrationData = mergedData;
                
                // Initialize ML model after calibration is loaded
                this.initializeMLModel().catch(err => {
                    console.warn('👁️ ML: Failed to initialize after calibration load:', err);
                });
                
                console.log('👁️ Eye Tracking: ✅ Loaded MERGED calibration (Master + User Feedback)', {
                    scrollUp: { 
                        mean: mergedData.scrollUp.mean.toFixed(4), 
                        stdDev: mergedData.scrollUp.stdDev.toFixed(4), 
                        samples: mergedData.scrollUp.samples.length,
                        masterSamples: DEFAULT_MASTER_CALIBRATION.calibrated ? DEFAULT_MASTER_CALIBRATION.scrollUp.samples.length : 0,
                        userSamples: userData.scrollUp?.samples?.length || 0
                    },
                    scrollDown: { 
                        mean: mergedData.scrollDown.mean.toFixed(4), 
                        stdDev: mergedData.scrollDown.stdDev.toFixed(4), 
                        samples: mergedData.scrollDown.samples.length,
                        masterSamples: DEFAULT_MASTER_CALIBRATION.calibrated ? DEFAULT_MASTER_CALIBRATION.scrollDown.samples.length : 0,
                        userSamples: userData.scrollDown?.samples?.length || 0
                    },
                    noScroll: { 
                        mean: mergedData.noScroll.mean.toFixed(4), 
                        stdDev: mergedData.noScroll.stdDev.toFixed(4), 
                        samples: mergedData.noScroll.samples.length,
                        masterSamples: DEFAULT_MASTER_CALIBRATION.calibrated ? DEFAULT_MASTER_CALIBRATION.noScroll.samples.length : 0,
                        userSamples: userData.noScroll?.samples?.length || 0
                    },
                    totalSamples: mergedData.scrollUp.samples.length + mergedData.scrollDown.samples.length + mergedData.noScroll.samples.length,
                    calibrated: mergedData.calibrated
                });
                return mergedData;
            }
            
            // No user calibration found - use master/default calibration
            if (DEFAULT_MASTER_CALIBRATION.calibrated) {
                this.calibrationData = DEFAULT_MASTER_CALIBRATION;
                
                // Initialize ML model with master calibration
                this.initializeMLModel().catch(err => {
                    console.warn('👁️ ML: Failed to initialize with master calibration:', err);
                });
                
                console.log('👁️ Eye Tracking: Using master/default calibration for all users', {
                    scrollUp: { mean: DEFAULT_MASTER_CALIBRATION.scrollUp.mean.toFixed(4), stdDev: DEFAULT_MASTER_CALIBRATION.scrollUp.stdDev.toFixed(4) },
                    scrollDown: { mean: DEFAULT_MASTER_CALIBRATION.scrollDown.mean.toFixed(4), stdDev: DEFAULT_MASTER_CALIBRATION.scrollDown.stdDev.toFixed(4) },
                    noScroll: { mean: DEFAULT_MASTER_CALIBRATION.noScroll.mean.toFixed(4), stdDev: DEFAULT_MASTER_CALIBRATION.noScroll.stdDev.toFixed(4) }
                });
                return DEFAULT_MASTER_CALIBRATION;
            }
        } catch (error) {
            console.error('👁️ Eye Tracking: Failed to load calibration', error);
        }
        
        // Fallback to master if available
        return DEFAULT_MASTER_CALIBRATION.calibrated ? DEFAULT_MASTER_CALIBRATION : null;
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
    
    // Calculate statistics from samples
    private calculateStatistics(samples: number[]): { mean: number; stdDev: number; min: number; max: number } {
        return EyeTrackingEngine.calculateStatistics(samples);
    }
    
    // Add a calibration sample
    addCalibrationSample(action: 'scrollUp' | 'scrollDown' | 'noScroll', normalizedY: number): void {
        if (!this.calibrationData) {
            this.calibrationData = {
                scrollUp: { normalizedY: 0, samples: [], mean: 0, stdDev: 0, min: 0, max: 0 },
                scrollDown: { normalizedY: 0, samples: [], mean: 0, stdDev: 0, min: 0, max: 0 },
                noScroll: { normalizedY: 0, samples: [], mean: 0, stdDev: 0, min: 0, max: 0 },
                calibrated: false
            };
        }
        
        this.calibrationData[action].samples.push(normalizedY);
        // Keep only last 20 samples per action
        if (this.calibrationData[action].samples.length > 20) {
            this.calibrationData[action].samples.shift();
        }
        
        // Calculate statistics from all samples
        const stats = this.calculateStatistics(this.calibrationData[action].samples);
        this.calibrationData[action].normalizedY = stats.mean; // Keep for backward compatibility
        this.calibrationData[action].mean = stats.mean;
        this.calibrationData[action].stdDev = stats.stdDev;
        this.calibrationData[action].min = stats.min;
        this.calibrationData[action].max = stats.max;
        
        // Mark as calibrated if we have at least 5 samples for each action
        if (this.calibrationData.scrollUp.samples.length >= 5 &&
            this.calibrationData.scrollDown.samples.length >= 5 &&
            this.calibrationData.noScroll.samples.length >= 5) {
            this.calibrationData.calibrated = true;
            console.log('👁️ Eye Tracking: ✅ Calibration complete! Learned patterns:', {
                scrollUp: { mean: stats.mean, range: `${stats.min.toFixed(3)}-${stats.max.toFixed(3)}` },
                scrollDown: { mean: this.calibrationData.scrollDown.mean, range: `${this.calibrationData.scrollDown.min.toFixed(3)}-${this.calibrationData.scrollDown.max.toFixed(3)}` },
                noScroll: { mean: this.calibrationData.noScroll.mean, range: `${this.calibrationData.noScroll.min.toFixed(3)}-${this.calibrationData.noScroll.max.toFixed(3)}` }
            });
        }
        
        this.saveCalibration(this.calibrationData);
        console.log('👁️ Eye Tracking: Added calibration sample', { 
            action, 
            normalizedY, 
            samples: this.calibrationData[action].samples.length,
            mean: stats.mean.toFixed(4),
            stdDev: stats.stdDev.toFixed(4)
        });
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
        
        // Initialize ML model (async, won't block)
        this.initializeMLModel().catch(err => {
            console.warn('👁️ ML: Failed to initialize ML model:', err);
        });

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
                minDetectionConfidence: 0.3, // Lowered from 0.5 for better detection
                minTrackingConfidence: 0.3   // Lowered from 0.5 for better detection
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
                    
                    // Log detection for debugging (reduced frequency)
                    if (Math.random() < 0.05) { // 5% of frames
                        console.log('👁️ Eye Tracking Engine: Face detected', {
                            landmarks: results.multiFaceLandmarks[0].length,
                            direction: avgGaze.direction,
                            confidence: avgGaze.confidence.toFixed(2),
                            hasCalibration: !!this.calibrationData?.calibrated
                        });
                    }
                    
                    onResults(avgGaze);
                } else {
                    // No face detected - log more frequently for debugging
                    if (Math.random() < 0.1) { // 10% of frames for better debugging
                        console.warn('👁️ Eye Tracking Engine: ⚠️ No face detected in frame', {
                            hasImage: !!results.image,
                            imageWidth: results.image?.width,
                            imageHeight: results.image?.height,
                            multiFaceLandmarks: results.multiFaceLandmarks?.length || 0,
                            timestamp: new Date().toISOString()
                        });
                    }
                    // Return center with low confidence (but not 0 to show system is working)
                    onResults({ 
                        direction: 'center', 
                        confidence: 0.1, // Small confidence to indicate system is active but no face
                        viewportZone: 'middle',
                        scrollIntensity: 0
                    });
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
                        } catch (error: any) {
                            // Only log errors that aren't related to intent detector (those are handled)
                            if (!error?.message?.includes('detectIntent')) {
                                // Log occasionally to avoid spam
                                if (Math.random() < 0.01) {
                                    console.warn('👁️ Eye Tracking Engine: Error processing frame:', error?.message || error);
                                }
                            }
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
        
        // Validate landmarks
        if (!landmarks || landmarks.length < 468) {
            // Don't log every frame - only occasionally
            if (Math.random() < 0.05) {
                console.warn('👁️ Eye Tracking: Invalid landmarks array', { 
                    length: landmarks?.length,
                    hasLandmarks: !!landmarks 
                });
            }
            return { direction: 'center', confidence: 0.1, viewportZone: 'middle', scrollIntensity: 0 };
        }
        
        // Key eye landmarks
        const leftEyeLeft = landmarks[33];
        const leftEyeRight = landmarks[133];
        const rightEyeLeft = landmarks[362];
        const rightEyeRight = landmarks[263];
        
        // Validate eye landmarks exist
        if (!leftEyeLeft || !leftEyeRight || !rightEyeLeft || !rightEyeRight) {
            // Don't log every frame - only occasionally
            if (Math.random() < 0.05) {
                console.warn('👁️ Eye Tracking: Missing eye landmarks', {
                    leftEyeLeft: !!leftEyeLeft,
                    leftEyeRight: !!leftEyeRight,
                    rightEyeLeft: !!rightEyeLeft,
                    rightEyeRight: !!rightEyeRight
                });
            }
            return { direction: 'center', confidence: 0.1, viewportZone: 'middle', scrollIntensity: 0 };
        }
        
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
            // Use learned patterns from calibration samples
            // Calculate how well current position matches each learned pattern
            const scrollUpData = this.calibrationData.scrollUp;
            const scrollDownData = this.calibrationData.scrollDown;
            const noScrollData = this.calibrationData.noScroll;
            
            // REAL-TIME DETECTION: Use minimal smoothing for immediate response
            // Store history for display purposes only, but use recent value for zone detection
            this.normalizedYHistory.push(normalizedY);
            if (this.normalizedYHistory.length > 3) { // Reduced from 5 to 3 for faster response
                this.normalizedYHistory.shift();
            }
            
            // Use MOST RECENT value (80% weight) + slight smoothing (20% weight) for real-time response
            // This gives immediate zone changes while reducing minor jitter
            let detectionY = normalizedY; // Primary: use raw value for real-time
            if (this.normalizedYHistory.length > 1) {
                const recent = this.normalizedYHistory[this.normalizedYHistory.length - 1];
                const previous = this.normalizedYHistory[this.normalizedYHistory.length - 2] || recent;
                // 80% current, 20% previous for minimal smoothing
                detectionY = (recent * 0.8) + (previous * 0.2);
            }
            
            // REAL-TIME ZONE DETECTION: Use tighter ranges for immediate, accurate zone detection
            const scrollUpRangeTight = {
                min: scrollUpData.mean - (1.0 * scrollUpData.stdDev),
                max: scrollUpData.mean + (1.0 * scrollUpData.stdDev)
            };
            const scrollDownRangeTight = {
                min: scrollDownData.mean - (1.0 * scrollDownData.stdDev),
                max: scrollDownData.mean + (1.0 * scrollDownData.stdDev)
            };
            const noScrollRangeTight = {
                min: noScrollData.mean - (1.0 * noScrollData.stdDev),
                max: noScrollData.mean + (1.0 * noScrollData.stdDev)
            };
            
            // Wider ranges for fallback (1.5*stdDev)
            const scrollUpRange = {
                min: scrollUpData.mean - (1.5 * scrollUpData.stdDev),
                max: scrollUpData.mean + (1.5 * scrollUpData.stdDev)
            };
            const scrollDownRange = {
                min: scrollDownData.mean - (1.5 * scrollDownData.stdDev),
                max: scrollDownData.mean + (1.5 * scrollDownData.stdDev)
            };
            const noScrollRange = {
                min: noScrollData.mean - (1.5 * noScrollData.stdDev),
                max: noScrollData.mean + (1.5 * noScrollData.stdDev)
            };
            
            // Check if current position is within tight ranges first (maximum precision)
            const inScrollUpRangeTight = detectionY >= scrollUpRangeTight.min && detectionY <= scrollUpRangeTight.max;
            const inScrollDownRangeTight = detectionY >= scrollDownRangeTight.min && detectionY <= scrollDownRangeTight.max;
            const inNoScrollRangeTight = detectionY >= noScrollRangeTight.min && detectionY <= noScrollRangeTight.max;
            
            // Fallback to wider ranges if not in tight range
            const inScrollUpRange = detectionY >= scrollUpRange.min && detectionY <= scrollUpRange.max;
            const inScrollDownRange = detectionY >= scrollDownRange.min && detectionY <= scrollDownRange.max;
            const inNoScrollRange = detectionY >= noScrollRange.min && detectionY <= noScrollRange.max;
            
            // ADVANCED ZONE DETECTION: Use Gaussian probability distributions for better accuracy
            // This method is more robust when zones overlap significantly
            
            // Calculate Gaussian probability for each zone
            const calculateGaussianProbability = (value: number, mean: number, stdDev: number): number => {
                if (stdDev === 0) return value === mean ? 1 : 0;
                const variance = stdDev * stdDev;
                const diff = value - mean;
                return Math.exp(-0.5 * (diff * diff) / variance) / (stdDev * Math.sqrt(2 * Math.PI));
            };
            
            // Calculate probabilities for each zone
            const probUp = calculateGaussianProbability(detectionY, scrollUpData.mean, scrollUpData.stdDev);
            const probDown = calculateGaussianProbability(detectionY, scrollDownData.mean, scrollDownData.stdDev);
            const probNoScroll = calculateGaussianProbability(detectionY, noScrollData.mean, noScrollData.stdDev);
            
            // Normalize probabilities (make them sum to 1)
            const totalProb = probUp + probDown + probNoScroll;
            const normalizedProbUp = totalProb > 0 ? probUp / totalProb : 0.33;
            const normalizedProbDown = totalProb > 0 ? probDown / totalProb : 0.33;
            const normalizedProbNoScroll = totalProb > 0 ? probNoScroll / totalProb : 0.34;
            
            // Also calculate Mahalanobis distance (normalized distance accounting for variance)
            const mahalanobisDistance = (value: number, mean: number, stdDev: number): number => {
                if (stdDev === 0) return Math.abs(value - mean);
                return Math.abs(value - mean) / stdDev;
            };
            
            const mahalDistUp = mahalanobisDistance(detectionY, scrollUpData.mean, scrollUpData.stdDev);
            const mahalDistDown = mahalanobisDistance(detectionY, scrollDownData.mean, scrollDownData.stdDev);
            const mahalDistNoScroll = mahalanobisDistance(detectionY, noScrollData.mean, noScrollData.stdDev);
            
            // STATISTICAL APPROACH: Combine probability and distance for best accuracy
            // Weight: 60% probability, 40% Mahalanobis distance (inverse)
            const statScoreUp = (normalizedProbUp * 0.6) + ((1 / (1 + mahalDistUp)) * 0.4);
            const statScoreDown = (normalizedProbDown * 0.6) + ((1 / (1 + mahalDistDown)) * 0.4);
            const statScoreNoScroll = (normalizedProbNoScroll * 0.6) + ((1 / (1 + mahalDistNoScroll)) * 0.4);
            
            // DEEP LEARNING APPROACH: Get ML model prediction if available
            // Use synchronous prediction for real-time performance
            let mlPrediction = null;
            if (this.mlModel && this.mlModelReady) {
                try {
                    const features = this.mlModel.extractFeatures(landmarks);
                    if (features) {
                        // Use synchronous prediction (fast for small models)
                        mlPrediction = this.mlModel.predictSync(features);
                    }
                } catch (error) {
                    // Ignore errors, use statistical approach only
                    console.warn('👁️ ML: Prediction error, using statistical approach:', error);
                }
            }
            
            // HYBRID ENSEMBLE: Combine ML (60%) + Statistical (40%) for maximum accuracy
            let finalScoreUp: number;
            let finalScoreDown: number;
            let finalScoreNoScroll: number;
            
            if (mlPrediction) {
                // ML model provides probabilities
                const mlProbUp = mlPrediction.probabilities.top;
                const mlProbDown = mlPrediction.probabilities.bottom;
                const mlProbNoScroll = mlPrediction.probabilities.middle;
                
                // Combine: 60% ML + 40% Statistical
                finalScoreUp = (mlProbUp * 0.6) + (statScoreUp * 0.4);
                finalScoreDown = (mlProbDown * 0.6) + (statScoreDown * 0.4);
                finalScoreNoScroll = (mlProbNoScroll * 0.6) + (statScoreNoScroll * 0.4);
            } else {
                // Fallback to statistical only
                finalScoreUp = statScoreUp;
                finalScoreDown = statScoreDown;
                finalScoreNoScroll = statScoreNoScroll;
            }
            
            // SIMPLIFIED ZONE DETECTION: Use closest mean for accurate detection
            // Since calibration values are very close, use simple distance-based detection
            let detectedZone: 'top' | 'middle' | 'bottom';
            let baseIntensity = 0;
            let detectionConfidence = 0;
            
            // Calculate distances to each zone center (using calibration means)
            const distToUp = Math.abs(detectionY - scrollUpData.mean);
            const distToDown = Math.abs(detectionY - scrollDownData.mean);
            const distToMiddle = Math.abs(detectionY - noScrollData.mean);
            
            // Find which zone is closest (simple and accurate)
            const minDist = Math.min(distToUp, distToDown, distToMiddle);
            
            // Determine zone based on closest distance
            if (minDist === distToUp) {
                // Closest to scrollUp mean
                detectedZone = 'top';
                detectionConfidence = finalScoreUp;
                // Calculate intensity based on how far from middle
                const distFromMiddle = Math.abs(detectionY - noScrollData.mean);
                const maxDist = Math.abs(scrollUpData.mean - noScrollData.mean);
                baseIntensity = maxDist > 0 ? -Math.min(1, Math.max(0.5, distFromMiddle / maxDist)) : -0.7;
            } else if (minDist === distToDown) {
                // Closest to scrollDown mean
                detectedZone = 'bottom';
                detectionConfidence = finalScoreDown;
                // Calculate intensity based on how far from middle
                const distFromMiddle = Math.abs(detectionY - noScrollData.mean);
                const maxDist = Math.abs(scrollDownData.mean - noScrollData.mean);
                baseIntensity = maxDist > 0 ? Math.min(1, Math.max(0.5, distFromMiddle / maxDist)) : 0.7;
            } else {
                // Closest to noScroll mean (middle)
                detectedZone = 'middle';
                detectionConfidence = finalScoreNoScroll;
                baseIntensity = 0; // NO SCROLLING in middle
            }
            
            // Add debugging to help identify issues
            if (Math.random() < 0.02) { // 2% of frames
                console.log('👁️ Zone Detection:', {
                    normalizedY: detectionY.toFixed(6),
                    distToUp: distToUp.toFixed(6),
                    distToDown: distToDown.toFixed(6),
                    distToMiddle: distToMiddle.toFixed(6),
                    detectedZone,
                    confidence: (detectionConfidence * 100).toFixed(1) + '%',
                    intensity: baseIntensity.toFixed(2),
                    means: {
                        up: scrollUpData.mean.toFixed(6),
                        down: scrollDownData.mean.toFixed(6),
                        middle: noScrollData.mean.toFixed(6)
                    }
                });
            }
            
            // Boost confidence if detection is very clear (high probability difference)
            const maxScore = Math.max(finalScoreUp, finalScoreDown, finalScoreNoScroll);
            const secondMaxScore = [finalScoreUp, finalScoreDown, finalScoreNoScroll].sort((a, b) => b - a)[1];
            const scoreDifference = maxScore - secondMaxScore;
            
            // If there's a clear winner (score difference > 0.2), boost confidence
            if (scoreDifference > 0.2) {
                detectionConfidence = Math.min(1, detectionConfidence * 1.3);
            }
            
            // Additional boost if ML model is being used
            if (mlPrediction) {
                detectionConfidence = Math.min(1, detectionConfidence * 1.1); // 10% boost for ML
            }
            
            // REAL-TIME ZONE UPDATE: Immediately update zone with no delay
            // No smoothing or stability checks - instant zone changes for real-time response
            viewportZone = detectedZone;
            this.currentZone = detectedZone;
            
            // Apply confidence-based intensity scaling
            // Higher confidence = stronger scroll intensity
            // For middle zone, ensure intensity is always 0 (no scrolling)
            if (detectedZone === 'middle') {
                scrollIntensity = 0; // CRITICAL: Middle zone NEVER scrolls
            } else {
                scrollIntensity = baseIntensity * Math.max(0.6, detectionConfidence);
            }
            
            // Store detection confidence for use in final confidence calculation
            this.zoneConfidence = detectionConfidence;
            
            // Map normalizedY to screen position for display (MUST be calculated BEFORE intent detector)
            // Use calibrated values to map - FIXED: Use detectionY (smoothed) instead of raw normalizedY
            // IMPORTANT: More negative normalizedY = looking up = screenY closer to 0 (top)
            // More positive normalizedY = looking down = screenY closer to 1 (bottom)
            const scrollUpY = scrollUpData.mean;
            const scrollDownY = scrollDownData.mean;
            const noScrollY = noScrollData.mean;
            const minY = Math.min(scrollUpY, scrollDownY, noScrollY);
            const maxY = Math.max(scrollUpY, scrollDownY, noScrollY);
            const rangeY = maxY - minY;
            if (rangeY > 0) {
                // Use smoothed detectionY for more accurate screen position
                // Invert: more negative = top (0), more positive = bottom (1)
                clampedScreenY = (detectionY - minY) / rangeY;
            } else {
                clampedScreenY = 0.5;
            }
            clampedScreenY = Math.max(0, Math.min(1, clampedScreenY));
            
            // PROFESSIONAL INTENT DETECTION: Use 5-zone system with fixation time
            // This prevents accidental scrolling while reading
            try {
                const intentDetector = this.getIntentDetector();
                const intent = intentDetector.detectIntent(
                    clampedScreenY, // Screen position (0.0 = top, 1.0 = bottom)
                    detectionConfidence,
                    detectedZone,
                    Date.now()
                );
                
                // Override scroll intensity based on intent detection
                // Only allow scrolling if intent detector confirms it
                // TEMPORARY: For testing, allow scrolling if zone is detected (bypass intent detector if too strict)
                const USE_INTENT_DETECTOR = true; // Set to false to bypass intent detector for testing
                
                if (USE_INTENT_DETECTOR) {
                    if (!intent.shouldScroll) {
                        scrollIntensity = 0; // No scroll if intent not confirmed
                    } else if (intent.scrollDirection === 'up') {
                        scrollIntensity = -Math.abs(scrollIntensity); // Negative for up
                    } else if (intent.scrollDirection === 'down') {
                        scrollIntensity = Math.abs(scrollIntensity); // Positive for down
                    }
                } else {
                    // Bypass mode: Use zone detection directly (for testing)
                    if (detectedZone === 'top') {
                        scrollIntensity = -Math.abs(scrollIntensity);
                    } else if (detectedZone === 'bottom') {
                        scrollIntensity = Math.abs(scrollIntensity);
                    } else {
                        scrollIntensity = 0;
                    }
                }
                
                // Add debugging for intent detection
                if (Math.random() < 0.02) { // 2% of frames
                    console.log('👁️ Intent Detection:', {
                        zone: intent.zone,
                        screenY: clampedScreenY.toFixed(3),
                        detectedZone,
                        shouldScroll: intent.shouldScroll,
                        scrollDirection: intent.scrollDirection,
                        fixationTime: intent.fixationTime + 'ms',
                        confidence: (intent.confidence * 100).toFixed(1) + '%',
                        finalScrollIntensity: scrollIntensity.toFixed(2)
                    });
                }
            } catch (error) {
                // If intent detector fails, continue without it (fallback to basic detection)
                console.warn('👁️ Eye Tracking: Intent detector error, using basic detection:', error);
            }
            
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
        
        // MAXIMUM PRECISION: Use detection confidence from advanced algorithm
        let confidence = 0.5; // Base confidence
        
        if (this.calibrationData && this.calibrationData.calibrated) {
            // Use the zone confidence calculated by the advanced detection algorithm
            // This already incorporates Gaussian probability and Mahalanobis distance
            // Ensure minimum confidence even if zoneConfidence is 0 (shouldn't happen, but safety check)
            if (this.zoneConfidence > 0) {
                confidence = Math.min(1.0, Math.max(0.6, this.zoneConfidence)); // Higher minimum (0.6) for accuracy
            } else {
                // Fallback: use base confidence if zoneConfidence is 0 (shouldn't happen in normal operation)
                confidence = 0.65; // Minimum working confidence
                console.warn('👁️ Eye Tracking: zoneConfidence is 0, using fallback confidence', {
                    hasCalibration: !!this.calibrationData,
                    calibrated: this.calibrationData?.calibrated,
                    viewportZone
                });
            }
            
            // Additional boost for having 59 samples (more data = more reliable)
            const sampleCount = this.calibrationData.scrollUp.samples.length + 
                              this.calibrationData.scrollDown.samples.length + 
                              this.calibrationData.noScroll.samples.length;
            if (sampleCount >= 50) {
                confidence = Math.min(1.0, confidence * 1.15); // 15% boost for large dataset (59 samples)
            }
            
            // Extra boost for middle zone (prioritize reading stability)
            if (viewportZone === 'middle') {
                confidence = Math.min(1.0, confidence * 1.1); // 10% boost for middle zone
            }
        } else {
            // Fallback confidence calculation
            confidence = Math.min(Math.sqrt(normalizedX ** 2 + normalizedY ** 2) * 10, 1.0);
        }
        
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
        
        // Reset intent detector
        try {
            if (this.intentDetector) {
                this.intentDetector.reset();
            }
        } catch (error) {
            console.warn('👁️ Eye Tracking: Failed to reset intent detector:', error);
        }
    }
    
    /**
     * Record that a scroll event occurred (for cooldown tracking)
     */
    recordScroll(): void {
        try {
            const intentDetector = this.getIntentDetector();
            intentDetector.recordScroll();
        } catch (error) {
            console.warn('👁️ Eye Tracking: Failed to record scroll in intent detector:', error);
        }
    }

    isReady(): boolean {
        return this.isInitialized;
    }
}

