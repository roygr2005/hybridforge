'use client'
import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Dumbbell } from 'lucide-react'
import { createClient } from '@/lib/supabase'
import translations from '@/i18n/translations'
import type { Lang } from '@/i18n/translations'

export default function AuthPage() {
  const [lang] = useState<Lang>('fr')
  const t = translations[lang]

  const searchParams = useSearchParams()
  const [mode, setMode] = useState<'signin' | 'signup'>(
    searchParams.get('mode') === 'signup' ? 'signup' : 'signin'
  )
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [name, setName]         = useState('')
  const [error, setError]       = useState<string | null>(null)
  const [loading, setLoading]   = useState(false)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) router.replace('/dashboard')
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    if (mode === 'signup') {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: name } },
      })
      if (error) { setError(error.message); setLoading(false); return }
      router.replace('/dashboard')
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) { setError(error.message); setLoading(false); return }
      router.replace('/dashboard')
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 text-green-400 font-bold text-2xl mb-2">
            <Dumbbell size={32} />
            Train Smart
          </div>
          <p className="text-gray-400 text-sm">
            {mode === 'signin' ? t.auth.signIn : t.auth.signUp}
          </p>
        </div>

        <div className="card">
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && (
              <div>
                <label htmlFor="name">{t.auth.name}</label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  required
                  placeholder="Jean Dupont"
                />
              </div>
            )}
            <div>
              <label htmlFor="email">{t.auth.email}</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                placeholder="jean@example.com"
              />
            </div>
            <div>
              <label htmlFor="password">{t.auth.password}</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                minLength={8}
                placeholder="••••••••"
              />
            </div>

            {error && (
              <div className="bg-red-900/30 border border-red-700 text-red-400 text-sm px-3 py-2 rounded-lg">
                {error}
              </div>
            )}

            <button type="submit" disabled={loading} className="btn-primary w-full mt-2">
              {loading ? t.common.loading : mode === 'signin' ? t.auth.signIn : t.auth.signUp}
            </button>
          </form>

          <div className="mt-4 text-center text-sm text-gray-400">
            {mode === 'signin' ? (
              <>
                {t.auth.noAccount}{' '}
                <button onClick={() => setMode('signup')} className="text-green-400 hover:underline">
                  {t.auth.signUp}
                </button>
              </>
            ) : (
              <>
                {t.auth.hasAccount}{' '}
                <button onClick={() => setMode('signin')} className="text-green-400 hover:underline">
                  {t.auth.signIn}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
