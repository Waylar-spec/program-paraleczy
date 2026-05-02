import { OrdoWidget } from "@/components/patient/OrdoWidget"

export default function WizytaPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <h1 className="text-lg font-semibold text-gray-900 mb-4">Umów wizytę</h1>
      <OrdoWidget />
    </div>
  )
}
