"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { BarChart3, TrendingUp, Download, Search, Filter, Eye, Send } from "lucide-react"
import { useQuery } from "react-query"
import { predictionAPI } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"

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

export function PredictionView() {
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStore, setFilterStore] = useState("all")
  const [filterDept, setFilterDept] = useState("all")
  const { toast } = useToast()

  // Fetch predictions data
  const {
    data: predictions = [],
    isLoading,
    error,
  } = useQuery("predictions-all", () => predictionAPI.getAll(), {
    retry: 1,
    refetchOnWindowFocus: false,
  })

  const { data: categorizedData, isLoading: categorizedLoading } = useQuery(
    "predictions-categorized",
    () => predictionAPI.getCategorized(),
    {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  )

  // Type-safe predictions array
  const typedPredictions = predictions as PredictionData[]

  // Filter predictions based on search and filters
  const filteredPredictions = typedPredictions.filter((prediction: PredictionData) => {
    const matchesSearch =
      prediction.store_id?.toString().includes(searchTerm) || prediction.dept_id?.toString().includes(searchTerm)

    const matchesStore = filterStore === "all" || prediction.store_id?.toString() === filterStore
    const matchesDept = filterDept === "all" || prediction.dept_id?.toString() === filterDept

    return matchesSearch && matchesStore && matchesDept
  })

  // Calculate summary statistics
  const summaryStats = {
    totalPredictions: typedPredictions.length,
    avgAccuracy:
      typedPredictions.length > 0
        ? typedPredictions.reduce((acc: number, pred: PredictionData) => acc + (pred.accuracy || 0), 0) /
          typedPredictions.length
        : 0,
    totalSales: typedPredictions.reduce((acc: number, pred: PredictionData) => acc + (pred.predicted_sales || 0), 0),
    uniqueStores: new Set(typedPredictions.map((p: PredictionData) => p.store_id)).size,
  }

  // Get unique stores and departments for filters
  const uniqueStores = [...new Set(typedPredictions.map((p: PredictionData) => p.store_id))].sort((a, b) => a - b)
  const uniqueDepts = [...new Set(typedPredictions.map((p: PredictionData) => p.dept_id))].sort((a, b) => a - b)

  const getAccuracyBadge = (accuracy: number | null) => {
    if (!accuracy) return <Badge variant="secondary">N/A</Badge>
    if (accuracy >= 90) return <Badge className="bg-green-600">Sangat Baik</Badge>
    if (accuracy >= 80) return <Badge className="bg-blue-600">Baik</Badge>
    if (accuracy >= 70) return <Badge className="bg-yellow-600">Cukup</Badge>
    return <Badge variant="destructive">Perlu Perbaikan</Badge>
  }

  const getCategoryBadge = (abc: string, xyz: string) => {
    const category = `${abc}-${xyz}`
    const colors: Record<string, string> = {
      "A-X": "bg-green-600",
      "A-Y": "bg-green-500",
      "A-Z": "bg-green-400",
      "B-X": "bg-yellow-600",
      "B-Y": "bg-yellow-500",
      "B-Z": "bg-yellow-400",
      "C-X": "bg-red-600",
      "C-Y": "bg-red-500",
      "C-Z": "bg-red-400",
    }
    return <Badge className={`${colors[category] || "bg-gray-600"} text-white`}>{category}</Badge>
  }

  const handleExport = () => {
    try {
      const csvContent = [
        [
          "Tanggal",
          "Toko",
          "Departemen",
          "Prediksi Penjualan",
          "Penjualan Aktual",
          "Akurasi",
          "Kategori ABC",
          "Kategori XYZ",
        ],
        ...filteredPredictions.map((pred: PredictionData) => [
          new Date(pred.created_at).toLocaleDateString("id-ID"),
          pred.store_id,
          pred.dept_id,
          pred.predicted_sales || 0,
          pred.actual_sales || 0,
          pred.accuracy || 0,
          pred.abc_class || "",
          pred.xyz_class || "",
        ]),
      ]
        .map((row) => row.join(","))
        .join("\n")

      const blob = new Blob([csvContent], { type: "text/csv" })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `prediksi-penjualan-${new Date().toISOString().split("T")[0]}.csv`
      a.click()
      window.URL.revokeObjectURL(url)

      toast({
        title: "Ekspor Berhasil",
        description: "Data prediksi berhasil diekspor ke file CSV",
      })
    } catch (error) {
      toast({
        title: "Ekspor Gagal",
        description: "Terjadi kesalahan saat mengekspor data",
        variant: "destructive",
      })
    }
  }

  const handleSendToManager = () => {
    toast({
      title: "Prediksi Dikirim",
      description: "Prediksi telah dikirim ke dashboard manager dan siap untuk dianalisis",
    })
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-red-600">Gagal memuat data prediksi. Silakan coba lagi.</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Summary Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Prediksi</CardTitle>
            <BarChart3 className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{isLoading ? "..." : summaryStats.totalPredictions}</div>
            <p className="text-xs text-muted-foreground">Prediksi yang dibuat</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Akurasi Rata-rata</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{isLoading ? "..." : `${summaryStats.avgAccuracy.toFixed(1)}%`}</div>
            <p className="text-xs text-muted-foreground">Performa model</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Penjualan</CardTitle>
            <TrendingUp className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? "..." : `Rp.${summaryStats.totalSales.toLocaleString()}`}
            </div>
            <p className="text-xs text-muted-foreground">Prediksi penjualan</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Toko Unik</CardTitle>
            <BarChart3 className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{isLoading ? "..." : summaryStats.uniqueStores}</div>
            <p className="text-xs text-muted-foreground">Toko yang dianalisis</p>
          </CardContent>
        </Card>
      </div>

      {/* Actions and Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center space-x-2">
              <Filter className="w-5 h-5" />
              <span>Filter & Aksi</span>
            </span>
            <div className="flex space-x-2">
              <Button onClick={handleSendToManager} disabled={filteredPredictions.length === 0}>
                <Send className="w-4 h-4 mr-2" />
                Kirim ke Manager
              </Button>
              <Button variant="outline" onClick={handleExport} disabled={filteredPredictions.length === 0}>
                <Download className="w-4 h-4 mr-2" />
                Ekspor CSV
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Cari berdasarkan toko atau departemen..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={filterStore} onValueChange={setFilterStore}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Filter Toko" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Toko</SelectItem>
                {uniqueStores.map((store) => (
                  <SelectItem key={`store-${store}`} value={store.toString()}>
                    Toko {store}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterDept} onValueChange={setFilterDept}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Filter Departemen" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Departemen</SelectItem>
                {uniqueDepts.map((dept) => (
                  <SelectItem key={`dept-${dept}`} value={dept.toString()}>
                    Dept {dept}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Predictions Table */}
      <Card>
        <CardHeader>
          <CardTitle>Detail Prediksi untuk Manager</CardTitle>
          <CardDescription>
            Menampilkan {filteredPredictions.length} dari {typedPredictions.length} prediksi yang akan dikirim ke
            manager
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Memuat data prediksi...</div>
          ) : filteredPredictions.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tanggal</TableHead>
                  <TableHead>Toko</TableHead>
                  <TableHead>Departemen</TableHead>
                  <TableHead>Prediksi</TableHead>
                  <TableHead>Aktual</TableHead>
                  <TableHead>Kategori</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPredictions.map((prediction: PredictionData) => (
                  <TableRow key={`prediction-${prediction.id}`}>
                    <TableCell>{new Date(prediction.created_at).toLocaleDateString("id-ID")}</TableCell>
                    <TableCell>
                      <Badge variant="outline">Toko {prediction.store_id}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">Dept {prediction.dept_id}</Badge>
                    </TableCell>
                    <TableCell className="font-medium">
                      Rp.{prediction.predicted_sales?.toLocaleString() || "N/A"}
                    </TableCell>
                    <TableCell>Rp.{prediction.actual_sales?.toLocaleString() || "N/A"}</TableCell>

                    <TableCell>{getCategoryBadge(prediction.abc_class || "C", prediction.xyz_class || "Z")}</TableCell>
                
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-gray-500">
              {searchTerm || filterStore !== "all" || filterDept !== "all"
                ? "Tidak ada prediksi yang sesuai dengan filter"
                : "Belum ada prediksi yang dibuat. Silakan buat prediksi terlebih dahulu di tab 'Buat Prediksi'."}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Category Summary for Manager */}
      {categorizedData && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Eye className="w-5 h-5" />
              <span>Ringkasan Kategori untuk Manager</span>
            </CardTitle>
            <CardDescription>
              Ringkasan prediksi berdasarkan klasifikasi ABC-XYZ yang akan dilihat manager
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {Object.entries(categorizedData.category_metrics || {}).map(([category, metrics]: [string, any]) => (
                <Card key={category} className="border-l-4 border-l-blue-500">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-center">
                      {getCategoryBadge(category.split("-")[0], category.split("-")[1])}
                      <Badge variant={metrics.confidence_level === "high" ? "default" : "secondary"}>
                        {metrics.confidence_level === "high" ? "Tinggi" : "Sedang"}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Jumlah:</span>
                      <span className="font-medium">{metrics.count}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Akurasi:</span>
                      <span className="font-medium">{metrics.avg_accuracy?.toFixed(1)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Total Prediksi:</span>
                      <span className="font-medium">Rp.{metrics.total_predicted_sales?.toLocaleString()}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
