# Deep Learning & AI Features - Code Package

This package contains all the deep learning and machine learning code from the MangaReader website.

## 📦 Contents

### Core Deep Learning Libraries

#### 1. Eye Tracking ML Model (TensorFlow.js)
- `src/lib/eye-tracking-ml.ts` - Neural network for eye tracking (TensorFlow.js)
- `src/lib/eye-tracking-intent.ts` - Intent detection for eye tracking
- `src/lib/shared-face-mesh.ts` - MediaPipe Face Mesh integration
- `src/lib/one-euro-filter.ts` - Smoothing filter for eye tracking
- `src/components/EyeTracking.tsx` - UI component for eye tracking

#### 2. Semantic Search & Embeddings
- `src/lib/embeddings.ts` - Sentence Transformers for text embeddings
- `src/lib/semantic-search.ts` - Semantic search engine
- `src/lib/semantic-search-v2.ts` - Enhanced semantic search
- `src/components/AdvancedSearch.tsx` - Advanced search UI
- `src/app/api/search/semantic/route.ts` - Semantic search API

#### 3. AI Recommendations
- `src/lib/ai-recommendations.ts` - AI recommendation engine
- `src/components/AIRecommendations.tsx` - Recommendations UI
- `src/app/api/manga/recommendations/personalized/route.ts` - Recommendations API
- `src/app/api/ai/recommendations/route.ts` - Alternative recommendations API

#### 4. Mood-Based Discovery
- `src/lib/ai-mood-discovery.ts` - Mood discovery engine
- `src/components/MoodDiscovery.tsx` - Mood discovery UI
- `src/app/api/manga/mood-discovery/route.ts` - Mood discovery API

#### 5. Previously On Recap
- `src/lib/ai-previously-on.ts` - Previously on recap generator
- `src/components/PreviouslyOnRecap.tsx` - Recap UI component
- `src/app/api/manga/[mangaId]/previously-on/route.ts` - Previously on API

#### 6. Chapter Summaries
- `src/lib/ai-chapter-summaries.ts` - Chapter summary generator
- `src/components/ChapterSummary.tsx` - Summary UI component
- `src/app/api/chapters/[chapterId]/summary/route.ts` - Chapter summary API

#### 7. Auto Brightness (Face Detection)
- `src/lib/auto-brightness.ts` - Auto brightness controller (uses ML for face detection)
- `src/components/AutoBrightness.tsx` - Auto brightness UI component

#### 8. Voice Assistant (NLP)
- `src/components/VoiceAssistant.tsx` - Voice assistant with NLP pattern matching

### Supporting Files
- `src/lib/ai-features-config.ts` - AI features configuration
- `src/lib/ai-metrics-simulator.ts` - AI metrics simulation
- `src/hooks/useAIFeatures.ts` - React hook for AI features
- `src/components/AIFeatureToggles.tsx` - AI feature toggle UI
- `src/app/api/user/ai-preferences/route.ts` - User AI preferences API
- `src/app/api/ai/metrics/route.ts` - AI metrics API

## 🚀 Technology Stack

### Client-Side (Browser)
- **TensorFlow.js** - `@tensorflow/tfjs` (Eye Tracking ML)
- **MediaPipe** - `@mediapipe/face_mesh` (Face/Eye Detection)
- **Web Speech API** - Browser API (Voice Assistant)

### Server-Side (Node.js)
- **Sentence Transformers** - `@xenova/transformers` (Text Embeddings)

## 📋 Dependencies

To use these files, you'll need:

```json
{
  "@tensorflow/tfjs": "^4.0.0",
  "@mediapipe/camera_utils": "^0.3.0",
  "@mediapipe/face_mesh": "^0.4.0",
  "@xenova/transformers": "^2.0.0",
  "react": "^18.0.0",
  "next": "^14.0.0"
}
```

## 📖 Documentation

For detailed documentation on how each feature works, see:
- `DEEP_LEARNING_FEATURES_DOCUMENTATION.md` (if included)
- `DEEP_LEARNING_FILES_LIST.md` (if included)

## 🔧 Usage

These files are designed to work within a Next.js application. Key integration points:

1. **Eye Tracking**: Integrates with chapter reading pages
2. **Semantic Search**: Used in search functionality
3. **Recommendations**: Used on homepage and manga detail pages
4. **Mood Discovery**: Used in mood selector on homepage
5. **Previously On**: Used on manga detail pages for returning users
6. **Chapter Summaries**: Used on chapter reading pages
7. **Auto Brightness**: Optional feature on reading pages
8. **Voice Assistant**: Global component available on all pages

## 📝 Notes

- All ML models run client-side (TensorFlow.js) or server-side (Transformers)
- The system uses a hybrid approach combining ML with statistical methods
- Some files may require additional context from the main application (database connections, authentication, etc.)

## 📄 License

This code is part of the MangaReader project. Please refer to the main project license.

