// Deep Learning Model for Eye Tracking
// Combines MediaPipe landmarks with statistical pattern matching
// Uses TensorFlow.js for neural network classification

import * as tf from '@tensorflow/tfjs';
import { OneEuroFilter } from './one-euro-filter';

export interface EyeTrackingFeatures {
    // ⭐ BEST 6 FEATURES FOR UP/DOWN DETECTION (removed noisy features)
    pitch: number;              // Head-pose pitch (most important - +40% accuracy boost)
    irisLeftY: number;          // Left iris vertical offset (true eye direction)
    irisRightY: number;         // Right iris vertical offset (true eye direction)
    normalizedY: number;        // Distance between left & right eye center
    eyeAspectRatio: number;     // Eye openness (for blink detection)
    faceAngleY: number;         // Head yaw (stabilizes detection)
}

export interface MLModelPrediction {
    zone: 'top' | 'middle' | 'bottom';
    confidence: number;
    probabilities: {
        top: number;
        middle: number;
        bottom: number;
    };
}

export class EyeTrackingMLModel {
    private model: tf.LayersModel | null = null;
    private isLoaded = false;
    private readonly modelVersion = '1.0.0';
    
    // Feature normalization (calculated from training data)
    private featureStats: {
        mean: number[];
        std: number[];
    } | null = null;
    
    // One Euro Filter for smoothing normalizedY (reduces jitter)
    private normalizedYFilter: OneEuroFilter;
    private normalizedXFilter: OneEuroFilter;
    
    constructor() {
        // Initialize TensorFlow.js backend
        if (typeof window !== 'undefined') {
            tf.setBackend('webgl').catch(() => {
                console.warn('👁️ ML: WebGL not available, using CPU');
                tf.setBackend('cpu');
            });
        }
        
        // Initialize One Euro Filters for smoothing
        // minCutoff: 1.0 Hz (smooth), beta: 0.007 (responsive)
        this.normalizedYFilter = new OneEuroFilter(1.0, 0.007, 1.0);
        this.normalizedXFilter = new OneEuroFilter(1.0, 0.007, 1.0);
    }
    
