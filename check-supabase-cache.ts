#!/usr/bin/env tsx
/**
 * Supabase Game Lines Cache Checker
 * Checks if old/stale game data is cached in Supabase
 *
 * Run with: npx tsx check-supabase-cache.ts
 */

import { readFileSync } from 'fs';
import { join } from 'path';
import { createClient } from '@supabase/supabase-js';

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

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkGameLinesCache() {
  console.log('🔍 Checking Supabase game_lines cache...\n');

  try {
    // Get all game lines
    const { data, error } = await supabase
      .from('game_lines')
      .select('*')
      .order('commence_time', { ascending: false })
      .limit(100);

    if (error) {
      console.error('❌ Error fetching game_lines:', error);
      return;
    }

    if (!data || data.length === 0) {
      console.log('✅ No cached games in Supabase (table is empty)');
      console.log('   → This means the app will fetch fresh data from APIs');
      return;
    }

    console.log(`📊 Found ${data.length} cached games\n`);

    // Analyze the data
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    let futureGames = 0;
    let todayGames = 0;
    let pastGames = 0;
    let oldGames2024 = 0;

    for (const game of data) {
      const commenceTime = new Date(game.commence_time);

      if (commenceTime > now) {
        futureGames++;
      } else if (commenceTime >= todayStart) {
        todayGames++;
      } else {
        pastGames++;
        if (commenceTime.getFullYear() === 2024) {
          oldGames2024++;
        }
      }
    }

    console.log('📅 Game Distribution:');
    console.log(`   • Future games: ${futureGames}`);
    console.log(`   • Today's games: ${todayGames}`);
    console.log(`   • Past games: ${pastGames}`);
    console.log(`   • Old 2024 games: ${oldGames2024}\n`);

    if (oldGames2024 > 0) {
      console.log('⚠️  WARNING: Found old 2024 games in cache!');
      console.log('   This could cause the UI to show stale data.\n');
      console.log('   Showing 5 oldest games:');

      const oldestGames = data
        .filter((g) => new Date(g.commence_time).getFullYear() === 2024)
        .sort((a, b) => new Date(a.commence_time).getTime() - new Date(b.commence_time).getTime())
        .slice(0, 5);

      oldestGames.forEach((game, i) => {
        console.log(`   ${i + 1}. ${game.home_team} vs ${game.away_team}`);
        console.log(`      Date: ${game.commence_time}`);
        console.log(`      Sport: ${game.sport}`);
      });

      console.log('\n💡 RECOMMENDATION:');
      console.log('   Run this SQL in Supabase to clean old games:');
      console.log(`   DELETE FROM game_lines WHERE commence_time < '${todayStart.toISOString()}';`);
    } else {
      console.log('✅ No old 2024 games found - cache looks clean!');
    }

    // Check for today's data
    if (futureGames === 0 && todayGames === 0) {
      console.log('\n⚠️  No upcoming games in cache');
      console.log('   → UI will need to fetch fresh data from APIs');
      console.log('   → Make sure API keys are working (run: npx tsx test-api-direct.ts)');
    } else {
      console.log(`\n✅ Found ${futureGames + todayGames} upcoming/today games in cache`);
    }

    // Show newest game
    if (data.length > 0) {
      const newest = data[0];
      console.log('\n📋 Most Recent Game in Cache:');
      console.log(`   ${newest.home_team} vs ${newest.away_team}`);
      console.log(`   Commence Time: ${newest.commence_time}`);
      console.log(`   Sport: ${newest.sport}`);
      console.log(`   Updated: ${newest.updated_at}`);
    }
  } catch (error) {
    console.error('❌ Exception:', error instanceof Error ? error.message : error);
  }

  console.log('\n' + '='.repeat(80));
}

checkGameLinesCache().catch(console.error);
