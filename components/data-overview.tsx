"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Database, Download, Eye, RefreshCw, FileText } from "lucide-react"
import { useQuery, useMutation, useQueryClient } from "react-query"
import { useToast } from "@/hooks/use-toast"
import { datasetAPI, predictionAPI } from "@/lib/api"

interface Dataset {
  id: number
  name: string
  store_id: string
  records_count: number
  file_size: number
  status: string
  created_at: string
  uploader?: {
    name: string
    username: string
  }
}

interface Prediction {
  id: number
  created_at: string
  model: {
    name: string
  }
  count: number
  total_actual_sales: number
  total_predicted_sales: number
  creator: {
    name: string
  }
  accuracy: number | null
}

interface DatasetPreview {
  name: string
  preview: Array<Record<string, any>>
}

export function DataOverview() {
  const [selectedDataset, setSelectedDataset] = useState<Dataset | null>(null)
  const [previewData, setPreviewData] = useState<DatasetPreview | null>(null)
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)

  const { toast } = useToast()
  const queryClient = useQueryClient()

  // Fetch datasets
  const {
    data: datasets = [],
    isLoading: datasetsLoading,
    refetch: refetchDatasets,
  } = useQuery<Dataset[]>("datasets-frontend", datasetAPI.getAllForFrontend, {
    retry: 1,
    refetchOnWindowFocus: false,
  })

  // Fetch predictions
  const {
    data: predictions = [],
    isLoading: predictionsLoading,
    refetch: refetchPredictions,
  } = useQuery<Prediction[]>("predictions-frontend", predictionAPI.getAllForFrontend, {
    retry: 1,
    refetchOnWindowFocus: false,
  })

  // Preview dataset mutation
  const previewMutation = useMutation((datasetId: number) => datasetAPI.preview(datasetId), {
    onSuccess: (data: DatasetPreview) => {
      setPreviewData(data)
      setIsPreviewOpen(true)
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.response?.data?.detail || "Gagal memuat preview dataset",
        variant: "destructive",
      })
    },
  })

  // Download dataset mutation
  const downloadMutation = useMutation((datasetId: number) => datasetAPI.download(datasetId), {
    onSuccess: (blob: Blob, variables: number) => {
      const dataset = datasets.find((d) => d.id === variables)
      const url = window.URL.createObjectURL(blob as Blob)
      const a = document.createElement("a")
      a.style.display = "none"
      a.href = url
      a.download = dataset?.name || `dataset_${variables}.csv`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      toast({
        title: "Berhasil",
        description: "Dataset berhasil diunduh",
      })
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.response?.data?.detail || "Gagal mengunduh dataset",
        variant: "destructive",
      })
    },
  })

  // Export prediction mutation
  const exportPredictionMutation = useMutation((predictionId: number) => predictionAPI.exportPrediction(predictionId), {
    onSuccess: (blob: Blob, variables: number) => {
      const url = window.URL.createObjectURL(blob as Blob)
      const a = document.createElement("a")
      a.style.display = "none"
      a.href = url
      a.download = `prediction_${variables}.csv`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      toast({
        title: "Berhasil",
        description: "Prediksi berhasil diekspor",
      })
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.response?.data?.detail || "Gagal mengekspor prediksi",
        variant: "destructive",
      })
    },
  })

  const handlePreview = (dataset: Dataset) => {
    setSelectedDataset(dataset)
    previewMutation.mutate(dataset.id)
  }

  const handleDownload = (datasetId: number) => {
    downloadMutation.mutate(datasetId)
  }

  const handleExportPrediction = (predictionId: number) => {
    exportPredictionMutation.mutate(predictionId)
  }

  const handleRefresh = () => {
    refetchDatasets()
    refetchPredictions()
    toast({
      title: "Data Diperbarui",
      description: "Data overview telah diperbarui",
    })
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-600"
      case "processing":
        return "bg-yellow-600"
      case "failed":
        return "bg-red-600"
      default:
        return "bg-gray-600"
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "completed":
        return "Selesai"
      case "processing":
        return "Memproses"
      case "failed":
        return "Gagal"
      default:
        return status
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Overview Data</h2>
          <p className="text-muted-foreground">Kelola dataset dan hasil prediksi</p>
        </div>
        <Button onClick={handleRefresh} disabled={datasetsLoading || predictionsLoading}>
          <RefreshCw className={`w-4 h-4 mr-2 ${datasetsLoading || predictionsLoading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Datasets Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Database className="w-5 h-5" />
            <span>Dataset</span>
          </CardTitle>
          <CardDescription>Daftar semua dataset yang telah diunggah</CardDescription>
        </CardHeader>
        <CardContent>
          {datasetsLoading ? (
            <div className="text-center py-8">Memuat dataset...</div>
          ) : datasets.length === 0 ? (
            <div className="text-center py-8 text-gray-500">Belum ada dataset yang diunggah</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nama Dataset</TableHead>
                  <TableHead>Store ID</TableHead>
                  <TableHead>Jumlah Record</TableHead>
                  <TableHead>Ukuran File</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Diunggah Oleh</TableHead>
                  <TableHead>Tanggal</TableHead>
                  <TableHead>Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {datasets.map((dataset) => (
                  <TableRow key={dataset.id}>
                    <TableCell className="font-medium">{dataset.name}</TableCell>
                    <TableCell>{dataset.store_id}</TableCell>
                    <TableCell>{dataset.records_count.toLocaleString()}</TableCell>
                    <TableCell>{formatFileSize(dataset.file_size)}</TableCell>
                    <TableCell>
                      <Badge className={`${getStatusBadgeColor(dataset.status)} text-white`}>
                        {getStatusLabel(dataset.status)}
                      </Badge>
                    </TableCell>
                    <TableCell>{dataset.uploader?.name || "System"}</TableCell>
                    <TableCell>{new Date(dataset.created_at).toLocaleDateString("id-ID")}</TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePreview(dataset)}
                          disabled={previewMutation.isLoading}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDownload(dataset.id)}
                          disabled={downloadMutation.isLoading}
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Predictions Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <FileText className="w-5 h-5" />
            <span>Hasil Prediksi</span>
          </CardTitle>
          <CardDescription>Daftar semua hasil prediksi yang telah dibuat</CardDescription>
        </CardHeader>
        <CardContent>
          {predictionsLoading ? (
            <div className="text-center py-8">Memuat prediksi...</div>
          ) : predictions.length === 0 ? (
            <div className="text-center py-8 text-gray-500">Belum ada prediksi yang dibuat</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Model</TableHead>
                  <TableHead>Jumlah Prediksi</TableHead>
                  <TableHead>Total Penjualan Aktual</TableHead>
                  <TableHead>Total Penjualan Prediksi</TableHead>
                  <TableHead>Akurasi</TableHead>
                  <TableHead>Dibuat Oleh</TableHead>
                  <TableHead>Tanggal</TableHead>
                  <TableHead>Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {predictions.map((prediction) => (
                  <TableRow key={prediction.id}>
                    <TableCell className="font-medium">{prediction.model.name}</TableCell>
                    <TableCell>{prediction.count.toLocaleString()}</TableCell>
                    <TableCell>Rp.{prediction.total_actual_sales.toLocaleString()}</TableCell>
                    <TableCell>Rp.{prediction.total_predicted_sales.toLocaleString()}</TableCell>
                    <TableCell>
                      {prediction.accuracy !== null ? (
                        <Badge
                          className={`${
                            prediction.accuracy > 90
                              ? "bg-green-600"
                              : prediction.accuracy > 80
                                ? "bg-yellow-600"
                                : "bg-red-600"
                          } text-white`}
                        >
                          {prediction.accuracy.toFixed(1)}%
                        </Badge>
                      ) : (
                        <Badge variant="secondary">N/A</Badge>
                      )}
                    </TableCell>
                    <TableCell>{prediction.creator.name}</TableCell>
                    <TableCell>{new Date(prediction.created_at).toLocaleDateString("id-ID")}</TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleExportPrediction(prediction.id)}
                        disabled={exportPredictionMutation.isLoading}
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Preview Dialog */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Preview Dataset: {previewData?.name}</DialogTitle>
            <DialogDescription>Menampilkan 5 baris pertama dari dataset</DialogDescription>
          </DialogHeader>
          {previewData && (
            <div className="max-h-96 overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    {Object.keys(previewData.preview[0] || {}).map((key) => (
                      <TableHead key={key}>{key}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {previewData.preview.map((row, index) => (
                    <TableRow key={index}>
                      {Object.values(row).map((value, cellIndex) => (
                        <TableCell key={cellIndex}>{String(value)}</TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
