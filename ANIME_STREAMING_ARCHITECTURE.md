# Anime Streaming Platform - Complete Architecture Documentation

## Overview

This document describes the complete Crunchyroll-style anime streaming platform architecture, including all microservices, APIs, data flows, and integration points.

## Architecture Layers

### 1. Client Layer
- **Web**: Next.js/React frontend with HLS.js player
- **Mobile**: iOS/Android apps with native players + EME for DRM
- **TV**: Smart TV apps with adaptive streaming

### 2. API Gateway
- Single HTTPS entrypoint (`/api/*`)
- Handles SSL, routing, rate limiting, auth validation
- Routes to microservices via internal network

### 3. Microservices

#### A. Auth Service
**Location**: `src/app/api/auth/*`

**Endpoints**:
- `POST /api/auth/signup` - User registration
- `POST /api/auth/login` - User authentication
- `GET /api/auth/me` - Get current user
- `POST /api/auth/refresh` - Refresh JWT token

**Features**:
- JWT-based authentication
- Role-based access control (user/creator/admin)
- Session management
- Multi-factor authentication support

#### B. Creator Service
**Location**: `src/app/api/creators/*`

**Endpoints**:
- `POST /api/creators/signup` - Create creator profile
- `GET /api/creators/signup` - Get creator status
- `GET /api/creators/dashboard` - Creator dashboard data

**Features**:
- Creator onboarding
- KYC verification workflow
- Creator profile management
- Earnings tracking

#### C. Ingest Service
**Location**: `src/app/api/ingest/*`

**Endpoints**:
- `POST /api/ingest/start` - Initialize chunked upload
- `PUT /api/ingest/{uploadId}/complete` - Complete upload
- `GET /api/ingest/{uploadId}/status` - Get upload status

**Features**:
- Chunked file uploads (5MB chunks)
- Presigned URLs for Cloudflare/S3
- File validation (size, type, checksums)
- Upload progress tracking

**Flow**:
1. Creator initiates upload → `POST /api/ingest/start`
2. Receives presigned URLs for chunks
3. Uploads chunks directly to storage
4. Completes upload → `PUT /api/ingest/{uploadId}/complete`
5. Triggers moderation and transcoding

#### D. Moderation Service
**Location**: `src/app/api/moderation/*`

**Endpoints**:
- `POST /api/moderation/process` - Run automated moderation
- `GET /api/moderation/review` - Get review queue
- `POST /api/moderation/review` - Submit review decision

**Features**:
- Automated content classification:
  - Copyright detection (audio fingerprinting)
  - NSFW classification (image/video analysis)
  - Violence detection
  - Profanity detection (subtitle scanning)
- Manual review queue for admins
- Moderation workflow:
  1. Upload completes → Auto moderation runs
  2. If flagged → Goes to manual review
  3. Admin reviews → Approve/Reject/Request Changes
  4. If approved → Moves to transcoding

#### E. Transcoding Service
**Location**: `src/app/api/transcode/*`

**Endpoints**:
- `POST /api/transcode/start` - Start transcode job
- `GET /api/transcode/status` - Get job status

**Features**:
- Multi-bitrate HLS/DASH generation
- Quality levels: 1080p, 720p, 480p, 360p
- Thumbnail generation
- Subtitle processing (VTT/SRT/ASS)
- FFmpeg-based transcoding (or cloud service)

**Transcode Job Flow**:
1. Asset approved → Transcode job created
2. Worker picks up job
3. Generates multi-bitrate renditions
4. Creates HLS/DASH manifests
5. Generates thumbnails
6. Updates episode with manifest URLs

#### F. Streaming Service
**Location**: `src/app/api/streaming/*`

**Endpoints**:
- `POST /api/streaming/playback-request` - Request playback with entitlement check

**Features**:
- Entitlement validation (subscription, geo-restrictions)
- Age rating / parental controls
- Signed manifest URLs (time-limited, 1 hour)
- DRM license token generation
- Server-side ad insertion (SSAI) support
- Device binding

**Playback Flow**:
1. Player requests playback → `POST /api/streaming/playback-request`
2. Service validates:
   - JWT token
   - Subscription entitlement
   - Geo-restrictions
   - Age rating
3. Generates signed manifest URL
4. Returns DRM config (if required)
5. Returns ad config (for free tier)
6. Player loads manifest and streams

#### G. Analytics Service
**Location**: `src/app/api/analytics/*`

**Endpoints**:
- `POST /api/analytics/events/collect` - Collect player events (batched)

**Features**:
- Player event collection (play, pause, seek, complete, etc.)
- Watch history updates
- Real-time analytics
- Event streaming to Kafka (production)
- ClickHouse/BigQuery integration (production)

