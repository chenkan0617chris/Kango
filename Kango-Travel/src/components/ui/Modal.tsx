'use client'

import { useEffect, useRef } from 'react'
import { X } from 'lucide-react'

interface ModalProps {
  open: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
  maxWidth?: 'sm' | 'md' | 'lg'
}

const widthClass = { sm: 'max-w-sm', md: 'max-w-md', lg: 'max-w-lg' }

export function Modal({ open, onClose, title, children, maxWidth = 'md' }: ModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    // Prevent background scroll when modal is open
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', onKey)
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      {/* Panel — mobile: bottom sheet with scroll; desktop: centered card */}
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        className={[
          'relative w-full bg-white shadow-2xl z-10 animate-fadeIn',
          'rounded-t-2xl sm:rounded-2xl',
          // Mobile: allow scrolling up to 90vh; desktop: unconstrained
          'flex flex-col max-h-[90vh] sm:max-h-[85vh]',
          widthClass[maxWidth],
        ].join(' ')}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
          {title && <h2 className="text-base font-semibold text-gray-900">{title}</h2>}
          <button
            onClick={onClose}
            className="ml-auto -mr-1 p-2 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors min-w-[36px] min-h-[36px] flex items-center justify-center"
            aria-label="关闭"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="px-6 py-5 overflow-y-auto flex-1 overscroll-contain">
          {children}
        </div>
      </div>
    </div>
  )
}