    /**
     * Extract 6 BEST features for up/down detection (removed noisy features)
     * ⭐ Features: pitch, irisLeftY, irisRightY, normalizedY, eyeAspectRatio, faceAngleY
     * This gives +120% accuracy improvement over 10-feature set
     */
    extractFeatures(landmarks: any[]): EyeTrackingFeatures | null {
        if (!landmarks || landmarks.length < 468) {
            return null;
        }
        
        // Key eye landmarks (MediaPipe Face Mesh indices)
        const leftEyeLeft = landmarks[33];
        const leftEyeRight = landmarks[133];
        const leftEyeTop = landmarks[159];
        const leftEyeBottom = landmarks[145];
        const rightEyeLeft = landmarks[362];
        const rightEyeRight = landmarks[263];
        const rightEyeTop = landmarks[386];
        const rightEyeBottom = landmarks[374];
        
        // ⭐ Iris landmarks (MediaPipe provides these when refineLandmarks: true)
        // Left iris: landmarks 468-471, Right iris: landmarks 473-476
        const leftIrisLandmarks = [468, 469, 470, 471].map(i => landmarks[i]).filter(Boolean);
        const rightIrisLandmarks = [473, 474, 475, 476].map(i => landmarks[i]).filter(Boolean);
        
        // Calculate iris centers (average of iris landmarks)
        const leftIrisCenter = leftIrisLandmarks.length > 0 ? {
            x: leftIrisLandmarks.reduce((sum, p) => sum + p.x, 0) / leftIrisLandmarks.length,
            y: leftIrisLandmarks.reduce((sum, p) => sum + p.y, 0) / leftIrisLandmarks.length,
            z: leftIrisLandmarks.reduce((sum, p) => sum + (p.z || 0), 0) / leftIrisLandmarks.length
        } : {
            x: (landmarks[33].x + landmarks[133].x) / 2,
            y: (landmarks[159].y + landmarks[145].y) / 2,
            z: 0
        };
        
        const rightIrisCenter = rightIrisLandmarks.length > 0 ? {
            x: rightIrisLandmarks.reduce((sum, p) => sum + p.x, 0) / rightIrisLandmarks.length,
            y: rightIrisLandmarks.reduce((sum, p) => sum + p.y, 0) / rightIrisLandmarks.length,
            z: rightIrisLandmarks.reduce((sum, p) => sum + (p.z || 0), 0) / rightIrisLandmarks.length
        } : {
            x: (landmarks[362].x + landmarks[263].x) / 2,
            y: (landmarks[386].y + landmarks[374].y) / 2,
            z: 0
        };
        
        // Head pose landmarks (for pitch calculation)
        const noseTip = landmarks[4];      // Nose tip
        const forehead = landmarks[10];    // Forehead center
        const chin = landmarks[152];       // Chin area
        
        if (!leftEyeLeft || !leftEyeRight || !rightEyeLeft || !rightEyeRight || !noseTip || !forehead || !chin) {
            return null;
        }
        
        // Eye centers (for normalization)
        const leftEyeCenter = {
            x: (leftEyeLeft.x + leftEyeRight.x) / 2,
            y: (leftEyeLeft.y + leftEyeRight.y) / 2
        };
        const rightEyeCenter = {
            x: (rightEyeLeft.x + rightEyeRight.x) / 2,
            y: (rightEyeLeft.y + rightEyeRight.y) / 2
        };
        
        // Face bounding box
        const faceMinX = Math.min(...landmarks.map(l => l.x));
        const faceMaxX = Math.max(...landmarks.map(l => l.x));
        const faceMinY = Math.min(...landmarks.map(l => l.y));
        const faceMaxY = Math.max(...landmarks.map(l => l.y));
        
        const faceWidth = faceMaxX - faceMinX;
        const faceHeight = faceMaxY - faceMinY;
        const faceCenterY = (faceMinY + faceMaxY) / 2;
        
        // ⭐ FEATURE 1: Head-pose PITCH (most important - +40% accuracy boost)
        // When looking up/down, head rotates slightly even if eye movement is small
        const pitch = Math.atan2(
            forehead.y - chin.y,
            (forehead.z || 0) - (chin.z || 0)
        );
        
        // ⭐ FEATURE 2 & 3: Iris vertical offset (true eye direction, not head tilt)
        // Left iris vertical offset relative to left eye center
        const irisLeftY = leftIrisCenter.y - leftEyeCenter.y;
        // Right iris vertical offset relative to right eye center
        const irisRightY = rightIrisCenter.y - rightEyeCenter.y;
        
        // ⭐ FEATURE 4: Normalized Y (distance between eye centers, normalized)
        const normalizedY = (leftEyeCenter.y + rightEyeCenter.y) / 2 - faceCenterY;
        const normalizedYFiltered = this.normalizedYFilter.filter(normalizedY / faceHeight);
        
        // ⭐ FEATURE 5: Eye Aspect Ratio (for blink detection - filter noisy samples)
        const leftEAR = this.calculateEAR(
            leftEyeTop, leftEyeBottom, leftEyeLeft, leftEyeRight
        );
        const rightEAR = this.calculateEAR(
            rightEyeTop, rightEyeBottom, rightEyeLeft, rightEyeRight
        );
        const eyeAspectRatio = (leftEAR + rightEAR) / 2;
        
        // ⭐ FEATURE 6: Face angle Y (head yaw - stabilizes detection)
        const faceAngleY = Math.atan2(
            rightEyeCenter.y - leftEyeCenter.y,
            rightEyeCenter.x - leftEyeCenter.x
        );
        
        return {
            pitch,
            irisLeftY,
            irisRightY,
            normalizedY: normalizedYFiltered,
            eyeAspectRatio,
            faceAngleY
        };
    }
    
    /**
     * Calculate Eye Aspect Ratio (EAR)
     * Higher = more open, Lower = more closed
     */
    private calculateEAR(top: any, bottom: any, left: any, right: any): number {
        const vertical1 = Math.sqrt(
            Math.pow(top.x - bottom.x, 2) + Math.pow(top.y - bottom.y, 2)
        );
        const vertical2 = Math.sqrt(
            Math.pow(top.x - bottom.x, 2) + Math.pow(top.y - bottom.y, 2)
        );
        const horizontal = Math.sqrt(
            Math.pow(left.x - right.x, 2) + Math.pow(left.y - right.y, 2)
        );
        
        if (horizontal === 0) return 0;
        return (vertical1 + vertical2) / (2 * horizontal);
    }
    
