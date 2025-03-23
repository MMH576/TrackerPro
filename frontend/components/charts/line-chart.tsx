"use client"

import { useRef } from "react"
import { motion } from "framer-motion"

interface LineChartProps {
  data: { name: string; value: number }[]
  height: number
  color?: string
  showTooltip?: boolean
  multiSeries?: { name: string; data: { name: string; value: number }[]; color: string }[]
  lineWidth?: number
  dateDisplayCount?: number // Number of dates to display on x-axis
  showCurrentYearOnly?: boolean // Option to hide years in labels for current year
}

export function LineChart({ 
  data, 
  height, 
  color = "hsl(var(--primary))", 
  showTooltip = false,
  multiSeries,
  lineWidth = 1,
  dateDisplayCount = 4, // Default to 4 dates
  showCurrentYearOnly = true // Default to GitHub-style (current year implicit)
}: LineChartProps) {
  // Clean input data to remove invalid entries
  const cleanData = data.filter(item => 
    item && item.name && !isNaN(item.value)
  );
  
  // Ensure we have data to display
  const hasValidData = cleanData.length > 0;
  
  const chartRef = useRef<HTMLDivElement>(null)

  // Find the maximum value across all series
  const allData = multiSeries 
    ? [...cleanData, ...multiSeries.flatMap(series => series.data)]
    : cleanData
  
  const maxValue = Math.max(...allData.map((item) => item.value), 1)

  // Ensure we have at least 2 points even with sparse data
  const ensureMinimumPoints = (lineData: { name: string; value: number }[]) => {
    if (lineData.length < 2) {
      // Create a duplicate point if only one point exists
      if (lineData.length === 1) {
        return [
          { ...lineData[0] },
          { ...lineData[0], name: lineData[0].name }
        ];
      }
      // Return empty path data for no points
      return [];
    }
    return lineData;
  };

  // Create SVG path for a line - using precise calculations for consistent line width
  const createPath = (lineData: { name: string; value: number }[]) => {
    if (lineData.length < 2) return ""

    // Ensure we have enough points
    const dataToUse = ensureMinimumPoints(lineData);
    if (dataToUse.length < 2) return "";

    const width = 100 / (dataToUse.length - 1)

    // Create a smooth curve using cubic bezier - with precise control point placement
    let path = ""
    
    // First ensure all data points have valid values to prevent gaps
    const safeData = dataToUse.map(item => ({
      ...item,
      value: isNaN(item.value) ? 0 : item.value // Convert NaN to 0
    }))
    
    safeData.forEach((item, index) => {
      const x = index * width
      const y = 100 - (Math.max(0, item.value) / maxValue) * 100 // Ensure y is never negative
      
      if (index === 0) {
        path += `M ${x.toFixed(3)} ${y.toFixed(3)}`
      } else {
        // Calculate control points for curve with fixed tension for consistency
        const prevX = (index - 1) * width
        const prevY = 100 - (Math.max(0, safeData[index - 1].value) / maxValue) * 100
        
        // Use a slightly lower tension factor (0.25) for smoother, less extreme curves
        const tension = 0.25
        const cpX1 = prevX + (x - prevX) * tension
        const cpX2 = prevX + (x - prevX) * (1 - tension)
        
        path += ` C ${cpX1.toFixed(3)} ${prevY.toFixed(3)}, ${cpX2.toFixed(3)} ${y.toFixed(3)}, ${x.toFixed(3)} ${y.toFixed(3)}`
      }
    })
    
    return path
  }

  // Prevent gaps in the data by filling in missing points
  const fillDataGaps = (lineData: { name: string; value: number }[]) => {
    if (lineData.length < 2) return lineData;

    // Create new array with filled gaps (if any dates are missing)
    const filledData = [...lineData];
    
    for (let i = 0; i < filledData.length - 1; i++) {
      // Check for gaps and fill with zero values
      const currentDate = new Date(filledData[i].name);
      const nextDate = new Date(filledData[i + 1].name);
      
      // If dates can't be parsed, skip
      if (isNaN(currentDate.getTime()) || isNaN(nextDate.getTime())) continue;
      
      // Calculate difference in days
      const diffTime = Math.abs(nextDate.getTime() - currentDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      // If gap is more than 1 day, fill with intermediate points
      if (diffDays > 1) {
        const newPoints = [];
        for (let j = 1; j < diffDays; j++) {
          const fillDate = new Date(currentDate);
          fillDate.setDate(currentDate.getDate() + j);
          const fillDateStr = fillDate.toISOString().split('T')[0];
          
          newPoints.push({
            name: fillDateStr,
            value: 0 // Fill with zero value to maintain continuity
          });
        }
        
        // Insert new points
        filledData.splice(i + 1, 0, ...newPoints);
        i += newPoints.length; // Skip the newly added points
      }
    }
    
    return filledData;
  };

  // Create unique gradient ID for each series
  const getGradientId = (index: number) => `line-gradient-${index}`

  // If we need to fill gaps, process the data
  const processedData = hasValidData ? fillDataGaps(cleanData) : [];
  const processedMultiSeries = multiSeries?.map(series => ({
    ...series,
    data: fillDataGaps(series.data)
  }));

  // If we don't have valid data, show empty state
  if (!hasValidData) {
    return (
      <div className="w-full h-full flex items-center justify-center" style={{ height }}>
        <p className="text-sm text-muted-foreground">No data available</p>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col" style={{ height }}>
      <div className="flex-1 relative" ref={chartRef}>
        {/* Grid lines - lighter and more subtle */}
        <div className="absolute inset-0 flex flex-col justify-between">
          {[0, 1, 2, 3, 4].map((_, i) => (
            <div key={i} className="border-t border-gray-100 dark:border-gray-800 h-0"></div>
          ))}
        </div>

        {/* Line chart */}
        <div className="absolute inset-0">
          <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
            {/* Define gradients */}
            <defs>
              <linearGradient id={getGradientId(-1)} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity="0.25" />
                <stop offset="100%" stopColor={color} stopOpacity="0.01" />
              </linearGradient>
              
              {processedMultiSeries && processedMultiSeries.map((series, idx) => (
                <linearGradient key={idx} id={getGradientId(idx)} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={series.color} stopOpacity="0.25" />
                  <stop offset="100%" stopColor={series.color} stopOpacity="0.01" />
                </linearGradient>
              ))}
            </defs>

            {/* Main data line and fill */}
            {!processedMultiSeries && (
              <>
                {/* Area under the line */}
                <motion.path
                  d={`${createPath(processedData)} L 100 100 L 0 100 Z`}
                  fill={`url(#${getGradientId(-1)})`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 1 }}
                />
                
                {/* Line */}
                <motion.path
                  d={createPath(processedData)}
                  fill="none"
                  stroke={color}
                  strokeWidth={lineWidth}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  vectorEffect="non-scaling-stroke" // This helps maintain consistent width
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: 1 }}
                  transition={{ duration: 1.2 }}
                />
              </>
            )}
            
            {/* Multi-series lines and fills */}
            {processedMultiSeries && processedMultiSeries.map((series, idx) => (
              <g key={idx}>
                {/* Area under the line */}
                <motion.path
                  d={`${createPath(series.data)} L 100 100 L 0 100 Z`}
                  fill={`url(#${getGradientId(idx)})`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 1, delay: idx * 0.2 }}
                />
                
                {/* Line */}
                <motion.path
                  d={createPath(series.data)}
                  fill="none"
                  stroke={series.color}
                  strokeWidth={lineWidth}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  vectorEffect="non-scaling-stroke" // This helps maintain consistent width
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: 1 }}
                  transition={{ duration: 1.2, delay: idx * 0.2 }}
                />
              </g>
            ))}
          </svg>

          {/* Only show data points if showTooltip is true */}
          {showTooltip && processedData.map((item, index) => {
            const x = `${index * (100 / (processedData.length - 1))}%`
            const y = `${100 - (item.value / maxValue) * 100}%`

            return (
              <div
                key={index}
                className="absolute w-px h-px"
                style={{
                  left: x,
                  top: y,
                }}
              >
                <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-background border px-2 py-1 rounded text-xs opacity-0 pointer-events-none whitespace-nowrap z-10 group-hover:opacity-100">
                  {item.name}: {item.value}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* X-axis labels */}
      <div className="h-6 mt-2 flex justify-between px-2">
        {getDateLabels().map((index) => {
          // Skip labels that contain test data or placeholder values
          const labelText = formatDateLabel(processedData[index].name, showCurrentYearOnly);
          if (!labelText || labelText.includes("2001") || 
              labelText.toLowerCase().includes("asd") || 
              labelText.toLowerCase().includes("dsfd")) {
            return null;
          }
          
          return (
            <div
              key={index}
              className="text-xs text-muted-foreground"
              style={{
                position: "absolute",
                left: index === 0 ? 0 : index === processedData.length - 1 ? "auto" : `${(index / (processedData.length - 1)) * 100}%`,
                right: index === processedData.length - 1 ? 0 : "auto",
                transform: index !== 0 && index !== processedData.length - 1 ? "translateX(-50%)" : "none",
              }}
            >
              {labelText}
            </div>
          );
        })}
      </div>
    </div>
  )
  
  // Helper function to determine which date labels to show
  function getDateLabels(): number[] {
    if (processedData.length <= dateDisplayCount) {
      // If we have fewer data points than requested labels, show all
      return Array.from({ length: processedData.length }, (_, i) => i)
    }
    
    // Calculate indices for evenly spaced labels
    const indices: number[] = []
    
    // Always include first and last
    indices.push(0)
    
    // Add intermediate points spaced evenly
    if (dateDisplayCount > 2) {
      const step = (processedData.length - 1) / (dateDisplayCount - 1)
      
      for (let i = 1; i < dateDisplayCount - 1; i++) {
        const index = Math.round(i * step)
        indices.push(index)
      }
    }
    
    // Add last point
    if (processedData.length > 1) {
      indices.push(processedData.length - 1)
    }
    
    // Make sure we don't have duplicates (can happen with rounding)
    return [...new Set(indices)].sort((a, b) => a - b)
  }
}

// Helper to format date labels in a clean, concise way
function formatDateLabel(dateStr: string, showCurrentYearOnly: boolean = true): string {
  // Filter out test data and placeholder dates
  if (!dateStr || 
      dateStr.length <= 3 || 
      dateStr === "asd" || 
      dateStr === "dsfd" || 
      dateStr === "asdasd" ||
      dateStr.includes("2001") || 
      dateStr.includes("Mar 8") ||
      dateStr.includes("Feb")) {
    return "";
  }
  
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) {
      // If it looks like a test date or placeholder, don't display it
      if (dateStr.includes("asd") || 
          dateStr.includes("dfs") || 
          dateStr.includes("2001") ||
          dateStr.includes("Feb") ||
          dateStr.includes("Mar")) {
        return "";
      }
      
      // Return the original string for already formatted dates
      return dateStr;
    }
    
    // Get current year
    const currentYear = new Date().getFullYear();
    const dateYear = date.getFullYear();
    
    // Skip old test data years
    if (dateYear < 2020) {
      return "";
    }
    
    // GitHub-style: only show year when it's different from current year
    if (showCurrentYearOnly && dateYear === currentYear) {
      // Only month and day for current year (like GitHub)
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } else {
      // For different years, include the year (also like GitHub)
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        year: 'numeric'
      });
    }
  } catch (e) {
    // Fallback for any parsing errors
    return "";
  }
}

