"use client"

import { useState, useRef } from "react"
import { X, Dumbbell, Star, Plus, Check, Pencil, Loader2, ImageIcon, Film } from "lucide-react"
import { useProgramBuilder } from "@/store/programBuilder"
import { toggleFavorite, updateExercise } from "@/lib/actions/exercises"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

async function uploadViaApi(blob: Blob, name: string): Promise<{ url: string } | { error: string }> {
  const fd = new FormData()
  fd.append("file", blob, name)
  const res = await fetch("/api/upload-exercise-image", { method: "POST", body: fd })
  return res.json()
}

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

function extractYouTubeId(url: string): string | null {
  const m = url.match(/(?:youtube\.com\/(?:watch\?v=|shorts\/|embed\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/)
  return m ? m[1] : null
}

function extractVimeoId(url: string): string | null {
  const m = url.match(/vimeo\.com\/(?:video\/)?(\d+)/)
  return m ? m[1] : null
}

function getEmbedUrl(url: string): string | null {
  const yt = extractYouTubeId(url)
  if (yt) return `https://www.youtube.com/embed/${yt}?rel=0&modestbranding=1`
  const vi = extractVimeoId(url)
  if (vi) return `https://player.vimeo.com/video/${vi}?dnt=1`
  return null
}

async function getThumbnailFromUrl(url: string): Promise<string | null> {
  const yt = extractYouTubeId(url)
  if (yt) return `https://img.youtube.com/vi/${yt}/hqdefault.jpg`
  const vi = extractVimeoId(url)
  if (vi) {
    try {
      const res = await fetch(`https://vimeo.com/api/oembed.json?url=https://vimeo.com/${vi}`)
      if (res.ok) { const d = await res.json(); return d.thumbnail_url ?? null }
    } catch { return null }
  }
  return null
}

function resizeToWebP(file: File | Blob, maxWidth = 800): Promise<Blob> {
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
      canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error("toBlob failed")), "image/webp", 0.78)
    }
    img.onerror = reject
    img.src = URL.createObjectURL(file instanceof File ? file : new File([file], "img"))
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
          exercise.animated_gif_url.endsWith('.mp4') ? (
            <video
              src={exercise.animated_gif_url}
              className="w-full h-full object-contain bg-white"
              controls
              autoPlay
              loop
              playsInline
            />
          ) : (
            <img src={exercise.animated_gif_url} alt={exercise.name} className="w-full h-full object-contain bg-white" />
          )
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

type EditMediaMode = "photo" | "video"

