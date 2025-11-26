// Professional Eye Tracking Intent Detection
// Implements fixation time, velocity detection, and 5-zone system
// Based on industry standards (Tobii, Apple Vision Pro, Meta Quest)

export type ScrollZone = 'top-scroll' | 'top-reading' | 'middle' | 'bottom-reading' | 'bottom-scroll';

export interface GazeIntent {
    zone: ScrollZone;
    screenY: number; // 0.0 = top, 1.0 = bottom
    fixationTime: number; // How long user has been looking at this zone (ms)
    shouldScroll: boolean; // Whether scrolling should be triggered
    scrollDirection: 'up' | 'down' | null;
    confidence: number; // 0.0 to 1.0
    velocity: number; // Gaze velocity (normalized units/ms)
}

export class EyeTrackingIntentDetector {
    // 5-Zone System (Professional Standard)
    private readonly TOP_SCROLL_ZONE = 0.07; // Top 7% - scroll zone
    private readonly TOP_READING_ZONE = 0.30; // 7-30% - safe reading zone
    private readonly MIDDLE_ZONE = 0.70; // 30-70% - middle reading zone
    private readonly BOTTOM_READING_ZONE = 0.93; // 70-93% - safe reading zone
    private readonly BOTTOM_SCROLL_ZONE = 0.93; // Bottom 7% - scroll zone
    
    // Fixation & Intent Detection
    private readonly FIXATION_TIME_THRESHOLD = 700; // 700ms fixation required (600-900ms range)
    private readonly SCROLL_COOLDOWN = 1000; // 1000ms cooldown after scroll (800-1200ms range)
    private readonly VELOCITY_THRESHOLD = 0.5; // Fast movement threshold
    
    // State Tracking
    private currentZone: ScrollZone | null = null;
    private fixationStartTime: number = 0;
    private lastScrollTime: number = 0;
    private previousGazeY: number = 0.5;
    private previousGazeTime: number = 0;
    private smoothedGazeY: number = 0.5;
    private readonly SMOOTHING_ALPHA = 0.25; // Exponential moving average (0.2-0.3)
    
    /**
     * Detect which zone the user is looking at (5-zone system)
     */
    detectZone(screenY: number): ScrollZone {
        if (screenY <= this.TOP_SCROLL_ZONE) {
            return 'top-scroll';
        } else if (screenY <= this.TOP_READING_ZONE) {
            return 'top-reading';
        } else if (screenY <= this.MIDDLE_ZONE) {
            return 'middle';
        } else if (screenY < this.BOTTOM_READING_ZONE) {
            return 'bottom-reading';
        } else {
            return 'bottom-scroll';
        }
    }
    
    /**
     * Calculate gaze velocity (how fast eyes are moving)
     */
    calculateVelocity(currentY: number, currentTime: number): number {
        if (this.previousGazeTime === 0) {
            this.previousGazeY = currentY;
            this.previousGazeTime = currentTime;
            return 0;
        }
        
        const deltaY = Math.abs(currentY - this.previousGazeY);
        const deltaTime = currentTime - this.previousGazeTime;
        
        if (deltaTime === 0) return 0;
        
        const velocity = deltaY / deltaTime; // normalized units per ms
        
        this.previousGazeY = currentY;
        this.previousGazeTime = currentTime;
        
        return velocity;
    }
    
    /**
     * Apply exponential moving average smoothing (micro-stability filter)
     */
    smoothGaze(gazeY: number): number {
        if (this.smoothedGazeY === 0.5 && gazeY !== 0.5) {
            // Initialize
            this.smoothedGazeY = gazeY;
        } else {
            // Exponential moving average: smoothed = alpha * current + (1 - alpha) * previous
            this.smoothedGazeY = this.SMOOTHING_ALPHA * gazeY + (1 - this.SMOOTHING_ALPHA) * this.smoothedGazeY;
        }
        return this.smoothedGazeY;
    }
    
