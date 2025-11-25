# How to Merge Your 30 Samples with Master Calibration

This guide will help you export your 30 calibration samples and merge them with the master calibration file, so the system uses all 45+ samples for training.

## Step 1: Export Your Calibration Data

1. **Open a manga chapter page** (where eye tracking is available)
2. **Start eye tracking** (click "Start tracking" if not already active)
3. **Click the "📤 Export Calibration Data" button** in the eye tracking panel
4. **Open browser console** (Press F12, then go to Console tab)
5. **Look for "RAW LOCALSTORAGE DATA"** section in the console output
6. **Copy the entire JSON object** (it should look like this):

```json
{
  "scrollUp": {
    "normalizedY": -0.16787074698525378,
    "samples": [-0.166, -0.169, ...],
    "mean": -0.16787074698525378,
    "stdDev": 0.0016010637061404467,
    "min": -0.17018064403617,
    "max": -0.1660904706811151
  },
  "scrollDown": {
    "normalizedY": -0.15392034361431023,
    "samples": [-0.152, -0.153, ...],
    "mean": -0.15392034361431023,
    "stdDev": 0.0011839555101398646,
    "min": -0.15586649753713383,
    "max": -0.1527321542378908
  },
  "noScroll": {
    "normalizedY": -0.1640265897555517,
    "samples": [-0.167, -0.165, ...],
    "mean": -0.1640265897555517,
    "stdDev": 0.0024813965073569384,
    "min": -0.16754697647636244,
    "max": -0.15995401427877134
  },
  "calibrated": true
}
```

## Step 2: Save Your Data

### Option A: Save to a File (Recommended)

1. **Create a file** named `user-calibration.json` in the project root
2. **Paste the copied JSON** into that file
3. **Save the file**

### Option B: Use Direct JSON (Alternative)

Just keep the JSON copied to your clipboard for the next step.

## Step 3: Merge with Master Calibration

### If you saved to a file:

```bash
node scripts/merge-calibration-data.js user-calibration.json
```

### If you want to paste JSON directly:

```bash
node scripts/merge-calibration-data.js --json '{"scrollUp": {...}, "scrollDown": {...}, "noScroll": {...}, "calibrated": true}'
```

**Note:** Make sure to escape quotes properly if pasting directly.

## Step 4: Verify the Merge

The script will:
- ✅ Show you the current master calibration (15 samples)
- ✅ Show your user calibration (30 samples)
- ✅ Show the merged result (45 samples)
- ✅ Create a backup of the original master file
- ✅ Update `src/lib/master-calibration-data.json` with all 45 samples

## Step 5: Test Eye Tracking

1. **Restart your development server** (if running)
2. **Test eye tracking** on a chapter page
3. **Check the "Calibration Data" section** - it should show 45 total samples
4. **Verify improved accuracy** - the system should now use all 45 samples

## Troubleshooting

### "No user calibration data provided"
- Make sure you copied the "RAW LOCALSTORAGE DATA" JSON, not the merged data
- Check that the JSON is valid

### "Invalid calibration data structure"
- Make sure your JSON has `scrollUp`, `scrollDown`, and `noScroll` fields
- Each field should have a `samples` array

### "File not found"
- Make sure you're running the command from the project root directory
- Check that the file path is correct

## What Happens After Merging?

- ✅ Master calibration file now contains all 45 samples
- ✅ All users (including new users) will benefit from the improved calibration
- ✅ The system will use all 45 samples for training
- ✅ Better accuracy for top, middle, and bottom zone detection

## Backup

The script automatically creates a backup file:
- `src/lib/master-calibration-data.json.backup`

If you need to restore the original:
```bash
mv src/lib/master-calibration-data.json.backup src/lib/master-calibration-data.json
```

