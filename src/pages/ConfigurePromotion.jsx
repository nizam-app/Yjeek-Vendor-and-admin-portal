import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { X } from 'lucide-react'

const PROMO_TYPES = ['Item / category deal', 'Free delivery', 'Buy X Get Y']
const APPLY_OPTIONS = ['All menu', 'Selected categories', 'Selected items']
const BRANCH_OPTIONS = ['All branches', 'Selected branches']
const REWARD_OPTIONS = ['Free', '50% off', '% off']

const labelClass = 'mb-1.5 block text-[10.5px] font-bold uppercase tracking-[0.04em] text-[#69706E]'
const inputClass =
  'box-border h-[42px] w-full rounded-[9px] border border-[#D6DBD6] bg-white px-3 text-[13px] font-semibold text-[#1A1A1A] outline-none focus:border-[#1AA34D]'
const cardClass = 'rounded-[14px] border border-[#E0E6E0] bg-white p-5'

const DEFAULT_NAMES = {
  'Item / category deal': 'Ramadan 20% Off',
  'Free delivery': 'Free Delivery Weekend',
  'Buy X Get Y': 'Buy 1 Get 1 Burger',
}

function Toggle({ checked, onChange, label }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={onChange}
      className={`box-border flex h-[22px] w-[38px] shrink-0 items-center rounded-[11px] px-[3px] transition-colors ${
        checked ? 'justify-end bg-[#2E9E4D]' : 'justify-start bg-[#C7CFC7]'
      }`}
    >
      <span className="size-4 shrink-0 rounded-lg bg-white" />
    </button>
  )
}

function PromoTypeTabs({ options, value, onChange }) {
  return (
    <div className="flex w-full rounded-[10px] bg-[#E8EBE8] p-1">
      {options.map((option) => {
        const selected = option === value
        return (
          <button
            key={option}
            type="button"
            onClick={() => onChange(option)}
            className={`min-w-0 flex-1 rounded-[8px] px-3 py-[11px] text-[13px] font-semibold whitespace-nowrap transition-colors ${
              selected
                ? 'bg-white text-[#127036] shadow-[0_1px_3px_rgba(26,28,26,0.1)]'
                : 'text-[#6B736E] hover:text-ink'
            }`}
          >
            {option}
          </button>
        )
      })}
    </div>
  )
}

function ScopeTabs({ options, value, onChange, className = '' }) {
  return (
    <div
      className={`inline-flex max-w-full flex-wrap gap-0.5 rounded-[10px] bg-[#EEF1EE] p-[3px] ${className}`}
    >
      {options.map((option) => {
        const selected = option === value
        return (
          <button
            key={option}
            type="button"
            onClick={() => onChange(option)}
            className={`rounded-[8px] px-3.5 py-2 text-[12.5px] whitespace-nowrap transition-colors ${
              selected
                ? 'bg-white font-bold text-[#1A1A1A] shadow-card'
                : 'font-semibold text-[#6B736E] hover:text-ink'
            }`}
          >
            {option}
          </button>
        )
      })}
    </div>
  )
}

function TagChip({ label, onRemove }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-green-active-text bg-green-active-bg py-[5px] pr-2 pl-3 text-[12px] font-semibold text-green-active-text">
      {label}
      <button
        type="button"
        onClick={onRemove}
        className="inline-flex size-4 items-center justify-center rounded-full text-green-active-text hover:bg-[#d7edd8]"
        aria-label={`Remove ${label}`}
      >
        <X size={11} strokeWidth={2.5} />
      </button>
    </span>
  )
}

