import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { formatApiErrorMessage } from '../../../api/errors'
import { adminService } from '../../../services/adminService'
import { MarketingViewTabs } from '../../../components/admin/MarketingViewTabs'
import { cn } from '../../../components/admin/cn'

const labelClass = 'mb-1.5 block text-[12px] font-medium leading-none text-[#7c8780]'
const inputClass =
  'box-border h-[40px] w-full rounded-[8px] border border-[rgba(0,0,0,0.1)] bg-white px-3 text-[13px] text-[#17231c] outline-none transition placeholder:text-[#9aa49d] focus:border-[#1aa054]'

const PLACEMENTS = [
  { value: 'ABOVE_PAYMENT', label: 'Above payment methods' },
  { value: 'BELOW_PAYMENT', label: 'Below payment methods (default)' },
  { value: 'ABOVE_BILL_SUMMARY', label: 'Above bill summary' },
  { value: 'BELOW_BILL_SUMMARY', label: 'Below bill summary' },
]

function Field({ label, children, className }) {
  return (
    <label className={cn('block min-w-0', className)}>
      <span className={labelClass}>{label}</span>
      {children}
    </label>
  )
}

function emptyLocale() {
  return {
    badge: '',
    promoHeadline: '',
    promoHint: '',
    promoCta: '',
    promoChips: ['', '', ''],
    sheetTitle: '',
    sheetSubtitle: '',
    sheetJoinCta: '',
    sheetDismissCta: '',
    sheetAlreadyJoined: '',
    benefits: [{ emoji: '✦', text: '' }],
  }
}

function mapLocaleFromApi(raw) {
  const base = emptyLocale()
  if (!raw || typeof raw !== 'object') return base
  const chips = Array.isArray(raw.promoChips) ? raw.promoChips.map(String) : []
  return {
    badge: raw.badge ?? '',
    promoHeadline: raw.promoHeadline ?? '',
    promoHint: raw.promoHint ?? '',
    promoCta: raw.promoCta ?? '',
    promoChips: [chips[0] ?? '', chips[1] ?? '', chips[2] ?? ''],
    sheetTitle: raw.sheetTitle ?? '',
    sheetSubtitle: raw.sheetSubtitle ?? '',
    sheetJoinCta: raw.sheetJoinCta ?? '',
    sheetDismissCta: raw.sheetDismissCta ?? '',
    sheetAlreadyJoined: raw.sheetAlreadyJoined ?? '',
    benefits: Array.isArray(raw.benefits) && raw.benefits.length
      ? raw.benefits.map((b) => ({
          emoji: b?.emoji ?? '✦',
          text: b?.text ?? '',
        }))
      : base.benefits,
  }
}

function ZoodBannerPreview({ locale }) {
  return (
    <div
      className="rounded-[16px] bg-[#9B111E] p-4 text-white"
      style={{ maxWidth: 360 }}
    >
      <div className="flex items-start gap-2">
        <span className="rounded-[8px] bg-[#FADB73] px-2 py-0.5 text-[11px] font-bold text-[#73141F]">
          {locale.badge || '✦ Zood'}
        </span>
        <p className="text-[14px] font-semibold leading-snug">
          {locale.promoHeadline || 'Headline'}
        </p>
      </div>
      <div className="mt-2 flex flex-wrap gap-2">
        {locale.promoChips.map((chip, i) =>
          chip ? (
            <span
              key={i}
              className="rounded-[9px] bg-white/20 px-2 py-1 text-[11px] font-semibold"
            >
              {chip}
            </span>
          ) : null,
        )}
      </div>
      <div className="mt-3 flex items-center justify-between gap-2">
        <p className="text-[12px] text-[#FFDBE0]">{locale.promoHint || 'Hint'}</p>
        <span className="shrink-0 rounded-full bg-white px-4 py-2 text-[13px] font-bold text-[#9B111E]">
          {locale.promoCta || 'CTA'}
        </span>
      </div>
    </div>
  )
}

