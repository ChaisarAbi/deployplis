"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { AlertTriangle, TrendingUp, Package, Target, Filter } from "lucide-react"
import { useQuery } from "react-query"
import { predictionAPI } from "@/lib/api"

interface PredictionData {
  id: number
  store_id: number
  dept_id: number
  predicted_sales: number
  actual_sales: number
  accuracy: number
  abc_class: string
  xyz_class: string
  created_at: string
}

interface DepartmentInsight {
  dept_id: number
  store_id: number
  abc_class: string
  xyz_class: string
  predicted_sales: number
  actual_sales: number
  accuracy: number
  risk_level: "low" | "medium" | "high"
  recommendation: string
}

export function ProductInsights() {
  const [selectedStore, setSelectedStore] = useState("all")
  const [selectedRisk, setSelectedRisk] = useState("all")

  // Fetch predictions data
  const { data: predictions = [], isLoading } = useQuery("predictions-insights", () => predictionAPI.getAll(), {
    retry: 1,
    refetchOnWindowFocus: false,
  })

  // Type-safe predictions
  const typedPredictions = predictions as PredictionData[]

  // Transform predictions into department insights
  const departmentInsights: DepartmentInsight[] = typedPredictions.map((pred) => {
    const abcClass = pred.abc_class || "C"
    const xyzClass = pred.xyz_class || "Z"

    // Determine risk level based on ABC-XYZ classification
    let riskLevel: "low" | "medium" | "high" = "medium"
    const classification = `${abcClass}${xyzClass}`

    if (["AX", "AY"].includes(classification)) riskLevel = "low"
    else if (["AZ", "BX", "BY"].includes(classification)) riskLevel = "medium"
    else riskLevel = "high"

    // Generate recommendations
    let recommendation = ""
    switch (classification) {
      case "AX":
        recommendation = "Prioritas tinggi - Stok optimal, prediksi akurat"
        break
      case "AY":
        recommendation = "Monitor ketat - Penjualan tinggi, variabilitas sedang"
        break
      case "AZ":
        recommendation = "Hati-hati - Penjualan tinggi tapi tidak dapat diprediksi"
        break
      case "BX":
        recommendation = "Stabil - Penjualan sedang, prediksi dapat diandalkan"
        break
      case "BY":
        recommendation = "Review berkala - Penjualan dan prediksi sedang"
        break
      case "BZ":
        recommendation = "Evaluasi - Penjualan sedang, sulit diprediksi"
        break
      case "CX":
        recommendation = "Efisiensi - Penjualan rendah tapi stabil"
        break
      case "CY":
        recommendation = "Optimasi - Penjualan rendah, variabilitas sedang"
        break
      case "CZ":
        recommendation = "Pertimbangkan penghentian - Penjualan rendah, tidak dapat diprediksi"
        break
      default:
        recommendation = "Perlu analisis lebih lanjut"
    }

    return {
      dept_id: pred.dept_id,
      store_id: pred.store_id,
      abc_class: abcClass,
      xyz_class: xyzClass,
      predicted_sales: pred.predicted_sales || 0,
      actual_sales: pred.actual_sales || 0,
      accuracy: pred.accuracy || 0,
      risk_level: riskLevel,
      recommendation,
    }
  })

  // Filter insights
  const filteredInsights = departmentInsights.filter((insight) => {
    const matchesStore = selectedStore === "all" || insight.store_id.toString() === selectedStore
    const matchesRisk = selectedRisk === "all" || insight.risk_level === selectedRisk
    return matchesStore && matchesRisk
  })

  // Calculate statistics
  const stats = {
    totalDepartments: departmentInsights.length,
    highRisk: departmentInsights.filter((d) => d.risk_level === "high").length,
    mediumRisk: departmentInsights.filter((d) => d.risk_level === "medium").length,
    lowRisk: departmentInsights.filter((d) => d.risk_level === "low").length,
    avgAccuracy:
      departmentInsights.length > 0
        ? departmentInsights.reduce((acc, d) => acc + d.accuracy, 0) / departmentInsights.length
        : 0,
  }

  // ABC-XYZ distribution
  const abcDistribution = {
    A: departmentInsights.filter((d) => d.abc_class === "A").length,
    B: departmentInsights.filter((d) => d.abc_class === "B").length,
    C: departmentInsights.filter((d) => d.abc_class === "C").length,
  }

  const xyzDistribution = {
    X: departmentInsights.filter((d) => d.xyz_class === "X").length,
    Y: departmentInsights.filter((d) => d.xyz_class === "Y").length,
    Z: departmentInsights.filter((d) => d.xyz_class === "Z").length,
  }

  // Get unique stores for filter
  const uniqueStores = [...new Set(departmentInsights.map((d) => d.store_id))].sort((a, b) => a - b)

  const getRiskBadge = (risk: string) => {
    switch (risk) {
      case "low":
        return <Badge className="bg-green-600">Rendah</Badge>
      case "medium":
        return <Badge className="bg-yellow-600">Sedang</Badge>
      case "high":
        return <Badge variant="destructive">Tinggi</Badge>
      default:
        return <Badge variant="secondary">N/A</Badge>
    }
  }

  const getClassificationBadge = (abc: string, xyz: string) => {
    const combined = `${abc}${xyz}`
    const colors: Record<string, string> = {
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

    return <Badge className={`${colors[combined] || "bg-gray-600"} text-white`}>{combined}</Badge>
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="text-center py-8">Memuat wawasan departemen...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Summary Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Departemen</CardTitle>
            <Package className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalDepartments}</div>
            <p className="text-xs text-muted-foreground">Departemen dianalisis</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Risiko Tinggi</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.highRisk}</div>
            <p className="text-xs text-muted-foreground">Perlu perhatian khusus</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Akurasi Rata-rata</CardTitle>
            <Target className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.avgAccuracy.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">Performa prediksi</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Risiko Rendah</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.lowRisk}</div>
            <p className="text-xs text-muted-foreground">Departemen stabil</p>
          </CardContent>
        </Card>
      </div>

      {/* ABC-XYZ Distribution */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Distribusi ABC (Nilai Penjualan)</CardTitle>
            <CardDescription>Klasifikasi berdasarkan kontribusi penjualan</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Kelas A (Tinggi)</span>
                <span>{abcDistribution.A} departemen</span>
              </div>
              <Progress value={(abcDistribution.A / stats.totalDepartments) * 100} className="h-2" />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Kelas B (Sedang)</span>
                <span>{abcDistribution.B} departemen</span>
              </div>
              <Progress value={(abcDistribution.B / stats.totalDepartments) * 100} className="h-2" />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Kelas C (Rendah)</span>
                <span>{abcDistribution.C} departemen</span>
              </div>
              <Progress value={(abcDistribution.C / stats.totalDepartments) * 100} className="h-2" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Distribusi XYZ (Variabilitas)</CardTitle>
            <CardDescription>Klasifikasi berdasarkan konsistensi penjualan</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Kelas X (Stabil)</span>
                <span>{xyzDistribution.X} departemen</span>
              </div>
              <Progress value={(xyzDistribution.X / stats.totalDepartments) * 100} className="h-2" />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Kelas Y (Variabel)</span>
                <span>{xyzDistribution.Y} departemen</span>
              </div>
              <Progress value={(xyzDistribution.Y / stats.totalDepartments) * 100} className="h-2" />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Kelas Z (Tidak Stabil)</span>
                <span>{xyzDistribution.Z} departemen</span>
              </div>
              <Progress value={(xyzDistribution.Z / stats.totalDepartments) * 100} className="h-2" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Filter className="w-5 h-5" />
            <span>Filter Wawasan</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <Select value={selectedStore} onValueChange={setSelectedStore}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Filter Toko" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Toko</SelectItem>
                {uniqueStores.map((store) => (
                  <SelectItem key={`store-filter-${store}`} value={store.toString()}>
                    Toko {store}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedRisk} onValueChange={setSelectedRisk}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Filter Risiko" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Risiko</SelectItem>
                <SelectItem value="low">Risiko Rendah</SelectItem>
                <SelectItem value="medium">Risiko Sedang</SelectItem>
                <SelectItem value="high">Risiko Tinggi</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Department Insights Table */}
      <Card>
        <CardHeader>
          <CardTitle>Wawasan Departemen</CardTitle>
          <CardDescription>
            Menampilkan {filteredInsights.length} dari {departmentInsights.length} departemen
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredInsights.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Toko</TableHead>
                  <TableHead>Departemen</TableHead>
                  <TableHead>Klasifikasi</TableHead>
                  <TableHead>Prediksi</TableHead>
                  <TableHead>Aktual</TableHead>
                  <TableHead>Akurasi</TableHead>
                  <TableHead>Risiko</TableHead>
                  <TableHead>Rekomendasi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInsights.map((insight, index) => (
                  <TableRow key={`insight-${insight.store_id}-${insight.dept_id}-${index}`}>
                    <TableCell>
                      <Badge variant="outline">Toko {insight.store_id}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">Dept {insight.dept_id}</Badge>
                    </TableCell>
                    <TableCell>{getClassificationBadge(insight.abc_class, insight.xyz_class)}</TableCell>
                    <TableCell>Rp.{insight.predicted_sales.toLocaleString()}</TableCell>
                    <TableCell>Rp.{insight.actual_sales.toLocaleString()}</TableCell>
                    <TableCell>{insight.accuracy.toFixed(1)}%</TableCell>
                    <TableCell>{getRiskBadge(insight.risk_level)}</TableCell>
                    <TableCell className="max-w-xs">
                      <div className="text-sm text-gray-600 truncate" title={insight.recommendation}>
                        {insight.recommendation}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-gray-500">
              Tidak ada wawasan yang sesuai dengan filter yang dipilih
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
