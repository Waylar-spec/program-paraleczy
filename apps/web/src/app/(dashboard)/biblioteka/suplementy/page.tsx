import { LibraryTabs } from "@/components/library/LibraryTabs"

export default function SuplementyPage() {
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Biblioteka</h1>
          <p className="text-sm text-gray-500 mt-1">Suplementy</p>
        </div>
      </div>
      <LibraryTabs />
      <div className="flex items-center justify-center h-48 text-gray-400 text-sm">
        Sekcja w budowie
      </div>
    </div>
  )
}
