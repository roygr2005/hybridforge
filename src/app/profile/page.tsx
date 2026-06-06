'use client'
import { useEffect, useState } from 'react'
import ProtectedLayout from '@/components/ProtectedLayout'
import { useAuth } from '@/hooks/useAuth'
import { useLang } from '@/hooks/useLang'
import { createClient } from '@/lib/supabase'
import { User } from 'lucide-react'
import type { Profile } from '@/types/database'

const SPORTS: { key: string; fr: string; en: string }[] = [
  { key: 'strength',    fr: 'Musculation',      en: 'Strength training' },
  { key: 'running',    fr: 'Course à pied',     en: 'Running' },
  { key: 'cycling',    fr: 'Vélo / Cyclisme',   en: 'Cycling' },
  { key: 'swimming',   fr: 'Natation',          en: 'Swimming' },
  { key: 'rowing',     fr: 'Aviron',            en: 'Rowing' },
  { key: 'crossfit',   fr: 'CrossFit',          en: 'CrossFit' },
  { key: 'hiking',     fr: 'Randonnée',         en: 'Hiking' },
  { key: 'yoga',       fr: 'Yoga / Pilates',    en: 'Yoga / Pilates' },
  { key: 'boxing',     fr: 'Boxe / Arts martiaux', en: 'Boxing / Martial arts' },
  { key: 'tennis',     fr: 'Tennis / Padel',    en: 'Tennis / Padel' },
  { key: 'football',   fr: 'Football',          en: 'Football / Soccer' },
  { key: 'basketball', fr: 'Basketball',        en: 'Basketball' },
]

export default function ProfilePage() {
  const { user, profile, refetchProfile } = useAuth()
  const { t, lang, setLang } = useLang(profile?.lang as 'fr' | 'en' | undefined)
  const supabase = createClient()

  const [form, setForm] = useState<Partial<Profile>>({})
  const [saving, setSaving] = useState(false)
  const [savedMsg, setSavedMsg] = useState('')

  useEffect(() => {
    if (profile) setForm(profile)
  }, [profile])

  function set(key: keyof Profile, value: unknown) {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  function toggleSport(sportKey: string) {
    const current = form.sports ?? []
    set('sports', current.includes(sportKey)
      ? current.filter(s => s !== sportKey)
      : [...current, sportKey]
    )
  }

  async function handleSave() {
    if (!user) return
    setSaving(true)
    const { error } = await supabase.from('profiles').update({
      full_name: form.full_name,
      birth_date: form.birth_date,
      height_cm: form.height_cm,
      weight_kg: form.weight_kg,
      gender: form.gender,
      level: form.level,
      goal: form.goal,
      sports: form.sports,
      lang: form.lang,
    }).eq('id', user.id)

    setSaving(false)
    if (!error) {
      setSavedMsg(t.profile.saved)
      setTimeout(() => setSavedMsg(''), 3000)
      refetchProfile?.()
      if (form.lang === 'en' || form.lang === 'fr') setLang(form.lang)
    }
  }

  return (
    <ProtectedLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <User size={24} className="text-gray-400" />
          {t.profile.title}
        </h1>

        {savedMsg && <div className="bg-green-900/30 border border-green-700 text-green-400 px-4 py-2 rounded-lg text-sm">{savedMsg}</div>}

        <div className="card space-y-4">
          <h2 className="font-semibold text-base text-gray-300">{t.profile.personalInfo}</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label>{t.profile.name}</label>
              <input value={form.full_name ?? ''} onChange={e => set('full_name', e.target.value)} placeholder="Jean Dupont" />
            </div>
            <div>
              <label>{t.profile.birthDate}</label>
              <input type="date" value={form.birth_date ?? ''} onChange={e => set('birth_date', e.target.value)} />
            </div>
            <div>
              <label>{t.profile.height}</label>
              <input type="number" value={form.height_cm ?? ''} onChange={e => set('height_cm', Number(e.target.value))} placeholder="178" />
            </div>
            <div>
              <label>{t.profile.weight}</label>
              <input type="number" step="0.1" value={form.weight_kg ?? ''} onChange={e => set('weight_kg', Number(e.target.value))} placeholder="75" />
            </div>
            <div>
              <label>{t.profile.gender}</label>
              <select value={form.gender ?? ''} onChange={e => set('gender', e.target.value as Profile['gender'])}>
                <option value="">—</option>
                <option value="male">{t.profile.male}</option>
                <option value="female">{t.profile.female}</option>
                <option value="other">{t.profile.other}</option>
                <option value="prefer_not">{t.profile.prefer_not}</option>
              </select>
            </div>
            <div>
              <label>{t.profile.language}</label>
              <select value={form.lang ?? 'fr'} onChange={e => set('lang', e.target.value)}>
                <option value="fr">🇫🇷 Français</option>
                <option value="en">🇬🇧 English</option>
              </select>
            </div>
          </div>
        </div>

        <div className="card space-y-4">
          <h2 className="font-semibold text-base text-gray-300">{t.profile.fitnessInfo}</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label>{t.profile.level}</label>
              <select value={form.level ?? 'beginner'} onChange={e => set('level', e.target.value as Profile['level'])}>
                <option value="beginner">{t.profile.beginner}</option>
                <option value="intermediate">{t.profile.intermediate}</option>
                <option value="advanced">{t.profile.advanced}</option>
              </select>
            </div>
            <div>
              <label>{t.profile.goal}</label>
              <select value={form.goal ?? 'health'} onChange={e => set('goal', e.target.value as Profile['goal'])}>
                <option value="health">{t.profile.health}</option>
                <option value="performance">{t.profile.performance}</option>
                <option value="muscle_gain">{t.profile.muscle_gain}</option>
                <option value="weight_loss">{t.profile.weight_loss}</option>
                <option value="endurance">{t.profile.enduranceGoal}</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block mb-2">{t.profile.sports}</label>
            <div className="flex flex-wrap gap-2">
              {SPORTS.map(s => (
                <button
                  key={s.key}
                  onClick={() => toggleSport(s.key)}
                  className={`px-3 py-1.5 rounded-lg text-sm border transition-colors ${
                    form.sports?.includes(s.key)
                      ? 'border-green-500 bg-green-900/30 text-green-400'
                      : 'border-gray-700 text-gray-400 hover:border-gray-500'
                  }`}
                >
                  {lang === 'en' ? s.en : s.fr}
                </button>
              ))}
            </div>
          </div>
        </div>

        <button onClick={handleSave} disabled={saving} className="btn-primary w-full">
          {saving ? t.common.loading : t.profile.save}
        </button>
      </div>
    </ProtectedLayout>
  )
}
