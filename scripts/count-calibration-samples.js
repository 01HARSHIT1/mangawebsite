const fs = require('fs');
const path = require('path');

// Read master calibration file
const masterCalPath = path.join(__dirname, '../src/lib/master-calibration-data.json');
const masterCal = JSON.parse(fs.readFileSync(masterCalPath, 'utf8'));

console.log('='.repeat(80));
console.log('📊 EYE TRACKING CALIBRATION DATA SUMMARY');
console.log('='.repeat(80));
console.log('');
console.log('📁 Master Calibration File (master-calibration-data.json):');
console.log('   ScrollUp (TOP):     ', masterCal.scrollUp.samples.length, 'samples');
console.log('   ScrollDown (BOTTOM):', masterCal.scrollDown.samples.length, 'samples');
console.log('   NoScroll (MIDDLE):   ', masterCal.noScroll.samples.length, 'samples');
console.log('   ──────────────────────────────────────────────');
const masterTotal = masterCal.scrollUp.samples.length + 
                   masterCal.scrollDown.samples.length + 
                   masterCal.noScroll.samples.length;
console.log('   TOTAL (Master):     ', masterTotal, 'samples');
console.log('');
console.log('📝 Note:');
console.log('   - Master calibration: Hardcoded in the codebase (available to all users)');
console.log('   - User feedback: Stored in browser localStorage (per-user)');
console.log('   - System uses: Master + User localStorage = Combined total');
console.log('');
console.log('   If you provided 30 more samples via feedback:');
console.log('   - They are stored in your browser localStorage');
console.log('   - System automatically merges: Master (15) + Your (30) = 45 total');
console.log('   - Use the "🔍 Verify" button in eye tracking panel to check your localStorage');
console.log('');
console.log('='.repeat(80));

