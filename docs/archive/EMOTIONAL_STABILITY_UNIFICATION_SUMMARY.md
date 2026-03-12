# Emotional Stability Score Unification

## Problem
The emotional stability score was being calculated differently across various parts of the application, leading to inconsistencies that affected SmartSlip functionality.

## Solution
Created a centralized emotional stability system with caching and consistent calculation across all components.

## Changes Made

### 1. Created Centralized Service
**File:** `/lib/services/emotional-stability-service.ts`
- Single source of truth for emotional stability calculations
- 5-minute caching to improve performance
- Server-side and client-side support
- Error handling with fallback values

### 2. Created React Hook
**File:** `/lib/hooks/use-emotional-stability.ts`
- Easy-to-use hook for all components
- Consistent data structure across the app
- Loading states and error handling
- Derived values (shouldReceiveAIPicks, colors, etc.)

### 3. Updated API Route
**File:** `/app/api/picker/recommend/route.ts`
- Now calculates emotional stability server-side
- No longer relies on client sending the score
- Fetches user data from database for accurate calculation
- More secure and reliable

### 4. Updated Components

#### Dashboard Header (`/components/dashboard-header.tsx`)
- Uses centralized hook instead of local calculation
- Consistent display with loading states

#### AI Picks Tab (`/components/tabs/ai-picks-tab.tsx`)
- Uses centralized hook
- Removed duplicate calculation logic
- Updated UI to use hook properties
- Simplified emotional state display

#### Analyze Bet Tab (`/components/tabs/analyze-bet-tab.tsx`)
- Uses centralized hook
- Removed local stability state
- Updated safety guard logic

## Key Benefits

### 1. Consistency
- All components now use the same emotional stability score
- No more discrepancies between different pages
- SmartSlip now works reliably

### 2. Performance
- 5-minute caching reduces redundant calculations
- Server-side calculation reduces client load
- Optimized data fetching

### 3. Reliability
- Single source of truth prevents bugs
- Better error handling with fallbacks
- More secure server-side calculation

### 4. Maintainability
- Centralized logic easier to update
- Consistent API across components
- Better separation of concerns

## How It Works

1. **Data Sources**: The service combines:
   - Recent emotion logs (30% weight)
   - Survey results (40% weight) 
   - Emotional variance (20% weight)
   - Betting patterns (10% weight)

2. **Caching**: Results are cached for 5 minutes per user

3. **API Integration**: The picker API now calculates scores server-side using user data from the database

4. **UI Updates**: All components use the React hook for consistent display

## Migration Notes

- Removed all duplicate `calculateEmotionalStability` calls from components
- Updated API interface to remove client-side emotional score parameter
- Standardized emotional stability display across all UI components
- Added proper loading and error states

## Testing Recommendations

1. Verify emotional stability scores are consistent across all pages
2. Test SmartSlip functionality with different emotional states
3. Verify caching behavior (score should remain consistent for 5 minutes)
4. Test error handling when data is unavailable
5. Verify server-side calculation in API responses

## Future Enhancements

- Add real-time updates when new emotions are logged
- Consider WebSocket integration for live score updates
- Add more detailed factor breakdowns in the hook
- Implement score history tracking