function AddChipButton({ onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center rounded-full border border-[#1AA34D] bg-white px-3 py-[5px] text-[12px] font-semibold text-[#127036] hover:bg-[#f3faf5]"
    >
      + Add
    </button>
  )
}

function ToggleRow({ title, hint, checked, onChange, label }) {
  return (
    <div className="flex flex-wrap items-center  gap-3">
      <div className="min-w-0">
        <p className="text-[13.5px] font-semibold text-ink">{title}</p>
        {hint ? <p className="mt-0.5 text-[12.5px] text-ink-muted">{hint}</p> : null}
      </div>
      <Toggle checked={checked} onChange={onChange} label={label} />
    </div>
  )
}

export default function ConfigurePromotion() {
  const navigate = useNavigate()
  const [promoType, setPromoType] = useState('Item / category deal')
  const [active, setActive] = useState(true)
  const [showDealBadge, setShowDealBadge] = useState(true)
  const [waiveFee, setWaiveFee] = useState(true)
  const [firstOrderOnly, setFirstOrderOnly] = useState(false)
  const [noEndDate, setNoEndDate] = useState(false)
  const [discountCheapest, setDiscountCheapest] = useState(true)
  const [limitOneReward, setLimitOneReward] = useState(true)
  const [appliesTo, setAppliesTo] = useState('All menu')
  const [branchScope, setBranchScope] = useState('All branches')
  const [unit, setUnit] = useState('%')
  const [reward, setReward] = useState('Free')
  const [tags, setTags] = useState(['Main dishes', 'Starters'])
  const [buyItems, setBuyItems] = useState(['Classic Burger'])
  const [getItems, setGetItems] = useState(['Fries (regular)'])
  const [form, setForm] = useState({
    name: 'Ramadan 20% Off',
    discount: '20',
    maxCap: '3.000',
    minOrder: '5.000',
    buyQty: '1',
    getQty: '1',
    startDate: '22 Mar 2026',
    endDate: '30 Mar 2026',
    usageLimit: '1000',
    perCustomer: '1',
  })

  function updateField(field, value) {
    setForm((c) => ({ ...c, [field]: value }))
  }

  function switchPromoType(next) {
    setPromoType(next)
    setForm((c) => {
      const isDefaultName = Object.values(DEFAULT_NAMES).includes(c.name)
      return isDefaultName ? { ...c, name: DEFAULT_NAMES[next] } : c
    })
  }

  function addUnique(list, setList, extras) {
    const next = extras.find((t) => !list.includes(t))
    if (next) setList((c) => [...c, next])
  }

  function handleSave() {
    navigate('/promotions')
  }

  const isDeal = promoType === 'Item / category deal'
  const isFreeDelivery = promoType === 'Free delivery'
  const isBogo = promoType === 'Buy X Get Y'

  return (
    <div className="px-[28px] pt-[18px] pb-10">
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <Link
          to="/promotions"
          className="inline-flex items-center gap-1 rounded-[18px] border border-[#E0E5E0] bg-white py-1.5 pr-3.5 pl-2.5 text-[12px] font-semibold text-ink-muted hover:bg-[#fafbfa]"
        >
          ‹ Promotions
        </Link>
        <h1 className="text-[22px] font-bold tracking-[-0.02em] text-ink sm:text-[24px]">
          Configure promotion
        </h1>
      </div>

      <div className="mb-4">
        <PromoTypeTabs options={PROMO_TYPES} value={promoType} onChange={switchPromoType} />
      </div>

      {/* Status — shared */}
      <section className={`${cardClass} mb-4 flex flex-wrap items-center gap-4`}>
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-[4px] text-[11px] font-bold ${
            active
              ? 'bg-green-active-bg text-green-active-text'
              : 'border border-[#949994] bg-[#F2F4F2] text-[#6B736E]'
          }`}
        >
          <span
            className={`size-1.5 rounded-full ${active ? 'bg-[#2E9E4D]' : 'bg-[#949994]'}`}
            aria-hidden
          />
          {active ? 'Active' : 'Paused'}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[14px] font-bold text-ink">Promotion status</p>
          <p className="text-[12.5px] leading-relaxed text-ink-muted">
            When paused, customers can&apos;t use this promotion — your settings are kept.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <span className="text-[12.5px] font-semibold text-ink-muted">Pause</span>
          <Toggle checked={active} onChange={() => setActive((v) => !v)} label="Promotion active" />
        </div>
      </section>

      {/* Item / category deal */}
      {isDeal ? (
        <>
          <section className={`${cardClass} mb-4`}>
            <h2 className="mb-4 text-[15px] font-bold text-ink">Basics</h2>

            <div className="mb-3.5 grid grid-cols-1 gap-3.5 lg:grid-cols-[1fr_140px_120px]">
              <div>
                <label className={labelClass}>Promotion name</label>
                <input
                  className={inputClass}
                  value={form.name}
                  onChange={(e) => updateField('name', e.target.value)}
                />
              </div>
              <div>
                <label className={labelClass}>Discount value</label>
                <input
                  className={inputClass}
                  value={form.discount}
                  onChange={(e) => updateField('discount', e.target.value)}
                />
              </div>
              <div>
                <label className={labelClass}>Unit</label>
                <div className="flex h-[42px] items-center rounded-[9px] bg-[#eef1ee] p-[3px]">
                  {['%', 'BHD'].map((u) => (
                    <button
                      key={u}
                      type="button"
                      onClick={() => setUnit(u)}
                      className={`h-full flex-1 rounded-[7px] text-[12.5px] font-semibold ${
                        unit === u ? 'bg-white text-ink shadow-card' : 'text-ink-muted'
                      }`}
                    >
                      {u}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="mb-4 grid grid-cols-1 gap-3.5 sm:grid-cols-2">
              <div>
                <label className={labelClass}>Max discount cap (BHD)</label>
                <input
                  className={inputClass}
                  value={form.maxCap}
                  onChange={(e) => updateField('maxCap', e.target.value)}
                />
              </div>
              <div>
                <label className={labelClass}>Minimum order (BHD)</label>
                <input
                  className={inputClass}
                  value={form.minOrder}
                  onChange={(e) => updateField('minOrder', e.target.value)}
                />
              </div>
            </div>

            <ToggleRow
              title='Show “deal” badge in app'
              hint="Highlight discounted items with a deal badge"
              checked={showDealBadge}
              onChange={() => setShowDealBadge((v) => !v)}
              label="Show deal badge"
            />
          </section>

          <section className={`${cardClass} mb-4`}>
            <h2 className="mb-3 text-[15px] font-bold text-ink">Applies to</h2>
            <ScopeTabs options={APPLY_OPTIONS} value={appliesTo} onChange={setAppliesTo} />
            <p className="mt-3 mb-3.5 text-[12.5px] text-ink-muted">
              {appliesTo === 'All menu'
                ? 'Currently applied to the entire menu across all selected branches.'
                : appliesTo === 'Selected categories'
                  ? 'Choose which categories this promotion applies to.'
                  : 'Choose specific menu items this promotion applies to.'}
            </p>
            <div className="flex flex-wrap items-center gap-2">
              {tags.map((tag) => (
                <TagChip
                  key={tag}
                  label={tag}
                  onRemove={() => setTags((c) => c.filter((t) => t !== tag))}
                />
              ))}
              <AddChipButton
                onClick={() =>
                  addUnique(tags, setTags, ['Drinks', 'Desserts', 'Sides', 'Mixed Grill', 'Hummus'])
                }
              />
            </div>
          </section>
        </>
      ) : null}

      {/* Free delivery */}
      {isFreeDelivery ? (
        <section className={`${cardClass} mb-4`}>
          <h2 className="mb-4 text-[15px] font-bold text-ink">Basics</h2>

          <div className="mb-4">
            <label className={labelClass}>Promotion name</label>
            <input
              className={inputClass}
              value={form.name}
              onChange={(e) => updateField('name', e.target.value)}
            />
          </div>

          <div className="mb-4">
            <ToggleRow
              title="Waive delivery fee"
              hint="Customer pays no delivery charge when this promo applies"
              checked={waiveFee}
              onChange={() => setWaiveFee((v) => !v)}
              label="Waive delivery fee"
            />
          </div>

          <div className="mb-4 max-w-[280px]">
            <label className={labelClass}>Minimum order to qualify (BHD)</label>
            <input
              className={inputClass}
              value={form.minOrder}
              onChange={(e) => updateField('minOrder', e.target.value)}
            />
          </div>

          <ToggleRow
            title="First order only"
            hint="Free delivery limited to a customer's first order"
            checked={firstOrderOnly}
            onChange={() => setFirstOrderOnly((v) => !v)}
            label="First order only"
          />
        </section>
      ) : null}

      {/* Buy X Get Y */}
      {isBogo ? (
        <section className={`${cardClass} mb-4`}>
          <h2 className="mb-4 text-[15px] font-bold text-ink">Buy X Get Y</h2>

          <div className="mb-3.5">
            <label className={labelClass}>Promotion name</label>
            <input
              className={inputClass}
              value={form.name}
              onChange={(e) => updateField('name', e.target.value)}
            />
          </div>

          <div className="mb-4 grid grid-cols-1 gap-3.5 lg:grid-cols-[120px_120px_1fr]">
            <div>
              <label className={labelClass}>Buy quantity</label>
              <input
                className={inputClass}
                value={form.buyQty}
                onChange={(e) => updateField('buyQty', e.target.value)}
              />
            </div>
            <div>
              <label className={labelClass}>Get quantity</label>
              <input
                className={inputClass}
                value={form.getQty}
                onChange={(e) => updateField('getQty', e.target.value)}
              />
            </div>
            <div>
              <label className={labelClass}>Reward on the &apos;get&apos; item</label>
              <div className="flex w-fit h-[42px] items-center rounded-[9px] bg-[#eef1ee] p-[3px]">
                {REWARD_OPTIONS.map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setReward(r)}
                    className={`h-full flex-1 rounded-[7px] px-4 text-[12.5px] font-semibold whitespace-nowrap ${
                      reward === r ? 'bg-white text-ink shadow-card' : 'text-ink-muted'
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="mb-4">
            <p className="text-[13.5px] font-semibold text-ink-muted">Buy (X) — qualifying items</p>
            <p className="mt-0.5 mb-2.5 text-[12.5px] text-ink-muted">
              Items the customer must purchase to unlock the reward
            </p>
            <div className="flex flex-wrap items-center gap-2">
              {buyItems.map((item) => (
                <TagChip
                  key={item}
                  label={item}
                  onRemove={() => setBuyItems((c) => c.filter((t) => t !== item))}
                />
              ))}
              <AddChipButton
                onClick={() =>
                  addUnique(buyItems, setBuyItems, ['Classic Burger', 'Mixed Grill', 'Pizza'])
                }
              />
            </div>
          </div>

          <div className="mb-4">
            <p className="text-[13.5px] font-semibold text-ink-muted">Get (Y) — reward items</p>
            <p className="mt-0.5 mb-2.5 text-[12.5px] text-ink-muted">
              Items the customer receives as the reward
            </p>
            <div className="flex flex-wrap items-center gap-2">
              {getItems.map((item) => (
                <TagChip
                  key={item}
                  label={item}
                  onRemove={() => setGetItems((c) => c.filter((t) => t !== item))}
                />
              ))}
              <AddChipButton
                onClick={() =>
                  addUnique(getItems, setGetItems, ['Fries (regular)', 'Soft drink', 'Salad'])
                }
              />
            </div>
          </div>

          <div className="mb-4">
            <ToggleRow
              title="Discount the cheapest item"
              hint="Apply the reward to the lowest-priced qualifying get item"
              checked={discountCheapest}
              onChange={() => setDiscountCheapest((v) => !v)}
              label="Discount cheapest item"
            />
          </div>

          <ToggleRow
            title="Limit one reward per order"
            hint="Only one Buy X Get Y reward can be used in a single order"
            checked={limitOneReward}
            onChange={() => setLimitOneReward((v) => !v)}
            label="Limit one reward"
          />
        </section>
      ) : null}

      {/* Schedule */}
      <section className={`${cardClass} mb-4`}>
        <h2 className="mb-4 text-[15px] font-bold text-ink">Schedule</h2>
        <div className="mb-4 grid grid-cols-1 gap-3.5 sm:grid-cols-2">
          <div>
            <label className={labelClass}>Start date</label>
            <input
              className={inputClass}
              value={form.startDate}
              onChange={(e) => updateField('startDate', e.target.value)}
            />
          </div>
          <div>
            <label className={labelClass}>End date</label>
            <input
              className={`${inputClass} ${noEndDate ? 'opacity-50' : ''}`}
              value={form.endDate}
              disabled={noEndDate}
              onChange={(e) => updateField('endDate', e.target.value)}
            />
          </div>
        </div>
        {(isFreeDelivery || isBogo) && (
          <ToggleRow
            title="No end date"
            hint="Run until I pause it"
            checked={noEndDate}
            onChange={() => setNoEndDate((v) => !v)}
            label="No end date"
          />
        )}
      </section>

      {/* Branches & limits — shared */}
      <section className={`${cardClass} mb-4`}>
        <h2 className="mb-3 text-[15px] font-bold text-ink">Branches &amp; limits</h2>
        <ScopeTabs
          options={BRANCH_OPTIONS}
          value={branchScope}
          onChange={setBranchScope}
          className="mb-4"
        />
        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
          <div>
            <label className={labelClass}>Total usage limit</label>
            <input
              className={inputClass}
              value={form.usageLimit}
              onChange={(e) => updateField('usageLimit', e.target.value)}
            />
          </div>
          <div>
            <label className={labelClass}>Uses per customer</label>
            <input
              className={inputClass}
              value={form.perCustomer}
              onChange={(e) => updateField('perCustomer', e.target.value)}
            />
          </div>
        </div>
      </section>

      <div className="flex items-center justify-between gap-3 py-3">
        <Link
          to="/promotions"
          className="inline-flex h-[40px] items-center justify-center rounded-full border border-[#E0E6E0] bg-white px-4 text-[13px] font-semibold text-ink hover:bg-[#f7f9f7]"
        >
          ‹ Back
        </Link>
        <button
          type="button"
          onClick={handleSave}
          className="inline-flex h-[40px] items-center justify-center rounded-full bg-[#1AA34D] px-8 text-[13px] font-semibold text-white hover:brightness-[0.96]"
        >
          Save
        </button>
      </div>
    </div>
  )
}