**Event Types**:
- `play` - Playback started
- `pause` - Playback paused
- `seek` - User seeked
- `quality_change` - Bitrate changed
- `complete` - Episode completed
- `heartbeat` - Periodic position update
- `error` - Playback error

#### H. Search Service
**Location**: `src/app/api/search/*`

**Endpoints**:
- `GET /api/search/anime` - Full-text search with filters
- `GET /api/search/anime/suggest` - Autocomplete suggestions

**Features**:
- Full-text search (title, description, alternatives)
- Filters (genre, status, year, rating)
- Sorting (relevance, rating, year, popularity)
- Facets for filter UI
- Autocomplete suggestions
- Elasticsearch integration (production)

#### I. Catalog Service
**Location**: `src/app/api/anime/*`

**Endpoints**:
- `GET /api/anime/featured` - Featured anime
- `GET /api/anime/trending` - Trending anime
- `GET /api/anime/popular` - Popular anime
- `GET /api/anime/recent` - Recently added
- `GET /api/anime/browse` - Browse with filters
- `GET /api/anime/{seriesId}` - Series details
- `GET /api/anime/{seriesId}/episodes` - Episode list

**Features**:
- Content discovery
- Curated collections
- Metadata management
- Episode listings

### 4. Data Stores

#### MongoDB Collections

**Users**:
- User accounts, authentication, subscriptions
- Indexes: `email`, `username`, `role`

**Creators**:
- Creator profiles, KYC status, earnings
- Indexes: `userId`, `kycStatus`

**Anime Series**:
- Series metadata, genres, ratings
- Indexes: `title`, `genres`, `status`, `year`

**Anime Episodes**:
- Episode metadata, manifest URLs, DRM config
- Indexes: `seriesId`, `episodeNumber`

**Assets**:
- Uploaded files, storage paths, checksums
- Indexes: `uploadId`, `userId`, `status`

**Ingest Uploads**:
- Upload sessions, chunk tracking
- Indexes: `uploadId`, `userId`, `status`

**Moderation Tasks**:
- Moderation queue, flags, decisions
- Indexes: `assetId`, `status`, `userId`

**Transcode Jobs**:
- Transcoding jobs, progress, outputs
- Indexes: `assetId`, `status`

**Watch History**:
- User watch positions, completion status
- Indexes: `userId`, `episodeId`, `seriesId`

**Playback Events**:
- Analytics events, player telemetry
- Indexes: `userId`, `episodeId`, `timestamp`

#### Redis (Cache)
- Session storage
- Rate limiting
- Recommendations cache
- Signed token cache

#### Object Storage (Cloudflare/S3)
- Master video files
- Transcoded segments
- HLS/DASH manifests
- Thumbnails
- Subtitles

#### CDN (Cloudflare)
- Edge caching for manifests
- Segment delivery
- Signed URL generation

## Complete Workflows

### 1. Creator Upload Workflow

```
1. Creator signs up → POST /api/creators/signup
   ├─ Creates creator profile
   ├─ KYC verification (if required)
   └─ Updates user role to 'creator'

2. Creator initiates upload → POST /api/ingest/start
   ├─ Validates file (size, type)
   ├─ Generates upload ID
   ├─ Creates presigned URLs for chunks
   └─ Returns chunk URLs to client

3. Client uploads chunks → Direct to storage
   ├─ Uploads each chunk to presigned URL
   └─ Notifies server of chunk completion

4. Upload complete → PUT /api/ingest/{uploadId}/complete
   ├─ Verifies checksum
   ├─ Creates asset record
   ├─ Enqueues moderation task
   └─ Enqueues transcode job (if video)

5. Automated moderation → POST /api/moderation/process
   ├─ Runs copyright detection
   ├─ Runs NSFW classification
   ├─ Runs violence detection
   ├─ Runs profanity check
   └─ Flags if needed

6. Manual review (if flagged) → Admin reviews
   ├─ Admin views queue → GET /api/moderation/review
   ├─ Admin makes decision → POST /api/moderation/review
   └─ If approved → Moves to transcoding

7. Transcoding → POST /api/transcode/start
   ├─ Worker picks up job
   ├─ Generates multi-bitrate renditions
   ├─ Creates HLS/DASH manifests
   ├─ Generates thumbnails
   └─ Updates episode with manifest URLs

8. Content published → Episode visible in catalog
```

### 2. User Playback Workflow

