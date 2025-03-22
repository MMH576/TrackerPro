"use client"

import { useEffect, useRef } from "react"
import { motion } from "framer-motion"

interface LineChartProps {
  data: { name: string; value: number }[]
  height: number
  color?: string
}

export function LineChart({ data, height, color = "hsl(var(--primary))" }: LineChartProps) {
  const maxValue = Math.max(...data.map((item) => item.value), 1)
  const chartRef = useRef<HTMLDivElement>(null)

  // Add tooltip functionality
  useEffect(() => {
    const chart = chartRef.current
    if (!chart) return

    const points = chart.querySelectorAll(".point")

    points.forEach((point) => {
      point.addEventListener("mouseenter", (e) => {
        const target = e.currentTarget as HTMLElement
        const tooltip = target.querySelector(".tooltip") as HTMLElement
        if (tooltip) {
          tooltip.style.opacity = "1"
        }
      })

      point.addEventListener("mouseleave", (e) => {
        const target = e.currentTarget as HTMLElement
        const tooltip = target.querySelector(".tooltip") as HTMLElement
        if (tooltip) {
          tooltip.style.opacity = "0"
        }
      })
    })

    return () => {
      points.forEach((point) => {
        point.removeEventListener("mouseenter", () => {})
        point.removeEventListener("mouseleave", () => {})
      })
    }
  }, [data])

  // Create SVG path for the line
  const createPath = () => {
    if (data.length < 2) return ""

    const width = 100 / (data.length - 1)

    return data
      .map((item, index) => {
        const x = index * width
        const y = 100 - (item.value / maxValue) * 100

        return `${index === 0 ? "M" : "L"} ${x} ${y}`
      })
      .join(" ")
  }

  return (
    <div className="w-full h-full flex flex-col" style={{ height }}>
      <div className="flex-1 relative" ref={chartRef}>
        {/* Grid lines */}
        <div className="absolute inset-0 flex flex-col justify-between">
          {[0, 1, 2, 3].map((_, i) => (
            <div key={i} className="border-t border-muted h-0"></div>
          ))}
        </div>

        {/* Line chart */}
        <div className="absolute inset-0">
          <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
            {/* Line */}
            <motion.path
              d={createPath()}
              fill="none"
              stroke={color}
              strokeWidth="2"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ duration: 1 }}
            />

            {/* Area under the line */}
            <motion.path
              d={`${createPath()} L 100 100 L 0 100 Z`}
              fill={color}
              opacity="0.1"
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.1 }}
              transition={{ duration: 1, delay: 0.5 }}
            />
          </svg>

          {/* Data points */}
          {data.map((item, index) => {
            const x = `${index * (100 / (data.length - 1))}%`
            const y = `${100 - (item.value / maxValue) * 100}%`

            return (
              <motion.div
                key={index}
                className="absolute w-3 h-3 rounded-full bg-background border-2 transform -translate-x-1/2 -translate-y-1/2 point cursor-pointer"
                style={{
                  left: x,
                  top: y,
                  borderColor: color,
                }}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.3, delay: 0.8 + index * 0.05 }}
              >
                <div className="tooltip absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-background border px-2 py-1 rounded text-xs opacity-0 transition-opacity pointer-events-none whitespace-nowrap z-10">
                  {item.name}: {item.value}
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>

      {/* X-axis labels */}
      <div className="h-6 mt-2 flex justify-between px-2">
        {data.length > 10
          ? [0, Math.floor(data.length / 2), data.length - 1].map((index) => (
              <div
                key={index}
                className="text-xs text-muted-foreground"
                style={{
                  position: "absolute",
                  left: `${index === 0 ? 0 : index === data.length - 1 ? "auto" : "50%"}`,
                  right: index === data.length - 1 ? 0 : "auto",
                  transform: index === Math.floor(data.length / 2) ? "translateX(-50%)" : "none",
                }}
              >
                {data[index].name}
              </div>
            ))
          : data.map((item, index) => (
              <div key={index} className="text-xs text-muted-foreground truncate text-center flex-1">
                {item.name}
              </div>
            ))}
      </div>
    </div>
  )
}

