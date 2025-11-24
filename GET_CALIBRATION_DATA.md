# Get Your Calibration Data

## Quick Steps:

1. Open your browser on the manga website
2. Press F12 to open Developer Tools
3. Go to the **Console** tab
4. Copy and paste this command:

```javascript
const data = JSON.parse(localStorage.getItem('eyeTrackingCalibration'));
if (data) {
    console.log('=== COPY THIS DATA ===');
    console.log(JSON.stringify({
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
    }, null, 2));
    console.log('=== END OF DATA ===');
} else {
    console.log('No calibration data found. Please complete calibration first.');
}
```

5. Copy the output and paste it here



