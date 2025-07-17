"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { User, Lock, Settings, Bell } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/components/auth-provider"
import { useMutation } from "react-query"

export function ProfileSettings() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [profileData, setProfileData] = useState({
    name: user?.name || "",
    email: user?.email || "",
    username: user?.username || "",
  })
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  })
  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    pushNotifications: false,
    weeklyReports: true,
    systemAlerts: true,
  })

  // Update profile mutation
  const updateProfileMutation = useMutation(
    async (data: typeof profileData) => {
      const response = await fetch("/api/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        },
        body: JSON.stringify(data),
      })
      if (!response.ok) throw new Error("Failed to update profile")
      return response.json()
    },
    {
      onSuccess: () => {
        toast({
          title: "Profil Diperbarui",
          description: "Informasi profil berhasil diperbarui",
        })
      },
      onError: (error: any) => {
        toast({
          title: "Gagal Memperbarui Profil",
          description: error.message || "Terjadi kesalahan saat memperbarui profil",
          variant: "destructive",
        })
      },
    },
  )

  // Change password mutation
  const changePasswordMutation = useMutation(
    async (data: typeof passwordData) => {
      const response = await fetch("/api/profile/change-password", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        },
        body: JSON.stringify(data),
      })
      if (!response.ok) throw new Error("Failed to change password")
      return response.json()
    },
    {
      onSuccess: () => {
        toast({
          title: "Password Diubah",
          description: "Password berhasil diubah",
        })
        setPasswordData({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        })
      },
      onError: (error: any) => {
        toast({
          title: "Gagal Mengubah Password",
          description: error.message || "Terjadi kesalahan saat mengubah password",
          variant: "destructive",
        })
      },
    },
  )

  // Update notification settings mutation
  const updateNotificationsMutation = useMutation(
    async (data: typeof notificationSettings) => {
      const response = await fetch("/api/profile/notifications", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        },
        body: JSON.stringify(data),
      })
      if (!response.ok) throw new Error("Failed to update notifications")
      return response.json()
    },
    {
      onSuccess: () => {
        toast({
          title: "Pengaturan Notifikasi Diperbarui",
          description: "Pengaturan notifikasi berhasil disimpan",
        })
      },
      onError: (error: any) => {
        toast({
          title: "Gagal Memperbarui Notifikasi",
          description: error.message || "Terjadi kesalahan saat memperbarui notifikasi",
          variant: "destructive",
        })
      },
    },
  )

  const handleUpdateProfile = () => {
    if (!profileData.name || !profileData.username) {
      toast({
        title: "Error",
        description: "Nama dan username harus diisi",
        variant: "destructive",
      })
      return
    }
    updateProfileMutation.mutate(profileData)
  }

  const handleChangePassword = () => {
    if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      toast({
        title: "Error",
        description: "Semua field password harus diisi",
        variant: "destructive",
      })
      return
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast({
        title: "Error",
        description: "Password baru dan konfirmasi password tidak cocok",
        variant: "destructive",
      })
      return
    }

    if (passwordData.newPassword.length < 6) {
      toast({
        title: "Error",
        description: "Password baru minimal 6 karakter",
        variant: "destructive",
      })
      return
    }

    changePasswordMutation.mutate(passwordData)
  }

  const handleUpdateNotifications = () => {
    updateNotificationsMutation.mutate(notificationSettings)
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center space-x-4">
        <Avatar className="h-16 w-16">
          <AvatarFallback className="bg-blue-600 text-white text-xl">
            {user?.name
              ?.split(" ")
              .map((n) => n[0])
              .join("")}
          </AvatarFallback>
        </Avatar>
        <div>
          <h1 className="text-2xl font-bold">{user?.name}</h1>
          <p className="text-gray-600">@{user?.username}</p>
          <p className="text-sm text-gray-500 capitalize">{user?.role?.replace("_", " ")}</p>
        </div>
      </div>

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="profile">
            <User className="w-4 h-4 mr-2" />
            Profil
          </TabsTrigger>
          <TabsTrigger value="security">
            <Lock className="w-4 h-4 mr-2" />
            Keamanan
          </TabsTrigger>
          <TabsTrigger value="notifications">
            <Bell className="w-4 h-4 mr-2" />
            Notifikasi
          </TabsTrigger>
          <TabsTrigger value="preferences">
            <Settings className="w-4 h-4 mr-2" />
            Preferensi
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>Informasi Profil</CardTitle>
              <CardDescription>Kelola informasi profil Anda</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Nama Lengkap</Label>
                  <Input
                    id="name"
                    value={profileData.name}
                    onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                    placeholder="Masukkan nama lengkap"
                  />
                </div>
                <div>
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    value={profileData.username}
                    onChange={(e) => setProfileData({ ...profileData, username: e.target.value })}
                    placeholder="Masukkan username"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={profileData.email}
                  onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                  placeholder="Masukkan email"
                />
              </div>
              <div className="flex justify-end">
                <Button onClick={handleUpdateProfile} disabled={updateProfileMutation.isLoading}>
                  {updateProfileMutation.isLoading ? "Menyimpan..." : "Simpan Perubahan"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle>Ubah Password</CardTitle>
              <CardDescription>Kelola keamanan akun Anda</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="currentPassword">Password Saat Ini</Label>
                <Input
                  id="currentPassword"
                  type="password"
                  value={passwordData.currentPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                  placeholder="Masukkan password saat ini"
                />
              </div>
              <div>
                <Label htmlFor="newPassword">Password Baru</Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                  placeholder="Masukkan password baru"
                />
              </div>
              <div>
                <Label htmlFor="confirmPassword">Konfirmasi Password Baru</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                  placeholder="Konfirmasi password baru"
                />
              </div>
              <div className="flex justify-end">
                <Button onClick={handleChangePassword} disabled={changePasswordMutation.isLoading}>
                  {changePasswordMutation.isLoading ? "Mengubah..." : "Ubah Password"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>Pengaturan Notifikasi</CardTitle>
              <CardDescription>Kelola preferensi notifikasi Anda</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Email Notifications</Label>
                  <p className="text-sm text-gray-500">Terima notifikasi melalui email</p>
                </div>
                <input
                  type="checkbox"
                  checked={notificationSettings.emailNotifications}
                  onChange={(e) =>
                    setNotificationSettings({
                      ...notificationSettings,
                      emailNotifications: e.target.checked,
                    })
                  }
                  className="h-4 w-4"
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>Push Notifications</Label>
                  <p className="text-sm text-gray-500">Terima notifikasi push di browser</p>
                </div>
                <input
                  type="checkbox"
                  checked={notificationSettings.pushNotifications}
                  onChange={(e) =>
                    setNotificationSettings({
                      ...notificationSettings,
                      pushNotifications: e.target.checked,
                    })
                  }
                  className="h-4 w-4"
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>Weekly Reports</Label>
                  <p className="text-sm text-gray-500">Terima laporan mingguan</p>
                </div>
                <input
                  type="checkbox"
                  checked={notificationSettings.weeklyReports}
                  onChange={(e) =>
                    setNotificationSettings({
                      ...notificationSettings,
                      weeklyReports: e.target.checked,
                    })
                  }
                  className="h-4 w-4"
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>System Alerts</Label>
                  <p className="text-sm text-gray-500">Terima alert sistem penting</p>
                </div>
                <input
                  type="checkbox"
                  checked={notificationSettings.systemAlerts}
                  onChange={(e) =>
                    setNotificationSettings({
                      ...notificationSettings,
                      systemAlerts: e.target.checked,
                    })
                  }
                  className="h-4 w-4"
                />
              </div>
              <div className="flex justify-end">
                <Button onClick={handleUpdateNotifications} disabled={updateNotificationsMutation.isLoading}>
                  {updateNotificationsMutation.isLoading ? "Menyimpan..." : "Simpan Pengaturan"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="preferences">
          <Card>
            <CardHeader>
              <CardTitle>Preferensi Sistem</CardTitle>
              <CardDescription>Atur preferensi penggunaan sistem</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Bahasa</Label>
                <select className="w-full p-2 border border-gray-300 rounded-md mt-1">
                  <option value="id">Bahasa Indonesia</option>
                  <option value="en">English</option>
                </select>
              </div>
              <div>
                <Label>Timezone</Label>
                <select className="w-full p-2 border border-gray-300 rounded-md mt-1">
                  <option value="Asia/Jakarta">Asia/Jakarta (WIB)</option>
                  <option value="Asia/Makassar">Asia/Makassar (WITA)</option>
                  <option value="Asia/Jayapura">Asia/Jayapura (WIT)</option>
                </select>
              </div>
              <div>
                <Label>Theme</Label>
                <select className="w-full p-2 border border-gray-300 rounded-md mt-1">
                  <option value="light">Light</option>
                  <option value="dark">Dark</option>
                  <option value="system">System</option>
                </select>
              </div>
              <div className="flex justify-end">
                <Button>Simpan Preferensi</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
