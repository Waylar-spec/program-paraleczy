import { Dumbbell } from "lucide-react"
import { getExercises } from "@/lib/actions/exercises"
import { ExerciseLibrary } from "@/components/exercises/ExerciseLibrary"
import { NewExerciseModal } from "@/components/exercises/NewExerciseModal"
import { LibraryTabs } from "@/components/library/LibraryTabs"

export default async function BibliotekaPage() {
  const exercises = await getExercises()

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Biblioteka</h1>
          <p className="text-sm text-gray-500 mt-1">
            {exercises.length > 0
              ? `${exercises.length} ćwiczeń`
              : "Dodaj własne ćwiczenia lub korzystaj z gotowej biblioteki"}
          </p>
        </div>
        <NewExerciseModal />
      </div>

      <LibraryTabs />

      {exercises.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-16 h-16 rounded-full bg-navy-50 flex items-center justify-center mb-4">
            <Dumbbell size={28} className="text-navy-500" />
          </div>
          <h2 className="text-lg font-medium text-gray-900 mb-2">Brak ćwiczeń</h2>
          <p className="text-sm text-gray-500 mb-6 max-w-sm">
            Dodaj pierwsze ćwiczenie do biblioteki.
          </p>
          <NewExerciseModal />
        </div>
      ) : (
        <ExerciseLibrary exercises={exercises} />
      )}
    </div>
  )
}
