'use client'
import Link from 'next/link'
import { Zap, Dumbbell, Activity, TrendingUp, Bot, Check } from 'lucide-react'
import { useState } from 'react'
import translations from '@/i18n/translations'
import type { Lang } from '@/i18n/translations'

export default function LandingPage() {
  const [lang, setLang] = useState<Lang>('fr')
  const t = translations[lang]

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <header className="max-w-6xl mx-auto px-4 py-5 flex items-center justify-between">
        <div className="flex items-center gap-2 font-bold text-xl text-orange-400">
          <Zap size={26} fill="currentColor" />
          HybridForge
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setLang(lang === 'fr' ? 'en' : 'fr')}
            className="text-xs px-2 py-1 rounded border border-gray-600 text-gray-300 hover:border-orange-400 hover:text-orange-400 transition-colors"
          >
            {lang === 'fr' ? '🇬🇧 EN' : '🇫🇷 FR'}
          </button>
          <Link href="/auth" className="text-sm text-gray-300 hover:text-white transition-colors">{t.landing.login}</Link>
          <Link href="/auth?mode=signup" className="bg-orange-600 hover:bg-orange-500 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors">
            {t.landing.cta}
          </Link>
        </div>
      </header>

      <section className="max-w-4xl mx-auto px-4 py-20 text-center">
        <div className="inline-flex items-center gap-2 bg-orange-900/30 border border-orange-700/50 text-orange-400 text-sm px-3 py-1 rounded-full mb-6">
          <Zap size={12} fill="currentColor" /> {t.landing.badge}
        </div>
        <h1 className="text-5xl font-extrabold mb-6 leading-tight">{t.landing.hero}</h1>
        <p className="text-xl text-gray-400 mb-10 max-w-2xl mx-auto">{t.landing.sub}</p>
        <Link href="/auth?mode=signup" className="bg-orange-600 hover:bg-orange-500 text-white text-base font-bold px-8 py-3 rounded-xl inline-block transition-colors">
          {t.landing.cta} →
        </Link>
      </section>

      <section className="max-w-5xl mx-auto px-4 pb-20 grid md:grid-cols-2 lg:grid-cols-4 gap-5">
        {[
          { icon: <Dumbbell size={28} />, title: t.landing.feature1Title, desc: t.landing.feature1Desc },
          { icon: <Activity size={28} />, title: t.landing.feature2Title, desc: t.landing.feature2Desc },
          { icon: <TrendingUp size={28} />, title: t.landing.feature3Title, desc: t.landing.feature3Desc },
          { icon: <Bot size={28} />, title: t.landing.feature4Title, desc: t.landing.feature4Desc },
        ].map(f => (
          <div key={f.title} className="bg-gray-900 border border-gray-800 rounded-xl p-5 hover:border-orange-700/50 transition-colors">
            <div className="text-orange-400 mb-3">{f.icon}</div>
            <h3 className="font-semibold text-lg mb-1">{f.title}</h3>
            <p className="text-gray-400 text-sm">{f.desc}</p>
          </div>
        ))}
      </section>

      <section className="max-w-3xl mx-auto px-4 pb-24 grid md:grid-cols-2 gap-6">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <h3 className="text-xl font-bold mb-1">{t.landing.priceFree}</h3>
          <p className="text-3xl font-extrabold my-3">0€</p>
          <ul className="space-y-2 text-sm text-gray-300 mb-6">
            {[t.landing.freeFeature1, t.landing.freeFeature2, t.landing.freeFeature3, t.landing.freeFeature4].map(item => (
              <li key={item} className="flex items-center gap-2"><Check size={16} className="text-orange-400 shrink-0" />{item}</li>
            ))}
          </ul>
          <Link href="/auth?mode=signup" className="block text-center bg-gray-700 hover:bg-gray-600 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
            {t.landing.cta}
          </Link>
        </div>
        <div className="bg-gray-900 border border-orange-600/50 rounded-xl p-6">
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-xl font-bold">{t.landing.pricePremium}</h3>
            <span className="text-xs px-2 py-0.5 bg-orange-600 text-white rounded-full">{t.landing.priceComingSoon}</span>
          </div>
          <p className="text-3xl font-extrabold my-3">~9€<span className="text-base font-normal text-gray-400">/mois</span></p>
          <ul className="space-y-2 text-sm text-gray-300 mb-6">
            {[t.landing.premiumFeature1, t.landing.premiumFeature2, t.landing.premiumFeature3, t.landing.premiumFeature4].map(item => (
              <li key={item} className="flex items-center gap-2"><Check size={16} className="text-orange-400 shrink-0" />{item}</li>
            ))}
          </ul>
          <button disabled className="w-full bg-orange-600 opacity-50 cursor-not-allowed text-white text-sm font-semibold px-4 py-2 rounded-lg">
            {t.landing.priceComingSoon}
          </button>
        </div>
      </section>

      <footer className="border-t border-gray-800 py-6 text-center text-sm text-gray-600">
        © {new Date().getFullYear()} HybridForge
      </footer>
    </div>
  )
}
