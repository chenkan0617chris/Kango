import Link from 'next/link'
import { Car, Shield, TrendingDown, Zap, Star, ArrowRight } from 'lucide-react'
import { Navbar } from '@/components/shared/Navbar'

const features = [
  {
    icon: Shield,
    title: '资金托管，安全放心',
    desc: '游客预付定金由平台托管，行程完成后自动结算，司机不会跑单，游客不会被坑。',
  },
  {
    icon: TrendingDown,
    title: '竞价模式，透明报价',
    desc: '多位司机主动报价，游客选择最合适的方案，价格公开透明，再无临时加价。',
  },
  {
    icon: Zap,
    title: '实时推送，即时响应',
    desc: '发布需求后司机立即收到推送，报价在您的页面实时显示，无需反复刷新。',
  },
]

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      {/* Hero */}
      <section className="bg-gradient-to-br from-blue-950 via-blue-900 to-blue-800 text-white flex-1">
        <div className="max-w-5xl mx-auto px-4 py-24 text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur px-4 py-1.5 rounded-full text-sm text-blue-200 mb-8">
            <Star size={13} fill="currentColor" className="text-yellow-400" />
            澳洲华人首选包车平台
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-6 leading-tight">
            包车不再靠缘分
            <br />
            <span className="text-blue-300">竞价让你省心省钱</span>
          </h1>
          <p className="text-blue-100 text-lg max-w-xl mx-auto mb-10">
            发布行程需求，多位认证司机主动报价，资金平台托管，专为海外华人设计的安全包车体验。
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/demand/create"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white text-blue-900 rounded-xl text-base font-semibold hover:bg-blue-50 transition-colors shadow-lg"
            >
              <Car size={18} />
              发布行程需求
              <ArrowRight size={16} />
            </Link>
            <Link
              href="/driver/marketplace"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-blue-800/60 backdrop-blur border border-blue-600 text-white rounded-xl text-base font-semibold hover:bg-blue-800 transition-colors"
            >
              我是司机，去接单
            </Link>
          </div>
        </div>
      </section>

      {/* Stats bar */}
      <section className="bg-white border-b border-gray-100">
        <div className="max-w-3xl mx-auto px-4 py-8 grid grid-cols-3 gap-4 text-center">
          {[
            { value: '100+', label: '认证司机' },
            { value: '1,200+', label: '成功行程' },
            { value: '4.9★', label: '平均评分' },
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
        <h2 className="text-2xl font-bold text-center text-gray-900 mb-10">为什么选择环亚出行？</h2>
        <div className="grid sm:grid-cols-3 gap-5">
          {features.map(f => (
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
          <h2 className="text-2xl font-bold text-gray-900 mb-3">准备好了吗？</h2>
          <p className="text-gray-500 text-sm mb-7">注册只需 30 秒，立刻发布您的第一个行程需求</p>
          <Link
            href="/register"
            className="inline-flex items-center gap-2 px-8 py-3.5 bg-blue-900 text-white rounded-xl font-semibold hover:bg-blue-800 transition-colors"
          >
            免费注册 <ArrowRight size={16} />
          </Link>
        </div>
      </section>

      <footer className="border-t border-gray-200 py-5 text-center text-xs text-gray-400">
        © 2025 环亚出行 HuanYa Travel · ABN 12 345 678 901
      </footer>
    </div>
  )
}
