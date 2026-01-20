"use client"

import { Card } from "@/components/ui/card"
import Image from "next/image"
import { useState, useEffect } from "react"
import { DashboardHeader } from "@/components/dashboard-header"
import { Navigation } from "@/components/navigation"
import { BottomNav } from "@/components/bottom-nav"
import { supabase } from "@/lib/supabase"
import type { UserData } from "@/lib/types"
import { storageHybrid as storage } from "@/lib/storage-hybrid"

// Move founder data outside component to prevent re-creation
const founders = [
  {
    name: "Shay Bouchles",
    title: "Chief Executive Officer",
    bio: "Originally from Maine and based in New York City since 2020, Shay brings a unique blend of educational expertise, entrepreneurial experience, and technical capability to the role. She holds a Master's degree in Environmental Policy and Sustainability Management from The New School and an undergraduate degree from the University of Maine, with academic foundations in research methodology and systems-level thinking that inform her approach to behavioral fintech. As a passionate vibecoder, Shay excels at rapid prototyping and product iteration using cutting-edge AI-assisted development platforms including Windsurf, Claude, Lovable, Vercel, Cursor, v0, Bolt.new, and Replit—translating complex psychology research into intuitive user experiences at speed. Her commitment to continuous upskilling through hackathons has included winning hackathon competitions and consistently building real-world impact solutions, sharpening both her technical capabilities and her ability to ship ideas fast. Prior to launching PlayMind Labs, she founded and led Saved by the Plate Inc., a nonprofit focused on advancing food justice and community education by connecting urban youth to local sustainable food systems—an experience that sharpened her skills in mission-driven fundraising, board management, nonprofit operations, and scaling social impact. Across her ventures, Shay has built teams, led community partnerships, and successfully navigated accelerator programs including Communitas Ventures, demonstrating her ability to synthesize social impact mindset with for-profit growth strategy. At PlayMind Labs, she leads product vision, user empathy research, AI-human psychology integration, and partnerships, ensuring the platform helps bettors make smarter, safer decisions while building a sustainable business model for responsible gaming technology.",
    image: "/shay.bouchles.png"
  },
  {
    name: "Sergio Monterroso",
    title: "Chief Financial Officer",
    bio: "Sergio Monterroso is the CFO of PlayMind Labs, bringing a robust foundation in finance, data science, and social impact entrepreneurship to the company's mission of transforming sports betting through behavioral psychology and AI. With a Bachelor's degree in Finance and Economics from Arizona State University's W.P. Carey School of Business and a Master's in Data and Social Research from Queens College, Sergio combines quantitative rigor with a deep commitment to addressing social inequality. Prior to co-founding PlayMind Labs, he served as Executive Director of G.I.V.E. (Global Impactful Vision Efforts), Inc., a nonprofit focused on combating food insecurity, and spent over four years as a Business Consultant at Growth Consulting Enterprise, where he developed expertise in financial strategy, operations, and data-informed decision-making. Sergio's work has been recognized by the Idealist Action Incubator, where he was named a 2025 Spring Cohort winner for his innovative approach to addressing systemic challenges. At PlayMind Labs, he leads financial planning, business modeling, and strategic growth initiatives, ensuring the company's technology serves both profitability and responsible gaming outcomes.",
    image: "/sergio.png"
  },
  {
    name: "Diamond Mc Pherson",
    title: "Chief Technology Officer",
    bio: "Diamond Mc Pherson is the CTO of PlayMind Labs, bringing nearly two decades of IT leadership and digital transformation expertise to architect the company's secure, scalable infrastructure. With a Bachelor's degree in Computer/Information Technology Administration from the University of Hertfordshire, an Associate's degree in Operating Systems Management from COSTAATT, and a Postgraduate Certificate in Cloud Computing from the University of Texas at Austin, Diamond combines deep technical knowledge with AWS Certified Solutions Architect credentials. Most recently, he served as Regional Hyper Support Coordinator at the International Rescue Committee, where he spearheaded the global implementation of Microsoft Dynamics 365 across LATAM, Africa, and Europe—boosting operational efficiency by 25%, increasing user engagement by 30%, and reducing IT support ticket volume by 40%. Prior to that, he spent 14 years at COSTAATT in Trinidad and Tobago, where he engineered a full-scale migration from VMware to Hyper-V, reducing licensing costs by 20% annually and training over 50 participants while managing 500+ user accounts with zero downtime. At PlayMind Labs, Diamond leads technical architecture, infrastructure design, and reliability engineering, ensuring the platform can handle sensitive behavioral data, real-time AI processing, and responsible gaming controls as the company scales.",
    image: "/diamond.png"
  }
] as const

