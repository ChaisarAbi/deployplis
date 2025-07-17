"use client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Activity, Download, RefreshCw, TrendingUp, AlertCircle, CheckCircle } from "lucide-react"
import { useQuery } from "react-query"
import { useToast } from "@/hooks/use-toast"
import { modelAPI } from "@/lib/api"

interface ModelMetrics {
  accuracy: number
  rmse: number
  mae: number
  r2Score: number
  trainingTime: string
  lastTrained: string
  status: string
}

interface ModelHistory {
  id: string
  date: string
  accuracy: number | null
  rmse: number | null
  parameters: string
  duration: string
  status: string
  modelId: number
}

export function ModelMonitoring() {
  const { toast } = useToast()

  // Fetch current model metrics
  const {
    data: currentMetrics,
    isLoading: metricsLoading,
    refetch: refetchMetrics,
  } = useQuery<ModelMetrics>("current-model-metrics", modelAPI.getCurrentMetrics, {
    retry: 1,
    refetchOnWindowFocus: false,
  })

  // Fetch model training history
  const {
    data: modelHistory = [],
    isLoading: historyLoading,
    refetch: refetchHistory,
  } = useQuery<ModelHistory[]>("model-history", modelAPI.getHistory, {
    retry: 1,
    refetchOnWindowFocus: false,
  })

  const handleRefresh = () => {
    refetchMetrics()
    refetchHistory()
    toast({
      title: "Data Diperbarui",
      description: "Monitoring model telah diperbarui",
    })
  }

  const handleExportModel = async () => {
    try {
      const blob = await modelAPI.export()
      const url = window.URL.createObjectURL(blob as Blob)
      const a = document.createElement("a")
      a.style.display = "none"
      a.href = url
      a.download = "model_export.joblib"
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      toast({
        title: "Berhasil",
        description: "Model berhasil diekspor",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Gagal mengekspor model",
        variant: "destructive",
      })
    }
  }

  const getAccuracyColor = (accuracy: number) => {
    if (accuracy >= 90) return "text-green-600"
    if (accuracy >= 80) return "text-yellow-600"
    return "text-red-600"
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="w-4 h-4 text-green-600" />
      case "failed":
        return <AlertCircle className="w-4 h-4 text-red-600" />
      default:
        return <Activity className="w-4 h-4 text-blue-600" />
    }
  }

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-600"
      case "failed":
        return "bg-red-600"
      case "training":
        return "bg-blue-600"
      default:
        return "bg-gray-600"
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "completed":
        return "Selesai"
      case "failed":
        return "Gagal"
      case "training":
        return "Melatih"
      default:
        return status
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Monitoring Model</h2>
          <p className="text-muted-foreground">Pantau performa dan riwayat pelatihan model</p>
        </div>
        <div className="flex space-x-2">
          <Button onClick={handleRefresh} disabled={metricsLoading || historyLoading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${metricsLoading || historyLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button onClick={handleExportModel}>
            <Download className="w-4 h-4 mr-2" />
            Ekspor Model
          </Button>
        </div>
      </div>

      {/* Current Model Metrics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <TrendingUp className="w-5 h-5" />
            <span>Metrik Model Saat Ini</span>
          </CardTitle>
          <CardDescription>Performa model yang sedang aktif</CardDescription>
        </CardHeader>
        <CardContent>
          {metricsLoading ? (
            <div className="text-center py-8">Memuat metrik model...</div>
          ) : currentMetrics ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Akurasi</span>
                  <Badge className={`${getAccuracyColor(currentMetrics.accuracy)} bg-transparent border-0 p-0`}>
                    {currentMetrics.accuracy.toFixed(2)}%
                  </Badge>
                </div>
                <Progress value={currentMetrics.accuracy} className="h-2" />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">RMSE</span>
                  <span className="text-sm font-bold">{currentMetrics.rmse.toFixed(4)}</span>
                </div>
                <div className="text-xs text-muted-foreground">Root Mean Square Error</div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">MAE</span>
                  <span className="text-sm font-bold">{currentMetrics.mae.toFixed(4)}</span>
                </div>
                <div className="text-xs text-muted-foreground">Mean Absolute Error</div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">R² Score</span>
                  <span className="text-sm font-bold">{currentMetrics.r2Score.toFixed(4)}</span>
                </div>
                <div className="text-xs text-muted-foreground">Coefficient of Determination</div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">Belum ada model yang dilatih</div>
          )}

          {currentMetrics && (
            <div className="mt-6 pt-6 border-t">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Waktu Pelatihan:</span>
                  <div className="font-medium">{currentMetrics.trainingTime}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Terakhir Dilatih:</span>
                  <div className="font-medium">
                    {new Date(currentMetrics.lastTrained).toLocaleDateString("id-ID", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                </div>
                <div>
                  <span className="text-muted-foreground">Status:</span>
                  <div className="flex items-center space-x-2 mt-1">
                    {getStatusIcon(currentMetrics.status)}
                    <Badge className={`${getStatusBadgeColor(currentMetrics.status)} text-white`}>
                      {getStatusLabel(currentMetrics.status)}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Model Training History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Activity className="w-5 h-5" />
            <span>Riwayat Pelatihan Model</span>
          </CardTitle>
          <CardDescription>Histori semua pelatihan model yang pernah dilakukan</CardDescription>
        </CardHeader>
        <CardContent>
          {historyLoading ? (
            <div className="text-center py-8">Memuat riwayat pelatihan...</div>
          ) : modelHistory.length === 0 ? (
            <div className="text-center py-8 text-gray-500">Belum ada riwayat pelatihan</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tanggal</TableHead>
                  <TableHead>Model ID</TableHead>
                  <TableHead>Akurasi</TableHead>
                  <TableHead>RMSE</TableHead>
                  <TableHead>Parameter</TableHead>
                  <TableHead>Durasi</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {modelHistory.map((history) => (
                  <TableRow key={history.id}>
                    <TableCell>
                      {new Date(history.date).toLocaleDateString("id-ID", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </TableCell>
                    <TableCell className="font-medium">#{history.modelId}</TableCell>
                    <TableCell>
                      {history.accuracy !== null ? (
                        <span className={getAccuracyColor(history.accuracy)}>{history.accuracy.toFixed(2)}%</span>
                      ) : (
                        <span className="text-gray-400">N/A</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {history.rmse !== null ? history.rmse.toFixed(4) : <span className="text-gray-400">N/A</span>}
                    </TableCell>
                    <TableCell>
                      <div className="max-w-xs truncate" title={history.parameters}>
                        {history.parameters}
                      </div>
                    </TableCell>
                    <TableCell>{history.duration}</TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(history.status)}
                        <Badge className={`${getStatusBadgeColor(history.status)} text-white`}>
                          {getStatusLabel(history.status)}
                        </Badge>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
