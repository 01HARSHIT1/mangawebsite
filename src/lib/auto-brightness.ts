// Auto-Brightness Detection and Adjustment
// Analyzes camera feed to detect ambient light and adjusts screen brightness accordingly
// Uses CSS filter to simulate screen brightness adjustment

export interface BrightnessSettings {
    enabled: boolean;
    minBrightness: number; // 0.0 - 1.0 (minimum brightness)
    maxBrightness: number; // 0.0 - 1.0 (maximum brightness)
    sensitivity: number; // 0.0 - 1.0 (how sensitive to light changes)
    smoothing: number; // 0.0 - 1.0 (smoothing factor for brightness changes)
}

export class AutoBrightnessController {
    private videoElement: HTMLVideoElement | null = null;
    private canvas: HTMLCanvasElement | null = null;
    private ctx: CanvasRenderingContext2D | null = null;
    private animationFrameId: number | null = null;
    private isRunning = false;
    
    private settings: BrightnessSettings = {
        enabled: true,
        minBrightness: 0.3, // 30% minimum (for dark rooms)
        maxBrightness: 1.0, // 100% maximum (for bright rooms)
        sensitivity: 0.7, // 70% sensitivity
        smoothing: 0.8 // 80% smoothing (prevents rapid changes)
    };
    
    // Brightness history for smoothing
    private brightnessHistory: number[] = [];
    private readonly historySize = 10;
    private currentBrightness = 1.0;
    
    constructor(videoElement: HTMLVideoElement, settings?: Partial<BrightnessSettings>) {
        this.videoElement = videoElement;
        this.settings = { ...this.settings, ...settings };
        
        // Create hidden canvas for image analysis
        this.canvas = document.createElement('canvas');
        this.canvas.width = 64; // Low resolution for performance
        this.canvas.height = 48;
        this.ctx = this.canvas.getContext('2d', { willReadFrequently: true });
    }
    
    /**
     * Calculate average luminance from a video frame
     * Returns value between 0 (dark) and 1 (bright)
     */
    private calculateLuminance(imageData: ImageData): number {
        const data = imageData.data;
        let totalLuminance = 0;
        let pixelCount = 0;
        
        // Sample every 4th pixel for performance (RGB + Alpha)
        for (let i = 0; i < data.length; i += 16) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            
            // Calculate luminance using relative luminance formula (ITU-R BT.709)
            // L = 0.2126*R + 0.7152*G + 0.0722*B
            const luminance = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
            totalLuminance += luminance;
            pixelCount++;
        }
        
        return pixelCount > 0 ? totalLuminance / pixelCount : 0.5;
    }
    
    /**
     * Map ambient light (0-1) to screen brightness (min-max)
     */
    private mapLightToBrightness(ambientLight: number): number {
        // Apply sensitivity: higher sensitivity = more aggressive adjustment
        const adjustedLight = Math.pow(ambientLight, 1 / this.settings.sensitivity);
        
        // Map to brightness range
        const brightness = this.settings.minBrightness + 
            (adjustedLight * (this.settings.maxBrightness - this.settings.minBrightness));
        
        return Math.max(this.settings.minBrightness, Math.min(this.settings.maxBrightness, brightness));
    }
    
    /**
     * Apply brightness to the page using CSS filter
     */
    private applyBrightness(brightness: number): void {
        // Smooth the brightness change
        this.brightnessHistory.push(brightness);
        if (this.brightnessHistory.length > this.historySize) {
            this.brightnessHistory.shift();
        }
        
        // Calculate smoothed brightness (exponential moving average)
        const smoothedBrightness = this.brightnessHistory.reduce((a, b) => a + b, 0) / this.brightnessHistory.length;
        const finalBrightness = this.currentBrightness * this.settings.smoothing + 
                               smoothedBrightness * (1 - this.settings.smoothing);
        
        this.currentBrightness = finalBrightness;
        
        // Apply CSS filter to body (affects entire page)
        document.body.style.filter = `brightness(${finalBrightness})`;
        document.body.style.transition = 'filter 0.3s ease-out'; // Smooth transition
    }
    
    /**
     * Analyze current video frame and adjust brightness
     */
    private analyzeFrame(): void {
        if (!this.videoElement || !this.canvas || !this.ctx || !this.isRunning) {
            return;
        }
        
        try {
            // Draw current video frame to canvas (downscaled for performance)
            this.ctx.drawImage(
                this.videoElement,
                0, 0,
                this.canvas.width,
                this.canvas.height
            );
            
            // Get image data
            const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
            
            // Calculate average luminance
            const ambientLight = this.calculateLuminance(imageData);
            
            // Map to brightness
            const targetBrightness = this.mapLightToBrightness(ambientLight);
            
            // Apply brightness
            this.applyBrightness(targetBrightness);
            
            // Log occasionally for debugging
            if (Math.random() < 0.01) { // 1% of frames
                console.log('💡 Auto-Brightness:', {
                    ambientLight: (ambientLight * 100).toFixed(1) + '%',
                    brightness: (this.currentBrightness * 100).toFixed(1) + '%',
                    target: (targetBrightness * 100).toFixed(1) + '%'
                });
            }
        } catch (error) {
            // Ignore errors (video might not be ready)
            if (Math.random() < 0.01) {
                console.warn('💡 Auto-Brightness: Frame analysis error:', error);
            }
        }
    }
    
    /**
     * Start auto-brightness detection
     */
    start(): void {
        if (this.isRunning || !this.settings.enabled) {
            return;
        }
        
        this.isRunning = true;
        console.log('💡 Auto-Brightness: Started');
        
        const loop = () => {
            if (!this.isRunning) {
                return;
            }
            
            this.analyzeFrame();
            this.animationFrameId = requestAnimationFrame(loop);
        };
        
        // Start analysis loop (runs at ~30fps for performance)
        this.animationFrameId = requestAnimationFrame(loop);
    }
    
    /**
     * Stop auto-brightness detection
     */
    stop(): void {
        if (!this.isRunning) {
            return;
        }
        
        this.isRunning = false;
        
        if (this.animationFrameId !== null) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
        
        // Reset brightness to normal
        document.body.style.filter = '';
        document.body.style.transition = '';
        this.currentBrightness = 1.0;
        this.brightnessHistory = [];
        
        console.log('💡 Auto-Brightness: Stopped');
    }
    
    /**
     * Update settings
     */
    updateSettings(settings: Partial<BrightnessSettings>): void {
        this.settings = { ...this.settings, ...settings };
    }
    
    /**
     * Get current brightness value
     */
    getCurrentBrightness(): number {
        return this.currentBrightness;
    }
    
    /**
     * Manually set brightness (0.0 - 1.0)
     */
    setBrightness(brightness: number): void {
        const clamped = Math.max(0, Math.min(1, brightness));
        this.currentBrightness = clamped;
        document.body.style.filter = `brightness(${clamped})`;
    }
}

