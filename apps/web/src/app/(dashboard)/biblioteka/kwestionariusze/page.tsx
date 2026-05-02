import { getSurveys } from "@/lib/actions/surveys"
import { SurveysLibrary } from "@/components/surveys/SurveysLibrary"

export default async function KwestionariuszePage() {
  const surveys = await getSurveys()

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Biblioteka</h1>
          <p className="text-sm text-gray-500 mt-1">
            {surveys.length} {surveys.length === 1 ? "kwestionariusz" : surveys.length < 5 ? "kwestionariusze" : "kwestionariuszy"}
          </p>
        </div>
      </div>

      <SurveysLibrary surveys={surveys} />
    </div>
  )
}
