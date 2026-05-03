import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Refresh session cookies — getSession() reads from cookie, no network call
  // Auth guard (redirect) stays in (dashboard)/layout.tsx
  await supabase.auth.getSession()

  return supabaseResponse
}

// Tight matcher — only runs on actual app pages, not on API/static/assets
export const config = {
  matcher: [
    "/biblioteka/:path*",
    "/pacjenci/:path*",
    "/ustawienia/:path*",
    "/drukuj/:path*",
  ],
}
