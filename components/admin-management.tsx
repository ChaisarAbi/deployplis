"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Plus, Edit, Trash2, RefreshCw, Key, UserCheck, UserX } from "lucide-react"
import { useQuery, useMutation, useQueryClient } from "react-query"
import { useToast } from "@/hooks/use-toast"
import { adminAPI } from "@/lib/api"

interface User {
  id: number
  username: string
  name: string
  email: string
  role: string
  is_active: boolean
  created_at: string
}

interface CreateUserData {
  username: string
  name: string
  email: string
  password: string
  role: string
}

interface UpdateUserData {
  name?: string
  email?: string
  role?: string
}

export function AdminManagement() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [createForm, setCreateForm] = useState<CreateUserData>({
    username: "",
    name: "",
    email: "",
    password: "",
    role: "manager",
  })
  const [editForm, setEditForm] = useState<UpdateUserData>({})

  const { toast } = useToast()
  const queryClient = useQueryClient()

  // Fetch users
  const {
    data: users = [],
    isLoading,
    refetch,
  } = useQuery<User[]>("users", adminAPI.getAllUsers, {
    retry: 1,
    refetchOnWindowFocus: false,
  })

  // Create user mutation
  const createUserMutation = useMutation((userData: CreateUserData) => adminAPI.createUser(userData), {
    onSuccess: () => {
      queryClient.invalidateQueries("users")
      setIsCreateDialogOpen(false)
      setCreateForm({
        username: "",
        name: "",
        email: "",
        password: "",
        role: "manager",
      })
      toast({
        title: "Berhasil",
        description: "Pengguna baru berhasil dibuat",
      })
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.response?.data?.detail || "Gagal membuat pengguna",
        variant: "destructive",
      })
    },
  })

  // Update user mutation
  const updateUserMutation = useMutation(
    ({ userId, userData }: { userId: number; userData: UpdateUserData }) => adminAPI.updateUser(userId, userData),
    {
      onSuccess: () => {
        queryClient.invalidateQueries("users")
        setIsEditDialogOpen(false)
        setSelectedUser(null)
        setEditForm({})
        toast({
          title: "Berhasil",
          description: "Data pengguna berhasil diperbarui",
        })
      },
      onError: (error: any) => {
        toast({
          title: "Error",
          description: error.response?.data?.detail || "Gagal memperbarui pengguna",
          variant: "destructive",
        })
      },
    },
  )

  // Delete user mutation
  const deleteUserMutation = useMutation((userId: number) => adminAPI.deleteUser(userId), {
    onSuccess: () => {
      queryClient.invalidateQueries("users")
      toast({
        title: "Berhasil",
        description: "Pengguna berhasil dihapus",
      })
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.response?.data?.detail || "Gagal menghapus pengguna",
        variant: "destructive",
      })
    },
  })

  // Reset password mutation
  const resetPasswordMutation = useMutation((userId: number) => adminAPI.resetPassword(userId), {
    onSuccess: (data) => {
      toast({
        title: "Berhasil",
        description: data.message || "Password berhasil direset",
      })
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.response?.data?.detail || "Gagal mereset password",
        variant: "destructive",
      })
    },
  })

  // Update user status mutation
  const updateStatusMutation = useMutation(
    ({ userId, status }: { userId: number; status: string }) => adminAPI.updateUserStatus(userId, status),
    {
      onSuccess: () => {
        queryClient.invalidateQueries("users")
        toast({
          title: "Berhasil",
          description: "Status pengguna berhasil diperbarui",
        })
      },
      onError: (error: any) => {
        toast({
          title: "Error",
          description: error.response?.data?.detail || "Gagal memperbarui status",
          variant: "destructive",
        })
      },
    },
  )

  const handleCreateUser = () => {
    if (!createForm.username || !createForm.name || !createForm.email || !createForm.password) {
      toast({
        title: "Error",
        description: "Semua field harus diisi",
        variant: "destructive",
      })
      return
    }
    createUserMutation.mutate(createForm)
  }

  const handleEditUser = () => {
    if (!selectedUser) return
    updateUserMutation.mutate({
      userId: selectedUser.id,
      userData: editForm,
    })
  }

  const handleDeleteUser = (userId: number) => {
    deleteUserMutation.mutate(userId)
  }

  const handleResetPassword = (userId: number) => {
    resetPasswordMutation.mutate(userId)
  }

  const handleToggleStatus = (userId: number, currentStatus: boolean) => {
    const newStatus = currentStatus ? "inactive" : "active"
    updateStatusMutation.mutate({ userId, status: newStatus })
  }

  const openEditDialog = (user: User) => {
    setSelectedUser(user)
    setEditForm({
      name: user.name,
      email: user.email,
      role: user.role,
    })
    setIsEditDialogOpen(true)
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "main_admin":
        return "bg-purple-600"
      case "admin":
        return "bg-blue-600"
      case "manager":
        return "bg-green-600"
      default:
        return "bg-gray-600"
    }
  }

  const getRoleLabel = (role: string) => {
    switch (role) {
      case "main_admin":
        return "Main Admin"
      case "admin":
        return "Admin"
      case "manager":
        return "Manager"
      default:
        return role
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Manajemen Pengguna</h2>
          <p className="text-muted-foreground">Kelola admin dan manager sistem</p>
        </div>
        <div className="flex space-x-2">
          <Button onClick={() => refetch()} disabled={isLoading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Tambah Pengguna
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Tambah Pengguna Baru</DialogTitle>
                <DialogDescription>Buat akun baru untuk admin atau manager</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    value={createForm.username}
                    onChange={(e) => setCreateForm({ ...createForm, username: e.target.value })}
                    placeholder="Masukkan username"
                  />
                </div>
                <div>
                  <Label htmlFor="name">Nama Lengkap</Label>
                  <Input
                    id="name"
                    value={createForm.name}
                    onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                    placeholder="Masukkan nama lengkap"
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={createForm.email}
                    onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                    placeholder="Masukkan email"
                  />
                </div>
                <div>
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={createForm.password}
                    onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                    placeholder="Masukkan password"
                  />
                </div>
                <div>
                  <Label htmlFor="role">Role</Label>
                  <Select
                    value={createForm.role}
                    onValueChange={(value) => setCreateForm({ ...createForm, role: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="manager">Manager</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                    Batal
                  </Button>
                  <Button onClick={handleCreateUser} disabled={createUserMutation.isLoading}>
                    {createUserMutation.isLoading ? "Membuat..." : "Buat Pengguna"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Daftar Pengguna</CardTitle>
          <CardDescription>Kelola semua admin dan manager dalam sistem</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Memuat data pengguna...</div>
          ) : users.length === 0 ? (
            <div className="text-center py-8 text-gray-500">Belum ada pengguna yang terdaftar</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nama</TableHead>
                  <TableHead>Username</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Dibuat</TableHead>
                  <TableHead>Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.name}</TableCell>
                    <TableCell>{user.username}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Badge className={`${getRoleBadgeColor(user.role)} text-white`}>{getRoleLabel(user.role)}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={user.is_active ? "default" : "secondary"}>
                        {user.is_active ? "Aktif" : "Nonaktif"}
                      </Badge>
                    </TableCell>
                    <TableCell>{new Date(user.created_at).toLocaleDateString("id-ID")}</TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button variant="outline" size="sm" onClick={() => openEditDialog(user)}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => handleToggleStatus(user.id, user.is_active)}>
                          {user.is_active ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => handleResetPassword(user.id)}>
                          <Key className="w-4 h-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="outline" size="sm">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Hapus Pengguna</AlertDialogTitle>
                              <AlertDialogDescription>
                                Apakah Anda yakin ingin menghapus pengguna {user.name}? Tindakan ini tidak dapat
                                dibatalkan.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Batal</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDeleteUser(user.id)}>Hapus</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Edit User Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Pengguna</DialogTitle>
            <DialogDescription>Perbarui informasi pengguna</DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-name">Nama Lengkap</Label>
                <Input
                  id="edit-name"
                  value={editForm.name || ""}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  placeholder="Masukkan nama lengkap"
                />
              </div>
              <div>
                <Label htmlFor="edit-email">Email</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={editForm.email || ""}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  placeholder="Masukkan email"
                />
              </div>
              <div>
                <Label htmlFor="edit-role">Role</Label>
                <Select
                  value={editForm.role || ""}
                  onValueChange={(value) => setEditForm({ ...editForm, role: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="manager">Manager</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                  Batal
                </Button>
                <Button onClick={handleEditUser} disabled={updateUserMutation.isLoading}>
                  {updateUserMutation.isLoading ? "Menyimpan..." : "Simpan Perubahan"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
