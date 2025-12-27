"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface SegmentedControlOption<T extends string = string> {
  value: T
  label: string
}

interface SegmentedControlProps<T extends string = string> {
  options: SegmentedControlOption<T>[]
  value: T
  onChange: (value: T) => void
  className?: string
}

export function SegmentedControl<T extends string = string>({
  options,
  value,
  onChange,
  className,
}: SegmentedControlProps<T>) {
  return (
    <div className={cn("inline-flex gap-2 flex-wrap", className)} role="group">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          className={cn(
            "px-4 py-2.5 rounded-full text-sm font-medium transition-all min-h-[44px]",
            "border-2 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-2",
            value === option.value
              ? "bg-primary text-primary-foreground border-primary shadow-sm"
              : "bg-background text-foreground border-border hover:border-primary/50 hover:bg-accent"
          )}
          aria-pressed={value === option.value}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}

interface YesNoControlProps {
  value: boolean
  onChange: (value: boolean) => void
  className?: string
  yesLabel?: string
  noLabel?: string
}

export function YesNoControl({
  value,
  onChange,
  className,
  yesLabel = "Yes",
  noLabel = "No",
}: YesNoControlProps) {
  return (
    <div className={cn("inline-flex gap-2", className)} role="group">
      <button
        type="button"
        onClick={() => onChange(true)}
        className={cn(
          "px-6 py-2.5 rounded-full text-sm font-medium transition-all min-h-[44px] min-w-[80px]",
          "border-2 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-2",
          value === true
            ? "bg-primary text-primary-foreground border-primary shadow-sm"
            : "bg-background text-foreground border-border hover:border-primary/50 hover:bg-accent"
        )}
        aria-pressed={value === true}
      >
        {yesLabel}
      </button>
      <button
        type="button"
        onClick={() => onChange(false)}
        className={cn(
          "px-6 py-2.5 rounded-full text-sm font-medium transition-all min-h-[44px] min-w-[80px]",
          "border-2 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-2",
          value === false
            ? "bg-primary text-primary-foreground border-primary shadow-sm"
            : "bg-background text-foreground border-border hover:border-primary/50 hover:bg-accent"
        )}
        aria-pressed={value === false}
      >
        {noLabel}
      </button>
    </div>
  )
}
