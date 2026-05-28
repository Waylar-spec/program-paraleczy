"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Star, Dumbbell, Trash2 } from "lucide-react"
import { toggleFavorite, deleteExercise } from "@/lib/actions/exercises"
import { toast } from "sonner"
import { useProgramBuilder } from "@/store/programBuilder"
import { ExerciseDetailModal } from "./ExerciseDetailModal"

type Exercise = {
  id: string
  name: string
  name_en: string | null
  description: string | null
  body_part: string | null
  category: string | null
  difficulty: number | null
  default_sets: number | null
  default_reps: number | null
  default_duration_seconds: number | null
  thumbnail_url: string | null
  animated_gif_url?: string | null
  video_url: string | null
  is_favorite: boolean
  is_public: boolean
  practitioner_id: string | null
}

// Module-level cache so we don't re-fetch on re-renders
const vimeoThumbCache = new Map<string, string>()

function useVimeoThumbnail(videoUrl: string | null): string | null {
  const [thumb, setThumb] = useState<string | null>(() => {
    if (!videoUrl) return null
    return vimeoThumbCache.get(videoUrl) ?? null
  })

  useEffect(() => {
    if (!videoUrl || !videoUrl.includes("vimeo")) return
    if (vimeoThumbCache.has(videoUrl)) { setThumb(vimeoThumbCache.get(videoUrl)!); return }

    const match = videoUrl.match(/vimeo\.com\/(?:video\/)?(\d+)/)
    if (!match) return

    fetch(`https://vimeo.com/api/oembed.json?url=https://vimeo.com/${match[1]}&width=640`)
      .then((r) => r.json())
      .then((data) => {
        if (data?.thumbnail_url) {
          vimeoThumbCache.set(videoUrl, data.thumbnail_url)
          setThumb(data.thumbnail_url)
        }
      })
      .catch(() => {})
  }, [videoUrl])

  return thumb
}

const DIFFICULTY_COLOR: Record<number, string> = {
  1: "text-green-600 bg-green-50",
  2: "text-yellow-600 bg-yellow-50",
  3: "text-red-600 bg-red-50",
}

