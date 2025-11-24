# Extract Calibration Data - ONE COMMAND

Since you've already completed calibration, the data is stored. Just run this ONE command in your browser console:

```javascript
const data = JSON.parse(localStorage.getItem('eyeTrackingCalibration')); if(data && data.calibrated) { const code = `let DEFAULT_MASTER_CALIBRATION: CalibrationData = { scrollUp: { normalizedY: ${data.scrollUp.mean}, samples: [${data.scrollUp.samples.join(', ')}], mean: ${data.scrollUp.mean}, stdDev: ${data.scrollUp.stdDev}, min: ${data.scrollUp.min}, max: ${data.scrollUp.max} }, scrollDown: { normalizedY: ${data.scrollDown.mean}, samples: [${data.scrollDown.samples.join(', ')}], mean: ${data.scrollDown.mean}, stdDev: ${data.scrollDown.stdDev}, min: ${data.scrollDown.min}, max: ${data.scrollDown.max} }, noScroll: { normalizedY: ${data.noScroll.mean}, samples: [${data.noScroll.samples.join(', ')}], mean: ${data.noScroll.mean}, stdDev: ${data.noScroll.stdDev}, min: ${data.noScroll.min}, max: ${data.noScroll.max} }, calibrated: true };`; console.log('=== COPY THIS CODE ==='); console.log(code); console.log('=== END ==='); copy(code); } else { console.log('No calibration data found'); }
```

This will automatically:
1. Read your existing calibration data
2. Generate the hardcoded code
3. Copy it to clipboard
4. Display it in console

Then I'll automatically apply it and remove the calibration UI.



