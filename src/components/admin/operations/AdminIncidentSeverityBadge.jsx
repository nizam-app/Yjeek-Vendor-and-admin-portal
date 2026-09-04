import { cn } from '../cn'
import { INCIDENT_PRIORITY_RANK } from '../../../lib/adminIncidentPresentation'

export function AdminIncidentSeverityBadge({ priority, severityLabel, className }) {
  const normalized = priority ? String(priority).toUpperCase() : null
  const ranked = normalized && INCIDENT_PRIORITY_RANK[normalized] ? normalized : null
  const label = ranked || (severityLabel === 'Unclassified' || severityLabel === 'UNCLASSIFIED' ? 'Unclassified' : null)
  if (!label) return null
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center rounded-md px-1.5 py-0.5 text-[9px] font-semibold leading-4',
        ranked === 'P1' && 'bg-[#8b3a32] text-white',
        ranked === 'P2' && 'bg-[#e8a54b] text-[#3d2a0a]',
        ranked === 'P3' && 'bg-[#eaf2fb] text-[#3974ad]',
        ranked === 'P4' && 'bg-[#f0f2f0] text-[#737d77]',
        !ranked && 'bg-[#f0f2f0] text-[#737d77] italic',
        className,
      )}
    >
      {label}
    </span>
  )
}
