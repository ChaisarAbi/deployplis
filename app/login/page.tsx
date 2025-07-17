"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { useAuth } from "@/components/auth-provider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2 } from "lucide-react"

export default function LoginPage() {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [year, setYear] = useState<number | null>(null)
  const { login } = useAuth()

  useEffect(() => {
    setYear(new Date().getFullYear())
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    const success = await login(username, password)
    if (!success) {
      setError("Username atau password salah")
    }
    setIsLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-200 p-4 relative">
      <Card className="w-full max-w-md shadow-lg border border-indigo-200">
        <div className="flex items-center justify-center mb-4">
          <img
            src="img.jpg"
            alt="Logo"
            className="h-24 w-auto rounded-lg shadow-md border border-gray-200"
          />
        </div>
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-indigo-700">CV. PRINTNESIA DIGITAL PRINTING</CardTitle>
          <CardDescription className="text-sm text-gray-600">Analisis Penjualan</CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username" className="text-sm font-medium text-gray-700">Username</Label>
              <Input
                id="username"
                type="text"
                autoComplete="off"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                disabled={isLoading}
                className="focus:ring-2 focus:ring-indigo-400"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium text-gray-700">Password</Label>
              <Input
                id="password"
                type="password"
                autoComplete="off"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
                className="focus:ring-2 focus:ring-indigo-400"
              />
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button
              type="submit"
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold transition-colors duration-200"
              disabled={isLoading}
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Masuk
            </Button>
          </form>

          <div className="mt-6 p-4 bg-indigo-50 rounded-lg border border-indigo-100">
            <p className="text-sm font-medium mb-2 text-indigo-700">Daftar Pengguna</p>
            <div className="text-xs space-y-1 text-gray-700">
              <div><strong>Admin Utama:</strong> mainadmin / admin123</div>
              <div><strong>Administrator:</strong> admin / admin123</div>
              <div><strong>Manajer:</strong> manager / manager123</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Copyright aman dari hydration mismatch */}
      {year && (
        <div className="absolute bottom-4 text-center text-xs text-gray-500 w-full">
          © {year} Nendi Setiawan. All rights reserved.
        </div>
      )}
    </div>
  )
}