function downloadCsv(filename, csvText) {
  const blob = new Blob([csvText], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

export default function AdminZoodPage() {
  const [tab, setTab] = useState('settings')
  const [localeTab, setLocaleTab] = useState('en')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [bannerEnabled, setBannerEnabled] = useState(true)
  const [checkoutPlacement, setCheckoutPlacement] = useState('BELOW_PAYMENT')
  const [hideAfterJoin, setHideAfterJoin] = useState(true)
  const [hideAfterDismiss, setHideAfterDismiss] = useState(false)
  const [contentEn, setContentEn] = useState(emptyLocale())
  const [contentAr, setContentAr] = useState(emptyLocale())
  const [totalJoined, setTotalJoined] = useState(0)

  const [waitlistLoading, setWaitlistLoading] = useState(false)
  const [waitlistError, setWaitlistError] = useState('')
  const [waitlist, setWaitlist] = useState([])
  const [waitlistPage, setWaitlistPage] = useState(1)
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 })
  const [search, setSearch] = useState('')
  const limit = 25

  const activeLocale = localeTab === 'ar' ? contentAr : contentEn
  const setActiveLocale = localeTab === 'ar' ? setContentAr : setContentEn

  const loadSettings = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await adminService.getAdminZood()
      const payload = res?.data ?? null
      const settings = payload?.settings
      setTotalJoined(Number(payload?.summary?.totalJoined) || 0)
      if (settings) {
        setBannerEnabled(Boolean(settings.bannerEnabled))
        setCheckoutPlacement(settings.checkoutPlacement || 'BELOW_PAYMENT')
        setHideAfterJoin(Boolean(settings.hideAfterJoin))
        setHideAfterDismiss(Boolean(settings.hideAfterDismiss))
        setContentEn(mapLocaleFromApi(settings.content?.en))
        setContentAr(mapLocaleFromApi(settings.content?.ar))
      }
    } catch (err) {
      setError(formatApiErrorMessage(err) || 'Failed to load Zoood settings.')
    } finally {
      setLoading(false)
    }
  }, [])

  const loadWaitlist = useCallback(
    async (page = 1) => {
      setWaitlistLoading(true)
      setWaitlistError('')
      try {
        const res = await adminService.listAdminZoodWaitlist({
          search: search.trim() || undefined,
          page,
          limit,
        })
        const payload = res?.data ?? null
        setWaitlist(Array.isArray(payload?.items) ? payload.items : [])
        const pag = payload?.pagination ?? { page: 1, totalPages: 1, total: 0 }
        setPagination(pag)
        setWaitlistPage(pag.page ?? page)
      } catch (err) {
        setWaitlistError(formatApiErrorMessage(err) || 'Failed to load waitlist.')
        setWaitlist([])
      } finally {
        setWaitlistLoading(false)
      }
    },
    [search],
  )

  useEffect(() => {
    loadSettings()
  }, [loadSettings])

  useEffect(() => {
    if (tab === 'waitlist') loadWaitlist(waitlistPage)
  }, [tab, loadWaitlist, waitlistPage])

  const previewLocale = useMemo(() => activeLocale, [activeLocale])

  async function saveSettings() {
    setSaving(true)
    setError('')
    setSuccess('')
    try {
      await adminService.updateAdminZoodSettings({
        bannerEnabled,
        checkoutPlacement,
        hideAfterJoin,
        hideAfterDismiss,
        content: {
          en: {
            ...contentEn,
            promoChips: contentEn.promoChips,
          },
          ar: {
            ...contentAr,
            promoChips: contentAr.promoChips,
          },
        },
      })
      setSuccess('Zoood settings saved. Customer app will use these on next checkout load.')
      await loadSettings()
    } catch (err) {
      setError(formatApiErrorMessage(err) || 'Save failed.')
    } finally {
      setSaving(false)
    }
  }

  async function exportWaitlist() {
    setWaitlistError('')
    try {
      const res = await adminService.exportAdminZoodWaitlist({
        search: search.trim() || undefined,
      })
      const csv = res?.data || ''
      if (!String(csv).trim()) {
        setWaitlistError('Export returned no data.')
        return
      }
      downloadCsv('zood-waitlist.csv', csv)
    } catch (err) {
      setWaitlistError(formatApiErrorMessage(err) || 'Export failed.')
    }
  }

  function updateBenefit(index, field, value) {
    setActiveLocale((prev) => {
      const benefits = [...prev.benefits]
      benefits[index] = { ...benefits[index], [field]: value }
      return { ...prev, benefits }
    })
  }

  function addBenefit() {
    setActiveLocale((prev) => ({
      ...prev,
      benefits: [...prev.benefits, { emoji: '✦', text: '' }],
    }))
  }

  return (
    <div className="min-h-0 flex-1 overflow-auto bg-[#f5f7f5] p-6 max-[900px]:p-4">
      <MarketingViewTabs active="zood" />
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-[22px] font-bold text-[#17231c]">Zoood waitlist</h1>
          <p className="mt-1 text-[13px] text-[#7c8780]">
            Checkout promo banner and customers who joined the Pro waitlist ({totalJoined} total).
          </p>
        </div>
        <div className="inline-flex rounded-full bg-white p-1 ring-1 ring-[#e4e8e4]">
          {['settings', 'waitlist'].map((id) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={cn(
                'h-[32px] rounded-full px-4 text-[12.5px] font-bold capitalize',
                tab === id ? 'bg-[#e8f7ed] text-[#1aa054]' : 'text-[#69756d]',
              )}
            >
              {id}
            </button>
          ))}
        </div>
      </div>

      {error ? (
        <div className="mb-4 rounded-[10px] border border-[#f3d0d0] bg-[#fff6f6] px-3 py-2 text-[12.5px] text-[#9b2c2c]">
          {error}
        </div>
      ) : null}
      {success ? (
        <div className="mb-4 rounded-[10px] border border-[#cfe8d7] bg-[#f3fbf6] px-3 py-2 text-[12.5px] text-[#1a6b3c]">
          {success}
        </div>
      ) : null}

      {tab === 'settings' ? (
        loading ? (
          <p className="text-[13px] text-[#7c8780]">Loading…</p>
        ) : (
          <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
            <div className="space-y-4">
              <section className="rounded-[14px] border border-[#eceeec] bg-white p-5">
                <h2 className="text-[15px] font-bold text-[#17231c]">Banner visibility</h2>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <label className="flex items-center gap-2 text-[13px]">
                    <input
                      type="checkbox"
                      checked={bannerEnabled}
                      onChange={(e) => setBannerEnabled(e.target.checked)}
                    />
                    Show Zoood banner on checkout
                  </label>
                  <label className="flex items-center gap-2 text-[13px]">
                    <input
                      type="checkbox"
                      checked={hideAfterJoin}
                      onChange={(e) => setHideAfterJoin(e.target.checked)}
                    />
                    Hide after customer joins waitlist
                  </label>
                  <label className="flex items-center gap-2 text-[13px]">
                    <input
                      type="checkbox"
                      checked={hideAfterDismiss}
                      onChange={(e) => setHideAfterDismiss(e.target.checked)}
                    />
                    Hide after customer taps &quot;Not now&quot;
                  </label>
                  <Field label="Checkout position">
                    <select
                      className={inputClass}
                      value={checkoutPlacement}
                      onChange={(e) => setCheckoutPlacement(e.target.value)}
                    >
                      {PLACEMENTS.map((p) => (
                        <option key={p.value} value={p.value}>{p.label}</option>
                      ))}
                    </select>
                  </Field>
                </div>
              </section>

              <section className="rounded-[14px] border border-[#eceeec] bg-white p-5">
                <div className="mb-4 flex gap-2">
                  {['en', 'ar'].map((loc) => (
                    <button
                      key={loc}
                      type="button"
                      onClick={() => setLocaleTab(loc)}
                      className={cn(
                        'h-[30px] rounded-full px-3 text-[12px] font-bold uppercase',
                        localeTab === loc
                          ? 'bg-[#17231c] text-white'
                          : 'bg-[#eff2f0] text-[#637068]',
                      )}
                    >
                      {loc}
                    </button>
                  ))}
                </div>
                <h2 className="text-[15px] font-bold text-[#17231c]">Copy (matches customer app)</h2>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <Field label="Badge">
                    <input
                      className={inputClass}
                      value={activeLocale.badge}
                      onChange={(e) =>
                        setActiveLocale((p) => ({ ...p, badge: e.target.value }))
                      }
                    />
                  </Field>
                  <Field label="Promo headline" className="sm:col-span-2">
                    <input
                      className={inputClass}
                      value={activeLocale.promoHeadline}
                      onChange={(e) =>
                        setActiveLocale((p) => ({ ...p, promoHeadline: e.target.value }))
                      }
                    />
                  </Field>
                  {[0, 1, 2].map((i) => (
                    <Field key={i} label={`Chip ${i + 1}`}>
                      <input
                        className={inputClass}
                        value={activeLocale.promoChips[i]}
                        onChange={(e) =>
                          setActiveLocale((p) => {
                            const chips = [...p.promoChips]
                            chips[i] = e.target.value
                            return { ...p, promoChips: chips }
                          })
                        }
                      />
                    </Field>
                  ))}
                  <Field label="Promo hint" className="sm:col-span-2">
                    <input
                      className={inputClass}
                      value={activeLocale.promoHint}
                      onChange={(e) =>
                        setActiveLocale((p) => ({ ...p, promoHint: e.target.value }))
                      }
                    />
                  </Field>
                  <Field label="Banner CTA">
                    <input
                      className={inputClass}
                      value={activeLocale.promoCta}
                      onChange={(e) =>
                        setActiveLocale((p) => ({ ...p, promoCta: e.target.value }))
                      }
                    />
                  </Field>
                  <Field label="Sheet title" className="sm:col-span-2">
                    <input
                      className={inputClass}
                      value={activeLocale.sheetTitle}
                      onChange={(e) =>
                        setActiveLocale((p) => ({ ...p, sheetTitle: e.target.value }))
                      }
                    />
                  </Field>
                  <Field label="Sheet subtitle" className="sm:col-span-2">
                    <textarea
                      className={cn(inputClass, 'min-h-[72px] py-2')}
                      value={activeLocale.sheetSubtitle}
                      onChange={(e) =>
                        setActiveLocale((p) => ({ ...p, sheetSubtitle: e.target.value }))
                      }
                    />
                  </Field>
                  <Field label="Join button">
                    <input
                      className={inputClass}
                      value={activeLocale.sheetJoinCta}
                      onChange={(e) =>
                        setActiveLocale((p) => ({ ...p, sheetJoinCta: e.target.value }))
                      }
                    />
                  </Field>
                  <Field label="Not now button">
                    <input
                      className={inputClass}
                      value={activeLocale.sheetDismissCta}
                      onChange={(e) =>
                        setActiveLocale((p) => ({ ...p, sheetDismissCta: e.target.value }))
                      }
                    />
                  </Field>
                  <Field label="Already joined message" className="sm:col-span-2">
                    <input
                      className={inputClass}
                      value={activeLocale.sheetAlreadyJoined}
                      onChange={(e) =>
                        setActiveLocale((p) => ({
                          ...p,
                          sheetAlreadyJoined: e.target.value,
                        }))
                      }
                    />
                  </Field>
                </div>
                <div className="mt-4">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-[12px] font-medium text-[#7c8780]">Sheet benefits</span>
                    <button
                      type="button"
                      className="text-[12px] font-bold text-[#1aa054]"
                      onClick={addBenefit}
                    >
                      + Add row
                    </button>
                  </div>
                  <div className="space-y-2">
                    {activeLocale.benefits.map((row, index) => (
                      <div key={index} className="flex gap-2">
                        <input
                          className={cn(inputClass, 'w-16')}
                          value={row.emoji}
                          onChange={(e) => updateBenefit(index, 'emoji', e.target.value)}
                          placeholder="✦"
                        />
                        <input
                          className={cn(inputClass, 'flex-1')}
                          value={row.text}
                          onChange={(e) => updateBenefit(index, 'text', e.target.value)}
                          placeholder="Benefit text"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </section>

              <button
                type="button"
                disabled={saving}
                onClick={saveSettings}
                className="h-[42px] rounded-[10px] bg-[#1aa054] px-6 text-[14px] font-bold text-white disabled:opacity-60"
              >
                {saving ? 'Saving…' : 'Save Zoood settings'}
              </button>
            </div>

            <div className="rounded-[14px] border border-[#eceeec] bg-white p-5">
              <h2 className="text-[15px] font-bold text-[#17231c]">Checkout preview</h2>
              <p className="mt-1 text-[12px] text-[#7c8780]">
                Matches the red banner in the customer app ({localeTab}).
              </p>
              <div className="mt-4 flex justify-center">
                <ZoodBannerPreview locale={previewLocale} />
              </div>
            </div>
          </div>
        )
      ) : (
        <section className="rounded-[14px] border border-[#eceeec] bg-white p-5">
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <input
              className={cn(inputClass, 'max-w-[280px]')}
              placeholder="Search name, phone, email"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  setWaitlistPage(1)
                  loadWaitlist(1)
                }
              }}
            />
            <button
              type="button"
              className="h-[40px] rounded-[8px] bg-[#eff2f0] px-4 text-[13px] font-bold"
              onClick={() => {
                setWaitlistPage(1)
                loadWaitlist(1)
              }}
            >
              Search
            </button>
            <button
              type="button"
              className="h-[40px] rounded-[8px] bg-[#eff2f0] px-4 text-[13px] font-bold"
              onClick={exportWaitlist}
            >
              Export CSV
            </button>
          </div>
          {waitlistError ? (
            <p className="mb-3 text-[12.5px] text-[#9b2c2c]">{waitlistError}</p>
          ) : null}
          {waitlistLoading ? (
            <p className="text-[13px] text-[#7c8780]">Loading waitlist…</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-left text-[12.5px]">
                <thead className="border-b border-[#eceeec] text-[#7c8780]">
                  <tr>
                    <th className="py-2 pr-3 font-medium">Customer</th>
                    <th className="py-2 pr-3 font-medium">Phone</th>
                    <th className="py-2 pr-3 font-medium">Email</th>
                    <th className="py-2 pr-3 font-medium">Joined</th>
                    <th className="py-2 pr-3 font-medium">Source</th>
                    <th className="py-2 pr-3 font-medium">Screen</th>
                    <th className="py-2 font-medium">Orders</th>
                  </tr>
                </thead>
                <tbody>
                  {waitlist.map((row) => {
                    const name = [row.firstName, row.lastName].filter(Boolean).join(' ') || '—'
                    const phone = row.countryCode
                      ? `${row.countryCode} ${row.phone}`
                      : row.phone
                    return (
                      <tr key={row.customerId} className="border-b border-[#f0f2f0]">
                        <td className="py-2.5 pr-3">
                          <Link
                            to={`/admin/customers/${row.customerId}`}
                            className="font-semibold text-[#1aa054] hover:underline"
                          >
                            {name}
                          </Link>
                        </td>
                        <td className="py-2.5 pr-3">{phone || '—'}</td>
                        <td className="py-2.5 pr-3">{row.email || '—'}</td>
                        <td className="py-2.5 pr-3">
                          {row.joinedAt
                            ? new Date(row.joinedAt).toLocaleString()
                            : '—'}
                        </td>
                        <td className="py-2.5 pr-3">{row.joinSource || '—'}</td>
                        <td className="py-2.5 pr-3">{row.joinScreen || '—'}</td>
                        <td className="py-2.5">{row.orderCount ?? 0}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
              {!waitlist.length ? (
                <p className="py-6 text-center text-[#9aa49d]">No waitlist members yet.</p>
              ) : null}
            </div>
          )}
          <div className="mt-4 flex items-center justify-between text-[12px] text-[#7c8780]">
            <span>
              Page {pagination.page} of {pagination.totalPages} ({pagination.total} total)
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={pagination.page <= 1}
                className="rounded-[8px] bg-[#eff2f0] px-3 py-1.5 font-bold disabled:opacity-40"
                onClick={() => setWaitlistPage((p) => Math.max(1, p - 1))}
              >
                Prev
              </button>
              <button
                type="button"
                disabled={pagination.page >= pagination.totalPages}
                className="rounded-[8px] bg-[#eff2f0] px-3 py-1.5 font-bold disabled:opacity-40"
                onClick={() => setWaitlistPage((p) => p + 1)}
              >
                Next
              </button>
            </div>
          </div>
        </section>
      )}
    </div>
  )
}
