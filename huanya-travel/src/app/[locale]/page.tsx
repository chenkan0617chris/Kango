import Link from 'next/link'
import { Car, Shield, TrendingDown, Zap, Star, ArrowRight } from 'lucide-react'
import { Navbar } from '@/components/shared/Navbar'
import { getTranslations } from 'next-intl/server'

export default async function HomePage() {
  const t = await getTranslations('home')

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      {/* Hero */}
      <section className="bg-gradient-to-br from-blue-950 via-blue-900 to-blue-800 text-white flex-1">
        <div className="max-w-5xl mx-auto px-4 py-24 text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur px-4 py-1.5 rounded-full text-sm text-blue-200 mb-8">
            <Star size={13} fill="currentColor" className="text-yellow-400" />
            {t('badge')}
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-6 leading-tight">
            {t('headline1')}
            <br />
            <span className="text-blue-300">{t('headline2')}</span>
          </h1>
          <p className="text-blue-100 text-lg max-w-xl mx-auto mb-10">
            {t('sub')}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/demand/create"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white text-blue-900 rounded-xl text-base font-semibold hover:bg-blue-50 transition-colors shadow-lg"
            >
              <Car size={18} />
              {t('ctaPost')}
              <ArrowRight size={16} />
            </Link>
            <Link
              href="/driver/marketplace"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-blue-800/60 backdrop-blur border border-blue-600 text-white rounded-xl text-base font-semibold hover:bg-blue-800 transition-colors"
            >
              {t('ctaDriver')}
            </Link>
          </div>
        </div>
      </section>

      {/* Stats bar */}
      <section className="bg-white border-b border-gray-100">
        <div className="max-w-3xl mx-auto px-4 py-8 grid grid-cols-3 gap-4 text-center">
          {[
            { value: t('stat1Value'), label: t('stat1Label') },
            { value: t('stat2Value'), label: t('stat2Label') },
            { value: t('stat3Value'), label: t('stat3Label') },
          ].map(s => (
            <div key={s.label}>
              <p className="text-2xl font-bold text-blue-900">{s.value}</p>
              <p className="text-xs text-gray-500 mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="max-w-5xl mx-auto px-4 py-20 w-full">
        <h2 className="text-2xl font-bold text-center text-gray-900 mb-10">{t('whyTitle')}</h2>
        <div className="grid sm:grid-cols-3 gap-5">
          {[
            { icon: Shield,       title: t('feature1Title'), desc: t('feature1Desc') },
            { icon: TrendingDown, title: t('feature2Title'), desc: t('feature2Desc') },
            { icon: Zap,         title: t('feature3Title'), desc: t('feature3Desc') },
          ].map(f => (
            <div key={f.title} className="bg-white rounded-2xl border border-gray-200 p-6 hover:border-blue-200 hover:shadow-md transition-all">
              <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center mb-4">
                <f.icon size={20} className="text-blue-900" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">{f.title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-gray-50 border-t border-gray-200 mt-auto">
        <div className="max-w-xl mx-auto px-4 py-14 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-3">{t('ctaTitle')}</h2>
          <p className="text-gray-500 text-sm mb-7">{t('ctaSub')}</p>
          <Link
            href="/register"
            className="inline-flex items-center gap-2 px-8 py-3.5 bg-blue-900 text-white rounded-xl font-semibold hover:bg-blue-800 transition-colors"
          >
            {t('ctaBtn')} <ArrowRight size={16} />
          </Link>
        </div>
      </section>

      <footer className="border-t border-gray-200 py-5 text-center text-xs text-gray-400">
        {t('footer')}
      </footer>
    </div>
  )
}
