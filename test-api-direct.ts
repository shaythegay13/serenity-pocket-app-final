#!/usr/bin/env tsx
/**
 * Direct API Test Script
 * Tests sports data APIs without going through the Next.js application
 *
 * Run with: npx tsx test-api-direct.ts
 */

import { readFileSync } from 'fs';
import { join } from 'path';

// Manually load .env.local
function loadEnv() {
  try {
    const envPath = join(process.cwd(), '.env.local');
    const envFile = readFileSync(envPath, 'utf-8');

    envFile.split('\n').forEach(line => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) return;

      const [key, ...valueParts] = trimmed.split('=');
      const value = valueParts.join('=');

      if (key && value) {
        process.env[key] = value;
      }
    });
  } catch (error) {
    console.error('⚠️  Could not load .env.local file');
  }
}

loadEnv();

console.log('🧪 Direct API Test Starting...\n');
console.log('📅 Today:', new Date().toISOString());
console.log('🔑 Environment Check:');
console.log('  - NEXT_PUBLIC_ODDS_API_KEY:', process.env.NEXT_PUBLIC_ODDS_API_KEY ? '✓ Set' : '✗ Missing');
console.log('  - NEXT_PUBLIC_RAPIDAPI_SPORTSBOOK_KEY:', process.env.NEXT_PUBLIC_RAPIDAPI_SPORTSBOOK_KEY ? '✓ Set' : '✗ Missing');
console.log('\n' + '='.repeat(80) + '\n');

// Test 1: The Odds API - NFL
async function testTheOddsAPI() {
  console.log('📊 TEST 1: The Odds API - NFL');
  console.log('-'.repeat(80));

  const apiKey = process.env.NEXT_PUBLIC_ODDS_API_KEY;
  if (!apiKey) {
    console.log('❌ SKIPPED: No API key found\n');
    return;
  }

  try {
    const url = `https://api.the-odds-api.com/v4/sports/americanfootball_nfl/odds?apiKey=${apiKey}&regions=us&markets=h2h,spreads&oddsFormat=american`;
    console.log('🌐 URL:', url.replace(apiKey, 'API_KEY_HIDDEN'));

    const response = await fetch(url);
    const remaining = response.headers.get('x-requests-remaining');

    console.log('📡 Status:', response.status, response.ok ? '✓ SUCCESS' : '✗ FAILED');
    console.log('⏳ Remaining Requests:', remaining || 'unknown');

    if (response.ok) {
      const data = await response.json();
      console.log('📦 Data Type:', Array.isArray(data) ? 'Array' : typeof data);
      console.log('🎮 Games Found:', Array.isArray(data) ? data.length : 0);

      if (Array.isArray(data) && data.length > 0) {
        console.log('\n📋 First Game Sample:');
        const game = data[0];
        console.log('  - ID:', game.id);
        console.log('  - Home Team:', game.home_team);
        console.log('  - Away Team:', game.away_team);
        console.log('  - Commence Time:', game.commence_time);
        console.log('  - Bookmakers:', game.bookmakers?.length || 0);
      } else {
        console.log('⚠️  No games returned - This might be expected if no NFL games are scheduled');
      }
    } else {
      const errorText = await response.text();
      console.log('❌ Error Response:', errorText.substring(0, 200));
    }
  } catch (error) {
    console.log('❌ Exception:', error instanceof Error ? error.message : error);
  }

  console.log('\n');
}

// Test 2: The Odds API - NBA
async function testTheOddsAPINBA() {
  console.log('🏀 TEST 2: The Odds API - NBA');
  console.log('-'.repeat(80));

  const apiKey = process.env.NEXT_PUBLIC_ODDS_API_KEY;
  if (!apiKey) {
    console.log('❌ SKIPPED: No API key found\n');
    return;
  }

  try {
    const url = `https://api.the-odds-api.com/v4/sports/basketball_nba/odds?apiKey=${apiKey}&regions=us&markets=h2h,spreads&oddsFormat=american`;
    console.log('🌐 URL:', url.replace(apiKey, 'API_KEY_HIDDEN'));

    const response = await fetch(url);
    const remaining = response.headers.get('x-requests-remaining');

    console.log('📡 Status:', response.status, response.ok ? '✓ SUCCESS' : '✗ FAILED');
    console.log('⏳ Remaining Requests:', remaining || 'unknown');

    if (response.ok) {
      const data = await response.json();
      console.log('📦 Data Type:', Array.isArray(data) ? 'Array' : typeof data);
      console.log('🎮 Games Found:', Array.isArray(data) ? data.length : 0);

      if (Array.isArray(data) && data.length > 0) {
        console.log('\n📋 First Game Sample:');
        const game = data[0];
        console.log('  - ID:', game.id);
        console.log('  - Home Team:', game.home_team);
        console.log('  - Away Team:', game.away_team);
        console.log('  - Commence Time:', game.commence_time);
        console.log('  - Bookmakers:', game.bookmakers?.length || 0);
      } else {
        console.log('⚠️  No games returned');
      }
    } else {
      const errorText = await response.text();
      console.log('❌ Error Response:', errorText.substring(0, 200));
    }
  } catch (error) {
    console.log('❌ Exception:', error instanceof Error ? error.message : error);
  }

  console.log('\n');
}

