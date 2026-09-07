import { ChevronDown } from 'lucide-react'
import {
  ADMIN_PHONE_COUNTRIES,
  DEFAULT_ADMIN_COUNTRY_CODE,
  adminPhoneCountryLabel,
  parseAdminPhone,
} from '../../lib/adminPhone'
import { cn } from './cn'

/**
 * One phone input: country code sits inside the left of the field.
 * Only Bahrain (+973) is listed for now; more countries can be added to ADMIN_PHONE_COUNTRIES.
 */
export default function AdminPhoneField({
  countryCode = DEFAULT_ADMIN_COUNTRY_CODE,
  phone = '',
  onChange,
  disabled = false,
  placeholder = '3300 0000',
  id,
  name,
  className = '',
}) {
  const parsed = parseAdminPhone(phone, countryCode)
  const selectValue = ADMIN_PHONE_COUNTRIES.some((country) => country.dial === parsed.countryCode)
    ? parsed.countryCode
    : DEFAULT_ADMIN_COUNTRY_CODE
  const selected =
    ADMIN_PHONE_COUNTRIES.find((country) => country.dial === selectValue) || ADMIN_PHONE_COUNTRIES[0]

  function emit(nextCountryCode, nextPhone) {
    onChange?.({ countryCode: nextCountryCode, phone: String(nextPhone || '').replace(/\D/g, '') })
  }

  function handlePhoneChange(event) {
    const raw = event.target.value
    if (raw.includes('+') || raw.replace(/\D/g, '').length > 8) {
      const next = parseAdminPhone(raw, selectValue)
      emit(next.countryCode, next.phone)
      return
    }
    emit(selectValue, raw.replace(/\D/g, ''))
  }

  return (
    <div
      className={cn(
        'box-border flex h-[40px] min-w-0 w-full items-stretch overflow-hidden rounded-[8px] border border-[rgba(0,0,0,0.1)] bg-white text-[13px] text-[#17231c] transition focus-within:border-[#1aa054]',
        disabled && 'bg-[#f6f8f6]',
        className,
      )}
    >
      <div className="relative shrink-0">
        <div className="flex h-full items-center gap-1 pl-3 pr-2">
          <span className="whitespace-nowrap font-medium text-[#17231c]">
            {adminPhoneCountryLabel(selected)}
          </span>
          <ChevronDown size={14} strokeWidth={2} className="shrink-0 text-[#7c8780]" aria-hidden />
        </div>
        <select
          aria-label="Country code"
          className="absolute inset-0 h-full w-full cursor-pointer appearance-none opacity-0 outline-none disabled:cursor-not-allowed"
          value={selectValue}
          disabled={disabled}
          onChange={(event) => emit(event.target.value, parsed.phone)}
        >
          {ADMIN_PHONE_COUNTRIES.map((country) => (
            <option key={country.dial} value={country.dial}>
              {adminPhoneCountryLabel(country)} — {country.name}
            </option>
          ))}
        </select>
      </div>
      <span className="my-2 w-px shrink-0 bg-[rgba(0,0,0,0.1)]" aria-hidden />
      <input
        id={id}
        name={name}
        type="tel"
        inputMode="numeric"
        autoComplete="tel-national"
        className="min-w-0 flex-1 border-0 bg-transparent px-3 text-[13px] text-[#17231c] outline-none placeholder:text-[#9aa49d] disabled:cursor-not-allowed"
        value={parsed.phone}
        onChange={handlePhoneChange}
        placeholder={placeholder}
        disabled={disabled}
        aria-label="Phone number"
      />
    </div>
  )
}
