const fs = require('fs');
const path = require('path');

// Analyze calibration data to understand distribution and suggest improvements
const calPath = path.join(__dirname, '../src/lib/master-calibration-data.json');
const cal = JSON.parse(fs.readFileSync(calPath, 'utf8'));

console.log('='.repeat(80));
console.log('📊 CALIBRATION DATA ANALYSIS');
console.log('='.repeat(80));
console.log('');

// Calculate separation between zones
const scrollUpMean = cal.scrollUp.mean;
const scrollDownMean = cal.scrollDown.mean;
const noScrollMean = cal.noScroll.mean;

const scrollUpStdDev = cal.scrollUp.stdDev;
const scrollDownStdDev = cal.scrollDown.stdDev;
const noScrollStdDev = cal.noScroll.stdDev;

console.log('📈 Zone Statistics:');
console.log('  ScrollUp (TOP):');
console.log(`    Mean: ${scrollUpMean.toFixed(6)}`);
console.log(`    StdDev: ${scrollUpStdDev.toFixed(6)}`);
console.log(`    Range: [${cal.scrollUp.min.toFixed(6)}, ${cal.scrollUp.max.toFixed(6)}]`);
console.log(`    Samples: ${cal.scrollUp.samples.length}`);
console.log('');

console.log('  ScrollDown (BOTTOM):');
console.log(`    Mean: ${scrollDownMean.toFixed(6)}`);
console.log(`    StdDev: ${scrollDownStdDev.toFixed(6)}`);
console.log(`    Range: [${cal.scrollDown.min.toFixed(6)}, ${cal.scrollDown.max.toFixed(6)}]`);
console.log(`    Samples: ${cal.scrollDown.samples.length}`);
console.log('');

console.log('  NoScroll (MIDDLE):');
console.log(`    Mean: ${noScrollMean.toFixed(6)}`);
console.log(`    StdDev: ${noScrollStdDev.toFixed(6)}`);
console.log(`    Range: [${cal.noScroll.min.toFixed(6)}, ${cal.noScroll.max.toFixed(6)}]`);
console.log(`    Samples: ${cal.noScroll.samples.length}`);
console.log('');

// Calculate separation
const upToMiddleDist = Math.abs(scrollUpMean - noScrollMean);
const downToMiddleDist = Math.abs(scrollDownMean - noScrollMean);
const upToDownDist = Math.abs(scrollUpMean - scrollDownMean);

console.log('📏 Zone Separation:');
console.log(`  Top to Middle: ${upToMiddleDist.toFixed(6)} (${(upToMiddleDist / noScrollStdDev).toFixed(2)} stdDev)`);
console.log(`  Bottom to Middle: ${downToMiddleDist.toFixed(6)} (${(downToMiddleDist / noScrollStdDev).toFixed(2)} stdDev)`);
console.log(`  Top to Bottom: ${upToDownDist.toFixed(6)} (${(upToDownDist / ((scrollUpStdDev + scrollDownStdDev) / 2)).toFixed(2)} stdDev)`);
console.log('');

// Check for overlap
const upRange = [scrollUpMean - 2 * scrollUpStdDev, scrollUpMean + 2 * scrollUpStdDev];
const downRange = [scrollDownMean - 2 * scrollDownStdDev, scrollDownMean + 2 * scrollDownStdDev];
const middleRange = [noScrollMean - 2 * noScrollStdDev, noScrollMean + 2 * noScrollStdDev];

const upMiddleOverlap = !(upRange[1] < middleRange[0] || upRange[0] > middleRange[1]);
const downMiddleOverlap = !(downRange[1] < middleRange[0] || downRange[0] > middleRange[1]);
const upDownOverlap = !(upRange[1] < downRange[0] || upRange[0] > downRange[1]);

console.log('🔍 Overlap Analysis (2 stdDev ranges):');
console.log(`  Top ↔ Middle: ${upMiddleOverlap ? '⚠️ OVERLAPS' : '✅ SEPARATED'}`);
console.log(`  Bottom ↔ Middle: ${downMiddleOverlap ? '⚠️ OVERLAPS' : '✅ SEPARATED'}`);
console.log(`  Top ↔ Bottom: ${upDownOverlap ? '⚠️ OVERLAPS' : '✅ SEPARATED'}`);
console.log('');

// Calculate optimal thresholds
const optimalUpThreshold = scrollUpMean + scrollUpStdDev;
const optimalDownThreshold = scrollDownMean - scrollDownStdDev;
const optimalMiddleMin = noScrollMean - noScrollStdDev;
const optimalMiddleMax = noScrollMean + noScrollStdDev;

console.log('🎯 Recommended Detection Thresholds:');
console.log(`  Top Zone: normalizedY < ${optimalUpThreshold.toFixed(6)}`);
console.log(`  Middle Zone: ${optimalMiddleMin.toFixed(6)} <= normalizedY <= ${optimalMiddleMax.toFixed(6)}`);
console.log(`  Bottom Zone: normalizedY > ${optimalDownThreshold.toFixed(6)}`);
console.log('');

// Calculate confidence boost factors
const upConfidenceBoost = upToMiddleDist / scrollUpStdDev;
const downConfidenceBoost = downToMiddleDist / scrollDownStdDev;
const middleConfidenceBoost = Math.min(upToMiddleDist, downToMiddleDist) / noScrollStdDev;

console.log('💪 Confidence Boost Factors:');
console.log(`  Top: ${upConfidenceBoost.toFixed(2)}x (higher = more confident)`);
console.log(`  Bottom: ${downConfidenceBoost.toFixed(2)}x (higher = more confident)`);
console.log(`  Middle: ${middleConfidenceBoost.toFixed(2)}x (higher = more confident)`);
console.log('');

// Overall assessment
const totalSamples = cal.scrollUp.samples.length + cal.scrollDown.samples.length + cal.noScroll.samples.length;
const avgStdDev = (scrollUpStdDev + scrollDownStdDev + noScrollStdDev) / 3;
const minSeparation = Math.min(upToMiddleDist, downToMiddleDist);

console.log('📊 Overall Assessment:');
console.log(`  Total Samples: ${totalSamples}`);
console.log(`  Average StdDev: ${avgStdDev.toFixed(6)}`);
console.log(`  Minimum Zone Separation: ${minSeparation.toFixed(6)}`);
console.log(`  Separation Ratio: ${(minSeparation / avgStdDev).toFixed(2)} (higher = better)`);
console.log('');

if (minSeparation / avgStdDev > 2) {
    console.log('✅ EXCELLENT: Zones are well-separated. Detection should be highly accurate.');
} else if (minSeparation / avgStdDev > 1) {
    console.log('⚠️ GOOD: Zones are reasonably separated. Some overlap may occur.');
} else {
    console.log('❌ CHALLENGING: Zones overlap significantly. Consider more samples or better calibration.');
}

console.log('');
console.log('='.repeat(80));

