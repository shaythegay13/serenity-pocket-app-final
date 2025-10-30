"use client"

import { useEffect, useState } from "react"
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

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase
        .from("profiles")
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
      const { error } = await supabase.from("profiles").upsert({
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
      setStatus("Saved")
      toast.success("Profile saved")

      const isComplete = !!name || !!(age !== "" || genderMode || location || occupation || experienceYears !== "")
      if (isComplete && typeof window !== "undefined") {
        const awarded = localStorage.getItem("serenity_profile_completed_awarded")
        if (!awarded) {
          // Award XP and tokens for completing profile
          await updateUserData({ xp: userData.xp + xpRewards.completeLesson, serenityTokens: userData.serenityTokens + tokenRewards.completeLesson })
          
          // Unlock all achievements when profile is completed
          const achievements = await storage.getAchievements()
          const unlockedAchievements = achievements.map((a: Achievement) => ({
            ...a,
            unlocked: true,
            unlockedAt: new Date()
          }))
          await storage.setAchievements(unlockedAchievements)
          
          localStorage.setItem("serenity_profile_completed_awarded", "true")
          toast.success("All achievements achieved!")
          forceRefresh() // Trigger achievements tab to reload
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
      const { error: upsertError } = await supabase.from("profiles").upsert({
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
        <div>
          <h2 className="text-2xl font-bold">Your Profile</h2>
          <p className="text-sm text-muted-foreground">Update your display info.</p>
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
              <label className="text-sm">Years of Trading Experience</label>
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
                <img src={avatarUrl} alt="picture" className="h-10 w-10 rounded-full object-cover" />
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
    </div>
  )
}
