"use client"

import { useEffect, useRef } from "react"
import { motion } from "framer-motion"

interface BarChartProps {
  data: { name: string; value: number }[]
  height: number
  color?: string
}

export function BarChart({ data, height, color = "hsl(var(--primary))" }: BarChartProps) {
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
    <div className="w-full h-full flex flex-col" style={{ height }}>
      <div className="flex-1 flex items-end justify-between gap-2 px-2" ref={chartRef}>
        {data.map((item, index) => {
          const percentage = (item.value / maxValue) * 100

          return (
            <div key={index} className="relative flex-1 flex flex-col justify-end group bar">
              <motion.div
                className="w-full rounded-t-md"
                style={{
                  backgroundColor: color,
                  opacity: 0.8,
                }}
                initial={{ height: 0 }}
                animate={{ height: `${percentage}%` }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              />
              <div className="tooltip absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-background border px-2 py-1 rounded text-xs opacity-0 transition-opacity pointer-events-none whitespace-nowrap z-10">
                {item.name}: {item.value}
              </div>
            </div>
          )
        })}
      </div>
      <div className="h-6 mt-2 flex justify-between px-2">
        {data.map((item, index) => (
          <div key={index} className="text-xs text-muted-foreground truncate text-center flex-1">
            {item.name}
          </div>
        ))}
      </div>
    </div>
  )
}