function EditMode({ exercise, onClose, onSaved }: {
  exercise: Exercise
  onClose: () => void
  onSaved: (updated: Partial<Exercise>) => void
}) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [fetchingThumb, setFetchingThumb] = useState(false)
  const [photoUploading, setPhotoUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const hasVideo = !!(exercise.video_url || exercise.animated_gif_url)
  const [mediaMode, setMediaMode] = useState<EditMediaMode>(hasVideo ? "video" : "photo")
  const [photoUrl, setPhotoUrl] = useState(exercise.thumbnail_url ?? "")
  const [videoUrl, setVideoUrl] = useState(exercise.video_url ?? exercise.animated_gif_url ?? "")
  const [thumbnailUrl, setThumbnailUrl] = useState(exercise.thumbnail_url ?? "")

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
  })

  function update(field: keyof typeof form, value: string) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  async function uploadPhoto(file: File | Blob, name = "photo.webp") {
    setPhotoUploading(true)
    try {
      const webpBlob = await resizeToWebP(file, 1200)
      const filename = name.replace(/\.[^.]+$/, "") + ".webp"
      const result = await uploadViaApi(webpBlob, filename)
      if ("error" in result) { toast.error("Błąd uploadu: " + result.error); return }
      setPhotoUrl(result.url)
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
    const thumb = await getThumbnailFromUrl(videoUrl)
    if (thumb) { setFetchingThumb(false); setThumbnailUrl(thumb); return }
    setFetchingThumb(false)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name) return
    setSaving(true)
    try {
      const isEmbedVideo = !!(extractYouTubeId(videoUrl) || extractVimeoId(videoUrl))
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
        thumbnailUrl: mediaMode === "photo" ? (photoUrl || undefined) : (thumbnailUrl || undefined),
        videoUrl: mediaMode === "video" && isEmbedVideo ? videoUrl : undefined,
        animatedGifUrl: mediaMode === "video" && !isEmbedVideo && videoUrl ? videoUrl : undefined,
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
        video_url: mediaMode === "video" && !!(extractYouTubeId(videoUrl) || extractVimeoId(videoUrl)) ? videoUrl : null,
        animated_gif_url: mediaMode === "video" && !(extractYouTubeId(videoUrl) || extractVimeoId(videoUrl)) ? videoUrl : null,
        thumbnail_url: mediaMode === "photo" ? (photoUrl || null) : (thumbnailUrl || null),
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
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 shrink-0">
        <h2 className="font-semibold text-gray-900 text-sm">Edytuj ćwiczenie</h2>
        <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
          <X size={16} className="text-gray-500" />
        </button>
      </div>

      <form id="edit-form" onSubmit={handleSubmit} onPaste={handlePaste} className="flex-1 overflow-y-auto p-5 space-y-4">

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-gray-700">Nazwa *</label>
          <input className={inputCls} value={form.name} onChange={e => update("name", e.target.value)} required autoFocus />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-gray-700">Opis / instrukcja</label>
          <textarea value={form.description} onChange={e => update("description", e.target.value)} rows={3} placeholder="Opis wykonania ćwiczenia..." className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-navy-400 resize-none" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-gray-700">Okolica ciała</label>
            <select className={selectCls} value={form.bodyPart} onChange={e => update("bodyPart", e.target.value)}>
              <option value="">— wybierz —</option>
              {BODY_PARTS.map(bp => <option key={bp} value={bp}>{bp}</option>)}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-gray-700">Kategoria</label>
            <select className={selectCls} value={form.category} onChange={e => update("category", e.target.value)}>
              <option value="">— wybierz —</option>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-gray-700">Trudność</label>
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
          <div className="space-y-1.5"><label className="text-xs font-medium text-gray-700">Serie</label><input type="number" min="1" className={inputCls} value={form.defaultSets} onChange={e => update("defaultSets", e.target.value)} placeholder="3" /></div>
          <div className="space-y-1.5"><label className="text-xs font-medium text-gray-700">Powtórzenia</label><input type="number" min="1" className={inputCls} value={form.defaultReps} onChange={e => update("defaultReps", e.target.value)} placeholder="12" /></div>
          <div className="space-y-1.5"><label className="text-xs font-medium text-gray-700">Czas (s)</label><input type="number" min="1" className={inputCls} value={form.defaultDuration} onChange={e => update("defaultDuration", e.target.value)} placeholder="30" /></div>
          <div className="space-y-1.5"><label className="text-xs font-medium text-gray-700">Przerwa (s)</label><input type="number" min="1" className={inputCls} value={form.defaultRest} onChange={e => update("defaultRest", e.target.value)} placeholder="60" /></div>
        </div>

        {/* ── Media ── */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-gray-700">Media</label>
          <div className="flex rounded-lg border border-gray-200 p-1 gap-1 bg-gray-50">
            {(["photo", "video"] as EditMediaMode[]).map(mode => (
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
                      </>
                  }
                </button>
              )}
              <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleFileChange} />
            </>
          ) : (
            <div className="space-y-2">
              <input
                type="url" className={inputCls}
                value={videoUrl}
                onChange={e => setVideoUrl(e.target.value)}
                onBlur={handleVideoBlur}
                placeholder="YouTube, Vimeo lub bezpośredni link .mp4..."
              />
              {fetchingThumb && <p className="text-xs text-gray-400 flex items-center gap-1.5"><Loader2 size={11} className="animate-spin" /> Pobieranie miniatury...</p>}
              {thumbnailUrl && (
                <div className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg border border-gray-200">
                  <img src={thumbnailUrl} alt="" className="w-20 h-12 rounded object-cover shrink-0" />
                  <span className="text-xs text-gray-500 flex-1">Miniatura</span>
                  <button type="button" onClick={() => setThumbnailUrl("")} className="text-gray-400 hover:text-gray-600"><X size={13} /></button>
                </div>
              )}
            </div>
          )}
        </div>
      </form>

      <div className="px-5 py-4 border-t border-gray-100 flex gap-3 shrink-0">
        <button type="button" onClick={onClose} className="flex-1 h-10 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
          Anuluj
        </button>
        <button type="submit" form="edit-form" disabled={saving}
          className="flex-1 h-10 rounded-xl bg-navy-500 hover:bg-navy-600 disabled:opacity-50 text-white text-sm font-medium transition-colors flex items-center justify-center gap-2">
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
        animatedGifUrl: exercise.animated_gif_url ?? null,
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
