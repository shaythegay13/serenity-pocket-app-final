"use client"

import Link from "next/link"
import Image from "next/image"
import {
  LinkedInIcon,
  InstagramIcon,
  TikTokIcon,
  YoutubeIcon,
  XIcon,
  LumaCalendarIcon
} from "@/components/ui/social-icons"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"

export function Footer() {
  const [isAuthed, setIsAuthed] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsAuthed(!!session)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthed(!!session)
    })

    return () => subscription.unsubscribe()
  }, [])

  return (
    <footer className="border-t border-border bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row justify-between gap-8">
          {/* Logo and Description - Full width on all screens */}
          <div className="space-y-4 md:max-w-sm">
            <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
              <div className="shrink-0">
                <div className="relative w-32 h-16 overflow-hidden rounded-none">
                  <Image
                    src="/logo.png"
                    alt="PlayMind Labs Logo"
                    fill
                    className="object-cover object-center logo-dark-mode-auto"
                  />
                </div>
              </div>
            </Link>
            <p className="text-sm text-muted-foreground max-w-sm">
              AI-powered sports betting analytics platform for smarter decisions.
            </p>

            {/* Social Media Links */}
            <div className="flex items-center gap-4 pt-2">
              <Link
                href="https://www.linkedin.com/company/playmind-labs"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground transition-colors"
                aria-label="LinkedIn"
              >
                <LinkedInIcon className="h-5 w-5" />
              </Link>
              <Link
                href="https://www.instagram.com/playmindlabs/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Instagram"
              >
                <InstagramIcon className="h-5 w-5" />
              </Link>
              <Link
                href="https://www.tiktok.com/@playmindlabs5"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground transition-colors"
                aria-label="TikTok"
              >
                <TikTokIcon className="h-5 w-5" />
              </Link>
              <Link
                href="https://www.youtube.com/@playmindlabs"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground transition-colors"
                aria-label="YouTube"
              >
                <YoutubeIcon className="h-5 w-5" />
              </Link>
              <Link
                href="https://x.com/PlayMindLabs"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground transition-colors"
                aria-label="X (Twitter)"
              >
                <XIcon className="h-5 w-5" />
              </Link>
              <Link
                href="https://luma.com/calendar/cal-bxGkf0dgOWPc1N4?"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Luma Calendar"
              >
                <LumaCalendarIcon className="h-5 w-5" />
              </Link>
            </div>
          </div>

          {/* Resources and Company Sections - Side by side on mobile and desktop */}
          <div className="grid grid-cols-2 gap-8 md:gap-16">
            {/* Resources Section */}
            <div>
              <h4 className="text-lg font-semibold text-foreground mb-4">Resources</h4>
              <ul className="space-y-2">
                <li>
                  <Link
                    href="/faq"
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    FAQs
                  </Link>
                </li>
                <li>
                  <Link
                    href="/demo"
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Demo
                  </Link>
                </li>
                <li>
                  <Link
                    href="/features"
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Features
                  </Link>
                </li>
                <li>
                  <Link
                    href="/pricing"
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Pricing
                  </Link>
                </li>
              </ul>
            </div>

            {/* Company Section */}
            <div>
              <h4 className="text-lg font-semibold text-foreground mb-4">Company</h4>
              <ul className="space-y-2">
                <li>
                  <Link
                    href="/about"
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    About
                  </Link>
                </li>
                <li>
                  <Link
                    href="/privacy"
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Privacy
                  </Link>
                </li>
                <li>
                  <Link
                    href="/terms"
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Terms
                  </Link>
                </li>
                <li>
                  <Link
                    href="/contact"
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Contact
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-8 pt-8 border-t border-border">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-muted-foreground">
              © 2026 PlayMind Labs. All rights reserved.
            </p>
            <div className="flex items-center gap-6">
              <span className="text-sm text-muted-foreground">
                Responsible gaming is our priority
              </span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
