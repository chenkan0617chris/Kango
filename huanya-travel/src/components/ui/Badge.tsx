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

const demandStatusLabel: Record<DemandStatus, string> = {
  pending:     '等待报价',
  bidding:     '竞价中',
  confirmed:   '已确认',
  in_progress: '行程中',
  completed:   '已完成',
  cancelled:   '已取消',
}

const bidStatusColor: Record<BidStatus, Color> = {
  active:    'blue',
  accepted:  'green',
  rejected:  'red',
  withdrawn: 'gray',
}

const bidStatusLabel: Record<BidStatus, string> = {
  active:    '报价中',
  accepted:  '已接受',
  rejected:  '未入选',
  withdrawn: '已撤回',
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
  return <Badge label={demandStatusLabel[status]} color={demandStatusColor[status]} />
}

export function BidStatusBadge({ status }: { status: BidStatus }) {
  return <Badge label={bidStatusLabel[status]} color={bidStatusColor[status]} />
}
