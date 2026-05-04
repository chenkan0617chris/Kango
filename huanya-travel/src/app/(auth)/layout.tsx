import { Car } from 'lucide-react'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-950 via-blue-900 to-blue-800 flex flex-col items-center justify-center p-4">
      {/* Brand */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-14 h-14 bg-white/10 backdrop-blur rounded-2xl mb-4">
          <Car size={28} className="text-white" />
        </div>
        <h1 className="text-white text-3xl font-bold tracking-tight">环亚出行</h1>
        <p className="text-blue-200 text-sm mt-1">澳洲华人包车平台 · 透明竞价</p>
      </div>

      {/* Card */}
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-8">
        {children}
      </div>

      <p className="text-blue-300 text-xs mt-6">
        © 2025 HuanYa Travel · 资金托管 · 实名认证
      </p>
    </div>
  )
}
