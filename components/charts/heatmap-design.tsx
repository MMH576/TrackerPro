interface HeatmapDesignProps {
  height?: number
}

export function HeatmapDesign({ height = 200 }: HeatmapDesignProps) {
  // Generate a grid of cells with varying opacity to simulate a heatmap
  const generateHeatmapCells = () => {
    const cells = []
    const rows = 7 // 7 days of the week
    const cols = Math.floor(height / 20) // Approximate number of weeks based on height

    for (let i = 0; i < rows; i++) {
      for (let j = 0; j < cols; j++) {
        // Random opacity between 0.1 and 1
        const opacity = Math.random() * 0.9 + 0.1
        cells.push(<div key={`${i}-${j}`} className="w-4 h-4 rounded-sm m-1 bg-primary" style={{ opacity }} />)
      }
    }

    return cells
  }

  return (
    <div className="w-full overflow-hidden" style={{ height }}>
      <div className="flex flex-wrap">{generateHeatmapCells()}</div>
    </div>
  )
}

