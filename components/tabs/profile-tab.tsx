"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import { supabase } from "@/lib/supabase"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import type { UserData, Achievement } from "@/lib/types"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { tokenRewards, xpRewards } from "@/lib/gamification"
import { storageHybrid as storage } from "@/lib/storage-hybrid"
interface ProfileTabProps {
  userData: UserData
  updateUserData: (updates: Partial<UserData>) => Promise<void>
  forceRefresh: () => void
}

export function ProfileTab({ userData, updateUserData, forceRefresh }: ProfileTabProps) {
  const [name, setName] = useState(userData?.name || "")
  const [avatarUrl, setAvatarUrl] = useState("")
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState<string | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [age, setAge] = useState<number | "">("")
  const [gender, setGender] = useState("")
  const [genderMode, setGenderMode] = useState<string>("")
  const [genderOther, setGenderOther] = useState("")
  const [location, setLocation] = useState("")
  const [occupation, setOccupation] = useState("")
  const [experienceYears, setExperienceYears] = useState<number | "">("")
  const [errors, setErrors] = useState<{ age?: string; experienceYears?: string }>(() => ({}))
  
  // Demographics fields (from survey)
  const [ageRange, setAgeRange] = useState(userData?.surveyData?.ageRange || "")
  const [region, setRegion] = useState(userData?.surveyData?.region || "")
  const [demographicOccupation, setDemographicOccupation] = useState(userData?.surveyData?.occupation || "")
  const [educationLevel, setEducationLevel] = useState(userData?.surveyData?.educationLevel || "")
  const [incomeRange, setIncomeRange] = useState(userData?.surveyData?.incomeRange || "")
  const [employmentStatus, setEmploymentStatus] = useState(userData?.surveyData?.employmentStatus || "")
  const [maritalStatus, setMaritalStatus] = useState(userData?.surveyData?.maritalStatus || "")
  const [ethnicity, setEthnicity] = useState(userData?.surveyData?.ethnicity || "")
  const [bettingFrequency, setBettingFrequency] = useState(userData?.surveyData?.bettingFrequency || "")
  const [typicalBetAmount, setTypicalBetAmount] = useState(userData?.surveyData?.typicalBetAmount || "")
  const [savingDemographics, setSavingDemographics] = useState(false)

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase
        .from("user_profiles")
        .select("name, avatar_url, age, gender, location, occupation, experience_years")
        .eq("id", user.id)
        .maybeSingle()
      if (data) {
        setName(data.name || name)
        setAvatarUrl(data.avatar_url || "")
        setAge(typeof data.age === "number" ? data.age : "")
        setGender(data.gender || "")
        setLocation(data.location || "")
        setOccupation(data.occupation || "")
        setExperienceYears(typeof data.experience_years === "number" ? data.experience_years : "")
        if (data.gender) {
          const normalized = data.gender.toLowerCase()
          if (["woman","man","non-binary","agender","prefer not to say"].includes(normalized)) {
            setGenderMode(normalized)
          } else {
            setGenderMode("self-describe")
            setGenderOther(data.gender)
          }
        }
      }
    }
    load()
  }, [])

  const validate = () => {
    const next: { age?: string; experienceYears?: string } = {}
    if (age !== "" && Number(age) < 0) next.age = "Age cannot be negative"
    if (experienceYears !== "" && Number(experienceYears) < 0) next.experienceYears = "Years cannot be negative"
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const save = async () => {
    if (!validate()) {
      toast.error("Please fix validation errors")
      return
    }
    setLoading(true)
    setStatus(null)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("Not signed in")
      const { error } = await supabase.from("user_profiles").upsert({
        id: user.id,
        name,
        avatar_url: avatarUrl,
        age: age === "" ? null : age,
        gender: genderMode === "self-describe" ? (genderOther || "") : (gender || ""),
        location,
        occupation,
        experience_years: experienceYears === "" ? null : experienceYears,
      })
      if (error) throw error

      // Update userData with the new name - this will update user_profiles table too
      await updateUserData({ name })

      setStatus("Saved")
      toast.success("Profile saved")

      const isComplete = !!name || !!(age !== "" || genderMode || location || occupation || experienceYears !== "")
      if (isComplete && typeof window !== "undefined") {
        const awarded = localStorage.getItem("serenity_profile_completed_awarded")
        if (!awarded) {
          // Award XP and tokens for completing profile
          await updateUserData({ xp: userData.xp + xpRewards.completeLesson, serenityTokens: userData.serenityTokens + tokenRewards.completeLesson })
          localStorage.setItem("serenity_profile_completed_awarded", "true")
          toast.success("Profile bonus awarded: +100 XP and +10 Serenity Tokens!")
        }
      }
    } catch (e: any) {
      setStatus(e.message)
      toast.error(e.message)
    } finally {
      setLoading(false)
    }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    window.location.reload()
  }

  const saveDemographics = async () => {
    setSavingDemographics(true)
    try {
      // Check if all demographics fields are filled
      const hasAllDemographics = ageRange && region && demographicOccupation && educationLevel &&
        incomeRange && employmentStatus && maritalStatus && ethnicity && bettingFrequency && typicalBetAmount

      if (!hasAllDemographics) {
        toast.error("Please fill out all demographic fields to earn the bonus XP")
        setSavingDemographics(false)
        return
      }

      // Check if user already received demographics bonus
      if (userData?.demographicsComplete) {
        toast.info("You've already received the demographics bonus!")
        setSavingDemographics(false)
        return
      }

      // Update surveyData with demographics
      await updateUserData({
        surveyData: {
          ...userData?.surveyData,
          name: userData?.surveyData?.name || "",
          email: userData?.surveyData?.email || "",
          userType: userData?.surveyData?.userType || "day-trader",
          experience: userData?.surveyData?.experience || "beginner",
          primaryGoal: userData?.surveyData?.primaryGoal || "",
          weeklyActivity: userData?.surveyData?.weeklyActivity || "",
          referralSource: userData?.surveyData?.referralSource || "",
          ageRange,
          region,
          occupation: demographicOccupation,
          educationLevel,
          incomeRange,
          employmentStatus,
          maritalStatus,
          ethnicity,
          bettingFrequency,
          typicalBetAmount,
        },
        demographicsComplete: true,
        xp: (userData?.xp || 0) + 200,
      })

      toast.success("Demographics saved! +200 XP earned! 🎉", {
        description: "Thank you for helping us understand our users better!"
      })
    } catch (e: any) {
      toast.error(e.message || "Failed to save demographics")
    } finally {
      setSavingDemographics(false)
    }
  }

  const uploadAvatar = async () => {
    if (!file) return
    setUploading(true)
    setStatus(null)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("Not signed in")
      const ext = file.name.split(".").pop() || "jpg"
      const path = `${user.id}/${Date.now()}.${ext}`
      const { error: uploadError } = await supabase.storage.from("avatars").upload(path, file, { upsert: false })
      if (uploadError) throw uploadError
      const { data: publicData } = supabase.storage.from("avatars").getPublicUrl(path)
      const url = publicData.publicUrl
      setAvatarUrl(url)
      const { error: upsertError } = await supabase.from("user_profiles").upsert({
        id: user.id,
        name,
        avatar_url: url,
        age: age === "" ? null : age,
        gender,
        location,
        occupation,
        experience_years: experienceYears === "" ? null : experienceYears,
      })
      if (upsertError) throw upsertError
      setStatus("Saved")
    } catch (e: any) {
      setStatus(e.message)
    } finally {
      setUploading(false)
      setFile(null)
    }
  }

  return (
    <div className="space-y-6 fade-in">
      <Card className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Your Profile</h2>
            <p className="text-sm text-muted-foreground">Update your display info.</p>
          </div>
          <Button
            variant="outline"
            onClick={() => window.location.href = '/gambling-survey'}
            className="flex items-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8"/>
              <path d="M21 3v5h-5"/>
            </svg>
            Retake Survey
          </Button>
        </div>
        <div className="space-y-3">
          <div>
            <label className="text-sm">Display name</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-sm">Age</label>
              <Input
                type="number"
                value={age}
                onChange={(e) => setAge(e.target.value === "" ? "" : Number(e.target.value))}
                min={0}
              />
              {errors.age && <p className="text-xs text-red-500">{errors.age}</p>}
            </div>
            <div>
              <label className="text-sm">Gender</label>
              <div className="flex flex-col gap-2">
                <Select
                  value={genderMode}
                  onValueChange={(v) => {
                    setGenderMode(v)
                    if (v === "woman") setGender("Woman")
                    else if (v === "man") setGender("Man")
                    else if (v === "non-binary") setGender("Non-binary")
                    else if (v === "agender") setGender("Agender")
                    else if (v === "prefer-not") setGender("Prefer not to say")
                    else if (v === "self-describe") setGender(genderOther)
                  }}
                >
                  <SelectTrigger className="w-full"><SelectValue placeholder="Select gender" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="woman">Woman</SelectItem>
                    <SelectItem value="man">Man</SelectItem>
                    <SelectItem value="non-binary">Non-binary</SelectItem>
                    <SelectItem value="agender">Agender</SelectItem>
                    <SelectItem value="prefer-not">Prefer not to say</SelectItem>
                    <SelectItem value="self-describe">Prefer to self-describe</SelectItem>
                  </SelectContent>
                </Select>
                {genderMode === "self-describe" && (
                  <Input
                    placeholder="Self-described gender"
                    value={genderOther}
                    onChange={(e) => {
                      setGenderOther(e.target.value)
                      if (genderMode === "self-describe") setGender(e.target.value)
                    }}
                  />
                )}
              </div>
            </div>
            <div>
              <label className="text-sm">Location</label>
              <Input value={location} onChange={(e) => setLocation(e.target.value)} />
            </div>
            <div>
              <label className="text-sm">Occupation</label>
              <Input value={occupation} onChange={(e) => setOccupation(e.target.value)} />
            </div>
            <div>
              <label className="text-sm">Years of Trading/Betting Experience</label>
              <Input
                type="number"
                value={experienceYears}
                onChange={(e) => setExperienceYears(e.target.value === "" ? "" : Number(e.target.value))}
                min={0}
              />
              {errors.experienceYears && <p className="text-xs text-red-500">{errors.experienceYears}</p>}
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-sm">Upload picture</label>
            <Input type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] || null)} />
            <div className="flex gap-2">
              <Button onClick={uploadAvatar} disabled={!file || uploading}>{uploading ? "Uploading..." : "Upload & Save"}</Button>
              {avatarUrl && (
                <Image
                  src={avatarUrl}
                  alt="Profile picture"
                  width={40}
                  height={40}
                  className="h-10 w-10 rounded-full object-cover"
                />
              )}
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button onClick={save} disabled={loading}>{loading ? "Saving..." : "Save"}</Button>
          <Button variant="outline" onClick={signOut}>Sign out</Button>
        </div>
        {status && <p className="text-sm text-muted-foreground">{status}</p>}
      </Card>

      {/* Demographics Section */}
      <Card className="p-6 space-y-4">
        <div>
          <h2 className="text-2xl font-bold">Demographics</h2>
          <p className="text-sm text-muted-foreground">
            Complete all fields to earn +200 XP bonus! {userData?.demographicsComplete && "✅ Completed"}
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium">Age Range</label>
            <Select value={ageRange} onValueChange={setAgeRange}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select age range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="18-24">18-24</SelectItem>
                <SelectItem value="25-34">25-34</SelectItem>
                <SelectItem value="35-44">35-44</SelectItem>
                <SelectItem value="45-54">45-54</SelectItem>
                <SelectItem value="55-64">55-64</SelectItem>
                <SelectItem value="65+">65+</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium">Region/Time Zone</label>
            <Input
              type="text"
              placeholder="e.g., Eastern US, Europe, Asia Pacific"
              value={region}
              onChange={(e) => setRegion(e.target.value)}
            />
          </div>

          <div>
            <label className="text-sm font-medium">General Occupation</label>
            <Input
              type="text"
              placeholder="e.g., Student, Professional, Retired"
              value={demographicOccupation}
              onChange={(e) => setDemographicOccupation(e.target.value)}
            />
          </div>

          <div>
            <label className="text-sm font-medium">Education Level</label>
            <Select value={educationLevel} onValueChange={setEducationLevel}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select education level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="high-school">High School or Less</SelectItem>
                <SelectItem value="some-college">Some College</SelectItem>
                <SelectItem value="associates">Associate's Degree</SelectItem>
                <SelectItem value="bachelors">Bachelor's Degree</SelectItem>
                <SelectItem value="masters">Master's Degree</SelectItem>
                <SelectItem value="doctorate">Doctorate or Professional Degree</SelectItem>
                <SelectItem value="prefer-not">Prefer not to say</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium">Annual Income Range</label>
            <Select value={incomeRange} onValueChange={setIncomeRange}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select income range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="under-25k">Under $25,000</SelectItem>
                <SelectItem value="25k-50k">$25,000 - $50,000</SelectItem>
                <SelectItem value="50k-75k">$50,000 - $75,000</SelectItem>
                <SelectItem value="75k-100k">$75,000 - $100,000</SelectItem>
                <SelectItem value="100k-150k">$100,000 - $150,000</SelectItem>
                <SelectItem value="150k-200k">$150,000 - $200,000</SelectItem>
                <SelectItem value="over-200k">Over $200,000</SelectItem>
                <SelectItem value="prefer-not">Prefer not to say</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium">Employment Status</label>
            <Select value={employmentStatus} onValueChange={setEmploymentStatus}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select employment status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="employed-full">Employed Full-Time</SelectItem>
                <SelectItem value="employed-part">Employed Part-Time</SelectItem>
                <SelectItem value="self-employed">Self-Employed</SelectItem>
                <SelectItem value="unemployed">Unemployed</SelectItem>
                <SelectItem value="student">Student</SelectItem>
                <SelectItem value="retired">Retired</SelectItem>
                <SelectItem value="unable">Unable to Work</SelectItem>
                <SelectItem value="prefer-not">Prefer not to say</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium">Marital Status</label>
            <Select value={maritalStatus} onValueChange={setMaritalStatus}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select marital status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="single">Single</SelectItem>
                <SelectItem value="married">Married</SelectItem>
                <SelectItem value="partnered">In a Relationship/Partnered</SelectItem>
                <SelectItem value="divorced">Divorced</SelectItem>
                <SelectItem value="widowed">Widowed</SelectItem>
                <SelectItem value="prefer-not">Prefer not to say</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium">Ethnicity/Race</label>
            <Select value={ethnicity} onValueChange={setEthnicity}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select ethnicity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="white">White/Caucasian</SelectItem>
                <SelectItem value="black">Black/African American</SelectItem>
                <SelectItem value="hispanic">Hispanic/Latino</SelectItem>
                <SelectItem value="asian">Asian</SelectItem>
                <SelectItem value="native-american">Native American/Alaska Native</SelectItem>
                <SelectItem value="pacific-islander">Pacific Islander</SelectItem>
                <SelectItem value="middle-eastern">Middle Eastern/North African</SelectItem>
                <SelectItem value="mixed">Two or More Races</SelectItem>
                <SelectItem value="other">Other</SelectItem>
                <SelectItem value="prefer-not">Prefer not to say</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium">Betting Frequency</label>
            <Select value={bettingFrequency} onValueChange={setBettingFrequency}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="How often do you bet?" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="several-times-week">Several times a week</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="few-times-month">Few times a month</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
                <SelectItem value="occasionally">Occasionally</SelectItem>
                <SelectItem value="rarely">Rarely</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium">Typical Bet Amount</label>
            <Select value={typicalBetAmount} onValueChange={setTypicalBetAmount}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Average bet size" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="under-10">Under $10</SelectItem>
                <SelectItem value="10-25">$10 - $25</SelectItem>
                <SelectItem value="25-50">$25 - $50</SelectItem>
                <SelectItem value="50-100">$50 - $100</SelectItem>
                <SelectItem value="100-250">$100 - $250</SelectItem>
                <SelectItem value="250-500">$250 - $500</SelectItem>
                <SelectItem value="500-1000">$500 - $1,000</SelectItem>
                <SelectItem value="over-1000">Over $1,000</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Button
          onClick={saveDemographics}
          disabled={savingDemographics || userData?.demographicsComplete || !ageRange || !region || !demographicOccupation ||
            !educationLevel || !incomeRange || !employmentStatus || !maritalStatus || !ethnicity || !bettingFrequency || !typicalBetAmount}
        >
          {savingDemographics ? "Saving..." : userData?.demographicsComplete ? "Already Completed ✅" : "Save & Earn 200 XP"}
        </Button>

        {!userData?.demographicsComplete && (
          <p className="text-xs text-muted-foreground">
            💡 Fill out all fields above to earn your bonus XP!
          </p>
        )}
      </Card>
    </div>
  )
}
