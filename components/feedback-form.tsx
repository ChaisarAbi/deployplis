"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { MessageSquare, Send, Clock, CheckCircle, AlertCircle } from "lucide-react"
import { useQuery, useMutation, useQueryClient } from "react-query"
import { feedbackAPI } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"

interface FeedbackData {
  id: number
  category: string
  dept_id?: string
  message: string
  status: "pending" | "reviewed" | "resolved"
  created_at: string
  updated_at: string
  response?: string
  user_id?: number
}

export function FeedbackForm() {
  const [category, setCategory] = useState("")
  const [deptId, setDeptId] = useState("")
  const [message, setMessage] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const { toast } = useToast()
  const queryClient = useQueryClient()

  // Fetch all feedback (will be filtered by user on backend if needed)
  const { data: feedbackHistory = [], isLoading } = useQuery("feedback-history", () => feedbackAPI.getAll(), {
    retry: 1,
    refetchOnWindowFocus: false,
  })

  // Submit feedback mutation
  const submitFeedbackMutation = useMutation(
    (feedbackData: { category: string; dept_id?: string; message: string }) => feedbackAPI.submit(feedbackData),
    {
      onSuccess: () => {
        toast({
          title: "Umpan Balik Terkirim",
          description: "Terima kasih atas umpan balik Anda. Tim kami akan segera merespons.",
        })
        // Reset form
        setCategory("")
        setDeptId("")
        setMessage("")
        // Refresh feedback history
        queryClient.invalidateQueries("feedback-history")
      },
      onError: (error: any) => {
        toast({
          title: "Gagal Mengirim",
          description: error.response?.data?.detail || "Terjadi kesalahan saat mengirim umpan balik",
          variant: "destructive",
        })
      },
      onSettled: () => {
        setIsSubmitting(false)
      },
    },
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!category || !message.trim()) {
      toast({
        title: "Form Tidak Lengkap",
        description: "Mohon lengkapi kategori dan pesan yang diperlukan",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)
    const feedbackData = {
      category,
      dept_id: deptId || undefined,
      message: message.trim(),
    }
    submitFeedbackMutation.mutate(feedbackData)
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <Badge variant="secondary" className="flex items-center space-x-1">
            <Clock className="w-3 h-3" />
            <span>Menunggu</span>
          </Badge>
        )
      case "reviewed":
        return (
          <Badge className="bg-blue-600 flex items-center space-x-1">
            <AlertCircle className="w-3 h-3" />
            <span>Ditinjau</span>
          </Badge>
        )
      case "resolved":
        return (
          <Badge className="bg-green-600 flex items-center space-x-1">
            <CheckCircle className="w-3 h-3" />
            <span>Selesai</span>
          </Badge>
        )
      default:
        return <Badge variant="secondary">Menunggu</Badge>
    }
  }

  const getCategoryBadge = (category: string) => {
    const categoryMap: Record<string, { label: string; color: string }> = {
      prediction_accuracy: { label: "Akurasi Prediksi", color: "bg-blue-600" },
      data_quality: { label: "Kualitas Data", color: "bg-green-600" },
      system_performance: { label: "Performa Sistem", color: "bg-purple-600" },
      feature_request: { label: "Permintaan Fitur", color: "bg-orange-600" },
      bug_report: { label: "Laporan Bug", color: "bg-red-600" },
      general: { label: "Umum", color: "bg-gray-600" },
    }

    const categoryInfo = categoryMap[category] || { label: category, color: "bg-gray-600" }
    return <Badge className={`${categoryInfo.color} text-white`}>{categoryInfo.label}</Badge>
  }

  // Type-safe feedback history
  const typedFeedbackHistory = feedbackHistory as FeedbackData[]

  return (
    <div className="space-y-6">
      {/* Feedback Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <MessageSquare className="w-5 h-5" />
            <span>Kirim Umpan Balik</span>
          </CardTitle>
          <CardDescription>Bantu kami meningkatkan sistem dengan memberikan umpan balik Anda</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category">Kategori *</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih kategori" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="prediction_accuracy">Akurasi Prediksi</SelectItem>
                    <SelectItem value="data_quality">Kualitas Data</SelectItem>
                    <SelectItem value="system_performance">Performa Sistem</SelectItem>
                    <SelectItem value="feature_request">Permintaan Fitur</SelectItem>
                    <SelectItem value="bug_report">Laporan Bug</SelectItem>
                    <SelectItem value="general">Umum</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="dept_id">ID Departemen (Opsional)</Label>
                <Input
                  id="dept_id"
                  placeholder="Contoh: D001, 1, 2, dst."
                  value={deptId}
                  onChange={(e) => setDeptId(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="message">Pesan *</Label>
              <Textarea
                id="message"
                placeholder="Jelaskan secara detail umpan balik Anda..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={4}
              />
            </div>
            <Button type="submit" disabled={isSubmitting} className="w-full md:w-auto">
              {isSubmitting ? (
                <>
                  <Clock className="w-4 h-4 mr-2 animate-spin" />
                  Mengirim...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Kirim Umpan Balik
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Feedback History */}
      <Card>
        <CardHeader>
          <CardTitle>Riwayat Umpan Balik</CardTitle>
          <CardDescription>Umpan balik yang telah dikirimkan ke sistem</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <Clock className="w-6 h-6 animate-spin mx-auto mb-2" />
              <p>Memuat riwayat umpan balik...</p>
            </div>
          ) : typedFeedbackHistory.length > 0 ? (
            <div className="space-y-4">
              {typedFeedbackHistory.map((feedback) => (
                <div key={`feedback-${feedback.id}`} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      {getCategoryBadge(feedback.category)}
                      {feedback.dept_id && <Badge variant="outline">Dept: {feedback.dept_id}</Badge>}
                    </div>
                    {getStatusBadge(feedback.status || "pending")}
                  </div>

                  <div className="space-y-2">
                    <p className="text-sm text-gray-700">{feedback.message}</p>

                    {feedback.response && (
                      <div className="bg-blue-50 border-l-4 border-blue-400 p-3 rounded">
                        <p className="text-sm font-medium text-blue-800 mb-1">Tanggapan Tim:</p>
                        <p className="text-sm text-blue-700">{feedback.response}</p>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>
                      Dikirim:{" "}
                      {new Date(feedback.created_at).toLocaleDateString("id-ID", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                    {feedback.updated_at && feedback.updated_at !== feedback.created_at && (
                      <span>
                        Diperbarui:{" "}
                        {new Date(feedback.updated_at).toLocaleDateString("id-ID", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium mb-2">Belum Ada Umpan Balik</p>
              <p>Kirim umpan balik pertama Anda untuk membantu meningkatkan sistem!</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tips Section */}
      <Card>
        <CardHeader>
          <CardTitle>Tips Memberikan Umpan Balik yang Efektif</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h4 className="font-semibold text-green-700">✅ Yang Sebaiknya Dilakukan:</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-start space-x-2">
                  <span className="text-green-600 mt-1">•</span>
                  <span>Jelaskan masalah secara spesifik dan detail</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-green-600 mt-1">•</span>
                  <span>Sertakan langkah-langkah untuk mereproduksi masalah</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-green-600 mt-1">•</span>
                  <span>Berikan contoh konkret atau screenshot jika memungkinkan</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-green-600 mt-1">•</span>
                  <span>Sebutkan departemen atau data yang terkait</span>
                </li>
              </ul>
            </div>
            <div className="space-y-3">
              <h4 className="font-semibold text-red-700">❌ Yang Sebaiknya Dihindari:</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-start space-x-2">
                  <span className="text-red-600 mt-1">•</span>
                  <span>Pesan yang terlalu singkat atau tidak jelas</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-red-600 mt-1">•</span>
                  <span>Mengirim umpan balik yang sama berulang kali</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-red-600 mt-1">•</span>
                  <span>Menggunakan bahasa yang tidak sopan</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-red-600 mt-1">•</span>
                  <span>Tidak memilih kategori yang sesuai</span>
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
