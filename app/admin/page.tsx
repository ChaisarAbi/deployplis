"use client"

import { useAuth } from "@/components/auth-provider"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Upload, Brain, BarChart3, Settings, FileText, Zap, Eye, Target, TrendingUp } from "lucide-react"
import { useState } from "react"
import { dashboardAPI, predictionAPI, modelAPI, datasetAPI } from "@/lib/api"
import { useQuery, useMutation, useQueryClient } from "react-query"
import { CSVTemplateDownload } from "@/components/csv-template-download"
import { useToast } from "@/hooks/use-toast"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Progress } from "@/components/ui/progress"
import dynamic from "next/dynamic"

// Make components that use React Query client-side only
const DataUploadDynamic = dynamic(
  () => import("@/components/data-upload").then((mod) => ({ default: mod.DataUpload })),
  {
    ssr: false,
    loading: () => <div className="p-4">Memuat...</div>,
  },
)

const ModelTrainingDynamic = dynamic(
  () => import("@/components/model-training").then((mod) => ({ default: mod.ModelTraining })),
  {
    ssr: false,
    loading: () => <div className="p-4">Memuat...</div>,
  },
)

const VisualizationDashboardDynamic = dynamic(
  () => import("@/components/visualization-dashboard").then((mod) => ({ default: mod.VisualizationDashboard })),
  {
    ssr: false,
    loading: () => <div className="p-4">Memuat...</div>,
  },
)

const PredictionViewDynamic = dynamic(
  () => import("@/components/prediction-view").then((mod) => ({ default: mod.PredictionView })),
  {
    ssr: false,
    loading: () => <div className="p-4">Memuat...</div>,
  },
)

interface Model {
  id: number
  name: string
  algorithm: string
  status: string
  created_at: string
  dataset_id: number
  metrics: {
    accuracy?: number
    rmse?: number
    mae?: number
    r2_score?: number
  }
}

interface Dataset {
  id: number
  name: string
  store_id: string
  records_count: number
  status: string
  created_at: string
  columns: string
}

