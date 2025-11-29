# Changes Analysis: Working vs Current

## Working Version (c8bd94e)
- **ALL AI features were completely disabled**
- No `useAIFeatures()` hook call
- No component imports
- No API calls for preferences
- Page loaded instantly

## Current Version Issues

### 1. `useAIFeatures()` Hook Called Immediately
- **Problem**: Hook runs on component mount, triggers API call to `/api/user/ai-preferences`
- **Impact**: Even with 5s timeout, this API call might be blocking initial render
- **Location**: Line 66 in ChapterReader.tsx

### 2. AutoBrightness Component (NOW DISABLED)
- **Heavy Operations**:
  - MutationObserver running continuously
  - setInterval every 100ms calling `lockPosition()`
  - Multiple `getComputedStyle()` calls
  - Position locking logic with multiple retries
- **Impact**: Even when not active, the component does heavy work on mount

### 3. User Interaction Gate
- Added `userInteracted` state
- But `useAIFeatures()` still runs immediately
- Components wait for interaction, but hook doesn't

## Recommendations

1. **Defer `useAIFeatures()` call** - Don't call it until user interacts
2. **AutoBrightness is disabled** - Good, test if page works now
3. **If still blocking**, defer the hook call itself

