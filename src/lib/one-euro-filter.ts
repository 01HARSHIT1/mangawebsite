// One Euro Filter for Smoothing Eye Tracking Data
// Reduces jitter while maintaining responsiveness
// Based on: https://cristal.univ-lille.fr/~casiez/1euro/

export class OneEuroFilter {
    private lastValue: number;
    private lastTime: number;
    private minCutoff: number;
    private beta: number;
    private dCutoff: number;
    private xFilter: LowPassFilter;
    private dxFilter: LowPassFilter;
    
    constructor(
        minCutoff: number = 1.0,  // Minimum cutoff frequency (Hz)
        beta: number = 0.007,      // Speed coefficient (higher = more responsive)
        dCutoff: number = 1.0      // Derivative cutoff frequency (Hz)
    ) {
        this.minCutoff = minCutoff;
        this.beta = beta;
        this.dCutoff = dCutoff;
        this.lastValue = 0;
        this.lastTime = 0;
        this.xFilter = new LowPassFilter(this.alpha(this.minCutoff));
        this.dxFilter = new LowPassFilter(this.alpha(this.dCutoff));
    }
    
    private alpha(cutoff: number): number {
        const te = 1.0 / 30.0; // Assume 30 FPS
        const tau = 1.0 / (2 * Math.PI * cutoff);
        return 1.0 / (1.0 + tau / te);
    }
    
    filter(value: number, timestamp?: number): number {
        const now = timestamp || Date.now();
        
        // Initialize on first call
        if (this.lastTime === 0) {
            this.lastTime = now;
            this.lastValue = value;
            return value;
        }
        
        // Calculate time delta
        const dt = (now - this.lastTime) / 1000.0; // Convert to seconds
        this.lastTime = now;
        
        // Update derivative filter
        const dx = (value - this.lastValue) / dt;
        const edx = this.dxFilter.filter(dx, this.alpha(this.dCutoff));
        
        // Calculate adaptive cutoff
        const cutoff = this.minCutoff + this.beta * Math.abs(edx);
        
        // Update main filter with adaptive cutoff
        const alpha = this.alpha(cutoff);
        const filteredValue = this.xFilter.filter(value, alpha);
        
        this.lastValue = filteredValue;
        return filteredValue;
    }
    
    reset(): void {
        this.lastValue = 0;
        this.lastTime = 0;
        this.xFilter = new LowPassFilter(this.alpha(this.minCutoff));
        this.dxFilter = new LowPassFilter(this.alpha(this.dCutoff));
    }
}

class LowPassFilter {
    private lastValue: number;
    private alpha: number;
    
    constructor(alpha: number) {
        this.alpha = alpha;
        this.lastValue = 0;
    }
    
    filter(value: number, alpha?: number): number {
        if (alpha !== undefined) {
            this.alpha = alpha;
        }
        
        if (this.lastValue === 0) {
            this.lastValue = value;
            return value;
        }
        
        const filtered = this.alpha * value + (1 - this.alpha) * this.lastValue;
        this.lastValue = filtered;
        return filtered;
    }
}

