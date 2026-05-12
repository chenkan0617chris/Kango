'use client'

import { useTranslations } from 'next-intl'
import type { DemandStatus, BidStatus } from '@/types'

type Color = 'gray' | 'blue' | 'green' | 'yellow' | 'red' | 'purple'

const colorClasses: Record<Color, string> = {
  gray:   'bg-gray-100 text-gray-600',
  blue:   'bg-blue-100 text-blue-800',
  green:  'bg-green-100 text-green-700',
  yellow: 'bg-yellow-100 text-yellow-700',
  red:    'bg-red-100 text-red-600',
  purple: 'bg-purple-100 text-purple-700',
}

const demandStatusColor: Record<DemandStatus, Color> = {
  pending:     'gray',
  bidding:     'blue',
  confirmed:   'green',
  in_progress: 'purple',
  completed:   'gray',
  cancelled:   'red',
}

const bidStatusColor: Record<BidStatus, Color> = {
  active:    'blue',
  accepted:  'green',
  rejected:  'red',
  withdrawn: 'gray',
}

interface BadgeProps {
  label: string
  color?: Color
}

export function Badge({ label, color = 'gray' }: BadgeProps) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${colorClasses[color]}`}>
      {label}
    </span>
  )
}

export function DemandStatusBadge({ status }: { status: DemandStatus }) {
  const t = useTranslations('badge')
  return <Badge label={t(status)} color={demandStatusColor[status]} />
}

export function BidStatusBadge({ status }: { status: BidStatus }) {
  const t = useTranslations('badge')
  return <Badge label={t(status)} color={bidStatusColor[status]} />
}