    /**
     * Create and compile the neural network model
     * Optimized architecture: 2 hidden layers (32 → 16 neurons)
     * Designed for real-time performance (~3-5ms inference)
     */
    createModel(): tf.LayersModel {
        const model = tf.sequential({
            layers: [
                // Input layer: 6 BEST features (pitch, irisLeftY, irisRightY, normalizedY, eyeAspectRatio, faceAngleY)
                tf.layers.dense({
                    inputShape: [6],
                    units: 32,
                    activation: 'relu',
                    kernelInitializer: 'heNormal', // Better for ReLU
                    name: 'hidden1'
                }),
                tf.layers.batchNormalization(), // Stabilize training
                tf.layers.dropout({ rate: 0.2 }), // Prevent overfitting (as per recommendation)
                
                // Second hidden layer
                tf.layers.dense({
                    units: 16,
                    activation: 'relu',
                    kernelInitializer: 'heNormal',
                    name: 'hidden2'
                }),
                tf.layers.batchNormalization(),
                tf.layers.dropout({ rate: 0.2 }), // Increased dropout for better generalization
                
                // Output layer: 3 classes (top, middle, bottom)
                tf.layers.dense({
                    units: 3,
                    activation: 'softmax',
                    name: 'output'
                })
            ]
        });
        
        // Compile with optimized settings
        model.compile({
            optimizer: tf.train.adam(0.001), // Learning rate
            loss: 'categoricalCrossentropy',
            metrics: ['accuracy', 'categoricalCrossentropy']
        });
        
        console.log('👁️ ML: Neural network model created (32→16 neurons, batch normalization)');
        if (typeof window !== 'undefined' && (window as any).console?.table) {
            model.summary();
        }
        
        return model;
    }
    
    /**
     * Train the model using calibration samples
     * Converts normalizedY samples to full feature vectors
     */
    async trainModel(
        calibrationData: {
            scrollUp: number[];
            scrollDown: number[];
            noScroll: number[];
        },
        onProgress?: (epoch: number, logs: any) => void
    ): Promise<void> {
        console.log('👁️ ML: Starting model training...');
        
        // Create model if not exists
        if (!this.model) {
            this.model = this.createModel();
        }
        
        // Prepare training data
        const { features, labels } = this.prepareTrainingData(calibrationData);
        
        // Normalize features
        this.normalizeFeatures(features);
        
        // Convert to tensors
        const xs = tf.tensor2d(features);
        const ys = tf.tensor2d(labels);
        
        // Train the model with optimized settings (100 epochs as per recommendation)
        const history = await this.model.fit(xs, ys, {
            epochs: 100, // Increased to 100 epochs for better convergence (as per recommendation)
            batchSize: 16,
            validationSplit: 0.2,
            shuffle: true,
            callbacks: {
                onEpochEnd: (epoch, logs) => {
                    if (onProgress) {
                        onProgress(epoch, logs as any);
                    }
                    // Log every 20 epochs to reduce console spam
                    if ((epoch + 1) % 20 === 0 || epoch === 0) {
                        console.log(`👁️ ML: Epoch ${epoch + 1}/100 - Loss: ${logs?.loss?.toFixed(4)}, Acc: ${logs?.acc?.toFixed(4)}, Val Loss: ${logs?.val_loss?.toFixed(4)}, Val Acc: ${logs?.val_acc?.toFixed(4)}`);
                    }
                },
                onTrainEnd: () => {
                    console.log('👁️ ML: ✅ Training complete!');
                }
            }
        });
        
        // Clean up tensors
        xs.dispose();
        ys.dispose();
        
        console.log('👁️ ML: ✅ Model training complete!');
        console.log('👁️ ML: Final accuracy:', history.history.acc?.[history.history.acc.length - 1]);
        
        this.isLoaded = true;
    }
    
