# RealmVerse Performance Guide

## STEP 3 – MongoDB indexes (run once)

Faster queries for list/featured/browse. In MongoDB shell or Compass, run:

```javascript
// manga collection
db.manga.createIndex({ createdAt: -1 });
db.manga.createIndex({ views: -1, likes: -1 });
db.manga.createIndex({ title: 1 });
db.manga.createIndex({ genres: 1 });
db.manga.createIndex({ status: 1 });
db.manga.createIndex({ uploaderId: 1 });
```

## Implemented optimizations

- **Homepage**: Hero first; Featured section uses API with light payload; AI toggles/MoodDiscovery/BuyMeACoffee loaded dynamically.
- **API manga**: Cache-Control for public list/featured; projection (no description) for list requests; revalidate hint.
- **Images**: Cloudinary cover URLs use `q_auto,f_auto,w_400` via `lib/cloudinary-optimize.ts`.
- **Reader**: Progressive image load (slice by `loadedPageCount`); limited initial PDF URLs.
- **Fonts**: `next/font` (Inter) with `display: 'swap'` in root layout.
- **Heavy features**: EyeTracking, AutoBrightness, VoiceAssistant loaded only when enabled and after interaction.

## Optional next steps

- Add ISR/revalidate to static routes (e.g. `revalidate = 60` in page or fetch).
- Use Next.js `<Image>` everywhere for manga covers with proper `sizes`.
- Anime: HLS/adaptive streaming instead of direct MP4 where possible.
