import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronDown, ChevronLeft } from 'lucide-react'
import motoBikeIcon from '../../../assets/moto_bike.png'
import carIcon from '../../../assets/💨.png'
import uploadIcon from '../../../assets/⬆.png'
import imageUploadIcon from '../../../assets/🖼.png'
import { cn } from '../../../components/admin/cn'

const labelClass = 'mb-1.5 block text-[12px] font-medium text-[#7c8780]'
const inputClass =
  'box-border h-[40px] w-full rounded-[8px] border border-[rgba(0,0,0,0.1)] bg-white px-3 text-[13px] text-[#17231c] outline-none transition placeholder:text-[#9aa49d] focus:border-[#1aa054]'

const SPECIAL_ITEMS = [
  'Age-restricted 18+',
  'Pharmacy',
  'Fragile',
  'Vape & Tobacco',
  'Pharmacy / Rx',
  'Vape',
  'Jewelry',
  'Electronics',
  'High-value',
  'Frozen / Chilled',
]

const STORE_TYPES = [
  'Groceries',
  'Food',
  'Cosmetics',
  'Gifts',
  'Fashion',
  'Stationery',
  'Baby & Kids',
  'Sports',
]

function Field({ label, children, className }) {
  return (
    <label className={cn('block min-w-0', className)}>
      <span className={labelClass}>{label}</span>
      {children}
    </label>
  )
}

function Select({ children, ...props }) {
  return (
    <div className="relative">
      <select className={cn(inputClass, 'appearance-none pr-9')} {...props}>
        {children}
      </select>
      <ChevronDown
        size={14}
        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#7c8780]"
      />
    </div>
  )
}

function UploadBox({ label, variant = 'file' }) {
  const iconSrc = variant === 'image' ? imageUploadIcon : uploadIcon

  return (
    <button
      type="button"
      className="flex h-[110px] w-[140px] shrink-0 flex-col items-center justify-center gap-1.5 rounded-[10px] border border-dashed border-[#d5dbd7] bg-[#f6f8f6] transition hover:border-[#1aa054] hover:bg-[#eef7f1]"
    >
      <img src={iconSrc} alt="" className="h-5 w-5 object-contain" />
      <span className="px-2 text-center text-[12px] font-bold leading-tight text-[#17231c]">{label}</span>
      <span className="text-[12px] font-medium text-[#1aa054]">Upload</span>
    </button>
  )
}

function Chip({ label, selected, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'inline-flex h-[32px] items-center rounded-full border px-3 text-[12px] font-medium transition',
        selected
          ? 'border-[#1aa054] bg-[#e8f7ed] text-[#147940]'
          : 'border-[#e4e8e4] bg-white text-[#59655e] hover:bg-[#f6f8f6]',
      )}
    >
      {label}
    </button>
  )
}

function Card({ title, children }) {
  return (
    <section className="rounded-[14px] border border-[#eceeec] bg-white p-5 shadow-[0_1px_2px_rgba(20,40,28,.03)] max-[700px]:p-4">
      {title ? <h3 className="mb-4 text-[15px] font-bold text-[#17231c]">{title}</h3> : null}
      {children}
    </section>
  )
}

function DocSection({ title, items }) {
  return (
    <Card title={title}>
      <div className="flex flex-wrap gap-3">
        {items.map(({ label, variant }) => (
          <UploadBox key={label} label={label} variant={variant} />
        ))}
      </div>
    </Card>
  )
}

