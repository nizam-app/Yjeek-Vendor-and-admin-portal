import { cn } from './cn'
import { ADMIN_DASHBOARD_MAP_TABS } from '../../mappers/admin/mapAdminDashboardMap'

/**
 * Admin Live map panel — same chrome as the existing Full Overview map.
 * Renders API points as markers inside the placeholder plane (no map SDK).
 */
export function AdminLiveMap({
  layer,
  onLayerChange,
  legend = [],
  points = [],
  scopeNote,
  isLoading = false,
  error = null,
  onRetry,
}) {
  return (
    <section className="h-[407px] rounded-xl border border-[#e4e8e4] bg-white p-3 shadow-[0_1px_2px_rgba(20,40,28,.025)]">
      <div className="flex h-[20px] items-center justify-between">
        <h2 className="text-[16px] font-bold leading-4">Live map</h2>
        <div className="flex items-center gap-1 text-[11px] font-medium text-[#6f7a73]">
          {ADMIN_DASHBOARD_MAP_TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => onLayerChange?.(tab.id)}
              className={cn(
                'rounded px-2 py-1 transition',
                layer === tab.id ? 'bg-[#edf8f0] text-[#168247]' : 'hover:bg-[#f3f6f4]',
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="relative mt-1 h-[347px] overflow-hidden rounded-lg bg-[#e9eeea]">
        {isLoading && !points.length ? (
          <div className="absolute inset-0 grid place-items-center text-[12px] font-medium text-[#7a857e]">
            Loading map…
          </div>
        ) : null}

        {error && !points.length ? (
          <div className="absolute inset-0 grid place-items-center px-4 text-center text-[12px] font-medium text-[#a15b58]">
            <div>
              <p>Unable to load map layer.</p>
              {onRetry ? (
                <button
                  type="button"
                  onClick={onRetry}
                  className="mt-2 rounded-md border border-[#e0e5e1] bg-white px-2.5 py-1 text-[11px] text-[#536158] hover:bg-[#f6f7f6]"
                >
                  Try again
                </button>
              ) : null}
            </div>
          </div>
        ) : null}

        {!isLoading && !error && !points.length ? (
          <div className="absolute inset-0 grid place-items-center text-[12px] font-medium text-[#8a938c]">
            {layer === 'zones' || layer === 'heatmap'
              ? 'This map layer is not connected yet.'
              : 'No map points for this layer.'}
          </div>
        ) : null}

        {points.map((point) => {
          const title = [
            point.orderNumber || point.name,
            point.vendorName && point.vendorName !== point.name ? point.vendorName : null,
            point.area || null,
            point.kind === 'pickup' ? 'Pickup' : point.kind === 'dropoff' ? 'Dropoff' : null,
            point.status,
            point.load != null ? `load ${point.load}` : null,
          ]
            .filter(Boolean)
            .join(' · ')

          return (
            <button
              key={point.id}
              type="button"
              title={title}
              className={cn(
                'absolute z-[1] -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/80 shadow-sm',
                point.kind === 'dropoff' ? 'h-2 w-2' : 'h-2.5 w-2.5',
              )}
              style={{
                left: `${point.leftPct}%`,
                top: `${point.topPct}%`,
                backgroundColor: point.color,
              }}
              aria-label={title || 'Map point'}
            />
          )
        })}

        {legend.length ? (
          <div className="absolute bottom-2 left-2 z-[2] flex flex-wrap items-center gap-2 rounded-md bg-white/95 px-2.5 py-1.5 text-[11px] font-medium text-[#667269] shadow-sm">
            {legend.map((item) => (
              <span key={item.key}>
                <i
                  className="mr-1 inline-block h-2 w-2 rounded-full"
                  style={{ backgroundColor: item.color }}
                />
                {item.label}
              </span>
            ))}
          </div>
        ) : null}
      </div>

      <p className="mt-1 text-[10px] font-normal text-[#a1a8a3]">
        {scopeNote || 'Map scope auto-applies from your access (country / region / zone).'}
      </p>
    </section>
  )
}
