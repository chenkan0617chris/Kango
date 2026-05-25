'use client'

import { Star } from 'lucide-react'

interface StarRatingProps {
  value: number
  onChange?: (v: number) => void
  interactive?: boolean
  size?: number
  className?: string
}

export function StarRating({
  value,
  onChange,
  interactive = false,
  size = 16,
  className = '',
}: StarRatingProps) {
  const rounded = Math.round(value)

  return (
    <div className={['flex items-center gap-0.5', className].join(' ')} role={interactive ? 'radiogroup' : undefined}>
      {[1, 2, 3, 4, 5].map(n => {
        const filled = n <= rounded
        const starEl = (
          <Star
            size={size}
            className={filled ? 'text-yellow-400' : 'text-gray-200'}
            fill="currentColor"
          />
        )

        if (!interactive) {
          return <span key={n} aria-hidden>{starEl}</span>
        }

        return (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={n === rounded}
            aria-label={`${n}`}
            onClick={() => onChange?.(n)}
            className="p-0.5 rounded-md hover:scale-110 transition-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700"
          >
            <Star
              size={size}
              className={n <= value ? 'text-yellow-500' : 'text-gray-200'}
              fill="currentColor"
            />
          </button>
        )
      })}
    </div>
  )
}
