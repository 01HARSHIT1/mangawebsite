// Script to automatically read calibration data and update the code
// This reads from the console output or localStorage and updates src/lib/eye-tracking.ts

const fs = require('fs');
const path = require('path');

// This will be called after calibration completes
// The calibration data should be in the console output or in a file

function applyCalibrationFromData(calibrationData) {
    const eyeTrackingPath = path.join(__dirname, '../src/lib/eye-tracking.ts');
    let content = fs.readFileSync(eyeTrackingPath, 'utf8');
    
    const { scrollUp, scrollDown, noScroll } = calibrationData;
    
    const newCalibrationCode = `// MASTER CALIBRATION - Hardcoded from final calibration samples
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
    
    // Find and replace the DEFAULT_MASTER_CALIBRATION section
    const regex = /let DEFAULT_MASTER_CALIBRATION: CalibrationData = \{[\s\S]*?\};/;
    content = content.replace(regex, newCalibrationCode);
    
    fs.writeFileSync(eyeTrackingPath, content, 'utf8');
    console.log('✅ Calibration data has been hardcoded into src/lib/eye-tracking.ts');
}

// If calibration data is passed as argument
if (process.argv[2]) {
    const data = JSON.parse(process.argv[2]);
    applyCalibrationFromData(data);
} else {
    console.log('Usage: node scripts/apply-calibration.js \'{"scrollUp": {...}, "scrollDown": {...}, "noScroll": {...}}\'');
    console.log('Or provide the calibration data from the console output');
}

module.exports = { applyCalibrationFromData };

