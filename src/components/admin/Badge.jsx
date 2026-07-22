import { cn } from './cn'

export function Badge({ children, tone = 'green', className }) {
  const tones = {
    green: 'bg-[#e8f7ed] text-[#147940]',
    yellow: 'bg-[#fff5d9] text-[#9a6510]',
    red: 'bg-[#fdebea] text-[#bf3c36]',
    blue: 'bg-[#eaf2fc] text-[#2b66a5]',
    gray: 'bg-[#eff2f0] text-[#637068]',
    purple: 'bg-[#f1eafe] text-[#7752a8]',
    bronze: 'bg-[#f3e6d8] text-[#8a5a2b]',
  }
  return <span className={cn('inline-flex rounded-full px-2 py-1 text-[10px] font-medium', tones[tone], className)}>{children}</span>
}
