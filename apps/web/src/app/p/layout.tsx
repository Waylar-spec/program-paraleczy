import { Toaster } from "@/components/ui/sonner"

export default function PatientLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      {children}
      <Toaster richColors position="top-center" />
    </div>
  )
}
