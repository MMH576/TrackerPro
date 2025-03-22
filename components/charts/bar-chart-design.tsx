interface BarChartDesignProps {
  height?: number
}

export function BarChartDesign({ height = 200 }: BarChartDesignProps) {
  return (
    <div className="w-full flex items-end justify-between gap-2 px-2" style={{ height }}>
      {[40, 65, 35, 85, 55, 75, 30].map((value, index) => (
        <div key={index} className="bg-primary/80 rounded-t-md w-full" style={{ height: `${value}%` }}></div>
      ))}
    </div>
  )
}

