"use client"

import dynamic from "next/dynamic"
import { useEffect, useState } from "react"

// Dynamically import Plotly to avoid SSR issues
const Plot = dynamic(() => import("react-plotly.js"), { ssr: false })

interface PlotlyChartProps {
  data: any
  title?: string
  height?: number
}

export function PlotlyChart({ data, title, height = 400 }: PlotlyChartProps) {
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  if (!isClient) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-100 rounded-lg">
        <div className="text-gray-500">Memuat grafik...</div>
      </div>
    )
  }

  return (
    <div className="w-full">
      <Plot
        data={data.data}
        layout={{
          ...data.layout,
          title: title || data.layout?.title,
          height: height,
          autosize: true,
          margin: { l: 50, r: 50, t: 50, b: 50 },
        }}
        config={{
          responsive: true,
          displayModeBar: true,
          displaylogo: false,
          modeBarButtonsToRemove: ["pan2d", "lasso2d", "select2d"],
        }}
        style={{ width: "100%", height: `${height}px` }}
      />
    </div>
  )
}