export function ExerciseCard({ exercise }: { exercise: Exercise }) {
  const router = useRouter()
  const [favorite, setFavorite] = useState(exercise.is_favorite)
  const [showDetail, setShowDetail] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const { addExercise, removeExercise, hasExercise, exercises, isOpen: builderOpen } = useProgramBuilder()
  const inProgram = hasExercise(exercise.id)
  const isOwn = !!exercise.practitioner_id

  const hasThumb = !!exercise.thumbnail_url
  // Direct mp4 (e.g. Physitrack) — shown as looping demo video
  const isDirectMp4 = !!exercise.video_url && !exercise.video_url.includes("vimeo") && !exercise.video_url.includes("youtube") && !exercise.video_url.includes("youtu.be") && (exercise.video_url.endsWith(".mp4") || exercise.video_url.includes(".mp4"))
  // Vimeo thumbnail — fetched lazily
  const isVimeo = !!exercise.video_url && exercise.video_url.includes("vimeo")
  const vimeoThumb = useVimeoThumbnail(isVimeo ? exercise.video_url : null)

  async function handleDelete(e: React.MouseEvent) {
    e.stopPropagation()
    if (!confirmDelete) {
      setConfirmDelete(true)
      setTimeout(() => setConfirmDelete(false), 3000)
      return
    }
    setDeleting(true)
    try {
      await deleteExercise(exercise.id)
      toast.success("Ćwiczenie usunięte")
      router.refresh()
    } catch {
      toast.error("Nie udało się usunąć")
      setDeleting(false)
      setConfirmDelete(false)
    }
  }

  async function handleFavorite(e: React.MouseEvent) {
    e.stopPropagation()
    const next = !favorite
    setFavorite(next)
    try {
      await toggleFavorite(exercise.id, next)
      router.refresh()
    } catch {
      setFavorite(!next)
    }
  }

  function handleCheckbox(e: React.MouseEvent) {
    e.stopPropagation()
    if (inProgram) {
      const item = exercises.find((ex) => ex.exerciseId === exercise.id)
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
    }
  }

  const params = [
    exercise.default_sets && `${exercise.default_sets} serie`,
    exercise.default_reps && `${exercise.default_reps} powt.`,
    exercise.default_duration_seconds && `${exercise.default_duration_seconds}s`,
  ].filter(Boolean).join(" · ")

  return (
    <>
      <div
        onClick={builderOpen ? undefined : () => setShowDetail(true)}
        className={`group bg-white rounded-xl border overflow-hidden transition-all ${
          inProgram ? "border-navy-400 ring-1 ring-navy-300" : "border-gray-200"
        } ${builderOpen ? "cursor-default" : "cursor-pointer hover:shadow-sm hover:border-navy-200"}`}
      >
        {/* Thumbnail / GIF area */}
        <div className="relative aspect-video bg-gray-50 flex items-center justify-center overflow-hidden">
          {/* Priority: direct mp4 (Physitrack) > vimeo thumb > static thumbnail > placeholder */}
          {isDirectMp4 ? (
            <video
              src={exercise.video_url!}
              className="absolute inset-0 w-full h-full object-contain"
              autoPlay
              muted
              loop
              playsInline
            />
          ) : vimeoThumb ? (
            <img
              src={vimeoThumb}
              alt={exercise.name}
              loading="lazy"
              className="absolute inset-0 w-full h-full object-cover"
            />
          ) : hasThumb ? (
            <img
              src={exercise.thumbnail_url!}
              alt={exercise.name}
              loading="lazy"
              className="absolute inset-0 w-full h-full object-cover"
            />
          ) : exercise.animated_gif_url?.endsWith('.mp4') ? (
            // mp4 gif — bez autoPlay pokazuje pierwszy kadr jako statyczny obraz
            <video
              src={exercise.animated_gif_url}
              className="absolute inset-0 w-full h-full object-contain"
              muted
              playsInline
              preload="metadata"
            />
          ) : (
            <Dumbbell size={32} className="text-gray-300" />
          )}

          {/* Checkbox top-left */}
          <button
            onClick={handleCheckbox}
            className={`absolute top-2 left-2 z-10 w-6 h-6 rounded-md border-2 flex items-center justify-center transition-colors ${
              inProgram
                ? "bg-navy-500 border-navy-500"
                : "bg-white/80 border-gray-300 hover:border-navy-400"
            }`}
          >
            {inProgram && (
              <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            )}
          </button>

          {/* Favorite top-right */}
          <button
            onClick={handleFavorite}
            className="absolute top-2 right-2 p-1.5 rounded-lg bg-white/80 hover:bg-white transition-colors z-10"
          >
            <Star
              size={14}
              className={favorite ? "text-yellow-400 fill-yellow-400" : "text-gray-400"}
            />
          </button>

          {!isOwn && (
            <span className="absolute bottom-2 left-2 text-xs px-1.5 py-0.5 rounded bg-navy-500 text-white font-medium z-10">
              Biblioteka
            </span>
          )}
        </div>

        {/* Info */}
        <div className="p-3">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-sm font-medium text-gray-900 leading-tight line-clamp-2">{exercise.name}</p>
              {exercise.name_en && (
                <p className="text-xs text-gray-400 leading-tight mt-0.5 line-clamp-1">{exercise.name_en}</p>
              )}
            </div>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className={`shrink-0 p-1.5 rounded-lg transition-colors opacity-0 group-hover:opacity-100 ${
                confirmDelete
                  ? "bg-red-500 text-white opacity-100"
                  : "hover:bg-red-50 text-gray-300 hover:text-red-500"
              }`}
              title={confirmDelete ? "Kliknij ponownie aby potwierdzić" : "Usuń ćwiczenie"}
            >
              <Trash2 size={13} />
            </button>
          </div>
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            {exercise.body_part && (
              <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                {exercise.body_part}
              </span>
            )}
            {exercise.difficulty && (
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${DIFFICULTY_COLOR[exercise.difficulty]}`}>
                {["", "Łatwe", "Średnie", "Trudne"][exercise.difficulty]}
              </span>
            )}
          </div>
          {params && (
            <p className="text-xs text-gray-400 mt-1.5">{params}</p>
          )}
        </div>
      </div>

      {showDetail && (
        <ExerciseDetailModal
          exercise={{ ...exercise, is_favorite: favorite }}
          onClose={() => setShowDetail(false)}
        />
      )}
    </>
  )
}
