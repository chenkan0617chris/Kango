'use client'

import { useState, useRef, useEffect } from 'react'
import { MapPin } from 'lucide-react'

const AUSSIE_LOCATIONS = [
  // Melbourne
  'Melbourne CBD, VIC',
  'Melbourne Airport (MEL), Tullamarine',
  'Great Ocean Road, VIC',
  'Yarra Valley, VIC',
  'Phillip Island, VIC',
  'Grampians National Park, VIC',
  'Mornington Peninsula, VIC',
  'Healesville, VIC',
  'Dandenong Ranges, VIC',
  'St Kilda, Melbourne VIC',
  // Sydney
  'Sydney CBD, NSW',
  'Sydney Airport (SYD), Mascot',
  'Blue Mountains, NSW',
  'Hunter Valley, NSW',
  'Bondi Beach, NSW',
  'Jervis Bay, NSW',
  // Queensland
  'Brisbane CBD, QLD',
  'Gold Coast, QLD',
  'Sunshine Coast, QLD',
  'Cairns, QLD',
  'Port Douglas, QLD',
  // Others
  'Adelaide CBD, SA',
  'Barossa Valley, SA',
  'Perth CBD, WA',
  'Margaret River, WA',
  'Hobart, TAS',
  'Launceston, TAS',
]

interface LocationInputProps {
  label: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  required?: boolean
}

export function LocationInput({ label, value, onChange, placeholder = '输入地点…', required }: LocationInputProps) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState(value)
  const containerRef = useRef<HTMLDivElement>(null)

  const filtered = query.length > 0
    ? AUSSIE_LOCATIONS.filter(l => l.toLowerCase().includes(query.toLowerCase())).slice(0, 6)
    : []

  useEffect(() => {
    setQuery(value)
  }, [value])

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  function select(loc: string) {
    setQuery(loc)
    onChange(loc)
    setOpen(false)
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setQuery(e.target.value)
    onChange(e.target.value)
    setOpen(true)
  }

  return (
    <div className="space-y-1" ref={containerRef}>
      <label className="block text-sm font-medium text-gray-700">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      <div className="relative">
        <MapPin size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
        <input
          type="text"
          value={query}
          onChange={handleChange}
          onFocus={() => query && setOpen(true)}
          placeholder={placeholder}
          required={required}
          className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-gray-300 bg-white text-sm text-gray-900 placeholder-gray-400
            focus:border-blue-900 focus:outline-none focus:ring-1 focus:ring-blue-900 transition-colors"
        />
        {open && filtered.length > 0 && (
          <ul className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg py-1 animate-fadeIn">
            {filtered.map(loc => (
              <li
                key={loc}
                onMouseDown={() => select(loc)}
                className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-900 cursor-pointer"
              >
                <MapPin size={13} className="text-gray-400 shrink-0" />
                {loc}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
