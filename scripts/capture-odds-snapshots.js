/**
 * Odds Snapshot Capture Script
 *
 * This script periodically captures odds snapshots for all major sports.
 * It should be run on a schedule (e.g., every 15-30 minutes) to build
 * historical line movement data.
 *
 * Usage:
 *   node scripts/capture-odds-snapshots.js
 *
 * Or with custom interval (in minutes):
 *   node scripts/capture-odds-snapshots.js --interval 15
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

async function captureSnapshots() {
  const timestamp = new Date().toISOString()
  console.log(`\n${'='.repeat(60)}`)
  console.log(`📸 Starting odds snapshot capture at ${timestamp}`)
  console.log('='.repeat(60))

  try {
    const response = await fetch(`${API_BASE_URL}/api/capture-odds-snapshot`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const result = await response.json()

    console.log('\n✅ Snapshot capture completed successfully!')
    console.log(`   - Total games: ${result.stats?.totalGames || 0}`)
    console.log(`   - Snapshots saved: ${result.stats?.totalSnapshots || 0}`)
    console.log(`   - Sports processed: ${result.stats?.sports || 0}`)

    if (result.stats?.errors && result.stats.errors.length > 0) {
      console.log('\n⚠️  Errors encountered:')
      result.stats.errors.forEach(err => console.log(`   - ${err}`))
    }

    return result
  } catch (error) {
    console.error('\n❌ Failed to capture odds snapshots:', error.message)
    throw error
  }
}

// Parse command line arguments
const args = process.argv.slice(2)
let interval = 30 // Default: 30 minutes
let runOnce = false

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--interval' && args[i + 1]) {
    interval = parseInt(args[i + 1], 10)
    i++
  } else if (args[i] === '--once') {
    runOnce = true
  }
}

// Main execution
if (runOnce) {
  // Run once and exit
  captureSnapshots()
    .then(() => {
      console.log('\n✅ Single capture completed. Exiting.')
      process.exit(0)
    })
    .catch(() => {
      console.error('\n❌ Capture failed. Exiting.')
      process.exit(1)
    })
} else {
  // Run continuously on interval
  console.log(`🔄 Snapshot capture service started`)
  console.log(`   Interval: ${interval} minutes`)
  console.log(`   Press Ctrl+C to stop\n`)

  // Run immediately on start
  captureSnapshots().catch(err => {
    console.error('Initial capture failed:', err)
  })

  // Then run on interval
  const intervalMs = interval * 60 * 1000
  setInterval(() => {
    captureSnapshots().catch(err => {
      console.error('Scheduled capture failed:', err)
    })
  }, intervalMs)
}

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n\n👋 Shutting down snapshot capture service...')
  process.exit(0)
})

process.on('SIGTERM', () => {
  console.log('\n\n👋 Shutting down snapshot capture service...')
  process.exit(0)
})
