import Link from "next/link"
import { LayoutTemplate } from "lucide-react"

import { getTemplates } from "@/lib/actions/templates"
import { NewTemplateModal } from "@/components/templates/NewTemplateModal"
import { TemplateSelector } from "@/components/templates/TemplateSelector"

const TABS = [
  { label: "Ćwiczenia", href: "/biblioteka" },
  { label: "Szablony", href: "/biblioteka/szablony" },
  { label: "Protokoły", href: "/biblioteka/protokoly" },
  { label: "Edukacja", href: "/biblioteka/edukacja" },
  { label: "Kwestionariusze", href: "/biblioteka/kwestionariusze" },
]

export default async function SzablonyPage() {
  const templates = await getTemplates()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Biblioteka</h1>
          <p className="text-sm text-gray-500 mt-1">
            {templates.length > 0
              ? `${templates.length} szablonów programów`
              : "Twórz szablony ćwiczeń do wielokrotnego przypisywania pacjentom"}
          </p>
        </div>
        <NewTemplateModal />
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-6">
          {TABS.map((tab) => (
            <Link
              key={tab.href}
              href={tab.href}
              className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
                tab.href === "/biblioteka/szablony"
                  ? "border-navy-600 text-navy-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              {tab.label}
            </Link>
          ))}
        </nav>
      </div>

      {templates.length > 0 ? (
        <TemplateSelector templates={templates} />
      ) : (
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
      )}
    </div>
  )
}
