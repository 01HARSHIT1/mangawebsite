# Admin & Feature Analysis - Current vs Required

## 🔐 Admin Authentication Status

### ✅ Currently Implemented
- Admin login at `/admin/login`
- Environment variable-based credentials (`ADMIN_EMAIL`, `ADMIN_PASSWORD`)
- Admin role checking (`user.role === 'admin'`)
- Admin dashboard at `/admin/dashboard`

### ❓ Questions Before Implementation
1. **Admin Credentials**: You mentioned `admin@mangawebsite.com` and `Admin123!Secure` - should I:
   - Update the admin login to check for these specific credentials?
   - Or keep environment variables but ensure these credentials work?
   - Should this be the ONLY way to access admin, or should environment variables still work?

2. **Admin Dashboard Location**: Should the admin dashboard be:
   - Inside the anime section (`/anime/admin/*`)?
   - Or remain at `/admin/*` but accessible from anime section?
   - Should there be an admin link/button visible in anime section navigation when logged in as admin?

---

## 📊 Admin Dashboard Features - Current vs Required

### ✅ Currently Implemented (General Admin)
1. **Main Dashboard** (`/admin/dashboard`)
   - Platform overview with stats
   - Quick action cards
   - Recent activity feed

2. **User Management** (`/admin/users`)
   - View all users
   - Search/filter users
   - Suspend/ban users
   - Upgrade to creator/admin

3. **Content Management** (`/admin/content`)
   - View manga/chapters
   - Edit/delete content
   - Approve/reject submissions

4. **Content Moderation** (`/admin/moderation`)
   - Review queue
   - Filter by status
   - Resolve/reject reports

5. **Analytics** (`/admin/analytics`)
   - Platform analytics
   - Charts and metrics

6. **Creator Management** (`/admin/creators`)
   - View creators
   - Verify creators
   - View creator stats

7. **Monetization** (`/admin/monetization`)
   - Revenue management
   - Payout handling

8. **Homepage Control** (`/admin/homepage`)
   - Manage banners
   - Configure sections

9. **Settings** (`/admin/settings`)
   - System settings

10. **AI Features** (`/admin/ai`)
    - AI moderation tools

11. **Anime Content Management** (`/admin/anime`)
    - View anime series
    - Edit/delete series
    - Upload content

### ❌ Missing Admin Features (Anime-Specific)

#### 1️⃣ Content Moderation (Anime-Specific)
**Required:**
- Episode & Anime Review Queue
  - Preview video before publish
  - Verify audio tracks (single/dual)
  - Verify subtitle correctness
  - Verify poster quality
  - Verify age rating accuracy
  - Approve/reject/request changes
  - Schedule publish time

**Questions:**
- Should this be a separate page (`/admin/anime/moderation`) or integrated into existing `/admin/moderation`?
- How should video preview work? (Embedded player, thumbnail + metadata, or full playback?)
- What does "schedule publish time" mean? Should episodes be hidden until scheduled time?
- Should there be a separate queue for anime vs manga content?

#### 2️⃣ Audio & Subtitle Validation Panel
**Required:**
- View detected audio tracks (FFmpeg verified)
- Language mismatch warnings
- Force-disable broken tracks
- Set default audio manually
- Preview subtitles live
- Flag timing or sync issues
- Disable misleading translations

**Questions:**
- Should this be part of episode review, or a separate validation panel?
- How should subtitle preview work? (Overlay on video, separate viewer, or both?)
- What does "force-disable broken tracks" mean? Should it hide them from users or mark them as unavailable?

#### 3️⃣ Creator Management (Anime-Specific)
**Required:**
- Creator verification status
- Upload history (anime-specific)
- Strike count
- Monetization eligibility
- Revenue split percentage
- Performance metrics

**Questions:**
- Should this extend existing `/admin/creators` or be separate for anime creators?
- What constitutes a "strike"? (Copyright violation, policy violation, etc.)
- How should revenue split be configured? (Per creator, per series, or global?)

#### 4️⃣ User Management (Anime-Specific)
**Required:**
- Search users by email/IP/activity
- View watch history (privacy safe)
- Comment moderation
- Temporary mute
- Account suspension
- Shadow ban
- Bot detection
- Fake view detection
- Comment spam detection
- Abuse pattern alerts

