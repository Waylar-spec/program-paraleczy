import { NextRequest, NextResponse } from "next/server"
import { revalidateTag } from "next/cache"

export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-revalidate-secret")
  if (!secret || secret !== process.env.SUPABASE_SECRET_KEY) {
    return NextResponse.json({ error: "Brak autoryzacji" }, { status: 401 })
  }
  revalidateTag("exercises", "max")
  return NextResponse.json({ ok: true })
}
