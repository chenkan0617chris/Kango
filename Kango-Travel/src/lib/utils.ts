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

function appToDateLocale(locale: string): string {
  return locale === 'zh' ? 'zh-CN' : 'en-AU'
}

export function formatDate(dateStr: string, locale = 'en'): string {
  return new Date(dateStr).toLocaleDateString(appToDateLocale(locale), {
    year: 'numeric', month: 'long', day: 'numeric',
  })
}

export function formatRelativeTime(dateStr: string, locale = 'en'): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const seconds = Math.floor(diff / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours   = Math.floor(minutes / 60)
  const days    = Math.floor(hours / 24)
  const months  = Math.floor(days / 30)

  const rtf = new Intl.RelativeTimeFormat(locale === 'zh' ? 'zh-CN' : 'en-AU', { numeric: 'auto' })
  if (seconds < 60) return locale === 'zh' ? '刚刚' : 'just now'
  if (minutes < 60) return rtf.format(-minutes, 'minute')
  if (hours   < 24) return rtf.format(-hours,   'hour')
  if (days    < 30) return rtf.format(-days,     'day')
  return rtf.format(-months, 'month')
}

export function formatDateTime(dateStr: string, locale = 'en'): string {
  return new Date(dateStr).toLocaleString(appToDateLocale(locale), {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

export function demandStatusLabel(status: string): string {
  const map: Record<string, string> = {
    pending: '待确认',
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
