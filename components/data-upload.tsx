"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Upload, FileText, CheckCircle, Calendar, Database } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { datasetAPI } from "@/lib/api"
import { useQuery, useMutation, useQueryClient } from "react-query"

export function DataUpload() {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [selectedStore, setSelectedStore] = useState("")
  const [uploadProgress, setUploadProgress] = useState(0)

  // Get datasets
  const { data: datasets = [], isLoading } = useQuery("datasets", datasetAPI.getAll)

  // Upload mutation
  const uploadMutation = useMutation(
    ({ file, storeId }: { file: File; storeId?: string }) => datasetAPI.upload(file, storeId),
    {
      onSuccess: () => {
        toast({
          title: "Upload Berhasil",
          description: "Dataset telah berhasil diunggah dan diproses",
        })
        queryClient.invalidateQueries("datasets")
        setSelectedStore("")
      },
      onError: (error: any) => {
        toast({
          title: "Upload Gagal",
          description: error.response?.data?.detail || "Terjadi kesalahan saat upload",
          variant: "destructive",
        })
      },
    },
  )

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!selectedStore) {
      toast({
        title: "Error",
        description: "Harap pilih toko untuk data",
        variant: "destructive",
      })
      return
    }

    uploadMutation.mutate({ file, storeId: selectedStore })
    event.target.value = ""
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-green-600">Selesai</Badge>
      case "processing":
        return <Badge className="bg-yellow-600">Memproses</Badge>
      case "error":
        return <Badge variant="destructive">Error</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Unggah Data</h2>
        <p className="text-gray-600">Unggah data penjualan untuk pelatihan dan analisis model</p>
      </div>

      {/* Form Upload */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Upload className="w-5 h-5" />
            <span>Unggah Data Penjualan</span>
          </CardTitle>
          <CardDescription>Unggah file CSV yang berisi data penjualan untuk toko tertentu</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="store">Toko</Label>
              <select
                id="store"
                value={selectedStore}
                onChange={(e) => setSelectedStore(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={uploadMutation.isLoading}
              >
                <option value="">Pilih Toko</option>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => (
                  <option key={i} value={`Store ${i}`}>
                    Store {i}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="file">File CSV</Label>
              <Input
                id="file"
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                className="cursor-pointer"
                disabled={uploadMutation.isLoading}
              />
            </div>
          </div>

          {uploadMutation.isLoading && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Mengunggah...</span>
                <span>Memproses file</span>
              </div>
              <Progress value={50} className="h-2" />
            </div>
          )}

          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="font-medium text-blue-800 mb-2">Persyaratan File:</h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Format CSV saja</li>
              <li>• Kolom wajib: Store, Dept, Date, Weekly_Sales, IsHoliday</li>
              <li>• Ukuran file maksimal: 10MB</li>
              <li>• Format tanggal: YYYY-MM-DD</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Dataset yang Diunggah */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Database className="w-5 h-5" />
            <span>Dataset yang Diunggah</span>
          </CardTitle>
          <CardDescription>Kelola file data penjualan yang telah diunggah</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-4">Memuat dataset...</div>
          ) : (
            <div className="space-y-4">
              {datasets.map((dataset: any) => (
                <div key={dataset.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <p className="text-sm font-medium text-gray-900 truncate">{dataset.name}</p>
                        {getStatusBadge(dataset.status)}
                      </div>
                      <div className="flex items-center space-x-4 mt-1">
                        <span className="text-xs text-gray-500">
                          <Calendar className="w-3 h-3 inline mr-1" />
                          Toko: {dataset.store_id}
                        </span>
                        <span className="text-xs text-gray-500">
                          Ukuran: {(dataset.file_size / (1024 * 1024)).toFixed(1)} MB
                        </span>
                        <span className="text-xs text-gray-500">Record: {dataset.records_count?.toLocaleString()}</span>
                        <span className="text-xs text-gray-500">
                          Diunggah: {new Date(dataset.created_at).toLocaleDateString("id-ID")}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex space-x-2">
                    <Button size="sm" variant="outline">
                      <FileText className="w-3 h-3" />
                    </Button>
                    <Button size="sm" variant="outline">
                      Lihat Data
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