export default function AdminAddChampPage() {
  const navigate = useNavigate()
  const goBack = () => navigate('/admin/fleet')

  const [form, setForm] = useState({
    fullName: 'Khalid Ahmed',
    phone: '+973 3xxx xxxx',
    email: 'champ@email.com',
    nationality: 'Bahraini',
    supplier: 'Yjeek Fleet (In-house)',
    cpr: '',
    cprExpiry: '',
    birthDate: '',
    passport: '',
    passportExpiry: '',
    visa: '',
    visaExpiry: '',
    insuranceExpiry: '',
    licenseExpiry: '',
    plate: '12345',
    make: 'Honda',
    model: 'PCX',
    color: 'Red',
    year: '2023',
    vehicleType: 'Bike',
    specialItems: true,
    dailyLimit: 'BHD 50.000',
    orderLimit: 'BHD 20.000',
    onLimit: 'Stop cash orders',
  })

  const [specialTypes, setSpecialTypes] = useState(['Age-restricted 18+', 'Pharmacy', 'Fragile'])
  const [storeTypes, setStoreTypes] = useState(['Groceries', 'Food'])

  const update = (key) => (e) => setForm((prev) => ({ ...prev, [key]: e.target.value }))

  const toggleChip = (list, setList, value) => {
    setList((prev) => (prev.includes(value) ? prev.filter((item) => item !== value) : [...prev, value]))
  }

  return (
    <div className="px-5 pb-10 pt-4 max-[700px]:px-3">
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={goBack}
          className="inline-flex h-[34px] shrink-0 items-center gap-1 rounded-full border border-[#e4e8e4] bg-white px-3 text-[13px] font-medium text-[#1C211F] shadow-[0_1px_2px_rgba(20,40,28,.04)] hover:bg-[#f6f8f6]"
        >
          <ChevronLeft size={15} strokeWidth={2.2} />
          Champs
        </button>
        <h2 className="text-[20px] font-bold tracking-[-0.02em] text-[#17231c]">Add champ</h2>
      </div>

      <div className="space-y-4">
        <Card title="Personal">
          <div className="grid grid-cols-2 gap-3 max-[700px]:grid-cols-1">
            <Field label="Full name">
              <input className={inputClass} value={form.fullName} onChange={update('fullName')} />
            </Field>
            <Field label="Phone">
              <input className={inputClass} value={form.phone} onChange={update('phone')} />
            </Field>
            <Field label="Email">
              <input className={inputClass} value={form.email} onChange={update('email')} />
            </Field>
            <Field label="Nationality">
              <Select value={form.nationality} onChange={update('nationality')}>
                <option>Bahraini</option>
                <option>Indian</option>
                <option>Pakistani</option>
                <option>Filipino</option>
                <option>Other</option>
              </Select>
            </Field>
          </div>

          <div className="mt-3">
            <Field label="Supplier">
              <Select value={form.supplier} onChange={update('supplier')}>
                <option>Yjeek Fleet (In-house)</option>
                <option>SwiftFleet</option>
                <option>PrimeRide</option>
              </Select>
            </Field>
          </div>

          <div className="mt-3 grid grid-cols-3 gap-3 max-[900px]:grid-cols-2 max-[600px]:grid-cols-1">
            <Field label="CPR number">
              <input className={inputClass} value={form.cpr} onChange={update('cpr')} placeholder="CPR number" />
            </Field>
            <Field label="CPR Expiry date">
              <input className={inputClass} value={form.cprExpiry} onChange={update('cprExpiry')} placeholder="DD/MM/YYYY" />
            </Field>
            <Field label="Birth date">
              <input className={inputClass} value={form.birthDate} onChange={update('birthDate')} placeholder="DD/MM/YYYY" />
            </Field>
          </div>

          <div className="mt-3 grid grid-cols-4 gap-3 max-[1100px]:grid-cols-2 max-[600px]:grid-cols-1">
            <Field label="Passport number">
              <input className={inputClass} value={form.passport} onChange={update('passport')} />
            </Field>
            <Field label="Passport Expiry date">
              <input className={inputClass} value={form.passportExpiry} onChange={update('passportExpiry')} placeholder="DD/MM/YYYY" />
            </Field>
            <Field label="Visa number">
              <input className={inputClass} value={form.visa} onChange={update('visa')} />
            </Field>
            <Field label="Visa Expiry date">
              <input className={inputClass} value={form.visaExpiry} onChange={update('visaExpiry')} placeholder="DD/MM/YYYY" />
            </Field>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-3 max-[700px]:grid-cols-1">
            <Field label="Vehicle insurance Expiry date">
              <input className={inputClass} value={form.insuranceExpiry} onChange={update('insuranceExpiry')} placeholder="DD/MM/YYYY" />
            </Field>
            <Field label="Driving license Expiry date">
              <input className={inputClass} value={form.licenseExpiry} onChange={update('licenseExpiry')} placeholder="DD/MM/YYYY" />
            </Field>
          </div>

          <div className="mt-3 grid grid-cols-5 gap-3 max-[1100px]:grid-cols-3 max-[700px]:grid-cols-2 max-[480px]:grid-cols-1">
            <Field label="Plate number">
              <input className={inputClass} value={form.plate} onChange={update('plate')} />
            </Field>
            <Field label="Make">
              <input className={inputClass} value={form.make} onChange={update('make')} />
            </Field>
            <Field label="Model">
              <input className={inputClass} value={form.model} onChange={update('model')} />
            </Field>
            <Field label="Color">
              <input className={inputClass} value={form.color} onChange={update('color')} />
            </Field>
            <Field label="Year of make">
              <input className={inputClass} value={form.year} onChange={update('year')} />
            </Field>
          </div>
        </Card>

        <Card title="Vehicle type">
          <div className="inline-flex items-center gap-2 rounded-[12px] bg-[#f3f5f3] p-1.5 w-[554px]">
            {[
              { id: 'Bike', icon: <img src={motoBikeIcon} alt="" className="h-4 w-4 object-contain" /> },
              { id: 'Car', icon: <img src={carIcon} alt="" className="h-4 w-4 object-contain" /> },
            ].map(({ id, icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => setForm((prev) => ({ ...prev, vehicleType: id }))}
                className={cn(
                  'inline-flex h-[40px] items-center gap-2 rounded-[10px] w-full px-4 text-[13px] font-bold transition',
                  form.vehicleType === id
                    ? 'bg-white text-[#17231c] shadow-[0_1px_3px_rgba(20,40,28,.12)]'
                    : 'text-[#69756d] hover:text-[#455249]',
                )}
              >
                {icon}
                {id}
              </button>
            ))}
          </div>
        </Card>

        <DocSection
          title="Personal picture"
          items={[{ label: 'Personal picture', variant: 'image' }]}
        />
        <DocSection
          title="CPR"
          items={[
            { label: 'CPR - Front', variant: 'file' },
            { label: 'CPR - Back', variant: 'file' },
          ]}
        />
        <DocSection title="Passport" items={[{ label: 'Passport', variant: 'file' }]} />
        <DocSection
          title="Visa"
          items={[
            { label: 'Resident permit', variant: 'file' },
            { label: 'Work permit', variant: 'file' },
          ]}
        />
        <DocSection
          title="Driving license"
          items={[
            { label: 'License - Front', variant: 'file' },
            { label: 'License - Back', variant: 'file' },
          ]}
        />
        <DocSection
          title="Vehicle registration"
          items={[
            { label: 'Reg - Front', variant: 'file' },
            { label: 'Reg - Back', variant: 'file' },
            { label: 'Vehicle photo 1', variant: 'image' },
            { label: 'Vehicle photo 2', variant: 'image' },
            { label: 'Vehicle photo 3', variant: 'image' },
          ]}
        />
        <DocSection title="Vehicle insurance" items={[{ label: 'Insurance', variant: 'file' }]} />

        <Card title="Delivery permissions & limits">
          <div className="mb-5 flex items-center w-fit gap-3 rounded-[12px] bg-[#f3f5f3] px-4 py-3">
            <div>
              <p className="text-[13px] font-bold text-[#17231c] mb-1"  >Can deliver special items</p>
              <p className='text-[12px] font-medium text-[#7c8780]'>Alcohol, age-restricted, pharmacy, fragile or high-value items</p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={form.specialItems}
              onClick={() => setForm((prev) => ({ ...prev, specialItems: !prev.specialItems }))}
              className={cn(
                'relative h-[28px] w-[48px] shrink-0 rounded-full transition',
                form.specialItems ? 'bg-[#1aa054]' : 'bg-[#d5dbd7]',
              )}
            >
              <span
                className={cn(
                  'absolute top-[3px] h-[22px] w-[22px] rounded-full bg-white shadow transition',
                  form.specialItems ? 'left-[23px]' : 'left-[3px]',
                )}
              />
            </button>
          </div>

          <div className="mb-5">
            <p className="mb-2.5 text-[12px] font-medium text-[#7c8780]">Special item types allowed</p>
            <div className="flex flex-wrap gap-2">
              {SPECIAL_ITEMS.map((item) => (
                <Chip
                  key={item}
                  label={item}
                  selected={specialTypes.includes(item)}
                  onClick={() => toggleChip(specialTypes, setSpecialTypes, item)}
                />
              ))}
            </div>
          </div>

          <div className="mb-5">
            <p className="mb-2.5 text-[12px] font-medium text-[#7c8780]">Allowed store types</p>
            <div className="flex flex-wrap gap-2">
              {STORE_TYPES.map((item) => (
                <Chip
                  key={item}
                  label={item}
                  selected={storeTypes.includes(item)}
                  onClick={() => toggleChip(storeTypes, setStoreTypes, item)}
                />
              ))}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 max-[900px]:grid-cols-1">
            <Field label="Daily cash limit (COD)">
              <input className={inputClass} value={form.dailyLimit} onChange={update('dailyLimit')} />
            </Field>
            <Field label="Per-order cash limit">
              <input className={inputClass} value={form.orderLimit} onChange={update('orderLimit')} />
            </Field>
            <Field label="On reaching limit">
              <Select value={form.onLimit} onChange={update('onLimit')}>
                <option>Stop cash orders</option>
                <option>Notify only</option>
                <option>Require approval</option>
              </Select>
            </Field>
          </div>
        </Card>
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={goBack}
          className="text-[13px] font-semibold hover:text-[#455249]  py-2.5 px-3 rounded-full bg-white text-black" 
        >
          Cancel
        </button>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            className="inline-flex h-[36px] items-center rounded-full border border-[#1aa054] bg-white px-4 text-[13px] font-bold text-[#1aa054] hover:bg-[#f3faf5]"
          >
            Save draft
          </button>
          <button
            type="button"
            onClick={goBack}
            className="inline-flex h-[36px] items-center rounded-full bg-[#1aa054] px-4 text-[13px] font-bold text-white hover:bg-[#158a47]"
          >
            Create champ
          </button>
        </div>
      </div>
    </div>
  )
}
