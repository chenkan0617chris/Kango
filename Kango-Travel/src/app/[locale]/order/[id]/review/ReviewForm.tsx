'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { useRouter } from '@/i18n/navigation'
import { Button } from '@/components/ui/Button'
import { Textarea } from '@/components/ui/Input'
import { StarRating } from '@/components/ui/StarRating'

interface Props {
  orderId: string
  driverName: string
  driverId: string
}

const COMMENT_MAX = 500

export function ReviewForm({ orderId, driverName, driverId }: Props) {
  const t = useTranslations('review')
  const router = useRouter()

  const [rating,  setRating]  = useState<number>(5)
  const [comment, setComment] = useState('')
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')

  const levelLabels: Record<number, string> = {
    1: t('levels.1'),
    2: t('levels.2'),
    3: t('levels.3'),
    4: t('levels.4'),
    5: t('levels.5'),
  }
  const levelLabel = levelLabels[rating] ?? ''

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const trimmed = comment.trim()
    const body: Record<string, unknown> = {
      order_id: orderId,
      rating,
    }
    if (trimmed) body.comment = trimmed

    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const json = await res.json().catch(() => ({}))
        setError(json.error ?? t('errorGeneric'))
        setLoading(false)
        return
      }
      router.push(`/profile/driver/${driverId}`)
      router.refresh()
    } catch {
      setError(t('errorNetwork'))
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-200 p-6 space-y-5">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">{t('title')}</h2>
        <p className="text-sm text-gray-500 mt-1">{t('subtitle', { name: driverName })}</p>
      </div>

      {/* Star rating */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          {t('ratingLabel')}
        </label>
        <div className="flex flex-col items-center gap-2 bg-gray-50 border border-gray-200 rounded-2xl py-5">
          <StarRating
            value={rating}
            onChange={setRating}
            interactive
            size={36}
          />
          <p className="text-sm font-medium text-gray-700">{levelLabel}</p>
        </div>
      </div>

      {/* Comment */}
      <div className="space-y-1">
        <label className="block text-sm font-medium text-gray-700">{t('commentLabel')}</label>
        <Textarea
          rows={4}
          maxLength={COMMENT_MAX}
          placeholder={t('commentPlaceholder')}
          value={comment}
          onChange={e => setComment(e.target.value)}
        />
        <div className="flex justify-end">
          <span className="text-xs text-gray-400">
            {comment.length}/{COMMENT_MAX}
          </span>
        </div>
      </div>

      {error && (
        <p className="text-xs text-red-600">{error}</p>
      )}

      <Button type="submit" loading={loading} className="w-full">
        {loading ? t('submitting') : t('submit')}
      </Button>
    </form>
  )
}
