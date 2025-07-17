import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(request: NextRequest) {
  console.log("DEBUG MIDDLEWARE: Processing request for:", request.nextUrl.pathname)

  // Get the pathname of the request (e.g. /, /admin, /manager)
  const path = request.nextUrl.pathname

  // Define public paths that don't require authentication
  const publicPaths = ["/login", "/"]

  // Check if the path is public
  const isPublicPath = publicPaths.includes(path)

  // Get the token from cookies
  const userCookie = request.cookies.get("user")?.value
  console.log("DEBUG MIDDLEWARE: User cookie exists:", !!userCookie)

  // If it's a public path and user is logged in, redirect to appropriate dashboard
  if (isPublicPath && userCookie) {
    try {
      const user = JSON.parse(decodeURIComponent(userCookie))
      console.log("DEBUG MIDDLEWARE: User found in cookie:", user)

      if (path === "/" || path === "/login") {
        console.log("DEBUG MIDDLEWARE: Redirecting logged-in user to dashboard")
        switch (user.role) {
          case "main_admin":
            return NextResponse.redirect(new URL("/main-admin", request.url))
          case "admin":
            return NextResponse.redirect(new URL("/admin", request.url))
          case "manager":
            return NextResponse.redirect(new URL("/manager", request.url))
        }
      }
    } catch (error) {
      // Invalid token, continue to login
      console.error("DEBUG MIDDLEWARE: Error parsing user cookie:", error)
    }
  }

  // If it's a protected path and no token, redirect to login
  if (!isPublicPath && !userCookie) {
    console.log("DEBUG MIDDLEWARE: No auth for protected path, redirecting to login")
    return NextResponse.redirect(new URL("/login", request.url))
  }

  // If user is trying to access a role-specific path, check permissions
  if (userCookie && !isPublicPath) {
    try {
      const user = JSON.parse(decodeURIComponent(userCookie))
      console.log("DEBUG MIDDLEWARE: Checking role access for:", user.role, "accessing:", path)

      // Check role-based access
      if (path.startsWith("/main-admin") && user.role !== "main_admin") {
        console.log("DEBUG MIDDLEWARE: Access denied for main-admin path")
        return NextResponse.redirect(new URL("/login", request.url))
      }

      if (path.startsWith("/admin") && user.role !== "admin") {
        console.log("DEBUG MIDDLEWARE: Access denied for admin path")
        return NextResponse.redirect(new URL("/login", request.url))
      }

      if (path.startsWith("/manager") && user.role !== "manager") {
        console.log("DEBUG MIDDLEWARE: Access denied for manager path")
        return NextResponse.redirect(new URL("/login", request.url))
      }
    } catch (error) {
      console.error("DEBUG MIDDLEWARE: Error parsing user cookie for role check:", error)
      return NextResponse.redirect(new URL("/login", request.url))
    }
  }

  console.log("DEBUG MIDDLEWARE: Request allowed to proceed")
  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
}
