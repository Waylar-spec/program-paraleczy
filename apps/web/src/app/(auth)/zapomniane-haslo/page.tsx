"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [error, setError] = useState("")
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError("")

    const supabase = createClient()
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/confirm?next=/ustaw-nowe-haslo`,
    })

    setLoading(false)
    if (error) {
      setError("Nie udało się wysłać linku. Spróbuj ponownie.")
      return
    }
    setSent(true)
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
            <CardTitle>Zresetuj hasło</CardTitle>
            <CardDescription>
              {sent
                ? "Sprawdź swoją skrzynkę e-mail"
                : "Podaj adres e-mail, a wyślemy link do zresetowania hasła"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {sent ? (
              <div className="space-y-4">
                <p className="text-sm text-gray-600">
                  Jeśli konto o adresie <span className="font-medium">{email}</span> istnieje, otrzymasz e-mail z linkiem do ustawienia nowego hasła.
                </p>
                <Link href="/login" className="text-sm text-navy-600 hover:underline">
                  Powrót do logowania
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">E-mail</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="twoj@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoFocus
                  />
                </div>
                {error && <p className="text-sm text-red-600">{error}</p>}
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Wysyłanie..." : "Wyślij link resetujący"}
                </Button>
                <Link href="/login" className="block text-sm text-center text-gray-500 hover:text-gray-700">
                  Powrót do logowania
                </Link>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
