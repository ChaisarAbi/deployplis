"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { BarChart3, AlertTriangle, Package, DollarSign, Target, ShoppingCart, Activity, RefreshCw } from "lucide-react"
import { useQuery } from "react-query"
import { useToast } from "@/hooks/use-toast"
import { FeedbackForm } from "@/components/feedback-form"
import { DashboardLayout } from "@/components/dashboard-layout"
import { dashboardAPI } from "@/lib/api"

interface CategorySummary {
  product_count: number
  avg_accuracy: number
  confidence_level: string
}

interface RevenueImpact {
  total_revenue: number
  percentage: number
  priority: string
}

interface RiskAssessment {
  risk_level: string
  recommendation: string
}

interface StockRecommendation {
  recommended_stock: number
  stock_weeks: number
  reorder_point: number
}

interface ManagerStats {
  category_summary: Record<string, CategorySummary>
  revenue_impact: Record<string, RevenueImpact>
  risk_assessment: Record<string, RiskAssessment>
  stock_recommendations: Record<string, StockRecommendation>
}

export default function ManagerDashboard() {
  const [refreshKey, setRefreshKey] = useState(0)
  const { toast } = useToast()

  // Fetch enhanced manager statistics
  const {
    data: managerStats,
    isLoading: statsLoading,
    refetch: refetchStats,
  } = useQuery<ManagerStats>(
    ["manager-stats", refreshKey],
    async () => {
      return await dashboardAPI.getManagerStats()
    },
    {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  )

  const handleRefresh = () => {
    setRefreshKey((prev) => prev + 1)
    refetchStats()
    toast({
      title: "Data Diperbarui",
      description: "Dashboard telah diperbarui dengan data terbaru",
    })
  }

  // Calculate overall metrics
  const overallMetrics = managerStats
    ? {
        totalProducts: Object.values(managerStats.category_summary).reduce((sum, cat) => sum + cat.product_count, 0),
        avgAccuracy:
          Object.values(managerStats.category_summary).reduce((sum, cat) => sum + cat.avg_accuracy, 0) /
            Object.keys(managerStats.category_summary).length || 0,
        totalRevenue: Object.values(managerStats.revenue_impact).reduce((sum, rev) => sum + rev.total_revenue, 0),
        highRiskCategories: Object.values(managerStats.risk_assessment).filter((risk) => risk.risk_level === "Tinggi")
          .length,
      }
    : null

  const getCategoryColor = (category: string) => {
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
    return colors[category] || "bg-gray-600"
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "Tinggi":
        return "bg-red-600"
      case "Sedang":
        return "bg-yellow-600"
      case "Rendah":
        return "bg-green-600"
      default:
        return "bg-gray-600"
    }
  }

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case "Tinggi":
        return "bg-red-600"
      case "Sedang":
        return "bg-yellow-600"
      case "Rendah":
        return "bg-green-600"
      default:
        return "bg-gray-600"
    }
  }

  return (
    <DashboardLayout title="Manager Dashboard">
       {/* Logo dan Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-4">
          <img src="/img1.jpeg" alt="Logo" className="h-10 w-auto" />
          <h1 className="text-2xl font-semibold">CV. Printnesia Digital Printing</h1>
        </div>
      </div>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Dashboard Manager</h1>
            <p className="text-muted-foreground">
              Analisis bisnis dan rekomendasi strategis berdasarkan prediksi penjualan
            </p>
          </div>
          <Button onClick={handleRefresh} disabled={statsLoading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${statsLoading ? "animate-spin" : ""}`} />
            Perbarui Data
          </Button>
        </div>

        {/* Overall Metrics */}
        {overallMetrics && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Produk</CardTitle>
                <Package className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{overallMetrics.totalProducts}</div>
                <p className="text-xs text-muted-foreground">Produk yang dianalisis</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Akurasi Rata-rata</CardTitle>
                <Target className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{overallMetrics.avgAccuracy.toFixed(1)}%</div>
                <p className="text-xs text-muted-foreground">Tingkat akurasi prediksi</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                <DollarSign className="h-4 w-4 text-purple-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">Rp.{overallMetrics.totalRevenue.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">Pendapatan total</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Kategori Berisiko</CardTitle>
                <AlertTriangle className="h-4 w-4 text-red-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{overallMetrics.highRiskCategories}</div>
                <p className="text-xs text-muted-foreground">Perlu perhatian khusus</p>
              </CardContent>
            </Card>
          </div>
        )}

        <Tabs defaultValue="overview" className="space-y-5">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Ringkasan Bisnis</TabsTrigger>
            <TabsTrigger value="revenue">Dampak Revenue</TabsTrigger>
            <TabsTrigger value="risk">Penilaian Risiko</TabsTrigger>
            <TabsTrigger value="stock">Rekomendasi Stok</TabsTrigger>
          </TabsList>

          {/* Business Overview */}
          <TabsContent value="overview" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <BarChart3 className="w-5 h-5" />
                  <span>Ringkasan Kategori Produk</span>
                </CardTitle>
                <CardDescription>Analisis performa berdasarkan klasifikasi ABC-XYZ</CardDescription>
              </CardHeader>
              <CardContent>
                {statsLoading ? (
                  <div className="text-center py-8">Memuat data kategori...</div>
                ) : managerStats?.category_summary ? (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {Object.entries(managerStats.category_summary).map(([category, data]) => (
                      <Card
                        key={category}
                        className="border-l-4"
                        style={{ borderLeftColor: getCategoryColor(category).replace("bg-", "#") }}
                      >
                        <CardHeader className="pb-2">
                          <div className="flex justify-between items-center">
                            <Badge className={`${getCategoryColor(category)} text-white`}>{category}</Badge>
                            <Badge
                              variant={
                                data.confidence_level === "Tinggi"
                                  ? "default"
                                  : data.confidence_level === "Sedang"
                                    ? "secondary"
                                    : "destructive"
                              }
                            >
                              {data.confidence_level}
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <span className="text-sm text-muted-foreground">Jumlah Produk:</span>
                              <span className="font-medium">{data.product_count}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-muted-foreground">Akurasi:</span>
                              <span className="font-medium">{data.avg_accuracy.toFixed(1)}%</span>
                            </div>
                            <Progress value={data.avg_accuracy} className="h-2" />
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">Belum ada data kategori tersedia</div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Revenue Impact */}
          <TabsContent value="revenue" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <DollarSign className="w-5 h-5" />
                  <span>Analisis Dampak Revenue</span>
                </CardTitle>
                <CardDescription>Kontribusi revenue per kategori produk</CardDescription>
              </CardHeader>
              <CardContent>
                {statsLoading ? (
                  <div className="text-center py-8">Memuat data revenue...</div>
                ) : managerStats?.revenue_impact ? (
                  <div className="space-y-4">
                    {Object.entries(managerStats.revenue_impact)
                      .sort(([, a], [, b]) => b.total_revenue - a.total_revenue)
                      .map(([category, data]) => (
                        <div key={category} className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex items-center space-x-4">
                            <Badge className={`${getCategoryColor(category)} text-white`}>{category}</Badge>
                            <div>
                              <div className="font-medium">Rp.{data.total_revenue.toLocaleString()}</div>
                              <div className="text-sm text-muted-foreground">
                                {data.percentage.toFixed(1)}% dari total
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Badge className={`${getPriorityColor(data.priority)} text-white`}>
                              Prioritas {data.priority}
                            </Badge>
                            <Progress value={data.percentage} className="w-24 h-2" />
                          </div>
                        </div>
                      ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">Belum ada data revenue tersedia</div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Risk Assessment */}
          <TabsContent value="risk" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <AlertTriangle className="w-5 h-5" />
                  <span>Penilaian Risiko & Rekomendasi</span>
                </CardTitle>
                <CardDescription>Analisis risiko berdasarkan variabilitas dan nilai penjualan</CardDescription>
              </CardHeader>
              <CardContent>
                {statsLoading ? (
                  <div className="text-center py-8">Memuat analisis risiko...</div>
                ) : managerStats?.risk_assessment ? (
                  <div className="space-y-4">
                    {Object.entries(managerStats.risk_assessment).map(([category, data]) => (
                      <Card
                        key={category}
                        className="border-l-4"
                        style={{ borderLeftColor: getRiskColor(data.risk_level).replace("bg-", "#") }}
                      >
                        <CardContent className="pt-4">
                          <div className="flex justify-between items-start">
                            <div className="space-y-2">
                              <div className="flex items-center space-x-2">
                                <Badge className={`${getCategoryColor(category)} text-white`}>{category}</Badge>
                                <Badge className={`${getRiskColor(data.risk_level)} text-white`}>
                                  Risiko {data.risk_level}
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground">{data.recommendation}</p>
                            </div>
                            <Activity className="w-5 h-5 text-muted-foreground" />
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">Belum ada data risiko tersedia</div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Stock Recommendations */}
          <TabsContent value="stock" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <ShoppingCart className="w-5 h-5" />
                  <span>Rekomendasi Manajemen Stok</span>
                </CardTitle>
                <CardDescription>Saran stok optimal berdasarkan prediksi dan klasifikasi</CardDescription>
              </CardHeader>
              <CardContent>
                {statsLoading ? (
                  <div className="text-center py-8">Memuat rekomendasi stok...</div>
                ) : managerStats?.stock_recommendations ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Object.entries(managerStats.stock_recommendations).map(([category, data]) => (
                      <Card key={category}>
                        <CardHeader className="pb-2">
                          <Badge className={`${getCategoryColor(category)} text-white w-fit`}>{category}</Badge>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">Stok Rekomendasi:</span>
                            <span className="font-medium">Rp.{data.recommended_stock.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">Durasi Stok:</span>
                            <span className="font-medium">{data.stock_weeks} minggu</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">Titik Reorder:</span>
                            <span className="font-medium">Rp.{data.reorder_point.toLocaleString()}</span>
                          </div>
                          <div className="pt-2 border-t">
                            <div className="text-xs text-muted-foreground">
                              {category.startsWith("A")
                                ? "Prioritas tinggi - Monitor ketat"
                                : category.startsWith("B")
                                  ? "Prioritas sedang - Perencanaan standar"
                                  : "Prioritas rendah - Evaluasi berkala"}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">Belum ada rekomendasi stok tersedia</div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}
