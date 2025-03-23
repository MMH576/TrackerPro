"use client"

import { useMemo, useRef, useEffect, useState } from "react"
import { motion } from "framer-motion"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface HeatmapChartProps {
  data?: { date: string; value: number }[]
  height: number
  showMonthLabels?: boolean
  year?: number
}

export function HeatmapChart({ 
  data = [], 
  height,
  showMonthLabels = false,
  year = new Date().getFullYear()
}: HeatmapChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);
  
  // Generate full year of dates
  const allDates = useMemo(() => {
    // Start from January 1st of the specified year
    const startDate = new Date(year, 0, 1)
    const endDate = new Date(year, 11, 31)
    
    const result: { date: string; value: number }[] = []
    const current = new Date(startDate)
    
    while (current <= endDate) {
      const dateString = current.toISOString().split("T")[0]
      
      // Check if this date has a value in data
      const matchingDate = data.find(d => d.date === dateString)
      
      result.push({
        date: dateString,
        value: matchingDate ? matchingDate.value : 0
      })
      
      current.setDate(current.getDate() + 1)
    }
    
    return result
  }, [data, year])
  
  // Organize dates by week and month for display
  const organizedData = useMemo(() => {
    const weeks: { date: string; value: number }[][] = []
    let currentWeek: { date: string; value: number }[] = []
    
    // Get the day of week for January 1st (0 = Sunday, 6 = Saturday)
    const firstDayOfYear = new Date(year, 0, 1).getDay()
    
    // Add empty cells for days before January 1st
    for (let i = 0; i < firstDayOfYear; i++) {
      currentWeek.push({ date: "", value: -1 }) // -1 indicates empty cell
    }
    
    // Add all dates
    allDates.forEach((day, index) => {
      currentWeek.push(day)
      
      const dayOfWeek = (firstDayOfYear + index) % 7
      
      // Start a new week after Saturday
      if (dayOfWeek === 6) {
        weeks.push(currentWeek)
        currentWeek = []
      }
    })
    
    // Add the last partial week if needed
    if (currentWeek.length > 0) {
      // Fill the last week with empty cells
      while (currentWeek.length < 7) {
        currentWeek.push({ date: "", value: -1 })
      }
      weeks.push(currentWeek)
    }
    
    return weeks
  }, [allDates, year])
  
  // Get month labels with accurate positions based on actual month start
  const monthLabels = useMemo(() => {
    if (!showMonthLabels) return [];
    
    const months: { name: string; weekIndex: number }[] = []
    
    // Find the first day of each month in the organized data
    for (let month = 0; month < 12; month++) {
      const firstDayOfMonth = new Date(year, month, 1).toISOString().split('T')[0];
      
      // Find which week contains the first day of the month
      let weekIndex = -1;
      for (let i = 0; i < organizedData.length; i++) {
        const week = organizedData[i];
        if (week.some(day => day.date === firstDayOfMonth)) {
          weekIndex = i;
          break;
        }
      }
      
      if (weekIndex !== -1) {
        months.push({
          name: new Date(year, month, 1).toLocaleDateString('en-US', { month: 'short' }),
          weekIndex
        });
      }
    }
    
    return months;
  }, [organizedData, showMonthLabels, year]);
  
  // Calculate cell size based on container dimensions and number of weeks
  const cellSize = useMemo(() => {
    if (containerWidth === 0) return 12; // Default size
    
    // Total number of weeks in the year (typically 52-53)
    const weeksCount = organizedData.length;
    
    // Calculate gap space
    const gapSpace = (weeksCount - 1) * 2; // 2px gap between weeks
    
    // Calculate base on available width (minus padding and gaps)
    const cellWidth = Math.floor((containerWidth - gapSpace - 8) / weeksCount); // 8px for padding
    
    // Calculate based on number of rows (7 days per week)
    const cellHeight = Math.floor(height / 7) - 1; // Account for gap
    
    // Use the smaller of width or height to keep cells square
    const size = Math.min(cellWidth, cellHeight);
    
    // Constrain to reasonable bounds
    return Math.max(Math.min(size, 16), 8);
  }, [containerWidth, height, organizedData.length]);
  
  // Calculate total width for positioning elements
  const totalWidth = useMemo(() => {
    const weeksCount = organizedData.length;
    return weeksCount * (cellSize + 2) + 4; // Include gaps and padding
  }, [organizedData.length, cellSize]);
  
  // Setup resize observer to track container width
  useEffect(() => {
    if (!containerRef.current) return;
    
    const updateSize = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.offsetWidth);
      }
    };
    
    // Initial size calculation
    updateSize();
    
    // Set up resize observer
    const observer = new ResizeObserver(updateSize);
    observer.observe(containerRef.current);
    
    return () => {
      if (containerRef.current) {
        observer.unobserve(containerRef.current);
      }
    };
  }, []);
  
  // Get color based on value
  const getColorForValue = (value: number) => {
    if (value < 0) return 'transparent' // Empty cell
    if (value === 0) return 'bg-gray-200 dark:bg-gray-800' // Empty (no activity)
    if (value === 1) return 'bg-emerald-200 dark:bg-emerald-900' // 1 habit
    if (value === 2) return 'bg-emerald-300 dark:bg-emerald-700' // 2 habits
    if (value === 3) return 'bg-emerald-400 dark:bg-emerald-600' // 3 habits
    return 'bg-emerald-500' // 4+ habits
  }
  
  // Format tooltip text with proper pluralization
  const formatTooltipText = (date: string, value: number) => {
    const dateObj = new Date(date);
    const formattedDate = dateObj.toLocaleDateString('en-US', { 
      month: 'long',
      day: 'numeric'
    });
    
    // Use exact habit count
    const habitText = value === 1
      ? '1 habit completed'
      : value > 0 
        ? `${value} habits completed` 
        : 'No habits completed';
    
    return `${habitText} on ${formattedDate}${dateObj.getFullYear() !== year ? `, ${dateObj.getFullYear()}` : ''}.`;
  };
  
  return (
    <TooltipProvider>
      <div className="w-full h-full flex flex-col" style={{ height }} ref={containerRef}>
        {/* Month labels row */}
        {showMonthLabels && (
          <div className="w-full h-6 relative mb-1 px-2">
            {monthLabels.map((month, idx) => {
              // Calculate the exact position of this month's label
              const position = (month.weekIndex * (cellSize + 2) + 2) / totalWidth;
              
              return (
                <div 
                  key={idx} 
                  className="absolute text-xs text-muted-foreground font-medium" 
                  style={{ 
                    left: `${position * 100}%`,
                    transform: 'translateX(-25%)' // Offset to align with first day
                  }}
                >
                  {month.name}
                </div>
              );
            })}
          </div>
        )}
        
        {/* Main heatmap container */}
        <div className="flex-1 w-full overflow-hidden">
          <div 
            className="flex gap-[2px] min-h-full w-full justify-between px-2"
            style={{ 
              minWidth: `${organizedData.length * (cellSize + 2)}px`,
              maxWidth: '100%'
            }}
          >
            {/* Heatmap grid */}
            {organizedData.map((week, weekIndex) => (
              <motion.div 
                key={weekIndex}
                className="flex flex-col gap-[2px]"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: weekIndex * 0.002 }}
              >
                {week.map((day, dayIndex) => (
                  <Tooltip key={dayIndex}>
                    <TooltipTrigger asChild>
                      <div
                        className={`rounded-sm ${getColorForValue(day.value)} transition-all duration-200 hover:scale-110 hover:z-10 ${day.value >= 0 ? 'cursor-pointer' : ''}`}
                        style={{
                          width: cellSize,
                          height: cellSize,
                          opacity: day.value < 0 ? 0 : 1, // Hide empty cells
                        }}
                      ></div>
                    </TooltipTrigger>
                    {day.date && (
                      <TooltipContent side="top" className="text-xs p-2">
                        {formatTooltipText(day.date, day.value)}
                      </TooltipContent>
                    )}
                  </Tooltip>
                ))}
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}

