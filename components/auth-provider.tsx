"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState } from "react"
import { useRouter } from "next/navigation"

type User = {
  id: string
  username: string
  role: "main_admin" | "admin" | "manager"
  name: string
}

type AuthContextType = {
  user: User | null
  login: (username: string, password: string) => Promise<boolean>
  logout: () => void
  isLoading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    // Check for existing session
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem("access_token")
        const savedUser = localStorage.getItem("user")

        console.log("DEBUG AUTH: Checking existing auth - Token exists:", !!token, "User exists:", !!savedUser)

        if (token && savedUser) {
          const userData = JSON.parse(savedUser)
          console.log("DEBUG AUTH: Found saved user:", userData)

          // Verify token is still valid by calling backend
          const response = await fetch("http://localhost:8000/auth/me", {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          })

          if (response.ok) {
            const currentUser = await response.json()
            console.log("DEBUG AUTH: Token is valid, current user:", currentUser)
            setUser({
              id: currentUser.id.toString(),
              username: currentUser.username,
              role: currentUser.role,
              name: currentUser.name,
            })

            // Set cookie for middleware
            document.cookie = `user=${encodeURIComponent(
              JSON.stringify({
                id: currentUser.id.toString(),
                username: currentUser.username,
                role: currentUser.role,
                name: currentUser.name,
              }),
            )}; path=/; max-age=${60 * 60 * 24 * 7}`
          } else {
            console.log("DEBUG AUTH: Token is invalid, clearing storage")
            // Token is invalid, clear storage
            localStorage.removeItem("access_token")
            localStorage.removeItem("user")
            document.cookie = "user=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT"
          }
        } else {
          console.log("DEBUG AUTH: No existing auth found")
        }
      } catch (error) {
        console.error("DEBUG AUTH: Error checking auth:", error)
        // Clear storage on error
        localStorage.removeItem("access_token")
        localStorage.removeItem("user")
        document.cookie = "user=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT"
      }

      setIsLoading(false)
    }

    checkAuth()
  }, [])

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      console.log("DEBUG AUTH: Attempting login for:", username)

      const response = await fetch("http://localhost:8000/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      })

      if (response.ok) {
        const data = await response.json()
        console.log("DEBUG AUTH: Login successful:", data)

        const userData = {
          id: data.user.id.toString(),
          username: data.user.username,
          role: data.user.role,
          name: data.user.name,
        }

        // Store token and user data
        localStorage.setItem("access_token", data.access_token)
        localStorage.setItem("user", JSON.stringify(userData))
        setUser(userData)

        // Set cookie for middleware
        document.cookie = `user=${encodeURIComponent(JSON.stringify(userData))}; path=/; max-age=${60 * 60 * 24 * 7}`

        // Redirect based on role
        switch (data.user.role) {
          case "main_admin":
            router.push("/main-admin")
            break
          case "admin":
            router.push("/admin")
            break
          case "manager":
            router.push("/manager")
            break
        }
        return true
      } else {
        const errorData = await response.json()
        console.error("DEBUG AUTH: Login failed:", errorData)
        return false
      }
    } catch (error) {
      console.error("DEBUG AUTH: Login error:", error)
      return false
    }
  }

  const logout = () => {
    console.log("DEBUG AUTH: Logging out")
    setUser(null)
    localStorage.removeItem("access_token")
    localStorage.removeItem("user")
    // Clear cookie
    document.cookie = "user=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT"
    router.push("/login")
  }

  return <AuthContext.Provider value={{ user, login, logout, isLoading }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth harus digunakan dalam AuthProvider")
  }
  return context
}
