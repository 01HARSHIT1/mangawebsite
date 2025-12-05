# Deep Learning Files - Complete List

This document lists all files containing deep learning and machine learning code in the MangaReader project.

---

## 📁 Core Deep Learning Libraries

### 1. Eye Tracking ML Model (TensorFlow.js)
- **`src/lib/eye-tracking-ml.ts`** ⭐ Main ML model implementation
- **`src/lib/eye-tracking.ts`** - Eye tracking engine (integrates ML model)
- **`src/lib/eye-tracking-intent.ts`** - Intent detection for eye tracking
- **`src/lib/shared-face-mesh.ts`** - MediaPipe Face Mesh integration
- **`src/lib/one-euro-filter.ts`** - Smoothing filter for eye tracking
- **`src/components/EyeTracking.tsx`** - UI component for eye tracking
- **`src/app/eye-tracking-calibration/page.tsx`** - Calibration page

### 2. Semantic Search & Embeddings
- **`src/lib/embeddings.ts`** ⭐ Sentence Transformers for embeddings
- **`src/lib/semantic-search.ts`** - Semantic search engine
- **`src/lib/semantic-search-v2.ts`** - Enhanced semantic search
- **`src/app/api/search/semantic/route.ts`** - Semantic search API endpoint

### 3. AI Recommendations
- **`src/lib/ai-recommendations.ts`** ⭐ Main recommendation engine
- **`src/components/AIRecommendations.tsx`** - Recommendations UI component
- **`src/app/api/manga/recommendations/personalized/route.ts`** - Recommendations API
- **`src/app/api/ai/recommendations/route.ts`** - Alternative recommendations API

### 4. Mood-Based Discovery
- **`src/lib/ai-mood-discovery.ts`** ⭐ Mood discovery engine
- **`src/components/MoodDiscovery.tsx`** - Mood discovery UI
- **`src/app/api/manga/mood-discovery/route.ts`** - Mood discovery API

### 5. Previously On Recap
- **`src/lib/ai-previously-on.ts`** ⭐ Previously on recap generator
- **`src/components/PreviouslyOnRecap.tsx`** - Recap UI component
- **`src/app/api/manga/[mangaId]/previously-on/route.ts`** - Previously on API

### 6. Chapter Summaries
- **`src/lib/ai-chapter-summaries.ts`** ⭐ Chapter summary generator
- **`src/components/ChapterSummary.tsx`** - Summary UI component
- **`src/app/api/chapters/[chapterId]/summary/route.ts`** - Chapter summary API

### 7. Auto Brightness (Face Detection)
- **`src/lib/auto-brightness.ts`** ⭐ Auto brightness controller (uses ML for face detection)
- **`src/components/AutoBrightness.tsx`** - Auto brightness UI component

### 8. Voice Assistant (NLP)
- **`src/components/VoiceAssistant.tsx`** ⭐ Voice assistant with NLP pattern matching

---

## 📁 Supporting Files

### Configuration & Hooks
- **`src/lib/ai-features-config.ts`** - AI features configuration
- **`src/hooks/useAIFeatures.ts`** - React hook for AI features
- **`src/components/AIFeatureToggles.tsx`** - AI feature toggle UI
- **`src/app/api/user/ai-preferences/route.ts`** - User AI preferences API

### Metrics & Analytics
- **`src/lib/ai-metrics-simulator.ts`** - AI metrics simulation
- **`src/app/api/ai/metrics/route.ts`** - AI metrics API
- **`src/app/admin/ai-metrics/page.tsx`** - Admin AI metrics page
- **`src/app/admin/ai/page.tsx`** - Admin AI settings page

### Integration Components
- **`src/components/MangaDetailClient.tsx`** - Uses AI recommendations
- **`src/components/AdvancedSearch.tsx`** - Uses semantic search
- **`src/components/ChapterReader.tsx`** - Integrates eye tracking and auto brightness
- **`src/components/SmartRecommendations.tsx`** - Smart recommendations component

---

