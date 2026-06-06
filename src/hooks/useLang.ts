'use client'
import { useState, useEffect } from 'react'
import type { Lang } from '@/i18n/translations'
import translations from '@/i18n/translations'

export function useLang(defaultLang: Lang = 'fr') {
  const [lang, setLangState] = useState<Lang>(defaultLang)

  useEffect(() => {
    const stored = localStorage.getItem('hf_lang') as Lang | null
    if (stored === 'fr' || stored === 'en') setLangState(stored)
    else if (defaultLang) setLangState(defaultLang)
  }, [defaultLang])

  const setLang = (l: Lang) => {
    setLangState(l)
    localStorage.setItem('hf_lang', l)
    // Dispatch event so other components can react
    window.dispatchEvent(new StorageEvent('storage', { key: 'hf_lang', newValue: l }))
  }

  // Also listen for changes from other components
  useEffect(() => {
    const handler = (e: StorageEvent) => {
      if (e.key === 'hf_lang' && (e.newValue === 'fr' || e.newValue === 'en')) {
        setLangState(e.newValue)
      }
    }
    window.addEventListener('storage', handler)
    return () => window.removeEventListener('storage', handler)
  }, [])

  return { lang, setLang, t: translations[lang] }
}
