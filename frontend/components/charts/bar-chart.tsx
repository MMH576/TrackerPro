"use client"

import { useEffect, useRef } from "react"
import { motion } from "framer-motion"

interface BarChartProps {
  data: { name: string; value: number }[]
  height: number
  color?: string
  showValues?: boolean
}

export function BarChart({ 
  data, 
  height, 
  color = "hsl(var(--primary))", 
  showValues = false
}: BarChartProps) {
  const maxValue = Math.max(...data.map((item) => item.value), 1)
  const chartRef = useRef<HTMLDivElement>(null)

  // Add tooltip functionality
  useEffect(() => {
    const chart = chartRef.current
    if (!chart) return

    const bars = chart.querySelectorAll(".bar")

    bars.forEach((bar) => {
      bar.addEventListener("mouseenter", (e) => {
        const target = e.currentTarget as HTMLElement
        const tooltip = target.querySelector(".tooltip") as HTMLElement
        if (tooltip) {
          tooltip.style.opacity = "1"
        }
      })

      bar.addEventListener("mouseleave", (e) => {
        const target = e.currentTarget as HTMLElement
        const tooltip = target.querySelector(".tooltip") as HTMLElement
        if (tooltip) {
          tooltip.style.opacity = "0"
        }
      })
    })

    return () => {
      bars.forEach((bar) => {
        bar.removeEventListener("mouseenter", () => {})
        bar.removeEventListener("mouseleave", () => {})
      })
    }
  }, [data])

  return (
    <div className="w-full h-full space-y-2" style={{ height }}>
      {data.map((item, index) => {
        const value = Math.max(0, item.value)
        const percentage = value / maxValue
        
        return (
          <div key={index} className="flex flex-col space-y-1">
            <div className="flex justify-between items-center text-xs">
              <span className="font-medium truncate" style={{ maxWidth: '60%' }}>
                {item.name}
              </span>
              {showValues && (
                <span className="text-muted-foreground">{value}%</span>
              )}
            </div>
            <div className="w-full bg-secondary rounded-full overflow-hidden h-2">
              <motion.div
                className="bg-primary h-full rounded-full"
                style={{ width: `${percentage * 100}%` }}
                initial={{ width: 0 }}
                animate={{ width: `${percentage * 100}%` }}
                transition={{ duration: 0.7, ease: "easeOut" }}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}