// Test 3: RapidAPI Sportsbook
async function testRapidAPISportsbook() {
  console.log('💰 TEST 3: RapidAPI Sportsbook');
  console.log('-'.repeat(80));

  const apiKey = process.env.NEXT_PUBLIC_RAPIDAPI_SPORTSBOOK_KEY;
  if (!apiKey) {
    console.log('❌ SKIPPED: No API key found\n');
    return;
  }

  try {
    const url = 'https://api-american-football.p.rapidapi.com/games?league=1&season=2024';
    console.log('🌐 URL:', url);

    const response = await fetch(url, {
      headers: {
        'x-rapidapi-host': 'api-american-football.p.rapidapi.com',
        'x-rapidapi-key': apiKey
      }
    });

    const remaining = response.headers.get('x-ratelimit-requests-remaining');

    console.log('📡 Status:', response.status, response.ok ? '✓ SUCCESS' : '✗ FAILED');
    console.log('⏳ Remaining Requests:', remaining || 'unknown');

    if (response.ok) {
      const data = await response.json();
      console.log('📦 Response Type:', typeof data);
      console.log('📦 Has Response Key:', 'response' in data ? 'Yes' : 'No');

      if (data.response && Array.isArray(data.response)) {
        console.log('🎮 Games Found:', data.response.length);

        if (data.response.length > 0) {
          console.log('\n📋 First Game Sample:');
          const game = data.response[0];
          console.log('  - Game ID:', game.game?.id);
          console.log('  - Teams:', game.teams?.home?.name, 'vs', game.teams?.away?.name);
          console.log('  - Date:', game.game?.date);
        }
      } else {
        console.log('⚠️  Unexpected response format');
      }
    } else {
      const errorText = await response.text();
      console.log('❌ Error Response:', errorText.substring(0, 200));
    }
  } catch (error) {
    console.log('❌ Exception:', error instanceof Error ? error.message : error);
  }

  console.log('\n');
}

// Test 4: ESPN API (via direct call, not proxy)
async function testESPNAPI() {
  console.log('📺 TEST 4: ESPN API - NBA Scoreboard');
  console.log('-'.repeat(80));

  try {
    const url = 'https://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard';
    console.log('🌐 URL:', url);

    const response = await fetch(url);

    console.log('📡 Status:', response.status, response.ok ? '✓ SUCCESS' : '✗ FAILED');

    if (response.ok) {
      const data = await response.json();
      console.log('📦 Has Events:', 'events' in data ? 'Yes' : 'No');

      if (data.events && Array.isArray(data.events)) {
        console.log('🎮 Events Found:', data.events.length);

        if (data.events.length > 0) {
          console.log('\n📋 First Event Sample:');
          const event = data.events[0];
          console.log('  - Name:', event.name);
          console.log('  - Short Name:', event.shortName);
          console.log('  - Date:', event.date);
          console.log('  - Status:', event.status?.type?.description);
        } else {
          console.log('⚠️  No events in scoreboard - might be off-season or between games');
        }
      }
    } else {
      const errorText = await response.text();
      console.log('❌ Error Response:', errorText.substring(0, 200));
    }
  } catch (error) {
    console.log('❌ Exception:', error instanceof Error ? error.message : error);
  }

  console.log('\n');
}

// Run all tests
async function runAllTests() {
  await testTheOddsAPI();
  await testTheOddsAPINBA();
  await testRapidAPISportsbook();
  await testESPNAPI();

  console.log('='.repeat(80));
  console.log('✅ All tests completed!');
  console.log('\n💡 Next Steps:');
  console.log('  1. If all tests show 200 ✓ SUCCESS but 0 games → APIs are working, just no games scheduled');
  console.log('  2. If tests show 401/403 ✗ FAILED → API key issues, check your .env.local');
  console.log('  3. If tests show 429 → Rate limited, wait or upgrade plan');
  console.log('  4. If some APIs work but UI still empty → Check Supabase caching or component logic\n');
}

runAllTests().catch(console.error);
