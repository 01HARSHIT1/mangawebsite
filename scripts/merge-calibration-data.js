const fs = require('fs');
const path = require('path');

/**
 * Script to merge user-provided calibration samples with master calibration
 * 
 * Usage:
 * 1. Export your calibration data from the eye tracking panel (click "Export Calibration Data")
 * 2. Copy the "RAW LOCALSTORAGE DATA" JSON from the console
 * 3. Save it to a file (e.g., user-calibration.json) or paste it as an argument
 * 4. Run: node scripts/merge-calibration-data.js [path-to-user-data.json]
 *    OR: node scripts/merge-calibration-data.js --json '{"scrollUp": {...}, ...}'
 */

function calculateStatistics(samples) {
    if (samples.length === 0) {
        return { mean: 0, stdDev: 0, min: 0, max: 0 };
    }
    
    const mean = samples.reduce((sum, val) => sum + val, 0) / samples.length;
    const variance = samples.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / samples.length;
    const stdDev = Math.sqrt(variance);
    const min = Math.min(...samples);
    const max = Math.max(...samples);
    
    return { mean, stdDev, min, max };
}

function mergeCalibrationData(masterData, userData) {
    console.log('🔄 Merging calibration data...');
    console.log('');
    
    // Count samples
    const masterTop = masterData.scrollUp?.samples?.length || 0;
    const masterMiddle = masterData.noScroll?.samples?.length || 0;
    const masterBottom = masterData.scrollDown?.samples?.length || 0;
    const masterTotal = masterTop + masterMiddle + masterBottom;
    
    const userTop = userData.scrollUp?.samples?.length || 0;
    const userMiddle = userData.noScroll?.samples?.length || 0;
    const userBottom = userData.scrollDown?.samples?.length || 0;
    const userTotal = userTop + userMiddle + userBottom;
    
    console.log('📊 Current Master Calibration:');
    console.log(`   Top: ${masterTop}, Middle: ${masterMiddle}, Bottom: ${masterBottom} (Total: ${masterTotal})`);
    console.log('');
    console.log('📊 Your User Calibration:');
    console.log(`   Top: ${userTop}, Middle: ${userMiddle}, Bottom: ${userBottom} (Total: ${userTotal})`);
    console.log('');
    
    // Merge samples
    const mergedData = {
        scrollUp: {
            samples: [...(masterData.scrollUp?.samples || []), ...(userData.scrollUp?.samples || [])],
            normalizedY: 0,
            mean: 0,
            stdDev: 0,
            min: 0,
            max: 0
        },
        scrollDown: {
            samples: [...(masterData.scrollDown?.samples || []), ...(userData.scrollDown?.samples || [])],
            normalizedY: 0,
            mean: 0,
            stdDev: 0,
            min: 0,
            max: 0
        },
        noScroll: {
            samples: [...(masterData.noScroll?.samples || []), ...(userData.noScroll?.samples || [])],
            normalizedY: 0,
            mean: 0,
            stdDev: 0,
            min: 0,
            max: 0
        },
        calibrated: true
    };
    
    // Calculate statistics for each zone
    ['scrollUp', 'scrollDown', 'noScroll'].forEach((action) => {
        const samples = mergedData[action].samples;
        if (samples.length > 0) {
            const stats = calculateStatistics(samples);
            mergedData[action].normalizedY = stats.mean;
            mergedData[action].mean = stats.mean;
            mergedData[action].stdDev = stats.stdDev;
            mergedData[action].min = stats.min;
            mergedData[action].max = stats.max;
        }
    });
    
    const mergedTop = mergedData.scrollUp.samples.length;
    const mergedMiddle = mergedData.noScroll.samples.length;
    const mergedBottom = mergedData.scrollDown.samples.length;
    const mergedTotal = mergedTop + mergedMiddle + mergedBottom;
    
    console.log('✅ Merged Calibration:');
    console.log(`   Top: ${mergedTop}, Middle: ${mergedMiddle}, Bottom: ${mergedBottom} (Total: ${mergedTotal})`);
    console.log('');
    
    return mergedData;
}

// Main execution
const masterCalPath = path.join(__dirname, '../src/lib/master-calibration-data.json');
const masterData = JSON.parse(fs.readFileSync(masterCalPath, 'utf8'));

let userData = null;

// Check command line arguments
const args = process.argv.slice(2);

if (args.length === 0) {
    console.log('❌ Error: No user calibration data provided');
    console.log('');
    console.log('Usage:');
    console.log('  node scripts/merge-calibration-data.js <path-to-user-data.json>');
    console.log('  OR');
    console.log('  node scripts/merge-calibration-data.js --json \'{"scrollUp": {...}, ...}\'');
    console.log('');
    console.log('To get your user data:');
    console.log('  1. Open the eye tracking panel on a chapter page');
    console.log('  2. Click "📤 Export Calibration Data"');
    console.log('  3. In the console, find "RAW LOCALSTORAGE DATA"');
    console.log('  4. Copy that JSON and save it to a file, or paste it as --json argument');
    process.exit(1);
}

if (args[0] === '--json') {
    // Parse JSON from command line
    try {
        userData = JSON.parse(args[1]);
    } catch (error) {
        console.error('❌ Error parsing JSON:', error.message);
        process.exit(1);
    }
} else {
    // Read from file
    const userDataPath = path.resolve(args[0]);
    if (!fs.existsSync(userDataPath)) {
        console.error(`❌ Error: File not found: ${userDataPath}`);
        process.exit(1);
    }
    try {
        userData = JSON.parse(fs.readFileSync(userDataPath, 'utf8'));
    } catch (error) {
        console.error('❌ Error reading file:', error.message);
        process.exit(1);
    }
}

// Validate user data structure
if (!userData.scrollUp || !userData.scrollDown || !userData.noScroll) {
    console.error('❌ Error: Invalid calibration data structure. Expected scrollUp, scrollDown, and noScroll fields.');
    process.exit(1);
}

// Merge the data
const mergedData = mergeCalibrationData(masterData, userData);

// Backup original master file
const backupPath = masterCalPath + '.backup';
fs.writeFileSync(backupPath, JSON.stringify(masterData, null, 2));
console.log(`💾 Backup created: ${backupPath}`);
console.log('');

// Write merged data to master file
fs.writeFileSync(masterCalPath, JSON.stringify(mergedData, null, 2));
console.log(`✅ Master calibration file updated: ${masterCalPath}`);
console.log('');
console.log('🎉 Success! The system will now use all', mergedData.scrollUp.samples.length + mergedData.scrollDown.samples.length + mergedData.noScroll.samples.length, 'samples for training.');
console.log('');
console.log('Next steps:');
console.log('  1. Test eye tracking to verify improved accuracy');
console.log('  2. If needed, you can restore the backup: mv', backupPath, masterCalPath);

