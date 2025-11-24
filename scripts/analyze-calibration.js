// Analyze calibration data for accuracy and precision
const calibration = {
  scrollUp: {
    mean: -0.16787074698525378,
    stdDev: 0.0016010637061404467,
    min: -0.17018064403617,
    max: -0.1660904706811151
  },
  scrollDown: {
    mean: -0.15392034361431023,
    stdDev: 0.0011839555101398646,
    min: -0.15586649753713383,
    max: -0.1527321542378908
  },
  noScroll: {
    mean: -0.1640265897555517,
    stdDev: 0.0024813965073569384,
    min: -0.16754697647636244,
    max: -0.15995401427877134
  }
};

console.log('=== CALIBRATION DATA ANALYSIS ===\n');

// Calculate ranges (mean ± 2*stdDev)
const scrollUpRange = {
  min: calibration.scrollUp.mean - (2 * calibration.scrollUp.stdDev),
  max: calibration.scrollUp.mean + (2 * calibration.scrollUp.stdDev)
};

const scrollDownRange = {
  min: calibration.scrollDown.mean - (2 * calibration.scrollDown.stdDev),
  max: calibration.scrollDown.mean + (2 * calibration.scrollDown.stdDev)
};

const noScrollRange = {
  min: calibration.noScroll.mean - (2 * calibration.noScroll.stdDev),
  max: calibration.noScroll.mean + (2 * calibration.noScroll.stdDev)
};

console.log('Scroll Up Range:', scrollUpRange);
console.log('Scroll Down Range:', scrollDownRange);
console.log('No Scroll Range:', noScrollRange);
console.log('');

// Check for overlaps
const hasOverlap = (range1, range2) => {
  return range1.max >= range2.min && range1.min <= range2.max;
};

const upDownOverlap = hasOverlap(scrollUpRange, scrollDownRange);
const upNoOverlap = hasOverlap(scrollUpRange, noScrollRange);
const downNoOverlap = hasOverlap(scrollDownRange, noScrollRange);

console.log('=== OVERLAP ANALYSIS ===');
console.log('ScrollUp ↔ ScrollDown overlap:', upDownOverlap);
console.log('ScrollUp ↔ NoScroll overlap:', upNoOverlap);
console.log('ScrollDown ↔ NoScroll overlap:', downNoOverlap);
console.log('');

// Calculate separation
const upDownSeparation = Math.abs(calibration.scrollUp.mean - calibration.scrollDown.mean);
const upNoSeparation = Math.abs(calibration.scrollUp.mean - calibration.noScroll.mean);
const downNoSeparation = Math.abs(calibration.scrollDown.mean - calibration.noScroll.mean);

console.log('=== SEPARATION ANALYSIS ===');
console.log('ScrollUp ↔ ScrollDown separation:', upDownSeparation.toFixed(6));
console.log('ScrollUp ↔ NoScroll separation:', upNoSeparation.toFixed(6));
console.log('ScrollDown ↔ NoScroll separation:', downNoSeparation.toFixed(6));
console.log('');

// Calculate precision (smaller stdDev = more precise)
console.log('=== PRECISION ANALYSIS ===');
console.log('ScrollUp precision (stdDev):', calibration.scrollUp.stdDev.toFixed(6), calibration.scrollUp.stdDev < 0.002 ? '✅ Good' : '⚠️ Low');
console.log('ScrollDown precision (stdDev):', calibration.scrollDown.stdDev.toFixed(6), calibration.scrollDown.stdDev < 0.002 ? '✅ Good' : '⚠️ Low');
console.log('NoScroll precision (stdDev):', calibration.noScroll.stdDev.toFixed(6), calibration.noScroll.stdDev < 0.003 ? '✅ Good' : '⚠️ Low');
console.log('');

// Recommendations
console.log('=== RECOMMENDATIONS ===');
if (upNoOverlap || downNoOverlap) {
  console.log('⚠️ WARNING: Overlapping ranges detected! This may cause jitter.');
  console.log('   Consider using tighter ranges (mean ± 1.5*stdDev) or better separation logic.');
}
if (upDownSeparation < 0.01) {
  console.log('⚠️ WARNING: ScrollUp and ScrollDown are very close!');
  console.log('   Separation:', upDownSeparation.toFixed(6), '< 0.01');
}
console.log('✅ Calibration data looks reasonable for testing.');

