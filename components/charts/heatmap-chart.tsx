"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"

interface HeatmapChartProps {
  height: number
  data?: { date: string; value: number }[]
}

export function HeatmapChart({ height, data }: HeatmapChartProps) {
  const [heatmapData, setHeatmapData] = useState<{ date: string; value: number }[]>([])

  // Generate random data if none provided
  useEffect(() => {
    if (data) {
      setHeatmapData(data)
      return
    }

    const generateRandomData = () => {
      const today = new Date()
      const result = []

      // Generate data for the last 90 days
      for (let i = 0; i < 90; i++) {
        const date = new Date(today)
        date.setDate(date.getDate() - i)

        // Random value between 0 and 4
        const value = Math.floor(Math.random() * 5)

        result.push({
          date: date.toISOString().split("T")[0],
          value,
        })
      }

      return result
    }

    setHeatmapData(generateRandomData())
  }, [data])

  // Calculate the number of weeks to display
  const weeks = Math.ceil(heatmapData.length / 7)

  // Group data by week
  const groupedData = Array.from({ length: weeks }, (_, weekIndex) => {
    return Array.from({ length: 7 }, (_, dayIndex) => {
      const dataIndex = weekIndex * 7 + dayIndex
      return dataIndex < heatmapData.length ? heatmapData[dataIndex] : null
    })
  })

  // Get color based on value
  const getColor = (value: number) => {
    if (value === 0) return "bg-muted opacity-30"
    if (value === 1) return "bg-primary opacity-20"
    if (value === 2) return "bg-primary opacity-40"
    if (value === 3) return "bg-primary opacity-60"
    return "bg-primary opacity-80"
  }

  // Calculate cell size based on height
  const cellSize = Math.min(Math.floor(height / 9), 16) // 7 days + some padding
  const cellGap = 2

  return (
    <div className="w-full h-full overflow-hidden" style={{ height }}>
      <div className="flex flex-row-reverse gap-1 overflow-x-auto pb-2 pt-1 pl-1">
        {groupedData.map((week, weekIndex) => (
          <div key={weekIndex} className="flex flex-col gap-1">
            {week.map((day, dayIndex) => (
              <motion.div
                key={dayIndex}
                className={`rounded-sm ${day ? getColor(day.value) : "bg-muted opacity-10"}`}
                style={{
                  width: cellSize,
                  height: cellSize,
                }}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.2, delay: (weekIndex * 7 + dayIndex) * 0.005 }}
                title={day ? `${day.date}: ${day.value} activities` : ""}
              />
            ))}
          </div>
        ))}
      </div>

      <div className="flex justify-between mt-2 px-2 text-xs text-muted-foreground">
        <span>Less</span>
        <div className="flex gap-1">
          {[0, 1, 2, 3, 4].map((value) => (
            <div key={value} className={`w-3 h-3 rounded-sm ${getColor(value)}`} />
          ))}
        </div>
        <span>More</span>
      </div>
    </div>
  )
}

