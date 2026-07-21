import { cn } from './cn'

export function Button({ children, primary = false, className = '', ...props }) {
  return (
    <button
      className={cn(
        'inline-flex h-[34px] items-center justify-center gap-2 rounded-md border px-3 text-[11px] font-medium transition',
        primary
          ? 'border-[#118446] bg-[#118446] text-white hover:bg-[#0d713b]'
          : 'border-[#dfe4e0] bg-white text-[#455249] hover:bg-[#f6f8f6]',
        className,
      )}
      {...props}
    >
      {children}
    </button>
  )
}