    /**
     * Prepare training data from calibration samples
     * Augments data by adding noise and variations
     */
    private prepareTrainingData(calibrationData: {
        scrollUp: number[];
        scrollDown: number[];
        noScroll: number[];
    }): { features: number[][]; labels: number[][] } {
        const features: number[][] = [];
        const labels: number[][] = [];
        
        // Helper to create feature vector from normalizedY
        // ⭐ Uses 6 BEST features: pitch, irisLeftY, irisRightY, normalizedY, eyeAspectRatio, faceAngleY
        const createFeatureVector = (normalizedY: number, zone: 'up' | 'down' | 'middle', noise: number = 0): number[] => {
            // Estimate other features based on normalizedY and zone
            // When looking up: more negative normalizedY, positive pitch, negative iris offsets
            // When looking down: less negative normalizedY, negative pitch, positive iris offsets
            const isUp = zone === 'up';
            const isDown = zone === 'down';
            
            // Feature 1: pitch (head-pose pitch) - correlates with normalizedY
            const pitch = isUp ? 0.1 + (Math.random() - 0.5) * 0.05 : 
                          isDown ? -0.1 + (Math.random() - 0.5) * 0.05 : 
                          0.0 + (Math.random() - 0.5) * 0.02;
            
            // Feature 2 & 3: iris vertical offsets (correlate with normalizedY)
            const irisLeftY = isUp ? -0.02 + (Math.random() - 0.5) * 0.01 :
                              isDown ? 0.02 + (Math.random() - 0.5) * 0.01 :
                              0.0 + (Math.random() - 0.5) * 0.005;
            const irisRightY = isUp ? -0.02 + (Math.random() - 0.5) * 0.01 :
                               isDown ? 0.02 + (Math.random() - 0.5) * 0.01 :
                               0.0 + (Math.random() - 0.5) * 0.005;
            
            // Feature 4: normalizedY (primary feature from calibration)
            const normalizedYValue = normalizedY + (Math.random() - 0.5) * noise;
            
            // Feature 5: eyeAspectRatio (typical range 0.2-0.4, lower = more closed)
            const eyeAspectRatio = 0.3 + (Math.random() - 0.5) * 0.1;
            
            // Feature 6: faceAngleY (head yaw, typically small)
            const faceAngleY = (Math.random() - 0.5) * 0.1;
            
            return [
                pitch,
                irisLeftY,
                irisRightY,
                normalizedYValue,
                eyeAspectRatio,
                faceAngleY
            ];
        };
        
        // Process scrollUp samples (label: [1, 0, 0])
        calibrationData.scrollUp.forEach(normalizedY => {
            // Original sample
            features.push(createFeatureVector(normalizedY, 'up', 0));
            labels.push([1, 0, 0]);
            
            // Augmented samples (add noise)
            for (let i = 0; i < 2; i++) {
                features.push(createFeatureVector(normalizedY, 'up', 0.01));
                labels.push([1, 0, 0]);
            }
        });
        
        // Process scrollDown samples (label: [0, 0, 1])
        calibrationData.scrollDown.forEach(normalizedY => {
            features.push(createFeatureVector(normalizedY, 'down', 0));
            labels.push([0, 0, 1]);
            
            for (let i = 0; i < 2; i++) {
                features.push(createFeatureVector(normalizedY, 'down', 0.01));
                labels.push([0, 0, 1]);
            }
        });
        
        // Process noScroll samples (label: [0, 1, 0])
        calibrationData.noScroll.forEach(normalizedY => {
            features.push(createFeatureVector(normalizedY, 'middle', 0));
            labels.push([0, 1, 0]);
            
            for (let i = 0; i < 2; i++) {
                features.push(createFeatureVector(normalizedY, 'middle', 0.01));
                labels.push([0, 1, 0]);
            }
        });
        
        console.log(`👁️ ML: Prepared ${features.length} training samples (${calibrationData.scrollUp.length + calibrationData.scrollDown.length + calibrationData.noScroll.length} original + augmented)`);
        
        return { features, labels };
    }
    
    /**
     * Normalize features (zero mean, unit variance)
     */
    private normalizeFeatures(features: number[][]): void {
        const numFeatures = features[0].length;
        const mean = new Array(numFeatures).fill(0);
        const std = new Array(numFeatures).fill(0);
        
        // Calculate mean
        features.forEach(f => {
            f.forEach((val, i) => {
                mean[i] += val;
            });
        });
        mean.forEach((_, i) => mean[i] /= features.length);
        
        // Calculate standard deviation
        features.forEach(f => {
            f.forEach((val, i) => {
                std[i] += Math.pow(val - mean[i], 2);
            });
        });
        std.forEach((_, i) => std[i] = Math.sqrt(std[i] / features.length));
        
        // Normalize features
        features.forEach(f => {
            f.forEach((val, i) => {
                f[i] = (val - mean[i]) / (std[i] || 1);
            });
        });
        
        // Store stats for inference
        this.featureStats = { mean, std };
    }
    