    /**
     * Detect user intent to scroll using multi-layer detection
     */
    detectIntent(
        screenY: number,
        confidence: number,
        viewportZone: 'top' | 'middle' | 'bottom',
        currentTime: number = Date.now()
    ): GazeIntent {
        // Step 1: Smooth the gaze position (micro-stability filter)
        const smoothedY = this.smoothGaze(screenY);
        
        // Step 2: Calculate gaze velocity
        const velocity = this.calculateVelocity(smoothedY, currentTime);
        
        // Step 3: Detect which zone user is looking at (5-zone system)
        const zone = this.detectZone(smoothedY);
        
        // Step 4: Track fixation time (how long user has been in this zone)
        let fixationTime = 0;
        if (zone === this.currentZone) {
            // Still in same zone - accumulate fixation time
            if (this.fixationStartTime === 0) {
                this.fixationStartTime = currentTime;
            }
            fixationTime = currentTime - this.fixationStartTime;
        } else {
            // Zone changed - reset fixation timer
            this.currentZone = zone;
            this.fixationStartTime = currentTime;
            fixationTime = 0;
        }
        
        // Step 5: Check if scrolling is allowed (cooldown period)
        const timeSinceLastScroll = currentTime - this.lastScrollTime;
        const inCooldown = timeSinceLastScroll < this.SCROLL_COOLDOWN;
        
        // Step 6: Determine if scrolling should be triggered
        let shouldScroll = false;
        let scrollDirection: 'up' | 'down' | null = null;
        
        // Only scroll zones can trigger scrolling
        if (zone === 'top-scroll' && !inCooldown) {
            // Top scroll zone: Check fixation time and velocity
            const hasFixation = fixationTime >= this.FIXATION_TIME_THRESHOLD;
            const hasFastMovement = velocity > this.VELOCITY_THRESHOLD; // Fast upward movement = intent
            
            // Scroll if: (fixation time met) OR (fast intentional movement)
            if (hasFixation || hasFastMovement) {
                shouldScroll = true;
                scrollDirection = 'up';
            }
        } else if (zone === 'bottom-scroll' && !inCooldown) {
            // Bottom scroll zone: Check fixation time and velocity
            const hasFixation = fixationTime >= this.FIXATION_TIME_THRESHOLD;
            const hasFastMovement = velocity > this.VELOCITY_THRESHOLD; // Fast downward movement = intent
            
            // Scroll if: (fixation time met) OR (fast intentional movement)
            if (hasFixation || hasFastMovement) {
                shouldScroll = true;
                scrollDirection = 'down';
            }
        }
        
        // Step 7: Calculate confidence (higher if fixation time is longer)
        let intentConfidence = confidence;
        if (shouldScroll) {
            // Boost confidence if fixation time exceeds threshold significantly
            const fixationBoost = Math.min(1.0, fixationTime / (this.FIXATION_TIME_THRESHOLD * 1.5));
            intentConfidence = Math.min(1.0, confidence * (0.7 + 0.3 * fixationBoost));
        }
        
        return {
            zone,
            screenY: smoothedY,
            fixationTime,
            shouldScroll,
            scrollDirection,
            confidence: intentConfidence,
            velocity
        };
    }
    
    /**
     * Record that a scroll event occurred (for cooldown tracking)
     */
    recordScroll(): void {
        this.lastScrollTime = Date.now();
        // Reset fixation when scroll happens
        this.fixationStartTime = 0;
    }
    
    /**
     * Reset all state (useful when stopping eye tracking)
     */
    reset(): void {
        this.currentZone = null;
        this.fixationStartTime = 0;
        this.lastScrollTime = 0;
        this.previousGazeY = 0.5;
        this.previousGazeTime = 0;
        this.smoothedGazeY = 0.5;
    }
    
    /**
     * Get current zone information
     */
    getCurrentZone(): ScrollZone | null {
        return this.currentZone;
    }
    
    /**
     * Get fixation time for current zone
     */
    getFixationTime(): number {
        if (this.fixationStartTime === 0) return 0;
        return Date.now() - this.fixationStartTime;
    }
}

