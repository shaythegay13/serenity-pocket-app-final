'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { usePathname } from 'next/navigation'

const navLinks = [
  { href: '/check-in', label: 'Emotional Check-In' },
  { href: '/serenity', label: 'Serenity Survey' },
  { href: '/pgsi', label: 'PGSI Survey' },
]

export function PublicPageHeader() {
  const pathname = usePathname()

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-white/10 backdrop-blur-sm bg-black/20">
      <div className="container mx-auto px-4 py-0.1">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center">
            <div className="relative">
              <div className="relative w-32 h-16 overflow-hidden rounded-md">
                <Image
                  src="/logo.png"
                  alt="PlayMind Labs Logo"
                  fill
                  className="object-cover object-center dark:invert"
                />
              </div>
            </div>
          </Link>

          {/* Nav Links - hidden on mobile */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  pathname === link.href
                    ? 'text-white bg-white/10'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Log In Button */}
          <Button
            asChild
            className="bg-linear-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-5 py-2 rounded-lg text-sm"
          >
            <Link href="/login">Log In</Link>
          </Button>
        </div>
      </div>
    </header>
  )
}
