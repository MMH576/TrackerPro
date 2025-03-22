interface LineChartDesignProps {
  height?: number
}

export function LineChartDesign({ height = 200 }: LineChartDesignProps) {
  return (
    <div
      className="w-full bg-gradient-to-b from-primary/20 to-background rounded-md overflow-hidden"
      style={{ height }}
    >
      <div className="h-full w-full flex items-end">
        <div className="flex-1 h-[30%] border-t border-primary/30"></div>
        <div className="flex-1 h-[45%] border-t border-primary/30"></div>
        <div className="flex-1 h-[60%] border-t border-primary/30"></div>
        <div className="flex-1 h-[80%] border-t border-primary/30"></div>
        <div className="flex-1 h-[70%] border-t border-primary/30"></div>
        <div className="flex-1 h-[90%] border-t border-primary/30"></div>
        <div className="flex-1 h-[75%] border-t border-primary/30"></div>
      </div>
    </div>
  )
}

