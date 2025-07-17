"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { BarChart3, TrendingUp, Grid3X3 } from "lucide-react"
import { PlotlyChart } from "@/components/charts/PlotlyChart"
import { visualizationAPI, datasetAPI } from "@/lib/api"
import { useQuery } from "react-query"

export function VisualizationDashboard() {
  const [selectedDataset, setSelectedDataset] = useState<number | null>(null)
  const [activeChart, setActiveChart] = useState("sales-trend")

  // Get datasets
  const { data: datasets = [] } = useQuery("datasets", datasetAPI.getAll)

  // Get chart data
  const { data: salesTrendData, isLoading: salesTrendLoading } = useQuery(
    ["sales-trend", selectedDataset],
    () => visualizationAPI.getSalesTrend(selectedDataset!),
    { enabled: !!selectedDataset && activeChart === "sales-trend" },
  )

  const { data: heatmapData, isLoading: heatmapLoading } = useQuery(
    ["abc-xyz-heatmap", selectedDataset],
    () => visualizationAPI.getAbcXyzHeatmap(selectedDataset!),
    { enabled: !!selectedDataset && activeChart === "heatmap" },
  )

  const chartButtons = [
    { id: "sales-trend", label: "Tren Penjualan", icon: TrendingUp },
    { id: "heatmap", label: "Heatmap ABC-XYZ", icon: Grid3X3 },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Dashboard Visualisasi</h2>
        <p className="text-gray-600">Analisis visual data penjualan</p>
      </div>

      {/* Dataset Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Pilih Dataset</CardTitle>
          <CardDescription>Pilih dataset untuk divisualisasikan</CardDescription>
        </CardHeader>
        <CardContent>
          <select
            value={selectedDataset || ""}
            onChange={(e) => setSelectedDataset(e.target.value ? Number.parseInt(e.target.value) : null)}
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Pilih dataset...</option>
            {datasets.map((dataset: any) => (
              <option key={dataset.id} value={dataset.id}>
                {dataset.name} - {dataset.store_id} ({dataset.records_count} records)
              </option>
            ))}
          </select>
        </CardContent>
      </Card>

      {selectedDataset && (
        <>
          {/* Chart Type Selection */}
          <div className="flex space-x-2 bg-gray-100 p-1 rounded-lg w-fit">
            {chartButtons.map((button) => (
              <Button
                key={button.id}
                variant={activeChart === button.id ? "default" : "ghost"}
                size="sm"
                onClick={() => setActiveChart(button.id)}
              >
                <button.icon className="w-4 h-4 mr-2" />
                {button.label}
              </Button>
            ))}
          </div>

          {/* Chart Display */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <BarChart3 className="w-5 h-5" />
                <span>
                  {activeChart === "sales-trend" && "Tren Penjualan"}
                  {activeChart === "heatmap" && "Heatmap Klasifikasi ABC-XYZ"}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {activeChart === "sales-trend" && (
                <>
                  {salesTrendLoading ? (
                    <div className="flex items-center justify-center h-64 bg-gray-100 rounded-lg">
                      <div className="text-gray-500">Memuat grafik tren penjualan...</div>
                    </div>
                  ) : salesTrendData ? (
                    <PlotlyChart data={salesTrendData} title="Tren Penjualan Walmart" height={500} />
                  ) : (
                    <div className="text-center py-8 text-gray-500">Tidak ada data untuk ditampilkan</div>
                  )}
                </>
              )}

              {activeChart === "heatmap" && (
                <>
                  {heatmapLoading ? (
                    <div className="flex items-center justify-center h-64 bg-gray-100 rounded-lg">
                      <div className="text-gray-500">Memuat heatmap ABC-XYZ...</div>
                    </div>
                  ) : heatmapData ? (
                    <PlotlyChart data={heatmapData} title="Heatmap Klasifikasi ABC-XYZ" height={400} />
                  ) : (
                    <div className="text-center py-8 text-gray-500">Tidak ada data untuk ditampilkan</div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
