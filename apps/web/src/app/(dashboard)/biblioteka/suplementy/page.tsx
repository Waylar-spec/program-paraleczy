import { getSupplements } from "@/lib/actions/supplements"
import { LibraryTabs } from "@/components/library/LibraryTabs"
import { SupplementsGrid } from "@/components/supplements/SupplementsGrid"

export default async function SuplementyPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; type?: string }>
}) {
  const { q, type } = await searchParams
  const supplements = await getSupplements(q)

  const types = Array.from(
    new Set(supplements.map((s) => s.product_type).filter(Boolean))
  ).sort() as string[]

  const filtered = type
    ? supplements.filter((s) => s.product_type === type)
    : supplements

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Biblioteka</h1>
          <p className="text-sm text-gray-500 mt-1">
            {filtered.length} {filtered.length === 1 ? "suplement" : filtered.length < 5 ? "suplementy" : "suplementów"} Formeds
          </p>
        </div>
      </div>

      <LibraryTabs />

      <SupplementsGrid supplements={filtered} types={types} currentType={type} currentSearch={q} />
    </div>
  )
}