**Questions:**
- Should this extend existing `/admin/users` or be separate?
- What does "privacy safe" watch history mean? (Aggregated stats only, or anonymized?)
- How should shadow ban work? (User sees content but others don't see their activity?)
- What triggers bot/fake view detection? (Automated thresholds or manual flags?)

#### 5️⃣ Copyright & Legal Panel
**Required:**
- Manual claims by studios
- DMCA takedown processing
- Counter-claim system
- Region-based blocking
- Auto-fingerprint matching (future)
- Evidence upload
- Timestamp verification
- Strike escalation system
- Repeat offender tracking

**Questions:**
- Should this be a new page (`/admin/anime/copyright`) or part of moderation?
- How should DMCA claims be submitted? (Email, form, or API?)
- What evidence formats are needed? (Screenshots, video clips, legal documents?)
- How should counter-claims work? (Creator can dispute, then what?)

#### 6️⃣ Monetization & Revenue Controls (Anime-Specific)
**Required:**
- Platform revenue (anime-specific)
- Creator payouts (anime-specific)
- Pending withdrawals
- Refund handling
- Fraud detection
- Change revenue split
- Disable monetization per video
- Ad suitability ratings
- Manual payout approvals

**Questions:**
- Should this extend existing `/admin/monetization` or be separate?
- How should ad suitability ratings work? (G, PG, PG-13, R, NC-17 mapping?)
- What triggers fraud detection? (Suspicious view patterns, payment issues?)

#### 7️⃣ Recommendation & Visibility Controls
**Required:**
- Feature anime on homepage
- Boost trending content
- Suppress low-quality uploads
- Manual ranking override
- Blacklist tags
- Control discoverability
- Emergency demotion of content

**Questions:**
- Should this be a new page (`/admin/anime/visibility`) or part of content management?
- How should "boost trending" work? (Manual multiplier, or priority flag?)
- What does "emergency demotion" mean? (Temporary removal from recommendations?)

#### 8️⃣ Platform Configuration Panel (Anime-Specific)
**Required:**
- Supported audio languages
- Max video size
- Allowed codecs
- Upload limits per creator
- Comment rules
- Subtitle formats
- Video quality presets

**Questions:**
- Should this extend existing `/admin/settings` or be separate for anime?
- What are the default values for these settings?
- Should upload limits be per creator, per day, or per series?

#### 9️⃣ Analytics & Reports (Anime-Specific)
**Required:**
- Watch time per anime
- Drop-off points
- Audio usage stats (JP vs EN)
- Subtitle usage heatmap
- Geo performance
- Creator engagement trends

**Questions:**
- Should this extend existing `/admin/analytics` or be separate?
- How should drop-off points be visualized? (Timeline graph, heatmap, or both?)
- What time ranges should be available? (Last 24h, 7d, 30d, all time?)

#### 🔟 System Health & Infrastructure
**Required:**
- Transcoding queue status
- CDN cache health
- Streaming errors
- FFmpeg failures
- API latency
- Storage usage

**Questions:**
- Should this extend existing `/admin/monitoring` or be separate?
- How should CDN cache health be monitored? (Hit rate, cache size, purge status?)
- What constitutes a "streaming error"? (4xx/5xx responses, timeouts, buffering issues?)

#### 1️⃣1️⃣ AI-Powered Admin Tools
**Required:**
- NSFW detection
- Violence detection
- Hate speech in comments
- Audio profanity detection
- Duplicate content detection
- Sudden traffic spike alerts
- Abuse trend detection
- Copyright risk alert
- Creator fraud suspicion

**Questions:**
- Should this extend existing `/admin/ai` or be separate for anime?
- What AI services should be used? (Existing setup, or new integrations?)
- What thresholds trigger alerts? (Confidence scores, pattern detection?)

#### 1️⃣2️⃣ Admin Roles & Permissions (RBAC)
**Required:**
- Super Admin (Everything)
- Content Moderator (Review & takedown)
- Creator Support (Creator issues)
- Finance Admin (Revenue & payouts)
- Legal Admin (Copyright & DMCA)
- Analyst (Read-only metrics)

**Questions:**
- Should this be a new system or extend existing role checking?
- How should permissions be stored? (Database, config file, or environment variables?)
- Should there be a UI to manage roles, or only code-based?

#### 1️⃣3️⃣ Audit Logs & Transparency
**Required:**
- Every action recorded
- Who approved what
- When content was altered
- Legal proof ready

**Questions:**
- Should this be a new page (`/admin/anime/audit-logs`) or part of existing system?
- What actions should be logged? (All admin actions, or only critical ones?)
- How long should logs be retained? (30 days, 1 year, permanent?)
- Should logs be exportable? (CSV, JSON, PDF?)

---

## 👤 User Features - Current vs Required

### ✅ Currently Implemented
1. **Watch History** ✅
   - Track last position
   - Resume playback
   - Continue Watching carousel

2. **My List / Favorites** ✅
   - Multiple list types (favorites, watchlist, watching, completed, dropped, on_hold)
   - Add/remove from lists

3. **Audio Switch** ✅
   - Dynamic audio track selection
   - Multiple language support

4. **Subtitle Switch** ✅
   - Dynamic subtitle selection
   - Multiple language support

5. **Quality Selector** ✅
   - 360p, 480p, 720p, 1080p, Auto

6. **Comments** ✅
   - Comment on episodes
   - Sort comments (Best, Newest, Oldest)
   - Authentication required

7. **Recommendations** ✅
   - Personalized recommendations
   - Content-based filtering

8. **Playback Speed Control** ✅
   - Settings menu in video player

9. **Fullscreen Support** ✅
   - Video player fullscreen

### ❌ Missing User Features

1. **Episode Autoplay** ❌
   - Auto-play next episode when current ends

2. **Watchlist** ❓
   - Question: Is this different from "watchlist" in My List? Or should it be a separate feature?

3. **Ratings & Reviews** ❌
   - Rate anime series (stars)
   - Write reviews
   - View ratings/reviews

4. **Intro Skip Button** ❌
   - Skip anime intro automatically

5. **Outro Skip** ❌
   - Skip outro/credits automatically

6. **Resume Playback Across Devices** ❓
   - Question: Is this already working via watch history, or needs enhancement?

7. **Keyboard Shortcuts** ❌
   - Space (play/pause), Arrow keys (seek), etc.

8. **Picture-in-Picture** ❌
   - PiP mode for video player

9. **Dark Mode** ❓
   - Question: Is this site-wide or anime-section specific?

10. **Creator Badges** ❌
    - Verified creator tick
    - Creator badges/achievements

11. **Episode Release Countdown** ❌
    - Countdown timer for upcoming episodes

12. **New Episode Notifications** ❌
    - Notify users when new episodes are released

13. **Audio Default Preference Per User** ❌
    - Remember user's preferred audio language

**Questions:**
- Should intro/outro skip be automatic (detect timestamps) or manual (user sets timestamps)?
- How should episode autoplay work? (Always on, user preference, or per-series setting?)
- Should ratings be per-series or per-episode?
- How should notifications work? (Email, in-app, push notifications, or all?)

---

## 🧑‍🎨 Creator Features - Current vs Required

### ✅ Currently Implemented
1. **Creator Profile Page** ✅
   - Creator dashboard
   - Profile management

2. **Anime Series Creation** ✅
   - Upload series
   - Series metadata

3. **Episode Upload** ✅
   - Upload episodes
   - Episode metadata
   - Audio/subtitle configuration

4. **Audio Track Management** ✅
   - Single/multiple audio selection
   - Language selection

5. **Subtitle Upload** ✅
   - Soft subtitle file upload
   - Hard sub declaration

6. **Content Moderation Status** ❓
   - Question: Is this visible to creators, or only admins?

7. **View & Engagement Analytics** ✅
   - Creator dashboard analytics
   - View statistics

8. **Monetization Dashboard** ✅
   - Earnings tracking
   - Payout management

### ❌ Missing Creator Features

1. **Episode Scheduling** ❌
   - Schedule episodes to publish at specific time

2. **Episode Preview Clips** ❌
   - Upload preview clips for episodes

**Questions:**
- How should episode scheduling work? (Date/time picker, or simple "publish later" toggle?)
- What should preview clips be used for? (Homepage previews, social media, or episode thumbnails?)

---

## 🎯 Implementation Priority Questions

Before I start implementing, I need clarification on:

### 1. Admin Access & Navigation
- **Q1**: Should admin dashboard be accessible from anime section navigation when logged in as admin?
- **Q2**: Should there be a dedicated "Admin" link/button in anime section navbar?
- **Q3**: Should admin credentials be hardcoded (`admin@mangawebsite.com` / `Admin123!Secure`) or use environment variables?

### 2. Feature Organization
- **Q4**: Should anime-specific admin features be:
  - Separate pages under `/admin/anime/*`?
  - Integrated into existing `/admin/*` pages?
  - Or a mix of both?

### 3. Implementation Order
- **Q5**: Which features should be implemented first?
  - Content Moderation (Episode Review Queue)?
  - Audio/Subtitle Validation Panel?
  - Copyright & Legal Panel?
  - Or something else?

### 4. Technical Details
- **Q6**: For video preview in admin review - should it be:
  - Embedded video player (full playback)?
  - Thumbnail + metadata only?
  - Or both options?

- **Q7**: For intro/outro skip - should it be:
  - Automatic detection (AI/ML)?
  - Manual timestamps set by creator?
  - Or both?

- **Q8**: For episode scheduling - should episodes be:
  - Hidden until scheduled time?
  - Visible but marked as "upcoming"?
  - Or both options?

### 5. Database & Storage
- **Q9**: Should audit logs be stored in:
  - Separate `admin_audit_logs` collection?
  - Or integrated into existing collections?

- **Q10**: For copyright claims - should evidence be stored:
  - In database (base64)?
  - In Cloudinary (files)?
  - Or both?

---

## 📋 Next Steps

**Please answer the questions above, and I will:**
1. Create a detailed implementation plan
2. Prioritize features based on your answers
3. Implement features one by one with your approval
4. Test each feature before moving to the next

**I will NOT implement anything until you confirm:**
- Admin access method
- Feature organization structure
- Implementation priority
- Technical approach for each feature

