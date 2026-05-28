import { PatientBottomNav } from "@/components/patient/PatientBottomNav"

export default async function KodLayout({
  children,
}: {
  children: React.ReactNode
  params: Promise<{ kod: string }>
}) {
  return (
    <div className="min-h-screen bg-gray-50 pb-16">
      {children}
      <PatientBottomNav />
    </div>
  )
}
