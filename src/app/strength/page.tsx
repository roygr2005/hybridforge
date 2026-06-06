'use client'
import { useEffect, useState } from 'react'
import ProtectedLayout from '@/components/ProtectedLayout'
import { useAuth } from '@/hooks/useAuth'
import { useLang } from '@/hooks/useLang'
import { createClient } from '@/lib/supabase'
import { Plus, Trash2, ChevronDown, ChevronUp, Dumbbell } from 'lucide-react'
import type { StrengthSession, StrengthSet } from '@/types/database'

interface SetRow { exercise: string; set_number: number; reps: number | ''; weight_kg: number | ''; rpe: number | ''; notes: string }
interface ExerciseGroup { name: string; sets: SetRow[] }

export default function StrengthPage() {
  const { user, profile } = useAuth()
  const { t } = useLang(profile?.lang as 'fr' | 'en' | undefined)
  const supabase = createClient()

  const [showForm, setShowForm] = useState(false)
  const [sessionName, setSessionName] = useState('')
  const [sessionDate, setSessionDate] = useState(new Date().toISOString().split('T')[0])
  const [duration, setDuration] = useState<number | ''>('')
  const [notes, setNotes] = useState('')
  const [exercises, setExercises] = useState<ExerciseGroup[]>([
    { name: '', sets: [{ exercise: '', set_number: 1, reps: '', weight_kg: '', rpe: '', notes: '' }] }
  ])
  const [saving, setSaving] = useState(false)
  const [savedMsg, setSavedMsg] = useState('')

  const [sessions, setSessions] = useState<StrengthSession[]>([])
  const [sessionSets, setSessionSets] = useState<Record<string, StrengthSet[]>>({})
  const [expanded, setExpanded] = useState<string | null>(null)

  useEffect(() => {
    if (!user) return
    fetchSessions()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  async function fetchSessions() {
    const { data } = await supabase
      .from('strength_sessions')
      .select('*')
      .eq('user_id', user!.id)
      .order('session_date', { ascending: false })
    setSessions(data ?? [])
  }

  async function loadSets(sessionId: string) {
    if (sessionSets[sessionId]) { setExpanded(sessionId); return }
    const { data } = await supabase
      .from('strength_sets')
      .select('*')
      .eq('session_id', sessionId)
      .order('exercise')
      .order('set_number')
    setSessionSets(prev => ({ ...prev, [sessionId]: data ?? [] }))
    setExpanded(sessionId)
  }

  function addExercise() {
    setExercises(prev => [
      ...prev,
      { name: '', sets: [{ exercise: '', set_number: 1, reps: '', weight_kg: '', rpe: '', notes: '' }] }
    ])
  }

  // FIX : ajoute exactement 1 série en clonant proprement l'objet
  function addSet(exIdx: number) {
    setExercises(prev => {
      const copy = prev.map((ex, i) => {
        if (i !== exIdx) return ex
        const newSet: SetRow = {
          exercise: ex.name,
          set_number: ex.sets.length + 1,
          reps: '',
          weight_kg: '',
          rpe: '',
          notes: '',
        }
        return { ...ex, sets: [...ex.sets, newSet] }
      })
      return copy
    })
  }

  function removeSet(exIdx: number, setIdx: number) {
    setExercises(prev => prev.map((ex, i) => {
      if (i !== exIdx) return ex
      const newSets = ex.sets.filter((_, j) => j !== setIdx).map((s, j) => ({ ...s, set_number: j + 1 }))
      return { ...ex, sets: newSets }
    }))
  }

  function updateSet(exIdx: number, setIdx: number, field: keyof SetRow, value: string | number) {
    setExercises(prev => prev.map((ex, i) => {
      if (i !== exIdx) return ex
      return {
        ...ex,
        sets: ex.sets.map((s, j) => j !== setIdx ? s : { ...s, [field]: value }),
      }
    }))
  }

  async function handleSave() {
    if (!user || !sessionName) return
    setSaving(true)

    const { data: sess, error: sessErr } = await supabase.from('strength_sessions').insert({
      user_id: user.id,
      name: sessionName,
      notes: notes || null,
      duration_minutes: duration === '' ? null : Number(duration),
      session_date: sessionDate,
    }).select().single()

    if (sessErr || !sess) { setSaving(false); return }

    const setsToInsert: Omit<StrengthSet, 'id' | 'created_at'>[] = []
    exercises.forEach(ex => {
      ex.sets.forEach(s => {
        if (!ex.name) return
        setsToInsert.push({
          session_id: sess.id,
          user_id: user.id,
          exercise: ex.name,
          set_number: s.set_number,
          reps: s.reps === '' ? null : Number(s.reps),
          weight_kg: s.weight_kg === '' ? null : Number(s.weight_kg),
          rpe: s.rpe === '' ? null : Number(s.rpe),
          notes: s.notes || null,
        })
      })
    })

    if (setsToInsert.length > 0) await supabase.from('strength_sets').insert(setsToInsert)

    setSaving(false)
    setSavedMsg(t.common.success)
    setTimeout(() => setSavedMsg(''), 3000)
    setShowForm(false)
    setSessionName(''); setDuration(''); setNotes('')
    setExercises([{ name: '', sets: [{ exercise: '', set_number: 1, reps: '', weight_kg: '', rpe: '', notes: '' }] }])
    fetchSessions()
  }

  // Affiche la durée en h min si >= 60
  function formatDuration(min: number | null) {
    if (!min) return ''
    if (min < 60) return `${min} min`
    const h = Math.floor(min / 60)
    const m = min % 60
    return m > 0 ? `${h}h${m.toString().padStart(2, '0')}` : `${h}h`
  }

  return (
    <ProtectedLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold flex items-center gap-2"><Dumbbell size={24} className="text-green-400" />{t.strength.title}</h1>
          <button onClick={() => setShowForm(!showForm)} className="btn-primary flex items-center gap-2 text-sm">
            <Plus size={16} /> {t.strength.newSession}
          </button>
        </div>

        {savedMsg && <div className="bg-green-900/30 border border-green-700 text-green-400 px-4 py-2 rounded-lg text-sm">{savedMsg}</div>}

        {showForm && (
          <div className="card space-y-5">
            <h2 className="font-semibold text-lg">{t.strength.newSession}</h2>
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <label>{t.strength.sessionName}</label>
                <input value={sessionName} onChange={e => setSessionName(e.target.value)} placeholder="Push, Full Body…" />
              </div>
              <div>
                <label>{t.strength.date}</label>
                <input type="date" value={sessionDate} onChange={e => setSessionDate(e.target.value)} />
              </div>
              <div>
                <label>{t.strength.duration}</label>
                <input type="number" value={duration} onChange={e => setDuration(e.target.value === '' ? '' : Number(e.target.value))} placeholder="60" />
              </div>
            </div>
            <div>
              <label>{t.strength.notes}</label>
              <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} placeholder="…" />
            </div>

            {exercises.map((ex, exIdx) => (
              <div key={exIdx} className="bg-gray-800/50 rounded-xl p-4 space-y-3 border border-gray-700">
                <div>
                  <label>{t.strength.exercise} {exIdx + 1}</label>
                  <input
                    value={ex.name}
                    onChange={e => setExercises(prev => prev.map((x, i) => i === exIdx ? { ...x, name: e.target.value } : x))}
                    placeholder="Squat, Bench press…"
                  />
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-gray-400 text-left">
                        <th className="pb-2 pr-3">#</th>
                        <th className="pb-2 pr-3">{t.strength.reps}</th>
                        <th className="pb-2 pr-3">{t.strength.weight}</th>
                        <th className="pb-2 pr-3">{t.strength.rpe}</th>
                        <th className="pb-2"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {ex.sets.map((s, sIdx) => (
                        <tr key={sIdx}>
                          <td className="pr-3 text-gray-500 py-1">{sIdx + 1}</td>
                          <td className="pr-3 py-1"><input type="number" value={s.reps} onChange={e => updateSet(exIdx, sIdx, 'reps', e.target.value)} className="w-16" placeholder="10" /></td>
                          <td className="pr-3 py-1"><input type="number" step="0.5" value={s.weight_kg} onChange={e => updateSet(exIdx, sIdx, 'weight_kg', e.target.value)} className="w-20" placeholder="80" /></td>
                          <td className="pr-3 py-1"><input type="number" step="0.5" min="1" max="10" value={s.rpe} onChange={e => updateSet(exIdx, sIdx, 'rpe', e.target.value)} className="w-16" placeholder="8" /></td>
                          <td className="py-1"><button onClick={() => removeSet(exIdx, sIdx)} className="text-gray-500 hover:text-red-400"><Trash2 size={14} /></button></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <button onClick={() => addSet(exIdx)} className="text-green-400 text-sm hover:underline flex items-center gap-1">
                  <Plus size={14} /> {t.strength.addSet}
                </button>
              </div>
            ))}

            <button onClick={addExercise} className="btn-secondary text-sm flex items-center gap-2 w-full justify-center">
              <Plus size={16} /> {t.strength.addExercise}
            </button>

            <div className="flex gap-3">
              <button onClick={handleSave} disabled={saving || !sessionName} className="btn-primary">
                {saving ? t.common.loading : t.strength.saveSession}
              </button>
              <button onClick={() => setShowForm(false)} className="btn-secondary">{t.common.cancel}</button>
            </div>
          </div>
        )}

        <div>
          <h2 className="text-lg font-semibold mb-3">{t.strength.history}</h2>
          {sessions.length === 0 ? (
            <p className="text-gray-500 text-sm">{t.strength.noSessions}</p>
          ) : (
            <div className="space-y-2">
              {sessions.map(s => (
                <div key={s.id} className="card">
                  <button
                    className="w-full flex items-center justify-between"
                    onClick={() => {
                      if (expanded === s.id) setExpanded(null)
                      else loadSets(s.id)
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <Dumbbell size={16} className="text-green-400" />
                      <span className="font-medium">{s.name}</span>
                      {s.duration_minutes && <span className="text-xs text-gray-500">{formatDuration(s.duration_minutes)}</span>}
                    </div>
                    <div className="flex items-center gap-2 text-gray-400 text-sm">
                      {new Date(s.session_date).toLocaleDateString(profile?.lang === 'en' ? 'en-GB' : 'fr-FR')}
                      {expanded === s.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </div>
                  </button>

                  {expanded === s.id && sessionSets[s.id] && (
                    <div className="mt-4 pt-4 border-t border-gray-800">
                      {Object.entries(
                        sessionSets[s.id].reduce((acc, set) => {
                          if (!acc[set.exercise]) acc[set.exercise] = []
                          acc[set.exercise].push(set)
                          return acc
                        }, {} as Record<string, StrengthSet[]>)
                      ).map(([exercise, sets]) => (
                        <div key={exercise} className="mb-3">
                          <p className="text-sm font-medium text-green-400 mb-1">{exercise}</p>
                          <div className="space-y-1">
                            {sets.map(set => (
                              <div key={set.id} className="flex gap-4 text-sm text-gray-300">
                                <span className="text-gray-500">#{set.set_number}</span>
                                {set.reps && <span>{set.reps} reps</span>}
                                {set.weight_kg && <span>{set.weight_kg} kg</span>}
                                {set.rpe && <span className="text-orange-400">RPE {set.rpe}</span>}
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                      {s.notes && <p className="text-xs text-gray-500 mt-2 italic">{s.notes}</p>}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </ProtectedLayout>
  )
}
