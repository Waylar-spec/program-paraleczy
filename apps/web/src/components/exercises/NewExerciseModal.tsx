"use client"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { Plus, Loader2, ImageIcon, Film, X } from "lucide-react"
import { createExercise, uploadExerciseImage } from "@/lib/actions/exercises"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { toast } from "sonner"

const BODY_PARTS = ["Kolano", "Bark", "Biodro", "Kręgosłup lędźwiowy", "Kręgosłup szyjny", "Łokieć", "Nadgarstek", "Stopa/Skokowy", "Całe ciało", "Inne"]
const CATEGORIES = ["Siła", "Rozciąganie", "Stabilizacja", "Mobilność", "Propriocepcja", "Kardio", "Relaksacja"]

function resizeToWebP(file: File | Blob, maxWidth = 1200): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new window.Image()
    img.onload = () => {
      const scale = img.width > maxWidth ? maxWidth / img.width : 1
      const w = Math.round(img.width * scale)
      const h = Math.round(img.height * scale)
      const canvas = document.createElement("canvas")
      canvas.width = w
      canvas.height = h
      const ctx = canvas.getContext("2d")
      if (!ctx) { reject(new Error("canvas context unavailable")); return }
      ctx.drawImage(img, 0, 0, w, h)
      canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error("toBlob failed")), "image/webp", 0.85)
    }
    img.onerror = reject
    img.src = URL.createObjectURL(file instanceof File ? file : new File([file], "img"))
  })
}

