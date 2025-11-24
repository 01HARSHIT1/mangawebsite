// One-time script to extract calibration data
// Run this in browser console: copy(JSON.parse(localStorage.getItem('eyeTrackingCalibration')))

// Or use this function:
function exportCalibration() {
    const data = JSON.parse(localStorage.getItem('eyeTrackingCalibration'));
    if (!data) {
        console.log('No calibration data found in localStorage');
        return null;
    }
    
    const exportData = {
        scrollUp: {
            samples: data.scrollUp.samples,
            mean: data.scrollUp.mean,
            stdDev: data.scrollUp.stdDev,
            min: data.scrollUp.min,
            max: data.scrollUp.max
        },
        scrollDown: {
            samples: data.scrollDown.samples,
            mean: data.scrollDown.mean,
            stdDev: data.scrollDown.stdDev,
            min: data.scrollDown.min,
            max: data.scrollDown.max
        },
        noScroll: {
            samples: data.noScroll.samples,
            mean: data.noScroll.mean,
            stdDev: data.noScroll.stdDev,
            min: data.noScroll.min,
            max: data.noScroll.max
        }
    };
    
    console.log('Copy this data:');
    console.log(JSON.stringify(exportData, null, 2));
    return exportData;
}

// Run: exportCalibration()