export default function AboutPage() {
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set())
  const [userData, setUserData] = useState<UserData | null>(null)
  const [authed, setAuthed] = useState<boolean | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let isMounted = true
    
    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        
        if (!isMounted) return
        
        setAuthed(!!session)
        
        if (session) {
          try {
            const storedUserData = await storage.getUserData()
            if (isMounted) {
              setUserData(storedUserData)
            }
          } catch (error) {
            console.error('Failed to fetch user data:', error)
          }
        }
      } catch (error) {
        console.error('Auth check failed:', error)
        setAuthed(false)
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    checkAuth()

    return () => {
      isMounted = false
    }
  }, [])

  const handleNavigateToTab = (tab: string) => {
    window.location.href = `/${tab === 'odds' ? 'sports-dashboard' : tab}`
  }

  const handleImageError = (imageName: string) => {
    setImageErrors(prev => new Set(prev).add(imageName))
  }

  const getImageSrc = (founder: { name: string; title: string; bio: string; image: string }) => {
    if (imageErrors.has(founder.image)) {
      // Try alternative extension
      const altImage = founder.image.endsWith('.png') 
        ? founder.image.replace('.png', '.jpg')
        : founder.image.replace('.jpg', '.png')
      
      if (imageErrors.has(altImage)) {
        return "/placeholder-user.jpg"
      }
      return altImage
    }
    return founder.image
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    )
  }

  const aboutContent = (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-foreground mb-4">
            About Serenity Pocket
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            We're on a mission to revolutionize sports betting through behavioral intelligence and responsible gaming technology.
          </p>
        </div>

        {/* Mission & Vision */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
          <Card className="p-8">
            <h2 className="text-2xl font-bold text-foreground mb-4">
              Our Mission
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              PlayMind Labs exists to make betting smarter, not bigger. We're the seatbelt, not the gas pedal. 
              Our goal is to help you understand your psychology, recognize harmful patterns, and make more informed decisions. 
              Always bet responsibly and never wager more than you can afford to lose.
            </p>
          </Card>
          
          <Card className="p-8">
            <h2 className="text-2xl font-bold text-foreground mb-4">
              Our Vision
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              A world where every sports bettor has access to sophisticated behavioral tools and analytics that help them understand their patterns, manage emotions, and make rational decisions. We envision a future where responsible gaming and data-driven insights go hand in hand.
            </p>
          </Card>
        </div>

        {/* Our Story */}
        <Card className="p-8 mb-16">
          <h2 className="text-2xl font-bold text-foreground mb-6 text-center">
            Our Story
          </h2>
          <div className="max-w-4xl mx-auto">
            <p className="text-muted-foreground leading-relaxed mb-4">
              PlayMind Labs was born from a simple observation: while sports betting has become increasingly sophisticated with advanced analytics and real-time data, the human element—emotions, biases, and behavioral patterns—was largely overlooked.
            </p>
            <p className="text-muted-foreground leading-relaxed mb-4">
              Our founders, bringing together expertise in behavioral psychology, financial technology, and artificial intelligence, recognized an opportunity to bridge this gap. They saw that the most successful bettors weren't just those with the best data, but those who understood themselves and maintained emotional discipline.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              Today, PlayMind Labs stands at the intersection of behavioral science and cutting-edge technology, providing users with the tools they need to bet smarter, stay in control, and enjoy sports betting as a form of entertainment rather than a source of stress.
            </p>
          </div>
        </Card>

        {/* Founders Section */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-foreground text-center mb-12">
            Meet Our Founders
          </h2>
          
          <div className="space-y-8 max-w-4xl mx-auto">
            {founders.map((founder, index) => (
              <Card key={index} className="p-8">
                <div className="flex flex-col md:flex-row gap-8 items-center">
                  <div className="shrink-0">
                    <Image
                      src={getImageSrc(founder)}
                      alt={founder.name}
                      width={120}
                      height={120}
                      className="rounded-full object-cover"
                      unoptimized={true}
                      onError={() => handleImageError(getImageSrc(founder))}
                    />
                  </div>
                  
                  <div className="flex-1 text-center md:text-left">
                    <h3 className="text-2xl font-bold text-foreground mb-2">
                      {founder.name}
                    </h3>
                    
                    <p className="text-primary font-medium text-lg mb-4">
                      {founder.title}
                    </p>
                    
                    <p className="text-muted-foreground leading-relaxed">
                      {founder.bio}
                    </p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Values Section */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-foreground text-center mb-12">
            Our Values
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="p-6 text-center">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🎯</span>
              </div>
              <h3 className="font-semibold text-foreground mb-2">Responsibility</h3>
              <p className="text-muted-foreground text-sm">
                We prioritize user welfare and responsible gaming above all else.
              </p>
            </Card>
            
            <Card className="p-6 text-center">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🔬</span>
              </div>
              <h3 className="font-semibold text-foreground mb-2">Science-Based</h3>
              <p className="text-muted-foreground text-sm">
                Our methods are grounded in behavioral psychology and data science.
              </p>
            </Card>
            
            <Card className="p-6 text-center">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🤝</span>
              </div>
              <h3 className="font-semibold text-foreground mb-2">Transparency</h3>
              <p className="text-muted-foreground text-sm">
                We believe in open communication and honest user relationships.
              </p>
            </Card>
            
            <Card className="p-6 text-center">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🚀</span>
              </div>
              <h3 className="font-semibold text-foreground mb-2">Innovation</h3>
              <p className="text-muted-foreground text-sm">
                We continuously push the boundaries of what's possible in betting analytics.
              </p>
            </Card>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center">
          <Card className="p-8 bg-muted/50">
            <h2 className="text-2xl font-semibold text-foreground mb-4">
              Join Our Community
            </h2>
            <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
              Be part of a growing community of responsible bettors who use data and behavioral insights to make smarter decisions.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="/pricing"
                className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
              >
                Get Started
              </a>
              <a
                href="/contact"
                className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2"
              >
                Contact Us
              </a>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )

  // Show full authenticated layout for logged-in users
  if (authed && userData) {
    return (
      <div className="min-h-screen bg-background">
        <DashboardHeader userData={userData} onNavigateToTab={handleNavigateToTab} />
        <div className="hidden md:block">
          <Navigation />
        </div>
        <main className="pb-20 md:pb-0">
          {aboutContent}
        </main>
        <BottomNav />
      </div>
    )
  }

  // Show basic layout for non-authenticated users
  return (
    <div className="min-h-screen bg-background">
      {aboutContent}
    </div>
  )
}
