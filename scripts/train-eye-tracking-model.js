// Training script for Eye Tracking ML Model
// Uses the 59 calibration samples to train the neural network
// Run: node scripts/train-eye-tracking-model.js

const fs = require('fs');
const path = require('path');

// Load master calibration data
const calibrationPath = path.join(__dirname, '../src/lib/master-calibration-data.json');
const calibrationData = JSON.parse(fs.readFileSync(calibrationPath, 'utf8'));

console.log('👁️ ML Training: Loading calibration data...');
console.log(`  - ScrollUp samples: ${calibrationData.scrollUp.samples.length}`);
console.log(`  - ScrollDown samples: ${calibrationData.scrollDown.samples.length}`);
console.log(`  - NoScroll samples: ${calibrationData.noScroll.samples.length}`);
console.log(`  - Total: ${calibrationData.scrollUp.samples.length + calibrationData.scrollDown.samples.length + calibrationData.noScroll.samples.length}`);

// Prepare training data summary
const trainingData = {
    scrollUp: calibrationData.scrollUp.samples,
    scrollDown: calibrationData.scrollDown.samples,
    noScroll: calibrationData.noScroll.samples
};

console.log('\n📊 Training Data Summary:');
console.log('  ScrollUp range:', {
    min: Math.min(...trainingData.scrollUp),
    max: Math.max(...trainingData.scrollUp),
    mean: calibrationData.scrollUp.mean,
    stdDev: calibrationData.scrollUp.stdDev
});
console.log('  ScrollDown range:', {
    min: Math.min(...trainingData.scrollDown),
    max: Math.max(...trainingData.scrollDown),
    mean: calibrationData.scrollDown.mean,
    stdDev: calibrationData.scrollDown.stdDev
});
console.log('  NoScroll range:', {
    min: Math.min(...trainingData.noScroll),
    max: Math.max(...trainingData.noScroll),
    mean: calibrationData.noScroll.mean,
    stdDev: calibrationData.noScroll.stdDev
});

console.log('\n✅ Training data prepared!');
console.log('📝 Note: The ML model will be trained automatically in the browser when:');
console.log('   1. User loads the eye tracking page');
console.log('   2. Calibration data is available (59 samples)');
console.log('   3. Model is not already trained/saved');
console.log('\n💡 The model training happens client-side using TensorFlow.js');
console.log('   This ensures privacy (no data sent to server) and real-time adaptation.');

// Export training data for reference
const exportPath = path.join(__dirname, '../data/training-data-summary.json');
fs.mkdirSync(path.dirname(exportPath), { recursive: true });
fs.writeFileSync(exportPath, JSON.stringify({
    ...trainingData,
    metadata: {
        totalSamples: trainingData.scrollUp.length + trainingData.scrollDown.length + trainingData.noScroll.length,
        scrollUpCount: trainingData.scrollUp.length,
        scrollDownCount: trainingData.scrollDown.length,
        noScrollCount: trainingData.noScroll.length,
        exportedAt: new Date().toISOString()
    }
}, null, 2));

console.log(`\n💾 Training data summary exported to: ${exportPath}`);