## 📊 File Categories Summary

### Core ML/DL Implementation Files (⭐ = Primary)
1. **`src/lib/eye-tracking-ml.ts`** ⭐ - TensorFlow.js neural network
2. **`src/lib/embeddings.ts`** ⭐ - Sentence Transformers
3. **`src/lib/ai-recommendations.ts`** ⭐ - Recommendation algorithms
4. **`src/lib/ai-mood-discovery.ts`** ⭐ - Mood matching
5. **`src/lib/ai-previously-on.ts`** ⭐ - Recap generation
6. **`src/lib/ai-chapter-summaries.ts`** ⭐ - Summary generation
7. **`src/lib/auto-brightness.ts`** ⭐ - Face detection ML
8. **`src/components/VoiceAssistant.tsx`** ⭐ - NLP pattern matching

### Supporting Libraries
- **`src/lib/eye-tracking.ts`** - Eye tracking engine
- **`src/lib/eye-tracking-intent.ts`** - Intent detection
- **`src/lib/shared-face-mesh.ts`** - MediaPipe integration
- **`src/lib/one-euro-filter.ts`** - Smoothing filter
- **`src/lib/semantic-search.ts`** - Search engine
- **`src/lib/semantic-search-v2.ts`** - Enhanced search

### UI Components
- **`src/components/EyeTracking.tsx`**
- **`src/components/AutoBrightness.tsx`**
- **`src/components/VoiceAssistant.tsx`**
- **`src/components/AIRecommendations.tsx`**
- **`src/components/MoodDiscovery.tsx`**
- **`src/components/PreviouslyOnRecap.tsx`**
- **`src/components/ChapterSummary.tsx`**
- **`src/components/AdvancedSearch.tsx`**
- **`src/components/AIFeatureToggles.tsx`**

### API Routes
- **`src/app/api/search/semantic/route.ts`**
- **`src/app/api/manga/recommendations/personalized/route.ts`**
- **`src/app/api/manga/mood-discovery/route.ts`**
- **`src/app/api/manga/[mangaId]/previously-on/route.ts`**
- **`src/app/api/chapters/[chapterId]/summary/route.ts`**
- **`src/app/api/user/ai-preferences/route.ts`**
- **`src/app/api/ai/metrics/route.ts`**
- **`src/app/api/ai/recommendations/route.ts`**

### Pages
- **`src/app/eye-tracking-calibration/page.tsx`**
- **`src/app/admin/ai-metrics/page.tsx`**
- **`src/app/admin/ai/page.tsx`**

---

## 📦 Technology Stack

### Client-Side (Browser)
- **TensorFlow.js** - `@tensorflow/tfjs` (Eye Tracking ML)
- **MediaPipe** - `@mediapipe/face_mesh` (Face/Eye Detection)
- **Web Speech API** - Browser API (Voice Assistant)

### Server-Side (Node.js)
- **Sentence Transformers** - `@xenova/transformers` (Text Embeddings)

---

## 🔍 Quick Reference

### Most Important Files (Core ML/DL Code)
1. **`src/lib/eye-tracking-ml.ts`** - Neural network for eye tracking
2. **`src/lib/embeddings.ts`** - Text embeddings generation
3. **`src/lib/ai-recommendations.ts`** - Recommendation algorithms
4. **`src/lib/ai-mood-discovery.ts`** - Mood-based discovery
5. **`src/lib/ai-previously-on.ts`** - Recap generation
6. **`src/lib/ai-chapter-summaries.ts`** - Chapter summaries
7. **`src/lib/auto-brightness.ts`** - Face detection for brightness
8. **`src/components/VoiceAssistant.tsx`** - NLP voice commands

### Total Files: **40+ files** containing deep learning code

---

## 📝 Notes

- Files marked with ⭐ contain the primary deep learning implementation
- Supporting files provide integration, UI, and API endpoints
- All ML models run client-side (TensorFlow.js) or server-side (Transformers)
- The system uses a hybrid approach combining ML with statistical methods

