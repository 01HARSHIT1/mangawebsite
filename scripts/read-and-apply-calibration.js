// Script to automatically read calibration data from file and hardcode it
const fs = require('fs');
const path = require('path');

const calibrationFile = path.join(__dirname, '../data/master-calibration.json');
const eyeTrackingFile = path.join(__dirname, '../src/lib/eye-tracking.ts');

function applyCalibration() {
    try {
        // Read calibration data
        if (!fs.existsSync(calibrationFile)) {
            console.log('❌ Calibration file not found:', calibrationFile);
            console.log('Please complete calibration first - it will be automatically saved.');
            return;
        }
        
        const calibrationData = JSON.parse(fs.readFileSync(calibrationFile, 'utf8'));
        console.log('✅ Found calibration data!');
        
        const { scrollUp, scrollDown, noScroll } = calibrationData;
        
        // Generate hardcoded code
        const newCalibrationCode = `// MASTER CALIBRATION - Hardcoded from final calibration samples
// This is the permanent default for all users
// Generated automatically from: data/master-calibration.json
// Date: ${new Date().toISOString()}
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
        
        // Read eye-tracking.ts file
        let content = fs.readFileSync(eyeTrackingFile, 'utf8');
        
        // Replace the DEFAULT_MASTER_CALIBRATION section
        const regex = /let DEFAULT_MASTER_CALIBRATION: CalibrationData = \{[\s\S]*?\};/;
        if (regex.test(content)) {
            content = content.replace(regex, newCalibrationCode);
            fs.writeFileSync(eyeTrackingFile, content, 'utf8');
            console.log('✅ Calibration data has been hardcoded into src/lib/eye-tracking.ts');
            console.log('📊 Calibration summary:');
            console.log(`   Scroll Up: mean=${scrollUp.mean.toFixed(4)}, samples=${scrollUp.samples.length}`);
            console.log(`   Scroll Down: mean=${scrollDown.mean.toFixed(4)}, samples=${scrollDown.samples.length}`);
            console.log(`   No Scroll: mean=${noScroll.mean.toFixed(4)}, samples=${noScroll.samples.length}`);
        } else {
            console.error('❌ Could not find DEFAULT_MASTER_CALIBRATION in eye-tracking.ts');
        }
    } catch (error) {
        console.error('❌ Error applying calibration:', error);
    }
}

// Run automatically
applyCalibration();

