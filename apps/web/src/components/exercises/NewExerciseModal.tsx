"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Plus, Image, Loader2 } from "lucide-react"
import { createExercise } from "@/lib/actions/exercises"
import { StepImagesUploader } from "./StepImagesUploader"
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

function extractYouTubeId(url: string): string | null {
  const m = url.match(/(?:youtube\.com\/(?:watch\?v=|shorts\/|embed\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/)
  return m ? m[1] : null
}

function extractVimeoId(url: string): string | null {
  const m = url.match(/vimeo\.com\/(?:video\/)?(\d+)/)
  return m ? m[1] : null
}

async function getThumbnailFromUrl(url: string): Promise<string | null> {
  if (!url) return null

  const ytId = extractYouTubeId(url)
  if (ytId) return `https://img.youtube.com/vi/${ytId}/hqdefault.jpg`

  const vimeoId = extractVimeoId(url)
  if (vimeoId) {
    try {
      const res = await fetch(`https://vimeo.com/api/oembed.json?url=https://vimeo.com/${vimeoId}`)
      if (res.ok) {
        const data = await res.json()
        return data.thumbnail_url ?? null
      }
    } catch {
      return null
    }
  }

  return null
}

export function NewExerciseModal() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [fetchingThumb, setFetchingThumb] = useState(false)
  const [stepImages, setStepImages] = useState<string[]>([])
  const [form, setForm] = useState({
    name: "",
    description: "",
    bodyPart: "",
    category: "",
    difficulty: "",
    defaultSets: "",
    defaultReps: "",
    defaultDuration: "",
    defaultRest: "",
    videoUrl: "",
    thumbnailUrl: "",
  })

  function update(field: keyof typeof form, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function handleVideoUrlBlur() {
    if (!form.videoUrl || form.thumbnailUrl) return
    setFetchingThumb(true)
    const thumb = await getThumbnailFromUrl(form.videoUrl)
    if (thumb) update("thumbnailUrl", thumb)
    setFetchingThumb(false)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name) return
    setLoading(true)
    try {
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
        videoUrl: form.videoUrl || undefined,
        thumbnailUrl: form.thumbnailUrl || undefined,
        stepImages: stepImages.length ? stepImages : undefined,
      })
      toast.success(`Ćwiczenie "${form.name}" zostało dodane`)
      setOpen(false)
      setStepImages([])
      setForm({ name: "", description: "", bodyPart: "", category: "", difficulty: "", defaultSets: "", defaultReps: "", defaultDuration: "", defaultRest: "", videoUrl: "", thumbnailUrl: "" })
      router.refresh()
    } catch {
      toast.error("Nie udało się dodać ćwiczenia")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger className="inline-flex items-center gap-2 h-9 px-4 rounded-lg bg-navy-500 hover:bg-navy-600 text-white text-sm font-medium transition-colors">
        <Plus size={16} />
        Nowe ćwiczenie
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nowe ćwiczenie</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="space-y-1.5">
            <Label htmlFor="ex-name">Nazwa *</Label>
            <Input
              id="ex-name"
              value={form.name}
              onChange={(e) => update("name", e.target.value)}
              placeholder="np. Przysiady z obciążeniem"
              required
              autoFocus
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="ex-desc">Opis / instrukcja</Label>
            <Textarea
              id="ex-desc"
              value={form.description}
              onChange={(e) => update("description", e.target.value)}
              placeholder="Opis wykonania ćwiczenia..."
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="ex-bodypart">Okolica ciała</Label>
              <select
                id="ex-bodypart"
                value={form.bodyPart}
                onChange={(e) => update("bodyPart", e.target.value)}
                className="flex h-9 w-full rounded-lg border border-input bg-background px-3 py-1 text-sm shadow-xs transition-colors focus:outline-none focus:ring-2 focus:ring-ring/50"
              >
                <option value="">— wybierz —</option>
                {BODY_PARTS.map((bp) => <option key={bp} value={bp}>{bp}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ex-category">Kategoria</Label>
              <select
                id="ex-category"
                value={form.category}
                onChange={(e) => update("category", e.target.value)}
                className="flex h-9 w-full rounded-lg border border-input bg-background px-3 py-1 text-sm shadow-xs transition-colors focus:outline-none focus:ring-2 focus:ring-ring/50"
              >
                <option value="">— wybierz —</option>
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Trudność</Label>
            <div className="flex gap-2">
              {[["1", "Łatwe", "bg-green-50 text-green-700 border-green-200"], ["2", "Średnie", "bg-yellow-50 text-yellow-700 border-yellow-200"], ["3", "Trudne", "bg-red-50 text-red-700 border-red-200"]].map(([val, label, cls]) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => update("difficulty", form.difficulty === val ? "" : val)}
                  className={`flex-1 h-9 rounded-lg border text-sm font-medium transition-colors ${
                    form.difficulty === val ? cls : "border-gray-200 text-gray-500 hover:bg-gray-50"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="ex-sets">Serie</Label>
              <Input id="ex-sets" type="number" min="1" max="20" value={form.defaultSets} onChange={(e) => update("defaultSets", e.target.value)} placeholder="3" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ex-reps">Powtórzenia</Label>
              <Input id="ex-reps" type="number" min="1" max="100" value={form.defaultReps} onChange={(e) => update("defaultReps", e.target.value)} placeholder="12" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ex-duration">Czas (s)</Label>
              <Input id="ex-duration" type="number" min="1" value={form.defaultDuration} onChange={(e) => update("defaultDuration", e.target.value)} placeholder="30" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ex-rest">Przerwa (s)</Label>
              <Input id="ex-rest" type="number" min="1" value={form.defaultRest} onChange={(e) => update("defaultRest", e.target.value)} placeholder="60" />
            </div>
          </div>

          <StepImagesUploader value={stepImages} onChange={setStepImages} />

          {/* Video + thumbnail */}
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="ex-video">Link do wideo (YouTube / Vimeo)</Label>
              <Input
                id="ex-video"
                type="url"
                value={form.videoUrl}
                onChange={(e) => update("videoUrl", e.target.value)}
                onBlur={handleVideoUrlBlur}
                placeholder="https://youtube.com/watch?v=..."
              />
              <p className="text-xs text-gray-400">Miniatura zostanie pobrana automatycznie po wklejeniu linku</p>
            </div>

            {/* Thumbnail preview */}
            <div className="flex items-start gap-3">
              <div className="w-24 h-16 rounded-lg bg-gray-100 border border-gray-200 overflow-hidden shrink-0 flex items-center justify-center">
                {fetchingThumb ? (
                  <Loader2 size={16} className="text-gray-400 animate-spin" />
                ) : form.thumbnailUrl ? (
                  <img src={form.thumbnailUrl} alt="Miniatura" className="w-full h-full object-cover" />
                ) : (
                  <Image size={20} className="text-gray-300" />
                )}
              </div>
              <div className="flex-1 space-y-1.5">
                <Label htmlFor="ex-thumb">URL miniatury</Label>
                <Input
                  id="ex-thumb"
                  type="url"
                  value={form.thumbnailUrl}
                  onChange={(e) => update("thumbnailUrl", e.target.value)}
                  placeholder="Wypełniane automatycznie lub wklej własny URL"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="inline-flex items-center h-9 px-4 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Anuluj
            </button>
            <button
              type="submit"
              disabled={loading || !form.name}
              className="inline-flex items-center h-9 px-4 rounded-lg bg-navy-500 hover:bg-navy-600 disabled:opacity-50 text-white text-sm font-medium transition-colors"
            >
              {loading ? "Dodawanie..." : "Dodaj ćwiczenie"}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
