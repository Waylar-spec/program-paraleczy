"use client"

import { useState, useRef } from "react"
import { Plus, Upload, Link as LinkIcon, X } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { getUploadUrl, getPublicUrl, createEducationalContent } from "@/lib/actions/education"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

type Mode = "pdf" | "link"

export function NewContentModal() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [mode, setMode] = useState<Mode>("pdf")
  const [name, setName] = useState("")
  const [url, setUrl] = useState("")
  const [bodyPart, setBodyPart] = useState("")
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  function reset() {
    setName(""); setUrl(""); setBodyPart(""); setFile(null); setMode("pdf")
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    setUploading(true)
    try {
      let fileUrl: string | undefined
      if (mode === "pdf" && file) {
        const { signedUrl, path } = await getUploadUrl(file.name, file.type)
        const res = await fetch(signedUrl, { method: "PUT", body: file, headers: { "Content-Type": file.type } })
        if (!res.ok) throw new Error("Upload nieudany")
        fileUrl = await getPublicUrl(path)
      }
      await createEducationalContent({
        name: name.trim(),
        type: mode === "pdf" ? "pdf" : "link",
        fileUrl,
        externalUrl: mode === "link" ? url.trim() : undefined,
        bodyPart: bodyPart || undefined,
      })
      toast.success("Materiał dodany")
      reset()
      setOpen(false)
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Błąd dodawania materiału")
    } finally {
      setUploading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) reset() }}>
      <DialogTrigger className="inline-flex items-center gap-2 h-9 px-4 rounded-lg bg-navy-500 hover:bg-navy-600 text-white text-sm font-medium transition-colors">
        <Plus size={15} />
        Nowy materiał
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Dodaj materiał edukacyjny</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          {/* Mode toggle */}
          <div className="flex rounded-lg border border-gray-200 overflow-hidden">
            {(["pdf", "link"] as Mode[]).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMode(m)}
                className={`flex-1 py-2 text-sm font-medium transition-colors ${
                  mode === m ? "bg-navy-500 text-white" : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                {m === "pdf" ? "📄 Plik PDF" : "🔗 Link zewnętrzny"}
              </button>
            ))}
          </div>

          <div className="space-y-1.5">
            <Label>Nazwa *</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="np. Ergonomia pracy siedzącej"
              required
            />
          </div>

          {mode === "pdf" ? (
            <div className="space-y-1.5">
              <Label>Plik PDF</Label>
              <div
                onClick={() => fileRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${
                  file ? "border-navy-300 bg-navy-50" : "border-gray-200 hover:border-navy-300"
                }`}
              >
                {file ? (
                  <div className="flex items-center justify-center gap-2">
                    <span className="text-sm text-navy-700 font-medium">{file.name}</span>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); setFile(null) }}
                      className="text-gray-400 hover:text-red-500"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-1.5 text-gray-400">
                    <Upload size={22} />
                    <p className="text-sm">Kliknij lub przeciągnij plik</p>
                    <p className="text-xs">PDF, max 20MB</p>
                  </div>
                )}
              </div>
              <input
                ref={fileRef}
                type="file"
                accept=".pdf"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0]
                  if (f) { setFile(f); if (!name) setName(f.name.replace(".pdf", "")) }
                }}
              />
            </div>
          ) : (
            <div className="space-y-1.5">
              <Label>URL *</Label>
              <div className="relative">
                <LinkIcon size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <Input
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://..."
                  className="pl-8"
                  required={mode === "link"}
                />
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <Label>Okolica ciała (opcjonalne)</Label>
            <Input
              value={bodyPart}
              onChange={(e) => setBodyPart(e.target.value)}
              placeholder="np. Kręgosłup"
            />
          </div>

          <div className="flex justify-end gap-3 pt-1">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="h-9 px-4 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Anuluj
            </button>
            <button
              type="submit"
              disabled={uploading || !name.trim() || (mode === "pdf" && !file) || (mode === "link" && !url.trim())}
              className="h-9 px-4 rounded-lg bg-navy-500 hover:bg-navy-600 disabled:opacity-50 text-white text-sm font-medium transition-colors"
            >
              {uploading ? "Dodaję..." : "Dodaj"}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
