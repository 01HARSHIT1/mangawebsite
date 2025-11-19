# Questions for Advanced AI Features Implementation

Before implementing the advanced deep learning features, I need to understand your requirements and preferences:

## 1. Eye Tracking Auto-Scroll

**Current Status**: Placeholder (scroll simulation, not real ML)

**Questions**:
1. **ML Framework Preference**:
   - MediaPipe Face Mesh (Google) - Lightweight, browser-based, good accuracy
   - TensorFlow.js with custom model - More control, requires model training
   - WebGazer.js - Simple but less accurate
   - Which do you prefer?

2. **Privacy & Permissions**:
   - Should we request camera permission only when user enables the feature?
   - Should video be processed locally (no server upload)?
   - Do you want to store any gaze data for analytics?

3. **Functionality**:
   - Auto-scroll speed: Fixed or adaptive based on reading speed?
   - Should it pause when user looks away?
   - Should it work in fullscreen mode only or also in normal view?
   - Do you want horizontal scrolling for manga pages?

4. **Performance**:
   - What's the minimum FPS you'd accept? (30fps, 60fps?)
   - Should we use Web Workers for processing to avoid blocking UI?

## 2. Light Detection for Auto Brightness

**Current Status**: Basic (AmbientLightSensor API with time-based fallback)

**Questions**:
1. **Brightness Adjustment**:
   - Should it adjust browser brightness (via CSS filters) or just theme (dark/light)?
   - Do you want smooth transitions or instant changes?
   - What brightness range? (e.g., 20% - 100%)

2. **Learning & Personalization**:
   - Should the system learn user preferences over time?
   - Should users be able to manually override brightness?
   - Do you want different brightness for different times of day?

3. **Fallback Behavior**:
   - If AmbientLightSensor is not available, use time-based detection?
   - Should we use device orientation/gyroscope as additional input?

4. **UI/UX**:
   - Show brightness indicator when adjusting?
   - Allow users to set minimum/maximum brightness limits?

## 3. Voice Assistant

**Current Status**: Basic (Web Speech API with simple commands)

**Questions**:
1. **Command Set**:
   - What commands do you want? (Current: next page, bookmark, go to chapter)
   - Do you want natural language commands? (e.g., "Show me action manga")
   - Should it work in reading mode only or site-wide?

2. **Wake Word**:
   - Do you want a wake word (e.g., "Hey Manga") or always listening?
   - Should it work offline or require internet?

3. **Feedback**:
   - Should it speak confirmations? (e.g., "Bookmarked")
   - Visual feedback (on-screen indicators)?
   - Error handling for misunderstood commands?

4. **Language Support**:
   - English only or multiple languages?
   - Accent/dialect tolerance?

## 4. Enhanced Recommendation System (Deep Learning)

**Current Status**: Working with real database, but using basic algorithms

**Questions**:
1. **ML Approach**:
   - Neural Collaborative Filtering (NCF) - Deep learning for recommendations
   - Matrix Factorization with embeddings
   - Hybrid approach (combine multiple methods)
   - Which do you prefer?

2. **Training**:
   - Should we train on user data? (Privacy concerns?)
   - Use pre-trained models or train from scratch?
   - How often should we retrain? (Daily, weekly, monthly?)

3. **Features to Consider**:
   - Reading time patterns
   - Genre preferences
   - Time of day preferences
   - Similar user behavior (collaborative)
   - Content similarity (content-based)
   - All of the above?

4. **Performance**:
   - Real-time recommendations or pre-computed?
   - Cache recommendations for how long?
   - How many recommendations per user? (10, 20, 50?)

## 5. Semantic Search (Deep Learning)

**Current Status**: Basic keyword matching

**Questions**:
1. **Embedding Model**:
   - Use pre-trained models (BERT, Sentence-BERT) or train custom?
   - Which language model? (Multilingual or English-only?)
   - Should we use a service (OpenAI embeddings) or self-hosted?

2. **Vector Database**:
   - FAISS (Facebook AI Similarity Search) - Fast, local
   - Pinecone - Managed service, scalable
   - MongoDB Atlas Vector Search - Integrated with existing DB
   - Which do you prefer?

3. **Search Features**:
   - Natural language queries only or also keyword search?
   - Should it understand manga-specific terms? (e.g., "isekai", "shounen")
   - Do you want image-based search? (Find manga by cover art)

4. **Indexing**:
   - Index manga titles, descriptions, tags, or all?
   - How often should we re-index? (Real-time or batch?)

## 6. General Questions

1. **Infrastructure**:
   - Do you have budget for external ML services? (OpenAI, Google Cloud AI, etc.)
   - Prefer self-hosted solutions or managed services?
   - What's your server capacity for running ML models?

2. **Privacy**:
   - Should all processing be client-side (browser) or server-side?
   - Do you want to collect user behavior data for training?
   - GDPR/privacy compliance requirements?

3. **Performance Priority**:
   - Accuracy over speed, or speed over accuracy?
   - What's acceptable latency? (Real-time, <1s, <5s?)

4. **Implementation Order**:
   - Which feature should we implement first?
   - Do you want all features at once or one at a time?

## My Recommendations

Based on typical web applications, I'd suggest:

1. **Eye Tracking**: MediaPipe Face Mesh (browser-based, good balance)
2. **Light Detection**: Enhance current implementation with learning
3. **Voice Assistant**: Improve current Web Speech API with better command recognition
4. **Recommendations**: Neural Collaborative Filtering (NCF) with TensorFlow.js
5. **Semantic Search**: Sentence-BERT embeddings with FAISS for vector search

**Implementation Order**:
1. Enhanced Recommendations (most impact)
2. Semantic Search (high user value)
3. Voice Assistant improvements
4. Light Detection improvements
5. Eye Tracking (most complex, requires most testing)

Please answer these questions so I can implement the features according to your preferences!

