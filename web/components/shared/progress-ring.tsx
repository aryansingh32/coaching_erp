"use client"

import React, { useEffect, useState } from "react"
import { cn } from "@/lib/utils"

interface ProgressRingProps {
  value: number // 0 to 100
  size?: "sm" | "md" | "lg" | "xl" | "2xl"
  color?: "primary" | "success" | "warning" | "danger" | "streak"
  showValue?: boolean
  className?: string
}

const sizeMap = {
  sm: { svg: 32, stroke: 3, text: "text-[10px]" },
  md: { svg: 48, stroke: 4, text: "text-xs" },
  lg: { svg: 64, stroke: 5, text: "text-sm" },
  xl: { svg: 96, stroke: 8, text: "text-lg" },
  "2xl": { svg: 128, stroke: 10, text: "text-2xl" },
}

const colorMap = {
  primary: "text-primary",
  success: "text-institute-success",
  warning: "text-institute-warning",
  danger: "text-institute-danger",
  streak: "text-institute-streak",
}

export function ProgressRing({
  value,
  size = "md",
  color = "primary",
  showValue = false,
  className,
}: ProgressRingProps) {
  const [progress, setProgress] = useState(0)
  
  const { svg: svgSize, stroke, text: textClass } = sizeMap[size]
  const center = svgSize / 2
  const radius = center - stroke
  const circumference = 2 * Math.PI * radius
  
  // Animate on mount or value change
  useEffect(() => {
    const timer = setTimeout(() => setProgress(value), 100)
    return () => clearTimeout(timer)
  }, [value])

  const strokeDashoffset = circumference - (progress / 100) * circumference

  return (
    <div className={cn("relative inline-flex items-center justify-center", className)}>
      <svg
        width={svgSize}
        height={svgSize}
        className="transform -rotate-90"
      >
        {/* Background track */}
        <circle
          className="text-muted/20"
          strokeWidth={stroke}
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx={center}
          cy={center}
        />
        {/* Progress indicator */}
        <circle
          className={cn("transition-all duration-1000 ease-out", colorMap[color])}
          strokeWidth={stroke}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx={center}
          cy={center}
        />
      </svg>
      {showValue && (
        <div className={cn("absolute inset-0 flex items-center justify-center font-mono font-medium", textClass)}>
          {Math.round(progress)}%
        </div>
      )}
    </div>
  )
}
