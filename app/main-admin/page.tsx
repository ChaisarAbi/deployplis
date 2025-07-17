"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Users,
  Database,
  Brain,
  TrendingUp,
  Activity,
  Download,
  Settings,
  BarChart3,
  FileText,
  AlertCircle,
  CheckCircle,
} from "lucide-react"
import { useQuery } from "react-query"
import { dashboardAPI, activitiesAPI, reportsAPI } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import { DashboardLayout } from "@/components/dashboard-layout"
import { AdminManagement } from "@/components/admin-management"
import { ModelMonitoring } from "@/components/model-monitoring"
import { DataOverview } from "@/components/data-overview"

interface DashboardStats {
  total_datasets: number
  total_models: number
  total_predictions: number
  total_feedback: number
  total_users: number
}

interface RecentActivity {
  id: string
  user: string
  action: string
  type: string
  time: string
}

export default function MainAdminDashboard() {
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState("overview")

  // Get dashboard stats
  const { data: stats, isLoading: statsLoading } = useQuery<DashboardStats>(
    "dashboard-stats",
    () => dashboardAPI.getStats(),
    {
      refetchInterval: 30000, // Refresh every 30 seconds
    },
  )

  // Get recent activities
  const { data: activities = [], isLoading: activitiesLoading } = useQuery<RecentActivity[]>(
    "recent-activities",
    () => activitiesAPI.getRecent(),
    {
      refetchInterval: 60000, // Refresh every minute
    },
  )

  const handleGenerateReport = async () => {
    try {
      const blob = await reportsAPI.generate()

      // Create download link
      const url = window.URL.createObjectURL(blob as Blob)
      const link = document.createElement("a")
      link.href = url
      link.download = `system-report-${new Date().toISOString().split("T")[0]}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)

      toast({
        title: "Laporan Berhasil Dibuat",
        description: "Laporan sistem telah diunduh ke perangkat Anda",
      })
    } catch (error) {
      toast({
        title: "Gagal Membuat Laporan",
        description: "Terjadi kesalahan saat membuat laporan",
        variant: "destructive",
      })
    }
  }

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "data":
        return <Database className="w-4 h-4" />
      case "model":
        return <Brain className="w-4 h-4" />
      case "feedback":
        return <AlertCircle className="w-4 h-4" />
      case "optimization":
        return <Settings className="w-4 h-4" />
      default:
        return <Activity className="w-4 h-4" />
    }
  }

  const getActivityColor = (type: string) => {
    switch (type) {
      case "data":
        return "text-blue-600"
      case "model":
        return "text-green-600"
      case "feedback":
        return "text-orange-600"
      case "optimization":
        return "text-purple-600"
      default:
        return "text-gray-600"
    }
  }

  return (
    <DashboardLayout title="Dashboard Main Admin">
      {/* Logo dan Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-4">
          <img src="/img1.jpeg" alt="Logo" className="h-10 w-auto" />
          <h1 className="text-2xl font-semibold">CV. Printnesia Digital Printing</h1>
        </div>
      </div>
      <div className="space-y-6">
        <p className="text-gray-600">Kelola sistem, Monitor Performa, dan Analisis Data</p>
        <div className="flex justify-between items-center">
          <Button onClick={handleGenerateReport} className="flex items-center space-x-2">
            <Download className="w-4 h-4" />
            <span>Generate Laporan</span>
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="admin-management">Manajemen Admin</TabsTrigger>
            <TabsTrigger value="model-monitoring">Monitor Model</TabsTrigger>
            <TabsTrigger value="data-overview">Data Overview</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{statsLoading ? "..." : stats?.total_users || 0}</div>
                  <p className="text-xs text-muted-foreground">Admin & Manager</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Datasets</CardTitle>
                  <Database className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{statsLoading ? "..." : stats?.total_datasets || 0}</div>
                  <p className="text-xs text-muted-foreground">Data tersimpan</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Models</CardTitle>
                  <Brain className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{statsLoading ? "..." : stats?.total_models || 0}</div>
                  <p className="text-xs text-muted-foreground">Model terlatih</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Predictions</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{statsLoading ? "..." : stats?.total_predictions || 0}</div>
                  <p className="text-xs text-muted-foreground">Prediksi dibuat</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Feedback</CardTitle>
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{statsLoading ? "..." : stats?.total_feedback || 0}</div>
                  <p className="text-xs text-muted-foreground">Umpan balik</p>
                </CardContent>
              </Card>
            </div>

            {/* Recent Activities */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Activity className="w-5 h-5" />
                  <span>Aktivitas Terbaru</span>
                </CardTitle>
                <CardDescription>Aktivitas sistem dalam 24 jam terakhir</CardDescription>
              </CardHeader>
              <CardContent>
                {activitiesLoading ? (
                  <div className="text-center py-4">Memuat aktivitas...</div>
                ) : activities && activities.length > 0 ? (
                  <div className="space-y-4">
                    {activities.map((activity) => (
                      <div key={activity.id} className="flex items-start space-x-3 p-3 rounded-lg bg-gray-50">
                        <div className={`mt-1 ${getActivityColor(activity.type)}`}>
                          {getActivityIcon(activity.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900">{activity.action}</p>
                          <div className="flex items-center space-x-2 mt-1">
                            <Badge variant="outline" className="text-xs">
                              {activity.user}
                            </Badge>
                            <span className="text-xs text-gray-500">{activity.time}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">Belum ada aktivitas terbaru</div>
                )}
              </CardContent>
            </Card>

            {/* System Status */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Status Sistem</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Database</span>
                    <Badge className="bg-green-600">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Online
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">ML Service</span>
                    <Badge className="bg-green-600">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Running
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">API</span>
                    <Badge className="bg-green-600">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Healthy
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Performance</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Response Time</span>
                    <Badge variant="outline">~150ms</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Uptime</span>
                    <Badge variant="outline">99.9%</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Memory Usage</span>
                    <Badge variant="outline">68%</Badge>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-start bg-transparent"
                    onClick={() => setActiveTab("admin-management")}
                  >
                    <Users className="w-4 h-4 mr-2" />
                    Kelola Admin
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-start bg-transparent"
                    onClick={() => setActiveTab("model-monitoring")}
                  >
                    <Brain className="w-4 h-4 mr-2" />
                    Monitor Model
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-start bg-transparent"
                    onClick={() => setActiveTab("data-overview")}
                  >
                    <BarChart3 className="w-4 h-4 mr-2" />
                    Lihat Data
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="admin-management">
            <AdminManagement />
          </TabsContent>

          <TabsContent value="model-monitoring">
            <ModelMonitoring />
          </TabsContent>

          <TabsContent value="data-overview">
            <DataOverview />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}
