import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

// Email verification types Supabase's `verifyOtp` accepts for a token_hash link.
type EmailOtpType = "signup" | "invite" | "magiclink" | "recovery" | "email_change" | "email"

// Shared landing point for Supabase email links (password recovery, invites, etc).
// See: https://supabase.com/docs/guides/auth/server-side/nextjs
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const token_hash = searchParams.get("token_hash")
  const type = searchParams.get("type") as EmailOtpType | null
  const next = searchParams.get("next") ?? "/pacjenci"

  if (token_hash && type) {
    const supabase = await createClient()
    await supabase.auth.verifyOtp({ type, token_hash })
  }

  return NextResponse.redirect(`${origin}${next}`)
}
