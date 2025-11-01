import { supabase } from "./supabase"
import { database } from "./database"
import { storageHybrid } from "./storage-hybrid"

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
      await database.createUserProfile(userId, {
        name: finalUsername,
        level: 1,
        xp: 0,
        xpToNextLevel: 500,
        emotionalAwarenessStreak: 0,
        biasRecognitionScore: 0,
        mindfulDecisionPercentage: 0,
        totalTrades: 0,
        mindfulTrades: 0,
        serenityTokens: 0,
        dailyRings: {
          emotionalAwareness: 0,
          biasRecognition: 0,
          mindfulness: 0,
        },
        lastRingReset: new Date(),
        perfectDays: 0,
        longestStreak: 0,
        totalEmotionsLogged: 0,
        totalBiasesIdentified: 0,
        totalJournalsCompleted: 0,
        totalModulesCompleted: 0,
        totalBreathingExercises: 0,
        mostProductiveDay: 0,
      })
      console.log("User_profiles created successfully")
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
