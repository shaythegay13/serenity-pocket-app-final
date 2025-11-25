import { supabase } from "./supabase"

// Track initialization to prevent duplicates
const initializingUsers = new Set<string>()

/**
 * Initialize a new user's data in the database
 * This is called when a user signs in but doesn't have profile data yet
 */
export async function initializeUserData(userId: string, username?: string) {
  // Prevent duplicate initialization
  if (initializingUsers.has(userId)) {
    console.log("Already initializing user, skipping duplicate call")
    return true
  }
  
  initializingUsers.add(userId)
  try {
    console.log("Initializing user data for:", userId)
    
    // Use provided username or get from auth if not provided
    let finalUsername = username
    if (!finalUsername) {
      console.log("Getting user metadata...")
      const { data: { user } } = await supabase.auth.getUser()
      finalUsername = user?.user_metadata?.username || user?.email?.split('@')[0] || 'Trader'
    }
    console.log("Username:", finalUsername)
    
    // 1. Create profile entry if it doesn't exist
    console.log("Checking for existing profile...")
    const profilePromise = supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle()
    
    const { data: existingProfile, error: profileCheckError } = await Promise.race([
      profilePromise,
      new Promise<any>((_, reject) => 
        setTimeout(() => reject(new Error('Timeout checking profile')), 3000)
      )
    ]).catch(err => {
      console.error("Error or timeout checking profile:", err)
      return { data: null, error: err }
    })
    
    if (profileCheckError) {
      console.error("Error checking profile:", profileCheckError)
    }
    
    if (!existingProfile) {
      console.log("Creating profile entry...")
      const { error: profileInsertError } = await supabase.from("profiles").insert({
        id: userId,
        username: finalUsername,
        name: finalUsername,
      })
      if (profileInsertError) {
        console.error("Error creating profile:", profileInsertError)
      } else {
        console.log("Profile created successfully")
      }
    } else {
      console.log("Profile already exists")
    }
    
    // 2. Create user_profiles entry if it doesn't exist
    console.log("Checking for existing user_profiles...")
    const { data: existingUserProfile, error: userProfileCheckError } = await supabase
      .from("user_profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle()
    
    if (userProfileCheckError) {
      console.error("Error checking user_profiles:", userProfileCheckError)
    }
    
    if (!existingUserProfile) {
      console.log("Creating user_profiles entry...")

      // Get user email from auth
      const { data: { user } } = await supabase.auth.getUser()

      const { error: userProfileInsertError } = await supabase
        .from("user_profiles")
        .insert({
          id: userId,
          name: finalUsername,
          email: user?.email,
          level: 1,
          xp: 0,
          xp_to_next_level: 500,
          emotional_awareness_streak: 0,
          bias_recognition_score: 0,
          mindful_decision_percentage: 0,
          total_trades: 0,
          mindful_trades: 0,
          serenity_tokens: 0,
          daily_rings: {
            emotionalAwareness: 0,
            biasRecognition: 0,
            mindfulness: 0,
          },
          last_ring_reset: new Date().toISOString(),
          perfect_days: 0,
          longest_streak: 0,
          total_emotions_logged: 0,
          total_biases_identified: 0,
          total_journals_completed: 0,
          total_modules_completed: 0,
          total_breathing_exercises: 0,
          most_productive_day: 0,
          onboarding_complete: false,
          biography_complete: false,
          emotion_track_complete: false,
        })

      if (userProfileInsertError) {
        console.error("Error creating user_profiles:", userProfileInsertError)
      } else {
        console.log("User_profiles created successfully")
      }
    } else {
      console.log("User_profiles already exists")
    }
    
    console.log("User initialization complete")
    initializingUsers.delete(userId)
    return true
  } catch (error) {
    console.error("Error initializing user:", error)
    initializingUsers.delete(userId)
    return false
  }
}
