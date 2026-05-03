import { getEducationalContent } from "@/lib/actions/education"
import { NewContentModal } from "@/components/education/NewContentModal"
import { EducationLibrary } from "@/components/education/EducationLibrary"
import { LibraryTabs } from "@/components/library/LibraryTabs"

export default async function EdukacjaPage() {
  const content = await getEducationalContent()

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Biblioteka</h1>
          <p className="text-sm text-gray-500 mt-1">
            {content.length > 0
              ? `${content.length} ${content.length === 1 ? "materiał" : content.length < 5 ? "materiały" : "materiałów"} edukacyjnych`
              : "Dodaj PDFy lub linki do artykułów dla pacjentów"}
          </p>
        </div>
        <NewContentModal />
      </div>

      <LibraryTabs />

      <EducationLibrary content={content} />
    </div>
  )
}
