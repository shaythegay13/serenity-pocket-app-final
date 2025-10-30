// Quick test script to check Supabase connectivity
const fs = require('fs')
const { createClient } = require('@supabase/supabase-js')

// Read .env.local manually
const envContent = fs.readFileSync('.env.local', 'utf8')
const envLines = envContent.split('\n')
let supabaseUrl, supabaseAnonKey

envLines.forEach(line => {
  if (line.startsWith('NEXT_PUBLIC_SUPABASE_URL=')) {
    supabaseUrl = line.split('=')[1].trim()
  }
  if (line.startsWith('NEXT_PUBLIC_SUPABASE_ANON_KEY=')) {
    supabaseAnonKey = line.split('=')[1].trim()
  }
})

console.log('🔍 Testing Supabase connection...')
console.log('URL:', supabaseUrl)
console.log('Key exists:', !!supabaseAnonKey)
console.log('Key length:', supabaseAnonKey?.length)

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase credentials!')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function test() {
  try {
    console.log('\n⏱️  Testing auth.getUser() with 5 second timeout...')
    
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Timeout after 5 seconds')), 5000)
    )
    
    const result = await Promise.race([
      supabase.auth.getUser(),
      timeoutPromise
    ])
    
    console.log('✅ Supabase is responding!')
    console.log('User:', result.data.user ? 'Logged in' : 'Not logged in')
    
    // Try a simple query to test database
    console.log('\n🗄️  Testing database connection...')
    const { data, error } = await Promise.race([
      supabase.from('user_profiles').select('count').limit(1),
      timeoutPromise
    ])
    
    if (error) {
      console.log('⚠️  Database query error:', error.message)
      console.log('   This might be normal if tables don\'t exist yet or RLS is blocking')
    } else {
      console.log('✅ Database is accessible!')
    }
    
  } catch (error) {
    console.error('❌ Connection error:', error.message)
    console.log('\n💡 Possible solutions:')
    console.log('   1. Check if your Supabase project is paused (visit dashboard)')
    console.log('   2. Verify the URL and anon key are correct')
    console.log('   3. Check your internet connection')
  }
}

test()
