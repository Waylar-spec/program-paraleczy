"use client"

import { useState } from "react"
import { X, Dumbbell, Star, Plus, Check, Pencil, Loader2, Image, ClipboardPaste } from "lucide-react"
import { useProgramBuilder } from "@/store/programBuilder"
import { toggleFavorite, updateExercise, uploadExerciseImage } from "@/lib/actions/exercises"
import { StepImagesUploader } from "./StepImagesUploader"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

type Exercise = {
  id: string
  name: string
  description: string | null
  body_part: string | null
  category: string | null
  difficulty: number | null
  default_sets: number | null
  default_reps: number | null
  default_duration_seconds: number | null
  default_rest_seconds?: number | null
  thumbnail_url: string | null
  animated_gif_url?: string | null
  video_url: string | null
  is_favorite: boolean
  is_public: boolean
  practitioner_id: string | null
  step_images?: string[] | null
}

interface Props {
  exercise: Exercise
  onClose: () => void
}

const DIFFICULTY_LABEL: Record<number, string> = { 1: "Łatwe", 2: "Średnie", 3: "Trudne" }
const DIFFICULTY_COLOR: Record<number, string> = {
  1: "text-green-600 bg-green-50",
  2: "text-yellow-600 bg-yellow-50",
  3: "text-red-600 bg-red-50",
}
const BODY_PARTS = ["Kolano", "Bark", "Biodro", "Kręgosłup lędźwiowy", "Kręgosłup szyjny", "Łokieć", "Nadgarstek", "Stopa/Skokowy", "Całe ciało", "Inne"]
const CATEGORIES = ["Siła", "Rozciąganie", "Stabilizacja", "Mobilność", "Propriocepcja", "Kardio", "Relaksacja"]

function getEmbedUrl(url: string): string | null {
  const yt = url.match(/(?:youtube\.com\/(?:watch\?v=|shorts\/|embed\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/)
  if (yt) return `https://www.youtube.com/embed/${yt[1]}?rel=0&modestbranding=1`
  const vi = url.match(/vimeo\.com\/(?:video\/)?(\d+)/)
  if (vi) return `https://player.vimeo.com/video/${vi[1]}?dnt=1`
  return null
}

async function getThumbnailFromUrl(url: string): Promise<string | null> {
  const yt = url.match(/(?:youtube\.com\/(?:watch\?v=|shorts\/|embed\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/)
  if (yt) return `https://img.youtube.com/vi/${yt[1]}/hqdefault.jpg`
  const vi = url.match(/vimeo\.com\/(?:video\/)?(\d+)/)
  if (vi) {
    try {
      const res = await fetch(`https://vimeo.com/api/oembed.json?url=https://vimeo.com/${vi[1]}`)
      if (res.ok) { const d = await res.json(); return d.thumbnail_url ?? null }
    } catch { return null }
  }
  return null
}

function resizeToWebP(file: File, maxWidth: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new window.Image()
    img.onload = () => {
      const scale = img.width > maxWidth ? maxWidth / img.width : 1
      const w = Math.round(img.width * scale)
      const h = Math.round(img.height * scale)
      const canvas = document.createElement("canvas")
      canvas.width = w
      canvas.height = h
      canvas.getContext("2d")!.drawImage(img, 0, 0, w, h)
      canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error("toBlob failed")), "image/webp", 0.85)
    }
    img.onerror = reject
    img.src = URL.createObjectURL(file)
  })
}

// ─── View mode ────────────────────────────────────────────────────────────────

