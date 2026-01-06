# Testing Guide: Audio/Subtitle Implementation

## Overview
This guide helps verify that audio tracks and subtitles are properly stored in the database and correctly displayed in the video player.

## Data Flow

### 1. Upload Flow (Creator)
1. **Upload Form** (`/anime/creator/upload`)
   - Creator selects audio type (Single/Multiple)
   - Creator selects languages for audio tracks
   - Creator selects subtitle type (Hard Sub/Soft Sub)
   - Creator uploads subtitle files (if Soft Sub)
   - Form data is sent to `/api/anime/episodes`

2. **Episode Creation API** (`/api/anime/episodes`)
   - Receives `audioTracks` and `subtitles` arrays
   - Stores in MongoDB `anime_episodes` collection:
     ```javascript
     {
       audioTracks: [
         {
           language: "Japanese",
           languageCode: "ja",
           url: "video_url",
           isDefault: true
         }
       ],
       subtitles: [
         {
           language: "English",
           languageCode: "en",
           url: "subtitle_url",
           format: "vtt",
           isDefault: true
         }
       ]
     }
     ```

### 2. Retrieval Flow (Viewer)
1. **Episode List API** (`/api/anime/[seriesId]/episodes`)
   - Returns episodes with `audioTracks` and `subtitles` included
   - Used by SeriesDetails page to show available tracks

2. **Episode Detail API** (`/api/anime/[seriesId]/episodes/[episodeNumber]`)
   - Returns episode with `availableTracks` object:
     ```javascript
     {
       availableTracks: {
         audio: [...],
         subtitles: [...]
       }
     }
     ```

3. **Playback API** (`/api/anime/episodes/[episodeId]/playback`)
   - Returns playback URL with tracks:
     ```javascript
     {
       manifestUrl: "...",
       subtitles: [...],
       audioTracks: [...]
     }
     ```

4. **Video Player** (`EnhancedVideoPlayer.tsx`)
   - Loads tracks from playback API (primary)
   - Falls back to episode props if playback API doesn't return tracks
   - Displays audio/subtitle selectors in UI
   - Allows switching between tracks

## Testing Checklist

### ✅ Database Storage
- [ ] Upload episode with single audio track
- [ ] Upload episode with multiple audio tracks
- [ ] Upload episode with soft subtitles
- [ ] Upload episode with hard subtitles
- [ ] Verify data in MongoDB `anime_episodes` collection

### ✅ API Endpoints
- [ ] `/api/anime/episodes` - Creates episode with tracks
- [ ] `/api/anime/[seriesId]/episodes` - Returns episodes with tracks
- [ ] `/api/anime/[seriesId]/episodes/[episodeNumber]` - Returns episode with availableTracks
- [ ] `/api/anime/episodes/[episodeId]/playback` - Returns playback data with tracks

### ✅ Frontend Display
- [ ] SeriesDetails page shows audio selector (if multiple tracks)
- [ ] SeriesDetails page shows subtitle selector (if subtitles exist)
- [ ] Video player shows audio/subtitle controls
- [ ] Audio track switching works
- [ ] Subtitle switching works
- [ ] Default tracks are selected correctly

### ✅ Edge Cases
- [ ] Episode with no audio tracks (should show single default)
- [ ] Episode with no subtitles (should not show subtitle selector)
- [ ] Episode with single audio track (should show static label)
- [ ] Episode with multiple audio tracks (should show dropdown)
- [ ] Playback API failure (should use episode props as fallback)

## Manual Testing Steps

### Test 1: Upload with Single Audio + Soft Subtitles
1. Go to `/anime/creator/upload`
2. Fill in series details
3. Select "Single Audio" → Choose "Japanese"
4. Select "Soft Sub" → Upload English VTT file
5. Upload episode video
6. Submit form
7. Check MongoDB: `db.anime_episodes.findOne({})` - verify `audioTracks` and `subtitles` arrays

### Test 2: Upload with Multiple Audio
1. Go to `/anime/creator/upload`
2. Select existing series or create new
3. Select "Multiple Audio" → Check "Japanese" and "English"
4. Set default to "Japanese"
5. Upload episode
6. Check database for multiple audio tracks

### Test 3: View Episode with Tracks
1. Navigate to series detail page
2. Click on episode with tracks
3. Verify audio/subtitle selectors appear
4. Test switching between tracks
5. Check browser console for any errors

### Test 4: API Response Verification
1. Open browser DevTools → Network tab
2. Navigate to episode page
3. Check API responses:
   - `/api/anime/[seriesId]/episodes/[episodeNumber]` - should have `availableTracks`
   - `/api/anime/episodes/[episodeId]/playback` - should have `subtitles` and `audioTracks`

## Debugging

### Check Database
```javascript
// MongoDB query to check episode tracks
db.anime_episodes.findOne(
  { title: "Your Episode Title" },
  { audioTracks: 1, subtitles: 1, _id: 1 }
)
```

### Check Console Logs
- Video player logs track loading: `console.log('Setting video source:', videoSrc)`
- Check for errors in browser console
- Check Network tab for API responses

### Common Issues
1. **Tracks not showing**: Check if data is in database
2. **Tracks not switching**: Check if video player receives track data
3. **Subtitle not loading**: Check subtitle URL is accessible
4. **Audio not switching**: For single video file, audio switching requires HLS/DASH with multiple audio streams

## Notes
- Audio track switching for single video file is limited (requires HLS/DASH with multiple audio streams)
- Hard subtitles are burned into video, so no separate files needed
- Soft subtitles require separate VTT/SRT files uploaded
- Default tracks are selected based on `isDefault: true` flag