function extractYouTubeId(url: string): string | null {
  const m = url.match(/(?:youtube\.com\/(?:watch\?v=|shorts\/|embed\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/)
  return m ? m[1] : null
}

function extractVimeoId(url: string): string | null {
  const m = url.match(/vimeo\.com\/(?:video\/)?(\d+)/)
  return m ? m[1] : null
}

type MediaMode = "photo" | "video"

const EMPTY_FORM = {
  name: "", description: "", bodyPart: "", category: "", difficulty: "",
  defaultSets: "", defaultReps: "", defaultDuration: "", defaultRest: "",
}

export function NewExerciseModal() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [mediaMode, setMediaMode] = useState<MediaMode>("photo")
  const [photoUrl, setPhotoUrl] = useState("")
  const [photoUploading, setPhotoUploading] = useState(false)
  const [videoUrl, setVideoUrl] = useState("")
  const [thumbnailUrl, setThumbnailUrl] = useState("")
  const [fetchingThumb, setFetchingThumb] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  function update(field: keyof typeof form, value: string) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  function reset() {
    setForm(EMPTY_FORM)
    setMediaMode("photo")
    setPhotoUrl("")
    setVideoUrl("")
    setThumbnailUrl("")
  }

  async function uploadPhoto(file: File | Blob, name = "photo.webp") {
    setPhotoUploading(true)
    try {
      const webpBlob = await resizeToWebP(file)
      const fd = new FormData()
      fd.append("file", webpBlob, name.replace(/\.[^.]+$/, "") + ".webp")
      const url = await uploadExerciseImage(fd)
      setPhotoUrl(url)
    } catch (err) {
      toast.error("Błąd uploadu: " + (err instanceof Error ? err.message : String(err)))
    } finally {
      setPhotoUploading(false)
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) uploadPhoto(file, file.name)
    e.target.value = ""
  }

  function handlePaste(e: React.ClipboardEvent) {
    if (mediaMode !== "photo") return
    const file = Array.from(e.clipboardData.items)
      .find(item => item.type.startsWith("image/"))?.getAsFile()
    if (!file) return
    e.preventDefault()
    uploadPhoto(file)
  }

  async function handleVideoBlur() {
    if (!videoUrl || thumbnailUrl) return
    const ytId = extractYouTubeId(videoUrl)
    if (ytId) { setThumbnailUrl(`https://img.youtube.com/vi/${ytId}/hqdefault.jpg`); return }
    const vimeoId = extractVimeoId(videoUrl)
    if (vimeoId) {
      setFetchingThumb(true)
      try {
        const res = await fetch(`https://vimeo.com/api/oembed.json?url=https://vimeo.com/${vimeoId}`)
        if (res.ok) { const d = await res.json(); if (d.thumbnail_url) setThumbnailUrl(d.thumbnail_url) }
      } catch {}
      setFetchingThumb(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name) return
    setLoading(true)
    try {
      const isEmbedVideo = !!(extractYouTubeId(videoUrl) || extractVimeoId(videoUrl))
      await createExercise({
        name: form.name,
        description: form.description || undefined,
        bodyPart: form.bodyPart || undefined,
        category: form.category || undefined,
        difficulty: form.difficulty ? parseInt(form.difficulty) : undefined,
        defaultSets: form.defaultSets ? parseInt(form.defaultSets) : undefined,
        defaultReps: form.defaultReps ? parseInt(form.defaultReps) : undefined,
        defaultDuration: form.defaultDuration ? parseInt(form.defaultDuration) : undefined,
        defaultRest: form.defaultRest ? parseInt(form.defaultRest) : undefined,
        thumbnailUrl: mediaMode === "photo" ? (photoUrl || undefined) : (thumbnailUrl || undefined),
        videoUrl: mediaMode === "video" && isEmbedVideo ? videoUrl : undefined,
        animatedGifUrl: mediaMode === "video" && !isEmbedVideo && videoUrl ? videoUrl : undefined,
      })
      toast.success(`Ćwiczenie "${form.name}" zostało dodane`)
      setOpen(false)
      reset()
      router.refresh()
    } catch {
      toast.error("Nie udało się dodać ćwiczenia")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) reset() }}>
      <DialogTrigger className="inline-flex items-center gap-2 h-9 px-4 rounded-lg bg-navy-500 hover:bg-navy-600 text-white text-sm font-medium transition-colors">
        <Plus size={16} />
        Nowe ćwiczenie
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nowe ćwiczenie</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} onPaste={handlePaste} className="space-y-4 mt-2">

          <div className="space-y-1.5">
            <Label htmlFor="ex-name">Nazwa *</Label>
            <Input id="ex-name" value={form.name} onChange={e => update("name", e.target.value)} placeholder="np. Przysiady z obciążeniem" required autoFocus />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="ex-desc">Opis / instrukcja</Label>
            <Textarea id="ex-desc" value={form.description} onChange={e => update("description", e.target.value)} placeholder="Opis wykonania ćwiczenia..." rows={3} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Okolica ciała</Label>
              <select value={form.bodyPart} onChange={e => update("bodyPart", e.target.value)} className="flex h-9 w-full rounded-lg border border-input bg-background px-3 py-1 text-sm shadow-xs focus:outline-none focus:ring-2 focus:ring-ring/50">
                <option value="">— wybierz —</option>
                {BODY_PARTS.map(bp => <option key={bp} value={bp}>{bp}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label>Kategoria</Label>
              <select value={form.category} onChange={e => update("category", e.target.value)} className="flex h-9 w-full rounded-lg border border-input bg-background px-3 py-1 text-sm shadow-xs focus:outline-none focus:ring-2 focus:ring-ring/50">
                <option value="">— wybierz —</option>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Trudność</Label>
            <div className="flex gap-2">
              {[["1", "Łatwe", "bg-green-50 text-green-700 border-green-200"], ["2", "Średnie", "bg-yellow-50 text-yellow-700 border-yellow-200"], ["3", "Trudne", "bg-red-50 text-red-700 border-red-200"]].map(([val, label, cls]) => (
                <button key={val} type="button" onClick={() => update("difficulty", form.difficulty === val ? "" : val)}
                  className={`flex-1 h-9 rounded-lg border text-sm font-medium transition-colors ${form.difficulty === val ? cls : "border-gray-200 text-gray-500 hover:bg-gray-50"}`}>
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5"><Label>Serie</Label><Input type="number" min="1" max="20" value={form.defaultSets} onChange={e => update("defaultSets", e.target.value)} placeholder="3" /></div>
            <div className="space-y-1.5"><Label>Powtórzenia</Label><Input type="number" min="1" max="100" value={form.defaultReps} onChange={e => update("defaultReps", e.target.value)} placeholder="12" /></div>
            <div className="space-y-1.5"><Label>Czas (s)</Label><Input type="number" min="1" value={form.defaultDuration} onChange={e => update("defaultDuration", e.target.value)} placeholder="30" /></div>
            <div className="space-y-1.5"><Label>Przerwa (s)</Label><Input type="number" min="1" value={form.defaultRest} onChange={e => update("defaultRest", e.target.value)} placeholder="60" /></div>
          </div>

          {/* ── Media ── */}
          <div className="space-y-2">
            <Label>Media</Label>
            <div className="flex rounded-lg border border-gray-200 p-1 gap-1 bg-gray-50">
              {(["photo", "video"] as MediaMode[]).map((mode) => (
                <button key={mode} type="button" onClick={() => setMediaMode(mode)}
                  className={`flex-1 flex items-center justify-center gap-1.5 h-8 rounded-md text-sm font-medium transition-colors ${mediaMode === mode ? "bg-white shadow-sm text-navy-700" : "text-gray-500 hover:text-gray-700"}`}>
                  {mode === "photo" ? <><ImageIcon size={14} /> Zdjęcie</> : <><Film size={14} /> Film</>}
                </button>
              ))}
            </div>

            {mediaMode === "photo" ? (
              <>
                {photoUrl ? (
                  <div className="relative rounded-xl overflow-hidden aspect-video bg-gray-50 border border-gray-200">
                    <img src={photoUrl} alt="" className="w-full h-full object-contain" />
                    <button type="button" onClick={() => setPhotoUrl("")}
                      className="absolute top-2 right-2 w-7 h-7 rounded-full bg-white shadow border border-gray-200 flex items-center justify-center hover:bg-red-50 transition-colors">
                      <X size={13} className="text-gray-500 hover:text-red-500" />
                    </button>
                    <button type="button" onClick={() => fileInputRef.current?.click()}
                      className="absolute inset-0 bg-black/0 hover:bg-black/10 transition-colors flex items-end justify-center pb-3 opacity-0 hover:opacity-100">
                      <span className="text-white text-xs font-medium bg-black/50 px-3 py-1 rounded-full">Zmień zdjęcie</span>
                    </button>
                  </div>
                ) : (
                  <button type="button" onClick={() => fileInputRef.current?.click()} disabled={photoUploading}
                    className="w-full aspect-video rounded-xl border-2 border-dashed border-gray-200 hover:border-navy-300 hover:bg-navy-50/20 transition-colors flex flex-col items-center justify-center gap-2 text-gray-400 disabled:opacity-50">
                    {photoUploading
                      ? <Loader2 size={24} className="animate-spin text-navy-400" />
                      : <>
                          <ImageIcon size={28} />
                          <span className="text-sm text-gray-500">Kliknij, aby wybrać plik</span>
                          <span className="text-xs">lub wklej zrzut ekranu <kbd className="bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded text-[10px]">Ctrl+V</kbd></span>
                          <span className="text-[11px] text-gray-400">JPG / PNG / WebP — konwersja do WebP automatycznie</span>
                        </>
                    }
                  </button>
                )}
                <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleFileChange} />
              </>
            ) : (
              <div className="space-y-2">
                <Input
                  type="url"
                  value={videoUrl}
                  onChange={e => setVideoUrl(e.target.value)}
                  onBlur={handleVideoBlur}
                  placeholder="YouTube, Vimeo lub bezpośredni link .mp4..."
                />
                {fetchingThumb && (
                  <p className="text-xs text-gray-400 flex items-center gap-1.5">
                    <Loader2 size={11} className="animate-spin" /> Pobieranie miniatury...
                  </p>
                )}
                {thumbnailUrl && (
                  <div className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg border border-gray-200">
                    <img src={thumbnailUrl} alt="" className="w-20 h-12 rounded object-cover shrink-0" />
                    <span className="text-xs text-gray-500 flex-1">Miniatura pobrana automatycznie</span>
                    <button type="button" onClick={() => setThumbnailUrl("")} className="text-gray-400 hover:text-gray-600">
                      <X size={13} />
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setOpen(false)}
              className="inline-flex items-center h-9 px-4 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
              Anuluj
            </button>
            <button type="submit" disabled={loading || !form.name}
              className="inline-flex items-center h-9 px-4 rounded-lg bg-navy-500 hover:bg-navy-600 disabled:opacity-50 text-white text-sm font-medium transition-colors">
              {loading ? "Dodawanie..." : "Dodaj ćwiczenie"}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
