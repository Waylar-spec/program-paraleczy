import { LayoutTemplate } from "lucide-react"
import { getTemplates } from "@/lib/actions/templates"
import { NewTemplateModal } from "@/components/templates/NewTemplateModal"
import { TemplateSelector } from "@/components/templates/TemplateSelector"
import { LibraryTabs } from "@/components/library/LibraryTabs"

export default async function SzablonyPage() {
  const templates = await getTemplates()

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Biblioteka</h1>
          <p className="text-sm text-gray-500 mt-1">
            {templates.length > 0
              ? `${templates.length} ${templates.length === 1 ? "szablon" : templates.length < 5 ? "szablony" : "szablonów"}`
              : "Twórz szablony ćwiczeń do wielokrotnego przypisywania pacjentom"}
          </p>
        </div>
        <NewTemplateModal />
      </div>

      <LibraryTabs />

      {templates.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-16 h-16 rounded-full bg-navy-50 flex items-center justify-center mb-4">
            <LayoutTemplate size={28} className="text-navy-500" />
          </div>
          <h2 className="text-lg font-medium text-gray-900 mb-2">Brak szablonów</h2>
          <p className="text-sm text-gray-500 mb-6 max-w-sm">
            Stwórz szablon programu ćwiczeń, który możesz przypisywać wielu pacjentom.
          </p>
          <NewTemplateModal />
        </div>
      ) : (
        <TemplateSelector templates={templates} />
      )}
    </div>
  )
}
