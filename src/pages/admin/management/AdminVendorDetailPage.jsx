import { useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { ChevronLeft, Pause, Pencil, Plus, Star } from 'lucide-react'
import { useApiResource } from '../../../hooks/useApiResource'
import { adminService } from '../../../services/adminService'
import { ApiState } from '../../../components/admin/ApiState'
import { AdminVendorBranches } from '../../../components/admin/management/AdminVendorBranches'
import { AdminVendorDeliveryZones } from '../../../components/admin/management/AdminVendorDeliveryZones'
import { AdminVendorUsers } from '../../../components/admin/management/AdminVendorUsers'
import { AdminVendorPromotions } from '../../../components/admin/management/AdminVendorPromotions'
import { cn } from '../../../components/admin/cn'

export default function AdminVendorDetailPage() {
  const { vendorId } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const [tab, setTab] = useState(location.state?.tab ?? 'Overview')
  const [storeOnline, setStoreOnline] = useState(null)
  const { data, error, isLoading, refetch } = useApiResource(
    () => adminService.getVendorDetail(vendorId),
    [vendorId],
  )

  if (!data) return <ApiState isLoading={isLoading} error={error} onRetry={refetch} />

  const online = storeOnline ?? data.storeOnline

  return (
    <div className="px-5 pb-10 pt-4 max-[700px]:px-3">
      {/* Header */}
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => navigate('/admin/vendors')}
          className="inline-flex h-[34px] shrink-0 items-center gap-1 rounded-full border border-[#e4e8e4] bg-white px-3 text-[13px] font-medium text-[#455249] shadow-[0_1px_2px_rgba(20,40,28,.04)] hover:bg-[#f6f8f6]"
        >
          <ChevronLeft size={15} strokeWidth={2.2} />
          Vendors
        </button>

        <div className="flex min-w-0 flex-1 items-center gap-3">
          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-[14px] bg-[#e5f5eb] text-[15px] font-bold text-[#127036]">
            {data.initials}
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-[22px] font-bold tracking-[-0.02em] text-[#17231c]">{data.name}</h2>
              <span className="inline-flex rounded-full bg-[#e8f7ed] px-2.5 py-[3px] text-[11px] font-bold text-[#147940]">
                {data.status}
              </span>
            </div>
            <p className="mt-1 truncate text-[12.5px] text-[#7c8780]">
              {data.id} · {data.storeType} · {data.branchesLabel} · ★ {data.rating}
            </p>
          </div>
        </div>

        <button
          type="button"
          className="inline-flex h-[36px] shrink-0 items-center gap-1.5 rounded-full border border-[#dfe4e0] bg-white px-3.5 text-[13px] font-medium text-[#127338] shadow-[0_1px_2px_rgba(20,40,28,.04)] hover:bg-[#f6f8f6]"
        >
          <Pencil size={14} strokeWidth={2} />
          Edit
        </button>
      </div>

      {/* Pill tabs */}
      <div className="mb-4 overflow-x-auto overscroll-x-contain touch-pan-x [-webkit-overflow-scrolling:touch]">
        <div className="inline-flex w-full min-w-full items-center rounded-[10px] bg-[#ebeceb] p-[4px]">
          {data.tabs.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setTab(item)}
              className={cn(
                'h-[32px] shrink-0 flex-1 rounded-[8px] px-3.5 text-[12.5px] whitespace-nowrap transition',
                tab === item
                  ? 'bg-white font-bold shadow-[0_1px_3px_rgba(20,40,28,.12)]'
                  : 'font-medium hover:text-[#455249]',
              )}
              style={{ color: tab === item ? '#1aa054' : '#69756d' }}
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      {tab === 'Overview' ? (
        <>
          {/* KPI row */}
          <div className="mb-4 grid grid-cols-5 gap-3 max-[1100px]:grid-cols-3 max-[700px]:grid-cols-2 max-[420px]:grid-cols-1">
            {data.metrics.map(({ label, value, star, tone }) => {
              const valueColor =
                tone === 'green' ? '#1aa054' : tone === 'orange' ? '#c4841a' : '#17231c'

              return (
              <div
                key={label}
                className="rounded-[14px] border border-[#eceeec] bg-white px-4 py-3.5 shadow-[0_1px_2px_rgba(20,40,28,.03)]"
              >
                <p className="text-[12px] text-[#7c8780]">{label}</p>
                <p
                  className="mt-2 flex items-center gap-1 text-[24px] font-bold leading-none tracking-[-0.02em]"
                  style={{ color: valueColor }}
                >
                  {star ? <Star size={16} className="shrink-0 fill-[#1aa054] text-[#1aa054]" /> : null}
                  <span>{value}</span>
                </p>
              </div>
              )
            })}
          </div>

          {/* Bottom cards: ~65% / ~35% */}
          <div className="grid grid-cols-[minmax(0,1.7fr)_minmax(260px,1fr)] items-start gap-4 max-[900px]:grid-cols-1">
            <section className="rounded-[14px] border border-[#eceeec] bg-white px-5 py-5 shadow-[0_1px_2px_rgba(20,40,28,.03)]">
              <h3 className="mb-1 text-[15px] font-bold text-[#17231c]">Store profile</h3>
              {[
                ['Legal name', data.legalName],
                ['Category', data.category],
                ['Delivery', data.delivery],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="flex items-center justify-between gap-6 border-b border-[#f0f2f0] py-3.5 last:border-0 last:pb-0"
                >
                  <span className="shrink-0 text-[12.5px] text-[#7c8780]">{label}</span>
                  <span className="text-right text-[13px] font-medium text-[#17231c]">{value}</span>
                </div>
              ))}
            </section>

            <section className="rounded-[14px] border border-[#eceeec] bg-white px-5 py-5 shadow-[0_1px_2px_rgba(20,40,28,.03)]">
              <h3 className="mb-4 text-[15px] font-bold text-[#17231c]">Status & controls</h3>

              <div className="flex items-start justify-between gap-3 border-b border-[#f0f2f0] pb-3">
                <div className="min-w-0">
                  <p className="text-[13px] font-bold text-[#17231c]">Store online</p>
                  <p className="mt-0.5 text-[12px] leading-[16px] text-[#7c8780]">
                    {online ? data.storeOnlineHint : 'Hidden from customers'}
                  </p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={online}
                  onClick={() => setStoreOnline(!online)}
                  className={cn(
                    'relative mt-0.5 h-[28px] w-[48px] shrink-0 rounded-full transition',
                    online ? 'bg-[#1aa054]' : 'bg-[#d5dbd7]',
                  )}
                >
                  <span
                    className={cn(
                      'absolute top-[3px] h-[22px] w-[22px] rounded-full bg-white shadow transition',
                      online ? 'left-[23px]' : 'left-[3px]',
                    )}
                  />
                </button>
              </div>

              <div className="mt-4 flex items-center justify-between gap-3">
                <span className="text-[13px] text-[#7c8780]">Dispatch mode</span>
                <span className="text-[13px] font-bold text-[#17231c]">{data.dispatchMode}</span>
              </div>

              <div className="mt-5 flex flex-col gap-2.5">
                <button
                  type="button"
                  className="inline-flex h-[42px] w-fit items-center justify-center gap-2 rounded-full bg-[#fff3d6] px-4 text-[13px] font-bold text-[#9E6B0D] hover:bg-[#ffecc0]"
                >
                  <Pause size={15} className="text-[#3b82f6]" fill="#3b82f6" strokeWidth={0} />
                  Force close store
                </button>
                <button
                  type="button"
                  className="inline-flex h-[42px] w-fit items-center justify-center rounded-full bg-[#fdebec] px-4 text-[13px] font-bold text-[#d64044] hover:bg-[#f9d9da]"
                >
                  Suspend vendor
                </button>
              </div>
            </section>
          </div>
        </>
      ) : tab === 'Branches' ? (
        <>
          <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
            <div>
              <h3 className="text-[15px] font-bold text-[#17231c]">
                Branches ({data.branches.length})
              </h3>
              <p className="mt-1 max-w-[520px] text-[12px] leading-[18px] text-[#7c8780]">
                Add, edit, force-close or delete branches. Each has its own radius, ETA &amp; min order.
              </p>
            </div>
            <button
              type="button"
              onClick={() =>
                navigate(`/admin/vendors/${encodeURIComponent(vendorId)}/branches/new`, {
                  state: { storeName: data.name, vendorId, mode: 'create' },
                })
              }
              className="inline-flex h-[34px] shrink-0 items-center gap-1.5 rounded-full bg-[#1aa054] px-4 text-[12px] font-bold text-white shadow-[0_1px_2px_rgba(20,40,28,.15)] hover:bg-[#158a47]"
            >
              <Plus size={14} strokeWidth={2.2} />
              Add branch
            </button>
          </div>
          <AdminVendorBranches
            branches={data.branches}
            vendorId={vendorId}
            storeName={data.name}
          />
        </>
      ) : tab === 'Users & staff' ? (
        <>
          <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
            <div>
              <h3 className="text-[15px] font-bold text-[#17231c]">
                Users &amp; staff ({data.users.length})
              </h3>
              <p className="mt-1 max-w-[520px] text-[12px] leading-[18px] text-[#7c8780]">
                Vendor admins, branch managers and staff with scoped, role-based access.
              </p>
            </div>
            <button
              type="button"
              onClick={() =>
                navigate(`/admin/vendors/${encodeURIComponent(vendorId)}/users/new`, {
                  state: {
                    storeName: data.name,
                    vendorId,
                    mode: 'create',
                    branches: data.branches,
                  },
                })
              }
              className="inline-flex h-[34px] shrink-0 items-center gap-1.5 rounded-full bg-[#1aa054] px-4 text-[12px] font-bold text-white shadow-[0_1px_2px_rgba(20,40,28,.15)] hover:bg-[#158a47]"
            >
              <Plus size={14} strokeWidth={2.2} />
              Add user
            </button>
          </div>
          <AdminVendorUsers
            users={data.users}
            vendorId={vendorId}
            storeName={data.name}
            branches={data.branches}
          />
        </>
      ) : tab === 'Delivery zones' ? (
        <AdminVendorDeliveryZones deliveryZones={data.deliveryZones} />
      ) : tab === 'Promotions' ? (
        <AdminVendorPromotions promotions={data.promotions} />
      ) : (
        <div className="rounded-[14px] border border-[#eceeec] bg-white px-5 py-12 text-center shadow-[0_1px_2px_rgba(20,40,28,.03)]">
          <p className="text-[15px] font-bold text-[#17231c]">{tab}</p>
          <p className="mt-1 text-[12px] text-[#7c8780]">This section will be available in a later update.</p>
        </div>
      )}
    </div>
  )
}
