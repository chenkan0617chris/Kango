type Size = 'sm' | 'md' | 'lg'

const sizeClasses: Record<Size, string> = {
  sm: 'w-3.5 h-3.5 border-[1.5px]',
  md: 'w-5 h-5 border-2',
  lg: 'w-7 h-7 border-2',
}

export function Spinner({ size = 'md', className = '' }: { size?: Size; className?: string }) {
  return (
    <span
      className={[
        'inline-block rounded-full border-current border-t-transparent animate-spin',
        sizeClasses[size],
        className,
      ].join(' ')}
    />
  )
}