export default function AdminDashboard() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState("overview")
  const [selectedModelId, setSelectedModelId] = useState<number | null>(null)
  const { toast } = useToast()
  const queryClient = useQueryClient()

  // Get dashboard stats - only run on client side
  const { data: stats } = useQuery("dashboard-stats", dashboardAPI.getStats, {
    enabled: typeof window !== "undefined", // Only run on client side
  })

  // Get available models for prediction
  const { data: models = [], isLoading: modelsLoading } = useQuery<Model[]>("models", modelAPI.getAll, {
    enabled: typeof window !== "undefined",
  })

  // Get available datasets
  const { data: datasets = [], isLoading: datasetsLoading } = useQuery<Dataset[]>("datasets", datasetAPI.getAll, {
    enabled: typeof window !== "undefined",
  })

  // Get existing predictions
  const { data: predictions = [], isLoading: predictionsLoading } = useQuery("predictions-all", predictionAPI.getDetails, {
    enabled: typeof window !== "undefined",
  })

  // Generate predictions mutation
  const generatePredictionsMutation = useMutation((modelId: number) => predictionAPI.generate(modelId), {
    onSuccess: (data) => {
      queryClient.invalidateQueries("predictions-all")
      queryClient.invalidateQueries("categorized-predictions")
      queryClient.invalidateQueries("manager-stats")
      toast({
        title: "Berhasil",
        description: `${data.message}. Total prediksi: ${data.predictions_count}`,
      })
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.response?.data?.detail || "Gagal membuat prediksi",
        variant: "destructive",
      })
    },
  })

  if (!user || user.role !== "admin") {
    return <div>Akses Ditolak</div>
  }

  const handleGeneratePredictions = () => {
    if (!selectedModelId) {
      toast({
        title: "Error",
        description: "Pilih model terlebih dahulu",
        variant: "destructive",
      })
      return
    }
    generatePredictionsMutation.mutate(selectedModelId)
  }

  const statCards = [
    {
      title: "Dataset Diunggah",
      value: stats?.total_datasets || "0",
      description: "Total dataset",
      icon: FileText,
      color: "text-blue-600",
    },
    {
      title: "Model Dilatih",
      value: stats?.total_models || "0",
      description: "Total model",
      icon: Brain,
      color: "text-purple-600",
    },
    {
      title: "Prediksi Dibuat",
      value: stats?.total_predictions || "0",
      description: "Total prediksi",
      icon: BarChart3,
      color: "text-green-600",
    },
    {
      title: "Umpan Balik",
      value: stats?.total_feedback || "0",
      description: "Total feedback",
      icon: Zap,
      color: "text-orange-600",
    },
  ]

  // Filter completed models for prediction
  const availableModels = models.filter((model) => model.status === "completed")
  const selectedModel = availableModels.find((model) => model.id === selectedModelId)
  const selectedDataset = datasets.find((dataset) => dataset.id === selectedModel?.dataset_id)

  return (
    <DashboardLayout title="Dashboard Petugas">
      {/* Logo dan Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-4">
            <img src="img1.jpeg" alt="Logo" className="h-10 w-auto" />
            <h1 className="text-2xl font-semibold">CV. Printnesia Digital Printing</h1>
          </div>
        </div>
      <div className="space-y-6">
        {/* Tab Navigasi */}
        <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg w-fit">
          <Button
            variant={activeTab === "overview" ? "default" : "ghost"}
            size="sm"
            onClick={() => setActiveTab("overview")}
          >
            <BarChart3 className="w-4 h-4 mr-2" />
            Ringkasan
          </Button>
          <Button
            variant={activeTab === "upload" ? "default" : "ghost"}
            size="sm"
            onClick={() => setActiveTab("upload")}
          >
            <Upload className="w-4 h-4 mr-2" />
            Unggah Data
          </Button>
          <Button
            variant={activeTab === "training" ? "default" : "ghost"}
            size="sm"
            onClick={() => setActiveTab("training")}
          >
            <Brain className="w-4 h-4 mr-2" />
            Pelatihan Model
          </Button>
          <Button
            variant={activeTab === "predictions" ? "default" : "ghost"}
            size="sm"
            onClick={() => setActiveTab("predictions")}
          >
            <Target className="w-4 h-4 mr-2" />
            Buat Prediksi
          </Button>
          <Button
            variant={activeTab === "results" ? "default" : "ghost"}
            size="sm"
            onClick={() => setActiveTab("results")}
          >
            <TrendingUp className="w-4 h-4 mr-2" />
            Hasil Prediksi
          </Button>
          <Button
            variant={activeTab === "visualization" ? "default" : "ghost"}
            size="sm"
            onClick={() => setActiveTab("visualization")}
          >
            <Eye className="w-4 h-4 mr-2" />
            Visualisasi
          </Button>
        </div>

        {activeTab === "overview" && (
          <>
            {/* Grid Statistik */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {statCards.map((stat, index) => (
                <Card key={index}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                    <stat.icon className={`h-4 w-4 ${stat.color}`} />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stat.value}</div>
                    <p className="text-xs text-muted-foreground">{stat.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* CSV Template Download */}
            <CSVTemplateDownload />

            {/* Aksi Cepat */}
            <Card>
              <CardHeader>
                <CardTitle>Aksi Cepat</CardTitle>
                <CardDescription>Tugas administratif umum untuk pengelolaan data dan model</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                  <Button className="h-20 flex-col space-y-2" onClick={() => setActiveTab("upload")}>
                    <Upload className="w-6 h-6" />
                    <span>Unggah Data</span>
                  </Button>
                  <Button
                    variant="outline"
                    className="h-20 flex-col space-y-2 bg-transparent"
                    onClick={() => setActiveTab("training")}
                  >
                    <Brain className="w-6 h-6" />
                    <span>Latih Model</span>
                  </Button>
                  <Button
                    variant="outline"
                    className="h-20 flex-col space-y-2 bg-transparent"
                    onClick={() => setActiveTab("predictions")}
                  >
                    <Target className="w-6 h-6" />
                    <span>Buat Prediksi</span>
                  </Button>
                  <Button
                    variant="outline"
                    className="h-20 flex-col space-y-2 bg-transparent"
                    onClick={() => setActiveTab("visualization")}
                  >
                    <Eye className="w-6 h-6" />
                    <span>Lihat Visualisasi</span>
                  </Button>
                  <Button variant="outline" className="h-20 flex-col space-y-2 bg-transparent" disabled>
                    <Settings className="w-6 h-6" />
                    <span>Pengaturan</span>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Informasi Sistem */}
            <Card>
              <CardHeader>
                <CardTitle>Informasi Sistem</CardTitle>
                <CardDescription>Status dan informasi sistem machine learning</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-green-600 rounded-full" />
                      <div>
                        <p className="font-medium text-green-800">XGBoost Engine</p>
                        <p className="text-sm text-green-600">Siap untuk pelatihan model</p>
                      </div>
                    </div>
                    <Badge className="bg-green-600">Online</Badge>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-blue-600 rounded-full" />
                      <div>
                        <p className="font-medium text-blue-800">Optuna Optimizer</p>
                        <p className="text-sm text-blue-600">Siap untuk optimasi hyperparameter</p>
                      </div>
                    </div>
                    <Badge className="bg-blue-600">Aktif</Badge>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-purple-50 border border-purple-200 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-purple-600 rounded-full" />
                      <div>
                        <p className="font-medium text-purple-800">Database SQLite</p>
                        <p className="text-sm text-purple-600">Penyimpanan data dan model</p>
                      </div>
                    </div>
                    <Badge className="bg-purple-600">Terhubung</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {activeTab === "upload" && <DataUploadDynamic />}
        {activeTab === "training" && <ModelTrainingDynamic />}

        {/* Tab Prediksi - Fungsi Utama untuk Admin */}
        {activeTab === "predictions" && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Target className="w-5 h-5" />
                  <span>Buat Prediksi untuk Manager</span>
                </CardTitle>
                <CardDescription>
                  Pilih model yang telah dilatih untuk membuat prediksi penjualan yang akan dikirim ke dashboard manager
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Model Selection */}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Pilih Model untuk Prediksi</label>
                    <Select
                      value={selectedModelId?.toString() || ""}
                      onValueChange={(value) => setSelectedModelId(Number.parseInt(value))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih model yang telah dilatih" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableModels.length > 0 ? (
                          availableModels.map((model) => (
                            <SelectItem key={model.id} value={model.id.toString()}>
                              {model.name} - {model.algorithm}
                              {model.metrics?.accuracy && ` (${model.metrics.accuracy.toFixed(2)}% akurasi)`}
                            </SelectItem>
                          ))
                        ) : (
                          <SelectItem value="no-models" disabled>
                            Tidak ada model yang tersedia
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Model Information */}
                  {selectedModel && selectedDataset && (
                    <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <h4 className="font-medium text-blue-900 mb-3">Informasi Model & Dataset</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div className="space-y-2">
                          <p>
                            <strong>Model:</strong> {selectedModel.name}
                          </p>
                          <p>
                            <strong>Algoritma:</strong> {selectedModel.algorithm}
                          </p>
                          <p>
                            <strong>Status:</strong>
                            <Badge className="ml-2 bg-green-600">{selectedModel.status}</Badge>
                          </p>
                          <p>
                            <strong>Akurasi:</strong>{" "}
                            {selectedModel.metrics?.accuracy ? `${selectedModel.metrics.accuracy.toFixed(2)}%` : "N/A"}
                          </p>
                        </div>
                        <div className="space-y-2">
                          <p>
                            <strong>Dataset:</strong> {selectedDataset.name}
                          </p>
                          <p>
                            <strong>Store ID:</strong> {selectedDataset.store_id}
                          </p>
                          <p>
                            <strong>Records:</strong> {selectedDataset.records_count.toLocaleString()}
                          </p>
                          <p>
                            <strong>Dilatih:</strong> {new Date(selectedModel.created_at).toLocaleDateString("id-ID")}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Generate Predictions Button */}
                  <Button
                    onClick={handleGeneratePredictions}
                    disabled={!selectedModelId || generatePredictionsMutation.isLoading || availableModels.length === 0}
                    className="w-full"
                    size="lg"
                  >
                    {generatePredictionsMutation.isLoading ? (
                      <>
                        <Settings className="w-4 h-4 mr-2 animate-spin" />
                        Membuat Prediksi...
                      </>
                    ) : (
                      <>
                        <Target className="w-4 h-4 mr-2" />
                        Buat Prediksi untuk Manager
                      </>
                    )}
                  </Button>

                  {availableModels.length === 0 && (
                    <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <p className="text-yellow-800 text-sm">
                        <strong>Tidak ada model yang tersedia.</strong> Silakan latih model terlebih dahulu di tab
                        "Pelatihan Model".
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Available Models Overview */}
            <Card>
              <CardHeader>
                <CardTitle>Model yang Tersedia</CardTitle>
                <CardDescription>Daftar model yang telah dilatih dan siap untuk membuat prediksi</CardDescription>
              </CardHeader>
              <CardContent>
                {modelsLoading ? (
                  <div className="text-center py-8">Memuat model...</div>
                ) : availableModels.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nama Model</TableHead>
                        <TableHead>Algoritma</TableHead>
                        <TableHead>Dataset</TableHead>
                        <TableHead>Akurasi</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Tanggal</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {availableModels.map((model) => {
                        const dataset = datasets.find((d) => d.id === model.dataset_id)
                        return (
                          <TableRow key={model.id}>
                            <TableCell className="font-medium">{model.name}</TableCell>
                            <TableCell>{model.algorithm}</TableCell>
                            <TableCell>{dataset?.name || "N/A"}</TableCell>
                            <TableCell>
                              {model.metrics?.accuracy ? (
                                <div className="flex items-center space-x-2">
                                  <Progress value={model.metrics.accuracy} className="w-16 h-2" />
                                  <span className="text-sm">{model.metrics.accuracy.toFixed(1)}%</span>
                                </div>
                              ) : (
                                "N/A"
                              )}
                            </TableCell>
                            <TableCell>
                              <Badge className="bg-green-600">{model.status}</Badge>
                            </TableCell>
                            <TableCell>{new Date(model.created_at).toLocaleDateString("id-ID")}</TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    Belum ada model yang tersedia. Silakan latih model terlebih dahulu.
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Tab Hasil Prediksi */}
        {activeTab === "results" && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <TrendingUp className="w-5 h-5" />
                  <span>Hasil Prediksi yang Telah Dibuat</span>
                </CardTitle>
                <CardDescription>Lihat dan kelola prediksi yang telah dibuat untuk manager</CardDescription>
              </CardHeader>
              <CardContent>
                <PredictionViewDynamic />
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === "visualization" && <VisualizationDashboardDynamic />}
      </div>
    </DashboardLayout>
  )
}