function ViewMode({ exercise, favorite, onFavorite, onEdit, onClose, onAddRemove, inProgram }: {
  exercise: Exercise
  favorite: boolean
  onFavorite: () => void
  onEdit: () => void
  onClose: () => void
  onAddRemove: () => void
  inProgram: boolean
}) {
  const embedUrl = exercise.video_url ? getEmbedUrl(exercise.video_url) : null
  const isOwn = !!exercise.practitioner_id

  return (
    <>
      {/* Video / thumbnail */}
      <div className="relative bg-black w-full aspect-video shrink-0">
        {embedUrl ? (
          <iframe
            src={embedUrl}
            className="w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        ) : exercise.animated_gif_url ? (
          <img src={exercise.animated_gif_url} alt={exercise.name} className="w-full h-full object-contain bg-white" />
        ) : exercise.thumbnail_url ? (
          <img src={exercise.thumbnail_url} alt={exercise.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Dumbbell size={48} className="text-gray-600" />
          </div>
        )}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/50 hover:bg-black/70 flex items-center justify-center transition-colors"
        >
          <X size={15} className="text-white" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="flex items-start justify-between gap-3 px-5 pt-4 pb-3">
          <div className="min-w-0">
            <h2 className="font-semibold text-gray-900 text-base leading-snug">{exercise.name}</h2>
            <div className="flex flex-wrap gap-1.5 mt-2">
              {exercise.body_part && (
                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{exercise.body_part}</span>
              )}
              {exercise.category && (
                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{exercise.category}</span>
              )}
              {exercise.difficulty && (
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${DIFFICULTY_COLOR[exercise.difficulty]}`}>
                  {DIFFICULTY_LABEL[exercise.difficulty]}
                </span>
              )}
              {!exercise.practitioner_id && (
                <span className="text-xs bg-navy-50 text-navy-600 px-2 py-0.5 rounded-full">Biblioteka</span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            {isOwn && (
              <button onClick={onEdit} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors" title="Edytuj">
                <Pencil size={15} className="text-gray-400" />
              </button>
            )}
            <button onClick={onFavorite} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
              <Star size={17} className={favorite ? "text-yellow-400 fill-yellow-400" : "text-gray-400"} />
            </button>
          </div>
        </div>

        {(exercise.default_sets || exercise.default_reps || exercise.default_duration_seconds) && (
          <div className="flex gap-3 px-5 pb-3">
            {exercise.default_sets && (
              <div className="flex-1 bg-navy-50 rounded-xl p-3 text-center">
                <p className="text-xl font-bold text-navy-700">{exercise.default_sets}</p>
                <p className="text-xs text-navy-500 mt-0.5">serie</p>
              </div>
            )}
            {exercise.default_reps && (
              <div className="flex-1 bg-navy-50 rounded-xl p-3 text-center">
                <p className="text-xl font-bold text-navy-700">{exercise.default_reps}</p>
                <p className="text-xs text-navy-500 mt-0.5">powtórzeń</p>
              </div>
            )}
            {exercise.default_duration_seconds && (
              <div className="flex-1 bg-navy-50 rounded-xl p-3 text-center">
                <p className="text-xl font-bold text-navy-700">{exercise.default_duration_seconds}</p>
                <p className="text-xs text-navy-500 mt-0.5">sekund</p>
              </div>
            )}
          </div>
        )}

        {/* Step images */}
        {exercise.step_images && exercise.step_images.length > 0 && (
          <div className="px-5 pb-3">
            <div className={`grid gap-2 ${exercise.step_images.length <= 2 ? "grid-cols-2" : "grid-cols-2"}`}>
              {exercise.step_images.map((url, i) => (
                <div key={i} className="relative aspect-video rounded-lg overflow-hidden bg-gray-100">
                  <img src={url} alt={`Krok ${i + 1}`} className="w-full h-full object-cover" />
                  <span className="absolute bottom-1 left-1 w-5 h-5 rounded bg-black/50 text-white text-[10px] font-bold flex items-center justify-center">{i + 1}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {exercise.description && (
          <div className="px-5 pb-4">
            <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">{exercise.description}</p>
          </div>
        )}
      </div>

      <div className="px-5 py-4 border-t border-gray-100 shrink-0">
        <button
          onClick={onAddRemove}
          className={`w-full h-10 rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
            inProgram
              ? "bg-green-50 text-green-700 hover:bg-red-50 hover:text-red-600 border border-green-200 hover:border-red-200"
              : "bg-navy-500 hover:bg-navy-600 text-white"
          }`}
        >
          {inProgram ? <><Check size={15} /> Dodano do programu</> : <><Plus size={15} /> Dodaj do programu</>}
        </button>
      </div>
    </>
  )
}

// ─── Edit mode ────────────────────────────────────────────────────────────────

function EditMode({ exercise, onClose, onSaved }: {
  exercise: Exercise
  onClose: () => void
  onSaved: (updated: Partial<Exercise>) => void
}) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [fetchingThumb, setFetchingThumb] = useState(false)
  const [uploadingThumb, setUploadingThumb] = useState(false)
  const [stepImages, setStepImages] = useState<string[]>(exercise.step_images ?? [])

  async function handleThumbPaste(e: React.ClipboardEvent) {
    const file = Array.from(e.clipboardData.items)
      .find(item => item.type.startsWith("image/"))?.getAsFile()
    if (!file) return
    e.preventDefault()
    setUploadingThumb(true)
    try {
      const webpBlob = await resizeToWebP(file, 800)
      const fd = new FormData()
      fd.append("file", webpBlob, "thumbnail.webp")
      const url = await uploadExerciseImage(fd)
      update("thumbnailUrl", url)
    } catch (err) {
      toast.error("Nie udało się wgrać miniatury: " + (err instanceof Error ? err.message : String(err)))
    } finally {
      setUploadingThumb(false)
    }
  }
  const [form, setForm] = useState({
    name: exercise.name,
    description: exercise.description ?? "",
    bodyPart: exercise.body_part ?? "",
    category: exercise.category ?? "",
    difficulty: exercise.difficulty ? String(exercise.difficulty) : "",
    defaultSets: exercise.default_sets ? String(exercise.default_sets) : "",
    defaultReps: exercise.default_reps ? String(exercise.default_reps) : "",
    defaultDuration: exercise.default_duration_seconds ? String(exercise.default_duration_seconds) : "",
    defaultRest: exercise.default_rest_seconds ? String(exercise.default_rest_seconds) : "",
    videoUrl: exercise.video_url ?? "",
    thumbnailUrl: exercise.thumbnail_url ?? "",
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
    setSaving(true)
    try {
      await updateExercise(exercise.id, {
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
        stepImages,
      })
      toast.success("Ćwiczenie zaktualizowane")
      router.refresh()
      onSaved({
        name: form.name,
        description: form.description || null,
        body_part: form.bodyPart || null,
        category: form.category || null,
        difficulty: form.difficulty ? parseInt(form.difficulty) : null,
        default_sets: form.defaultSets ? parseInt(form.defaultSets) : null,
        default_reps: form.defaultReps ? parseInt(form.defaultReps) : null,
        default_duration_seconds: form.defaultDuration ? parseInt(form.defaultDuration) : null,
        video_url: form.videoUrl || null,
        thumbnail_url: form.thumbnailUrl || null,
        step_images: stepImages,
      })
    } catch {
      toast.error("Nie udało się zapisać")
    } finally {
      setSaving(false)
    }
  }

  const inputCls = "w-full h-9 px-3 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-navy-400 bg-white"
  const selectCls = "w-full h-9 px-3 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-navy-400 bg-white"

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 shrink-0">
        <h2 className="font-semibold text-gray-900 text-sm">Edytuj ćwiczenie</h2>
        <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
          <X size={16} className="text-gray-500" />
        </button>
      </div>

      {/* Form — scrollable */}
      <form id="edit-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4">

        {/* Thumbnail preview */}
        <div className="w-full aspect-video rounded-xl bg-gray-100 overflow-hidden flex items-center justify-center">
          {fetchingThumb ? (
            <Loader2 size={24} className="text-gray-400 animate-spin" />
          ) : form.thumbnailUrl ? (
            <img src={form.thumbnailUrl} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="flex flex-col items-center gap-2 text-gray-300">
              <Image size={32} />
              <span className="text-xs">Brak miniatury</span>
            </div>
          )}
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-gray-700">Nazwa *</label>
          <input className={inputCls} value={form.name} onChange={(e) => update("name", e.target.value)} required autoFocus />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-gray-700">Opis / instrukcja</label>
          <textarea
            value={form.description}
            onChange={(e) => update("description", e.target.value)}
            rows={3}
            placeholder="Opis wykonania ćwiczenia..."
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-navy-400 resize-none"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-gray-700">Okolica ciała</label>
            <select className={selectCls} value={form.bodyPart} onChange={(e) => update("bodyPart", e.target.value)}>
              <option value="">— wybierz —</option>
              {BODY_PARTS.map((bp) => <option key={bp} value={bp}>{bp}</option>)}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-gray-700">Kategoria</label>
            <select className={selectCls} value={form.category} onChange={(e) => update("category", e.target.value)}>
              <option value="">— wybierz —</option>
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-gray-700">Trudność</label>
          <div className="flex gap-2">
            {[["1", "Łatwe", "bg-green-50 text-green-700 border-green-200"], ["2", "Średnie", "bg-yellow-50 text-yellow-700 border-yellow-200"], ["3", "Trudne", "bg-red-50 text-red-700 border-red-200"]].map(([val, label, cls]) => (
              <button
                key={val} type="button"
                onClick={() => update("difficulty", form.difficulty === val ? "" : val)}
                className={`flex-1 h-9 rounded-lg border text-sm font-medium transition-colors ${form.difficulty === val ? cls : "border-gray-200 text-gray-500 hover:bg-gray-50"}`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-gray-700">Serie</label>
            <input type="number" min="1" className={inputCls} value={form.defaultSets} onChange={(e) => update("defaultSets", e.target.value)} placeholder="3" />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-gray-700">Powtórzenia</label>
            <input type="number" min="1" className={inputCls} value={form.defaultReps} onChange={(e) => update("defaultReps", e.target.value)} placeholder="12" />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-gray-700">Czas (s)</label>
            <input type="number" min="1" className={inputCls} value={form.defaultDuration} onChange={(e) => update("defaultDuration", e.target.value)} placeholder="30" />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-gray-700">Przerwa (s)</label>
            <input type="number" min="1" className={inputCls} value={form.defaultRest} onChange={(e) => update("defaultRest", e.target.value)} placeholder="60" />
          </div>
        </div>

        <StepImagesUploader value={stepImages} onChange={setStepImages} />

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-gray-700">Link do wideo (YouTube / Vimeo)</label>
          <input
            type="url" className={inputCls} value={form.videoUrl}
            onChange={(e) => update("videoUrl", e.target.value)}
            onBlur={handleVideoUrlBlur}
            placeholder="https://youtube.com/watch?v=..."
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-gray-700 flex items-center gap-1.5">
            URL miniatury
            <span className="text-gray-400 font-normal flex items-center gap-1">
              — lub <ClipboardPaste size={11} /> wklej obraz (Ctrl+V)
            </span>
          </label>
          <div className="relative">
            <input
              type="url"
              className={inputCls}
              value={form.thumbnailUrl}
              onChange={(e) => update("thumbnailUrl", e.target.value)}
              onPaste={handleThumbPaste}
              placeholder="Wklej URL albo skopiuj klatkę z Vimeo i Ctrl+V"
            />
            {uploadingThumb && (
              <div className="absolute inset-0 flex items-center justify-center bg-white/80 rounded-lg">
                <Loader2 size={16} className="animate-spin text-navy-500" />
                <span className="ml-1.5 text-xs text-navy-600">Uploadowanie...</span>
              </div>
            )}
          </div>
        </div>
      </form>

      {/* Footer */}
      <div className="px-5 py-4 border-t border-gray-100 flex gap-3 shrink-0">
        <button type="button" onClick={onClose} className="flex-1 h-10 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
          Anuluj
        </button>
        <button
          type="submit" form="edit-form" disabled={saving}
          className="flex-1 h-10 rounded-xl bg-navy-500 hover:bg-navy-600 disabled:opacity-50 text-white text-sm font-medium transition-colors flex items-center justify-center gap-2"
        >
          {saving ? <><Loader2 size={14} className="animate-spin" /> Zapisuję...</> : "Zapisz zmiany"}
        </button>
      </div>
    </>
  )
}

// ─── Main modal ───────────────────────────────────────────────────────────────

export function ExerciseDetailModal({ exercise: initialExercise, onClose }: Props) {
  const router = useRouter()
  const { addExercise, removeExercise, hasExercise, exercises, open } = useProgramBuilder()
  const [exercise, setExercise] = useState(initialExercise)
  const [mode, setMode] = useState<"view" | "edit">("view")
  const [favorite, setFavorite] = useState(exercise.is_favorite)
  const inProgram = hasExercise(exercise.id)

  async function handleFavorite() {
    const next = !favorite
    setFavorite(next)
    try {
      await toggleFavorite(exercise.id, next)
      router.refresh()
    } catch {
      setFavorite(!next)
    }
  }

  function handleAddRemove() {
    if (inProgram) {
      const item = exercises.find((e) => e.exerciseId === exercise.id)
      if (item) removeExercise(item.itemId)
    } else {
      addExercise({
        exerciseId: exercise.id,
        name: exercise.name,
        thumbnailUrl: exercise.thumbnail_url,
        sets: exercise.default_sets ?? 3,
        reps: exercise.default_reps ?? null,
        durationSeconds: exercise.default_duration_seconds ?? null,
        notes: "",
      })
      toast.success("Dodano do programu")
      open()
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-xl overflow-hidden flex flex-col max-h-[90vh]">
        {mode === "view" ? (
          <ViewMode
            exercise={exercise}
            favorite={favorite}
            onFavorite={handleFavorite}
            onEdit={() => setMode("edit")}
            onClose={onClose}
            onAddRemove={handleAddRemove}
            inProgram={inProgram}
          />
        ) : (
          <EditMode
            exercise={exercise}
            onClose={() => setMode("view")}
            onSaved={(updated) => {
              setExercise((prev) => ({ ...prev, ...updated }))
              setMode("view")
            }}
          />
        )}
      </div>
    </div>
  )
}
