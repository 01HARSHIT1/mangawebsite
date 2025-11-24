// This script reads calibration data from console output or localStorage
// Run this in browser console after calibration completes

function extractCalibrationData() {
    // Try to get from localStorage first
    const stored = localStorage.getItem('__MASTER_CALIBRATION_FOR_HARDCODING__');
    if (stored) {
        const data = JSON.parse(stored);
        console.log('✅ Found calibration data in localStorage!');
        return data;
    }
    
    // Try to get from global variable
    if (window.__MASTER_CALIBRATION_DATA__) {
        console.log('✅ Found calibration data in global variable!');
        return {
            code: window.__MASTER_CALIBRATION_CODE__,
            data: window.__MASTER_CALIBRATION_DATA__
        };
    }
    
    // Try to get from regular calibration storage
    const calibration = localStorage.getItem('eyeTrackingCalibration');
    if (calibration) {
        const data = JSON.parse(calibration);
        if (data.calibrated) {
            console.log('✅ Found calibration data!');
            
            // Generate the code
            const { scrollUp, scrollDown, noScroll } = data;
            const code = `// MASTER CALIBRATION - Hardcoded from final calibration samples
// This is the permanent default for all users
// Generated automatically: ${new Date().toISOString()}
let DEFAULT_MASTER_CALIBRATION: CalibrationData = {
    scrollUp: {
        normalizedY: ${scrollUp.mean},
        samples: [${scrollUp.samples.join(', ')}],
        mean: ${scrollUp.mean},
        stdDev: ${scrollUp.stdDev},
        min: ${scrollUp.min},
        max: ${scrollUp.max}
    },
    scrollDown: {
        normalizedY: ${scrollDown.mean},
        samples: [${scrollDown.samples.join(', ')}],
        mean: ${scrollDown.mean},
        stdDev: ${scrollDown.stdDev},
        min: ${scrollDown.min},
        max: ${scrollDown.max}
    },
    noScroll: {
        normalizedY: ${noScroll.mean},
        samples: [${noScroll.samples.join(', ')}],
        mean: ${noScroll.mean},
        stdDev: ${noScroll.stdDev},
        min: ${noScroll.min},
        max: ${noScroll.max}
    },
    calibrated: true
};`;
            
            return { code, data };
        }
    }
    
    console.log('❌ No calibration data found. Please complete calibration first.');
    return null;
}

// Auto-run and display
const result = extractCalibrationData();
if (result) {
    console.log('='.repeat(100));
    console.log('📋 HARDCODED CODE TO APPLY:');
    console.log('='.repeat(100));
    console.log(result.code);
    console.log('='.repeat(100));
    console.log('📊 Calibration Data:', result.data);
    
    // Copy to clipboard if possible
    if (navigator.clipboard) {
        navigator.clipboard.writeText(result.code).then(() => {
            console.log('✅ Code copied to clipboard!');
        });
    }
}



