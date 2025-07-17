"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Zap, Settings, Play, BarChart3 } from "lucide-react"
import { useQuery, useMutation, useQueryClient } from "react-query"
import { useToast } from "@/hooks/use-toast"
import { modelAPI, datasetAPI } from "@/lib/api"

interface Dataset {
  id: number
  name: string
  store_id: string
  records_count: number
  status: string
  created_at: string
}

interface TrainingParameters {
  n_estimators: number
  max_depth: number
  learning_rate: number
  subsample: number
  colsample_bytree: number
}

interface TrainingResult {
  message: string
  model_id: number
  metrics: {
    accuracy: number
    rmse: number
    mae: number
    r2_score: number
  }
}

interface OptimizationResult {
  message: string
  model_id: number
  best_params: Record<string, any>
  metrics: {
    accuracy: number
    rmse: number
    mae: number
    r2_score: number
  }
  trials_completed: number
}

export function ModelTraining() {
  const [selectedDataset, setSelectedDataset] = useState<number | null>(null)
  const [parameters, setParameters] = useState<TrainingParameters>({
    n_estimators: 100,
    max_depth: 6,
    learning_rate: 0.1,
    subsample: 1.0,
    colsample_bytree: 1.0,
  })
  const [optimizationTrials, setOptimizationTrials] = useState(50)

  const { toast } = useToast()
  const queryClient = useQueryClient()

  // Fetch datasets
  const { data: datasets = [], isLoading: datasetsLoading } = useQuery<Dataset[]>("datasets", datasetAPI.getAll, {
    retry: 1,
    refetchOnWindowFocus: false,
  })

  // Train model mutation
  const trainModelMutation = useMutation(
    ({ datasetId, parameters }: { datasetId: number; parameters: TrainingParameters }) =>
      modelAPI.train(datasetId, parameters),
    {
      onSuccess: (data: TrainingResult) => {
        queryClient.invalidateQueries("models")
        queryClient.invalidateQueries("current-model-metrics")
        toast({
          title: "Berhasil",
          description: data.message,
        })
      },
      onError: (error: any) => {
        toast({
          title: "Error",
          description: error.response?.data?.detail || "Gagal melatih model",
          variant: "destructive",
        })
      },
    },
  )

  // Optimize model mutation
  const optimizeModelMutation = useMutation(
    ({ datasetId, nTrials }: { datasetId: number; nTrials: number }) => modelAPI.optimize(datasetId, nTrials),
    {
      onSuccess: (data: OptimizationResult) => {
        queryClient.invalidateQueries("models")
        queryClient.invalidateQueries("current-model-metrics")
        toast({
          title: "Optimasi Selesai",
          description: `${data.message}. Akurasi: ${data.metrics.accuracy.toFixed(2)}%`,
        })
      },
      onError: (error: any) => {
        toast({
          title: "Error",
          description: error.response?.data?.detail || "Gagal mengoptimasi model",
          variant: "destructive",
        })
      },
    },
  )

  const handleTrainModel = () => {
    if (!selectedDataset) {
      toast({
        title: "Error",
        description: "Pilih dataset terlebih dahulu",
        variant: "destructive",
      })
      return
    }

    trainModelMutation.mutate({
      datasetId: selectedDataset,
      parameters,
    })
  }

  const handleOptimizeModel = () => {
    if (!selectedDataset) {
      toast({
        title: "Error",
        description: "Pilih dataset terlebih dahulu",
        variant: "destructive",
      })
      return
    }

    optimizeModelMutation.mutate({
      datasetId: selectedDataset,
      nTrials: optimizationTrials,
    })
  }

  const resetParameters = () => {
    setParameters({
      n_estimators: 100,
      max_depth: 6,
      learning_rate: 0.1,
      subsample: 1.0,
      colsample_bytree: 1.0,
    })
  }

  const availableDatasets = datasets.filter((dataset) => dataset.status === "completed")

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Pelatihan Model</h2>
        <p className="text-muted-foreground">Latih dan optimasi model machine learning</p>
      </div>

      {/* Dataset Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <BarChart3 className="w-5 h-5" />
            <span>Pilih Dataset</span>
          </CardTitle>
          <CardDescription>Pilih dataset yang akan digunakan untuk pelatihan model</CardDescription>
        </CardHeader>
        <CardContent>
          {datasetsLoading ? (
            <div className="text-center py-4">Memuat dataset...</div>
          ) : availableDatasets.length === 0 ? (
            <div className="text-center py-4 text-gray-500">
              Belum ada dataset yang tersedia. Unggah dataset terlebih dahulu.
            </div>
          ) : (
            <div className="space-y-4">
              <Select
                value={selectedDataset?.toString() || ""}
                onValueChange={(value) => setSelectedDataset(Number.parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih dataset untuk pelatihan" />
                </SelectTrigger>
                <SelectContent>
                  {availableDatasets.map((dataset) => (
                    <SelectItem key={dataset.id} value={dataset.id.toString()}>
                      <div className="flex items-center justify-between w-full">
                        <span>{dataset.name}</span>
                        <Badge variant="secondary" className="ml-2">
                          {dataset.records_count.toLocaleString()} records
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {selectedDataset && (
                <div className="p-4 bg-muted rounded-lg">
                  {(() => {
                    const dataset = datasets.find((d) => d.id === selectedDataset)
                    return dataset ? (
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Nama:</span>
                          <div className="font-medium">{dataset.name}</div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Store ID:</span>
                          <div className="font-medium">{dataset.store_id}</div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Jumlah Record:</span>
                          <div className="font-medium">{dataset.records_count.toLocaleString()}</div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Tanggal Upload:</span>
                          <div className="font-medium">{new Date(dataset.created_at).toLocaleDateString("id-ID")}</div>
                        </div>
                      </div>
                    ) : null
                  })()}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Tabs defaultValue="manual" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="manual">Pelatihan Manual</TabsTrigger>
          <TabsTrigger value="optimization">Optimasi Otomatis</TabsTrigger>
        </TabsList>

        {/* Manual Training */}
        <TabsContent value="manual" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Settings className="w-5 h-5" />
                <span>Parameter Model</span>
              </CardTitle>
              <CardDescription>Atur parameter XGBoost secara manual</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>N Estimators: {parameters.n_estimators}</Label>
                  <Slider
                    value={[parameters.n_estimators]}
                    onValueChange={(value) => setParameters({ ...parameters, n_estimators: value[0] })}
                    min={50}
                    max={500}
                    step={10}
                    className="w-full"
                  />
                  <div className="text-xs text-muted-foreground">Jumlah pohon dalam ensemble (50-500)</div>
                </div>

                <div className="space-y-2">
                  <Label>Max Depth: {parameters.max_depth}</Label>
                  <Slider
                    value={[parameters.max_depth]}
                    onValueChange={(value) => setParameters({ ...parameters, max_depth: value[0] })}
                    min={3}
                    max={15}
                    step={1}
                    className="w-full"
                  />
                  <div className="text-xs text-muted-foreground">Kedalaman maksimum pohon (3-15)</div>
                </div>

                <div className="space-y-2">
                  <Label>Learning Rate: {parameters.learning_rate}</Label>
                  <Slider
                    value={[parameters.learning_rate]}
                    onValueChange={(value) => setParameters({ ...parameters, learning_rate: value[0] })}
                    min={0.01}
                    max={0.3}
                    step={0.01}
                    className="w-full"
                  />
                  <div className="text-xs text-muted-foreground">Tingkat pembelajaran (0.01-0.3)</div>
                </div>

                <div className="space-y-2">
                  <Label>Subsample: {parameters.subsample}</Label>
                  <Slider
                    value={[parameters.subsample]}
                    onValueChange={(value) => setParameters({ ...parameters, subsample: value[0] })}
                    min={0.5}
                    max={1.0}
                    step={0.1}
                    className="w-full"
                  />
                  <div className="text-xs text-muted-foreground">Rasio sampling data (0.5-1.0)</div>
                </div>

                <div className="space-y-2">
                  <Label>Colsample Bytree: {parameters.colsample_bytree}</Label>
                  <Slider
                    value={[parameters.colsample_bytree]}
                    onValueChange={(value) => setParameters({ ...parameters, colsample_bytree: value[0] })}
                    min={0.5}
                    max={1.0}
                    step={0.1}
                    className="w-full"
                  />
                  <div className="text-xs text-muted-foreground">Rasio sampling fitur (0.5-1.0)</div>
                </div>
              </div>

              <div className="flex justify-between items-center pt-4 border-t">
                <Button variant="outline" onClick={resetParameters}>
                  Reset ke Default
                </Button>
                <Button
                  onClick={handleTrainModel}
                  disabled={!selectedDataset || trainModelMutation.isLoading}
                  className="min-w-32"
                >
                  {trainModelMutation.isLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      Melatih...
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 mr-2" />
                      Latih Model
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Automatic Optimization */}
        <TabsContent value="optimization" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Zap className="w-5 h-5" />
                <span>Optimasi Otomatis</span>
              </CardTitle>
              <CardDescription>Gunakan Optuna untuk mencari parameter terbaik secara otomatis</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="trials">Jumlah Trials</Label>
                  <Input
                    id="trials"
                    type="number"
                    value={optimizationTrials}
                    onChange={(e) => setOptimizationTrials(Number.parseInt(e.target.value) || 50)}
                    min={10}
                    max={200}
                    placeholder="Masukkan jumlah trials"
                  />
                  <div className="text-xs text-muted-foreground">
                    Jumlah kombinasi parameter yang akan dicoba (10-200). Semakin banyak, semakin akurat tetapi lebih
                    lama.
                  </div>
                </div>

                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <h4 className="font-medium text-blue-900 mb-2">Tentang Optimasi Otomatis</h4>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• Menggunakan algoritma Bayesian Optimization</li>
                    <li>• Mencari kombinasi parameter terbaik secara otomatis</li>
                    <li>• Waktu eksekusi tergantung jumlah trials dan ukuran dataset</li>
                    <li>• Hasil biasanya lebih baik dari parameter manual</li>
                  </ul>
                </div>

                {optimizeModelMutation.isLoading && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Optimasi sedang berjalan...</span>
                      <span>Mohon tunggu</span>
                    </div>
                    <Progress value={undefined} className="h-2" />
                  </div>
                )}
              </div>

              <div className="flex justify-end pt-4 border-t">
                <Button
                  onClick={handleOptimizeModel}
                  disabled={!selectedDataset || optimizeModelMutation.isLoading}
                  className="min-w-32"
                >
                  {optimizeModelMutation.isLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      Mengoptimasi...
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4 mr-2" />
                      Mulai Optimasi
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