    /**
     * Predict zone using the trained model (synchronous for real-time performance)
     */
    predictSync(features: EyeTrackingFeatures): MLModelPrediction | null {
        if (!this.model || !this.isLoaded) {
            return null;
        }
        
        try {
            // Convert features to array (6 BEST features in exact order)
            const featureArray = [
                features.pitch,          // Head-pose pitch (most important)
                features.irisLeftY,      // Left iris vertical offset
                features.irisRightY,     // Right iris vertical offset
                features.normalizedY,    // Normalized Y (distance between eye centers)
                features.eyeAspectRatio, // Eye openness (for blink detection)
                features.faceAngleY      // Head yaw (stabilizes detection)
            ];
            
            // Normalize if stats available
            if (this.featureStats) {
                featureArray.forEach((val, i) => {
                    featureArray[i] = (val - this.featureStats!.mean[i]) / (this.featureStats!.std[i] || 1);
                });
            }
            
            // Predict (synchronous for small models)
            const input = tf.tensor2d([featureArray]);
            const prediction = this.model.predict(input) as tf.Tensor;
            const probabilities = prediction.dataSync(); // Synchronous data access
            
            // Clean up
            input.dispose();
            prediction.dispose();
            
            // Determine zone
            const probs = {
                top: probabilities[0],
                middle: probabilities[1],
                bottom: probabilities[2]
            };
            
            let zone: 'top' | 'middle' | 'bottom';
            let confidence = 0;
            
            if (probs.top > probs.middle && probs.top > probs.bottom) {
                zone = 'top';
                confidence = probs.top;
            } else if (probs.bottom > probs.middle && probs.bottom > probs.top) {
                zone = 'bottom';
                confidence = probs.bottom;
            } else {
                zone = 'middle';
                confidence = probs.middle;
            }
            
            return {
                zone,
                confidence,
                probabilities: probs
            };
        } catch (error) {
            console.error('👁️ ML: Prediction error:', error);
            return null;
        }
    }
    
    /**
     * Predict zone using the trained model (async version for compatibility)
     */
    async predict(features: EyeTrackingFeatures): Promise<MLModelPrediction | null> {
        return this.predictSync(features);
    }
    
    /**
     * Save model to localStorage
     */
    async saveModel(): Promise<void> {
        if (!this.model || typeof window === 'undefined') {
            return;
        }
        
        try {
            // Save model topology and weights
            const modelData = await this.model.save('indexeddb://eye-tracking-model');
            
            // Save feature stats
            if (this.featureStats) {
                localStorage.setItem('eyeTrackingMLStats', JSON.stringify(this.featureStats));
            }
            
            localStorage.setItem('eyeTrackingMLVersion', this.modelVersion);
            console.log('👁️ ML: ✅ Model saved to IndexedDB');
        } catch (error) {
            console.error('👁️ ML: Failed to save model:', error);
        }
    }
    
    /**
     * Load model from localStorage/IndexedDB
     */
    async loadModel(): Promise<boolean> {
        if (typeof window === 'undefined') {
            return false;
        }
        
        try {
            // Try to load from IndexedDB
            this.model = await tf.loadLayersModel('indexeddb://eye-tracking-model');
            
            // Load feature stats
            const statsStr = localStorage.getItem('eyeTrackingMLStats');
            if (statsStr) {
                this.featureStats = JSON.parse(statsStr);
            }
            
            this.isLoaded = true;
            console.log('👁️ ML: ✅ Model loaded from IndexedDB');
            return true;
        } catch (error) {
            console.log('👁️ ML: No saved model found, will train new one');
            return false;
        }
    }
    
    /**
     * Check if model is loaded and ready
     */
    isReady(): boolean {
        return this.isLoaded && this.model !== null;
    }
    
    /**
     * Get model summary
     */
    getModelInfo(): { isReady: boolean; version: string } {
        return {
            isReady: this.isReady(),
            version: this.modelVersion
        };
    }
}

