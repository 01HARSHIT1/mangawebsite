// Script to automatically extract calibration data and generate hardcoded values
// This runs when calibration completes

const fs = require('fs');
const path = require('path');

function generateHardcodedCalibration(calibrationData) {
    const { scrollUp, scrollDown, noScroll } = calibrationData;
    
    return `// MASTER CALIBRATION - Hardcoded from final calibration samples
// This is the permanent default for all users
// Generated automatically from calibration data
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
}

// This will be called from the browser when calibration completes
if (typeof window !== 'undefined') {
    window.exportCalibrationForHardcoding = function() {
        const data = JSON.parse(localStorage.getItem('eyeTrackingCalibration'));
        if (!data || !data.calibrated) {
            console.error('No calibrated data found');
            return null;
        }
        
        const code = generateHardcodedCalibration(data);
        console.log('=== COPY THIS CODE TO REPLACE DEFAULT_MASTER_CALIBRATION ===');
        console.log(code);
        console.log('=== END OF CODE ===');
        
        // Also copy to clipboard if possible
        if (navigator.clipboard) {
            navigator.clipboard.writeText(code).then(() => {
                console.log('✅ Code copied to clipboard!');
            });
        }
        
        return code;
    };
}

module.exports = { generateHardcodedCalibration };

