"use client"

import type React from "react"

interface ChartProps {
  data: any[]
  categories: string[]
  index: string
  colors: string[]
  valueFormatter?: (value: number) => string
  className?: string
  yAxisWidth?: number
}

export const BarChart: React.FC<ChartProps> = ({ data, categories, index, colors, valueFormatter, className }) => {
  return (
    <div className={className}>
      {/* Placeholder for BarChart implementation */}
      <div>BarChart - {index}</div>
      <pre>{JSON.stringify(data, null, 2)}</pre>
    </div>
  )
}

export const LineChart: React.FC<ChartProps> = ({
  data,
  categories,
  index,
  colors,
  valueFormatter,
  className,
  yAxisWidth,
}) => {
  return (
    <div className={className}>
      {/* Placeholder for LineChart implementation */}
      <div>LineChart - {index}</div>
      <pre>{JSON.stringify(data, null, 2)}</pre>
    </div>
  )
}

