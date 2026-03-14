"use client"

import { useState } from "react"
import Image from "next/image"
import { Card } from "@/components/ui/card"

interface Founder {
  name: string
  title: string
  bio: string
  image: string
}

export function FounderCard({ founder }: { founder: Founder }) {
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set())

  const handleImageError = (imageName: string) => {
    setImageErrors(prev => new Set(prev).add(imageName))
  }

  const getImageSrc = (founder: Founder) => {
    if (imageErrors.has(founder.image)) {
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

  return (
    <Card className="p-8">
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
  )
}
