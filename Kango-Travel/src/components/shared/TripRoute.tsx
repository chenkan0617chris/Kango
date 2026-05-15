'use client'

import { RotateCcw } from 'lucide-react'
import { useTranslations } from 'next-intl'

interface TripRouteProps {
  pickup: string
  dropoff: string
  waypoints?: string[] | null
  returnLoc?: string | null
  pickupDetail?: string | null
  /** sm = compact card style (no labels). lg = full detail style (with labels). Default: sm */
  size?: 'sm' | 'lg'
}

export function TripRoute({
  pickup,
  dropoff,
  waypoints,
  returnLoc,
  pickupDetail,
  size = 'sm',
}: TripRouteProps) {
  const t = useTranslations('demand')
  const wps = waypoints ?? []

  if (size === 'sm') {
    return (
      <div className="flex flex-col min-w-0 flex-1 gap-0">
        <div className="flex gap-2.5 items-start">
          <div className="flex flex-col items-center w-3 shrink-0" style={{ marginTop: '3px' }}>
            <div className="w-2.5 h-2.5 rounded-full bg-blue-600 shrink-0" />
            <div className="w-px bg-gray-200 flex-1 min-h-[10px]" />
          </div>
          <p className="text-sm font-semibold text-gray-900 truncate flex-1 pb-1.5">{pickup}</p>
        </div>

        {wps.map((wp, i) => (
          <div key={i} className="flex gap-2.5 items-start">
            <div className="flex flex-col items-center w-3 shrink-0" style={{ marginTop: '5px' }}>
              <div className="w-1.5 h-1.5 rounded-full bg-gray-300 shrink-0" />
              <div className="w-px bg-gray-200 flex-1 min-h-[10px]" />
            </div>
            <p className="text-xs text-gray-400 truncate flex-1 pb-1.5">{wp}</p>
          </div>
        ))}

        <div className="flex gap-2.5 items-start">
          <div className="flex flex-col items-center w-3 shrink-0" style={{ marginTop: '3px' }}>
            <div className="w-2.5 h-2.5 rounded-full bg-gray-700 shrink-0" />
            {returnLoc && <div className="w-px bg-purple-100 flex-1 min-h-[10px]" />}
          </div>
          <p className={`text-sm font-semibold text-gray-900 truncate flex-1 ${returnLoc ? 'pb-1.5' : ''}`}>
            {dropoff}
          </p>
        </div>

        {returnLoc && (
          <div className="flex gap-2.5 items-start">
            <div className="flex flex-col items-center w-3 shrink-0" style={{ marginTop: '3px' }}>
              <div className="w-2.5 h-2.5 rounded-full bg-purple-400 shrink-0" />
            </div>
            <p className="text-xs text-purple-600 truncate flex-1 flex items-center gap-1 pt-0.5">
              <RotateCcw size={10} className="shrink-0" />
              {returnLoc}
            </p>
          </div>
        )}
      </div>
    )
  }

  // size === 'lg'
  return (
    <div className="flex flex-col flex-1 min-w-0">
      <div className="flex gap-3 items-start">
        <div className="flex flex-col items-center w-4 shrink-0" style={{ marginTop: '4px' }}>
          <div className="w-3.5 h-3.5 rounded-full bg-blue-600 ring-2 ring-blue-100 shrink-0" />
          <div className="w-0.5 bg-gray-200 flex-1 min-h-[18px]" />
        </div>
        <div className="pb-3 flex-1 min-w-0">
          <p className="text-xs text-gray-400 uppercase tracking-wide font-medium">{t('pickup')}</p>
          <p className="font-bold text-gray-900 text-lg leading-snug truncate">{pickup}</p>
          {pickupDetail && <p className="text-xs text-gray-400 mt-0.5">{pickupDetail}</p>}
        </div>
      </div>

      {wps.map((stop, i) => (
        <div key={i} className="flex gap-3 items-start">
          <div className="flex flex-col items-center w-4 shrink-0" style={{ marginTop: '5px' }}>
            <div className="w-2 h-2 rounded-full bg-gray-300 shrink-0" />
            <div className="w-0.5 bg-gray-200 flex-1 min-h-[18px]" />
          </div>
          <div className="pb-3 flex-1 min-w-0">
            <p className="text-xs text-gray-400">{t('stopLabel')} {i + 1}</p>
            <p className="text-sm text-gray-700 font-medium truncate">{stop}</p>
          </div>
        </div>
      ))}

      <div className="flex gap-3 items-start">
        <div className="flex flex-col items-center w-4 shrink-0" style={{ marginTop: '4px' }}>
          <div className="w-3.5 h-3.5 rounded-full bg-gray-800 ring-2 ring-gray-100 shrink-0" />
          {returnLoc && <div className="w-0.5 bg-purple-100 flex-1 min-h-[18px]" />}
        </div>
        <div className={`${returnLoc ? 'pb-3' : ''} flex-1 min-w-0`}>
          <p className="text-xs text-gray-400 uppercase tracking-wide font-medium">{t('dropoff')}</p>
          <p className="font-bold text-gray-900 text-lg leading-snug truncate">{dropoff}</p>
        </div>
      </div>

      {returnLoc && (
        <div className="flex gap-3 items-start">
          <div className="flex flex-col items-center w-4 shrink-0" style={{ marginTop: '4px' }}>
            <div className="w-3.5 h-3.5 rounded-full bg-purple-500 ring-2 ring-purple-100 shrink-0" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-gray-400 uppercase tracking-wide font-medium flex items-center gap-1">
              <RotateCcw size={11} />
              {t('returnLoc')}
            </p>
            <p className="font-semibold text-purple-700 truncate">{returnLoc}</p>
          </div>
        </div>
      )}
    </div>
  )
}
