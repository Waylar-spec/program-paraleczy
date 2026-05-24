import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createServiceClient } from "@/lib/supabase/service"

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Brak autoryzacji" }, { status: 401 })

    const formData = await req.formData()
    const file = formData.get("file") as File
    if (!file) return NextResponse.json({ error: "Brak pliku" }, { status: 400 })

    const ext = (file.name ?? "file").split(".").pop()?.toLowerCase() ?? "webp"
    const path = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

    const storage = createServiceClient().storage
    const { error } = await storage
      .from("exercise-media")
      .upload(path, file, { contentType: file.type || "image/webp", upsert: false })

    if (error) return NextResponse.json({ error: `Storage: ${error.message}` }, { status: 500 })

    const { data: { publicUrl } } = storage.from("exercise-media").getPublicUrl(path)
    return NextResponse.json({ url: publicUrl })
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 })
  }
}
