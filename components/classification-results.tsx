"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { BarChart3, Download, Eye, Grid3X3, TrendingUp } from "lucide-react"

interface Product {
  id: string
  name: string
  abcClass: "A" | "B" | "C"
  xyzClass: "X" | "Y" | "Z"
  salesValue: number
  salesVolume: number
  variability: number
}

interface ClassificationSummary {
  category: string
  count: number
  percentage: number
  description: string
}

export function ClassificationResults() {
  const [selectedView, setSelectedView] = useState<"table" | "heatmap">("table")

  const [products] = useState<Product[]>([
    {
      id: "1",
      name: "Product Alpha",
      abcClass: "A",
      xyzClass: "X",
      salesValue: 125000,
      salesVolume: 850,
      variability: 0.15,
    },
    {
      id: "2",
      name: "Product Beta",
      abcClass: "A",
      xyzClass: "Y",
      salesValue: 98000,
      salesVolume: 720,
      variability: 0.35,
    },
    {
      id: "3",
      name: "Product Gamma",
      abcClass: "B",
      xyzClass: "X",
      salesValue: 65000,
      salesVolume: 450,
      variability: 0.18,
    },
    {
      id: "4",
      name: "Product Delta",
      abcClass: "B",
      xyzClass: "Z",
      salesValue: 45000,
      salesVolume: 320,
      variability: 0.65,
    },
    {
      id: "5",
      name: "Product Epsilon",
      abcClass: "C",
      xyzClass: "Y",
      salesValue: 25000,
      salesVolume: 180,
      variability: 0.42,
    },
  ])

  const classificationSummary: ClassificationSummary[] = [
    { category: "AX", count: 45, percentage: 15.2, description: "High value, stable demand" },
    { category: "AY", count: 32, percentage: 10.8, description: "High value, variable demand" },
    { category: "AZ", count: 18, percentage: 6.1, description: "High value, irregular demand" },
    { category: "BX", count: 67, percentage: 22.6, description: "Medium value, stable demand" },
    { category: "BY", count: 54, percentage: 18.2, description: "Medium value, variable demand" },
    { category: "BZ", count: 28, percentage: 9.4, description: "Medium value, irregular demand" },
    { category: "CX", count: 23, percentage: 7.8, description: "Low value, stable demand" },
    { category: "CY", count: 19, percentage: 6.4, description: "Low value, variable demand" },
    { category: "CZ", count: 10, percentage: 3.4, description: "Low value, irregular demand" },
  ]

  const getClassBadge = (abcClass: string, xyzClass: string) => {
    const combined = `${abcClass}${xyzClass}`
    const colors = {
      AX: "bg-green-600",
      AY: "bg-green-500",
      AZ: "bg-green-400",
      BX: "bg-yellow-600",
      BY: "bg-yellow-500",
      BZ: "bg-yellow-400",
      CX: "bg-red-600",
      CY: "bg-red-500",
      CZ: "bg-red-400",
    }

    return <Badge className={`${colors[combined as keyof typeof colors]} text-white`}>{combined}</Badge>
  }

  const HeatmapView = () => {
    const heatmapData = [
      ["", "X (Stable)", "Y (Variable)", "Z (Irregular)"],
      ["A (High)", "45", "32", "18"],
      ["B (Medium)", "67", "54", "28"],
      ["C (Low)", "23", "19", "10"],
    ]

    const getCellColor = (row: number, col: number, value: string) => {
      if (row === 0 || col === 0) return "bg-gray-100 font-medium"

      const numValue = Number.parseInt(value)
      if (numValue >= 50) return "bg-green-500 text-white"
      if (numValue >= 30) return "bg-yellow-500 text-white"
      if (numValue >= 20) return "bg-orange-500 text-white"
      return "bg-red-500 text-white"
    }

    return (
      <div className="grid grid-cols-4 gap-2 max-w-md">
        {heatmapData.map((row, rowIndex) =>
          row.map((cell, colIndex) => (
            <div
              key={`${rowIndex}-${colIndex}`}
              className={`p-3 text-center text-sm rounded ${getCellColor(rowIndex, colIndex, cell)}`}
            >
              {cell}
            </div>
          )),
        )}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">ABC-XYZ Classification Results</h2>
          <p className="text-gray-600">Product classification based on value and demand variability</p>
        </div>

        <div className="flex space-x-2">
          <Button
            variant={selectedView === "table" ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedView("table")}
          >
            <BarChart3 className="w-4 h-4 mr-2" />
            Table View
          </Button>
          <Button
            variant={selectedView === "heatmap" ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedView("heatmap")}
          >
            <Grid3X3 className="w-4 h-4 mr-2" />
            Heatmap
          </Button>
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Classification Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <TrendingUp className="w-5 h-5" />
            <span>Classification Summary</span>
          </CardTitle>
          <CardDescription>Distribution of products across ABC-XYZ categories</CardDescription>
        </CardHeader>
        <CardContent>
          {selectedView === "heatmap" ? (
            <div className="space-y-4">
              <HeatmapView />
              <p className="text-sm text-gray-600">
                Heatmap shows product count in each category. Darker colors indicate higher counts.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {classificationSummary.map((item) => (
                <div key={item.category} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-lg">{item.category}</span>
                    <Badge variant="outline">{item.count} products</Badge>
                  </div>
                  <div className="text-2xl font-bold text-blue-600 mb-1">{item.percentage}%</div>
                  <p className="text-sm text-gray-600">{item.description}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Product Classification Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Eye className="w-5 h-5" />
            <span>Product Classifications</span>
          </CardTitle>
          <CardDescription>Detailed view of individual product classifications</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product Name</TableHead>
                <TableHead>Classification</TableHead>
                <TableHead>Sales Value</TableHead>
                <TableHead>Sales Volume</TableHead>
                <TableHead>Variability</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((product) => (
                <TableRow key={product.id}>
                  <TableCell className="font-medium">{product.name}</TableCell>
                  <TableCell>{getClassBadge(product.abcClass, product.xyzClass)}</TableCell>
                  <TableCell>Rp.{product.salesValue.toLocaleString()}</TableCell>
                  <TableCell>{product.salesVolume.toLocaleString()}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        product.variability < 0.2 ? "default" : product.variability < 0.5 ? "secondary" : "destructive"
                      }
                    >
                      {(product.variability * 100).toFixed(1)}%
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button size="sm" variant="outline">
                      <Eye className="w-3 h-3" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
