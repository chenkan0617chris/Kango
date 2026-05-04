'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Users, Car } from 'lucide-react'
import type { UserRole } from '@/types'

export default function RegisterPage() {
  const [name, setName]       = useState('')
  const [email, setEmail]     = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole]       = useState<UserRole>('tourist')
  const [error, setError]     = useState('')
  const [loading, setLoading] = useState(false)
  const router   = useRouter()
  const supabase = createClient()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (password.length < 6) { setError('密码至少 6 位'); return }
    setLoading(true)
    setError('')

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: name, role } },
    })

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      router.push(role === 'driver' ? '/driver/marketplace' : '/demand/create')
      router.refresh()
    }
  }

  return (
    <div>
      <h2 className="text-xl font-bold text-gray-900 mb-1">创建账号</h2>
      <p className="text-sm text-gray-500 mb-6">加入环亚出行平台</p>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-xl">
            {error}
          </div>
        )}

        {/* Role selector */}
        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-700">我是</label>
          <div className="grid grid-cols-2 gap-3">
            {([
              { value: 'tourist', label: '游客/乘客', icon: Users, desc: '发布行程需求' },
              { value: 'driver',  label: '包车司机',  icon: Car,   desc: '接单赚取收入' },
            ] as const).map(({ value, label, icon: Icon, desc }) => (
              <button
                key={value}
                type="button"
                onClick={() => setRole(value)}
                className={[
                  'flex flex-col items-center gap-1.5 p-4 rounded-xl border-2 transition-all',
                  role === value
                    ? 'border-blue-900 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300',
                ].join(' ')}
              >
                <Icon size={20} className={role === value ? 'text-blue-900' : 'text-gray-400'} />
                <span className={`text-sm font-semibold ${role === value ? 'text-blue-900' : 'text-gray-700'}`}>
                  {label}
                </span>
                <span className="text-xs text-gray-400">{desc}</span>
              </button>
            ))}
          </div>
        </div>

        <Input
          label="姓名"
          type="text"
          placeholder="您的真实姓名"
          value={name}
          onChange={e => setName(e.target.value)}
          required
        />

        <Input
          label="邮箱"
          type="email"
          placeholder="your@email.com"
          value={email}
          onChange={e => setEmail(e.target.value)}
          autoComplete="email"
          required
        />

        <Input
          label="密码"
          type="password"
          placeholder="至少 6 位"
          value={password}
          onChange={e => setPassword(e.target.value)}
          autoComplete="new-password"
          required
        />

        <Button type="submit" loading={loading} className="w-full" size="lg">
          注册
        </Button>
      </form>

      <p className="text-center text-sm text-gray-500 mt-6">
        已有账号？{' '}
        <Link href="/login" className="text-blue-900 font-semibold hover:underline">
          立即登录
        </Link>
      </p>
    </div>
  )
}
