"use client"

import { useEffect, useState } from "react"
import { getExercisesByIds } from "@/lib/actions/exercises"
import { getPractitionerProfile } from "@/lib/actions/practitioner"
import { PrintPage } from "@/components/print/PrintPage"

type StoredExercise = {
  exerciseId: string
  name: string
  thumbnailUrl: string | null
  sets: number
  reps: number | null
  durationSeconds: number | null
  notes: string
}

type StoredData = {
  programName: string
  exercises: StoredExercise[]
  contentItems: { contentId: string; name: string; type: string; fileUrl: string | null; externalUrl: string | null }[]
}

type ExerciseDetail = {
  id: string
  name: string
  description: string | null
  body_part: string | null
  thumbnail_url: string | null
  step_images: string[] | null
  default_sets: number | null
  default_reps: number | null
  default_duration_seconds: number | null
  default_rest_seconds: number | null
}

type Practitioner = {
  first_name: string
  last_name: string
  practice_name: string | null
  practice_address: string | null
  practice_city: string | null
  practice_postal_code: string | null
  logo_url: string | null
} | null

export default function DrukujBuilderPage() {
  const [ready, setReady] = useState(false)
  const [data, setData] = useState<StoredData | null>(null)
  const [details, setDetails] = useState<ExerciseDetail[]>([])
  const [practitioner, setPractitioner] = useState<Practitioner>(null)

  useEffect(() => {
    const raw = sessionStorage.getItem("builderPrint")
    if (!raw) { setReady(true); return }

    const parsed: StoredData = JSON.parse(raw)
    setData(parsed)

    const ids = parsed.exercises.map((e) => e.exerciseId)
    Promise.all([
      getExercisesByIds(ids),
      getPractitionerProfile(),
    ]).then(([exDetails, pract]) => {
      setDetails(exDetails as ExerciseDetail[])
      setPractitioner(pract as Practitioner)
      setReady(true)
    })
  }, [])

  useEffect(() => {
    if (ready && data) {
      // small delay so images can start loading
      const t = setTimeout(() => window.print(), 800)
      return () => clearTimeout(t)
    }
  }, [ready, data])

  if (!ready) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-400 text-sm">Przygotowuję wydruk...</p>
      </div>
    )
  }

  if (!data || data.exercises.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-400 text-sm">Brak danych do wydruku.</p>
      </div>
    )
  }

  const detailMap = Object.fromEntries(details.map((d) => [d.id, d]))

  const items = data.exercises.map((ex, i) => {
    const det = detailMap[ex.exerciseId]
    return {
      id: ex.exerciseId + i,
      order: i + 1,
      sets: ex.sets,
      reps: ex.reps,
      duration_seconds: ex.durationSeconds,
      rest_seconds: null,
      notes: ex.notes || null,
      exercises: det
        ? {
            id: det.id,
            name: det.name,
            description: det.description,
            body_part: det.body_part,
            thumbnail_url: det.thumbnail_url ?? ex.thumbnailUrl,
            step_images: det.step_images,
            default_sets: det.default_sets,
            default_reps: det.default_reps,
            default_duration_seconds: det.default_duration_seconds,
            default_rest_seconds: det.default_rest_seconds,
          }
        : { id: ex.exerciseId, name: ex.name, description: null, body_part: null, thumbnail_url: ex.thumbnailUrl, step_images: null },
    }
  })

  const content = data.contentItems.map((c) => ({
    id: c.contentId,
    name: c.name,
    type: c.type,
    file_url: c.fileUrl,
    external_url: c.externalUrl,
  }))

  const printedAt = new Date().toLocaleDateString("pl-PL", { day: "numeric", month: "long", year: "numeric" })

  return (
    <>
      <div className="print:hidden fixed top-4 right-4 flex gap-2 z-50">
        <button
          onClick={() => window.close()}
          className="h-9 px-4 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
        >
          ← Zamknij
        </button>
        <button
          onClick={() => window.print()}
          className="h-9 px-4 rounded-lg bg-navy-500 hover:bg-navy-600 text-white text-sm font-medium transition-colors"
        >
          Drukuj / PDF
        </button>
      </div>

      <PrintPage
        title={data.programName}
        practitioner={practitioner}
        items={items}
        content={content}
        printedAt={printedAt}
      />
    </>
  )
}
