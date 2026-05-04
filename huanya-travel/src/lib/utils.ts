type ClassValue = string | number | boolean | null | undefined | Record<string, boolean | undefined | null>

export function cn(...inputs: ClassValue[]): string {
  return inputs
    .flatMap(i => {
      if (!i) return []
      if (typeof i === 'string' || typeof i === 'number') return [String(i)]
      if (typeof i === 'object') return Object.entries(i).filter(([, v]) => v).map(([k]) => k)
      return []
    })
    .join(' ')
}

/** Convert AUD cents to display string: 15000 -> "$150" */
export function formatAUD(cents: number): string {
  return `$${(cents / 100).toFixed(0)}`
}

/** Convert AUD dollars input to cents: 150 -> 15000 */
export function dollarsToCents(dollars: number): number {
  return Math.round(dollars * 100)
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('zh-AU', {
    year: 'numeric', month: 'long', day: 'numeric',
  })
}

export function formatDateTime(dateStr: string): string {
  return new Date(dateStr).toLocaleString('zh-AU', {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

export function demandStatusLabel(status: string): string {
  const map: Record<string, string> = {
    pending: '等待报价',
    bidding: '竞价中',
    confirmed: '已确认',
    in_progress: '行程中',
    completed: '已完成',
    cancelled: '已取消',
  }
  return map[status] ?? status
}

export function bidStatusLabel(status: string): string {
  const map: Record<string, string> = {
    active: '报价中',
    accepted: '已接受',
    rejected: '已拒绝',
    withdrawn: '已撤回',
  }
  return map[status] ?? status
}
