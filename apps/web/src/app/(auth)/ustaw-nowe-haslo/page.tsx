"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function NewPasswordPage() {
  const router = useRouter()
  const [checking, setChecking] = useState(true)
  const [hasSession, setHasSession] = useState(false)
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getSession().then(({ data: { session } }) => {
      setHasSession(!!session)
      setChecking(false)
    })
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")

    if (password.length < 8) {
      setError("Hasło musi mieć co najmniej 8 znaków")
      return
    }
    if (password !== confirmPassword) {
      setError("Hasła nie są takie same")
      return
    }

    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ password })
    setLoading(false)

    if (error) {
      setError("Nie udało się zmienić hasła. Spróbuj ponownie.")
      return
    }

    router.push("/pacjenci")
    router.refresh()
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-md px-4">
        <div className="flex justify-center mb-8">
          <div className="flex items-center gap-2">
            <Image src="/logo.png" alt="Para Leczy" width={32} height={32} className="rounded-lg" />
            <span className="text-xl font-semibold text-gray-900">Para Leczy</span>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Ustaw nowe hasło</CardTitle>
            {!checking && !hasSession && (
              <CardDescription>Link wygasł lub jest nieprawidłowy</CardDescription>
            )}
          </CardHeader>
          <CardContent>
            {checking ? (
              <p className="text-sm text-gray-500">Sprawdzanie...</p>
            ) : !hasSession ? (
              <div className="space-y-4">
                <p className="text-sm text-gray-600">Poproś o nowy link do resetowania hasła.</p>
                <Link href="/zapomniane-haslo" className="text-sm text-navy-600 hover:underline">
                  Wyślij nowy link
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="password">Nowe hasło</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoFocus
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Powtórz hasło</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                </div>
                {error && <p className="text-sm text-red-600">{error}</p>}
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Zapisywanie..." : "Zapisz nowe hasło"}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
