import { getPractitioner } from "@/lib/actions/practitioner"
import { PractitionerSettingsForm } from "@/components/settings/PractitionerSettingsForm"

export default async function UstawieniaPage() {
  const practitioner = await getPractitioner()

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Ustawienia konta</h1>
        <p className="text-sm text-gray-500 mt-1">Zarządzaj danymi swojej praktyki</p>
      </div>
      <PractitionerSettingsForm defaultValues={practitioner} />
    </div>
  )
}