```
1. User clicks play → POST /api/streaming/playback-request
   ├─ Validates JWT token
   ├─ Checks subscription entitlement
   ├─ Checks geo-restrictions
   ├─ Checks age rating
   └─ Generates signed manifest URL

2. Service returns playback data:
   ├─ Signed manifest URL (expires in 1 hour)
   ├─ DRM config (if required)
   ├─ Ad config (for free tier)
   ├─ Subtitles list
   └─ Audio tracks list

3. Player loads manifest → CDN
   ├─ Requests HLS manifest
   └─ Begins adaptive streaming

4. DRM (if required):
   ├─ Player requests license → DRM License Server
   ├─ Server validates token
   └─ Returns decryption keys

5. Ads (for free tier):
   ├─ SSAI: Server-stitched manifest
   └─ Client-side: VAST tags

6. Playback events → POST /api/analytics/events/collect
   ├─ Play, pause, seek events
   ├─ Quality changes
   ├─ Completion events
   └─ Updates watch history

7. Watch history updated:
   ├─ Last position saved
   ├─ Completion status tracked
   └─ Continue Watching updated
```

### 3. Search & Discovery Workflow

```
1. User searches → GET /api/search/anime?q=query
   ├─ Full-text search in MongoDB
   ├─ Applies filters (genre, status, year)
   ├─ Sorts results
   └─ Returns results with facets

2. Autocomplete → GET /api/search/anime/suggest?q=query
   ├─ Prefix matching on titles
   └─ Returns top 10 suggestions

3. Browse → GET /api/anime/browse
   ├─ Filtered listing
   ├─ Pagination
   └─ Sort options

4. Recommendations → GET /api/anime/recommendations
   ├─ Personalized (for logged-in users)
   ├─ Content-based filtering
   ├─ Collaborative filtering
   └─ Trending fallback (for anonymous)
```

## Security Features

### 1. Authentication & Authorization
- JWT tokens with expiration
- Refresh token rotation
- Role-based access control
- Device binding (optional)

### 2. Content Protection
- Signed manifest URLs (time-limited)
- DRM for premium content (Widevine/PlayReady/FairPlay)
- Token binding (device/session/IP)
- Watermarking (forensic, for premium)

### 3. Upload Security
- File type validation
- File size limits
- Checksum verification
- Virus scanning (production)

### 4. Rate Limiting
- API rate limits per user
- Upload rate limits
- Playback request limits

### 5. Geo-Restrictions
- Country-based blocking/allowing
- IP geolocation
- CDN-level enforcement

## Monetization

### Subscription Tiers
- **Free**: Ads, 720p max, limited content
- **Premium**: No ads, 1080p, offline downloads, 2 streams
- **Premium Plus**: No ads, 4K, offline downloads, 4 streams

### Creator Earnings
- Ad revenue share
- Subscription pool split
- Tips/donations
- PPV/rentals

### Payment Processing
- Razorpay integration (existing)
- Subscription management
- Payout scheduling
- Tax compliance

## Monitoring & Observability

### Metrics
- Playback start time
- Rebuffering ratio
- Playback success rate
- DRM failure rate
- Transcode success rate
- Moderation queue latency

### Logging
- Centralized logging (ELK/Datadog)
- Request correlation IDs
- Error tracking

### Tracing
- OpenTelemetry across services
- Performance monitoring

### SLOs
- 99.9% playback start success
- Median time-to-play < 3s
- Transcode success > 99%

## Scalability

### Horizontal Scaling
- Stateless services
- Auto-scaling groups
- Load balancing

### Caching
- Redis for sessions
- CDN for content
- Recommendations cache

### Message Queues
- Kafka/Kinesis for events
- SQS for job queues
- Background workers

## Production Deployment

### Infrastructure
- Kubernetes for orchestration
- Docker containers
- CI/CD pipelines
- Terraform for infrastructure

### Environment Variables
```
MONGODB_URI=
JWT_SECRET=
CLOUDFLARE_ACCOUNT_ID=
CLOUDFLARE_API_TOKEN=
STORAGE_PROVIDER=cloudflare
PLAYBACK_TOKEN_SECRET=
DRM_TOKEN_SECRET=
NEXT_PUBLIC_BASE_URL=
```

## API Documentation

All APIs follow RESTful conventions:
- `GET` - Retrieve resources
- `POST` - Create resources
- `PUT` - Update resources
- `DELETE` - Delete resources

Authentication: `Authorization: Bearer <token>`

Error responses:
```json
{
  "error": "Error message",
  "details": "Additional details"
}
```

## Next Steps

1. **Elasticsearch Integration**: Replace MongoDB text search with Elasticsearch
2. **Kafka Integration**: Stream events to Kafka for real-time processing
3. **FFmpeg Workers**: Implement actual transcoding workers
4. **DRM License Server**: Full DRM implementation
5. **SSAI Service**: Server-side ad insertion
6. **Watermarking**: Forensic watermarking for premium content
7. **Mobile Apps**: iOS/Android native apps
8. **TV Apps**: Smart TV applications

## Testing

- Unit tests for all services
- Integration tests for workflows
- E2E tests for playback flows
- Load testing for concurrent viewers
- DRM test keys for development



