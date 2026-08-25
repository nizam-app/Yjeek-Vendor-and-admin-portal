import { useState } from 'react'
import { Check, Copy, RefreshCw } from 'lucide-react'
import { copyTextToClipboard, generateStrongPassword } from '../../lib/generateStrongPassword'

const cn = (...parts) => parts.filter(Boolean).join(' ')

const defaultInputClass =
  'box-border h-[40px] w-full min-w-0 flex-1 rounded-[8px] border border-[rgba(0,0,0,0.1)] bg-white px-3 text-[13px] text-[#17231c] outline-none transition placeholder:text-[#9aa49d] focus:border-[#1aa054]'

/**
 * Visible password field with Generate + Copy (buyer: strong password, show it, copy).
 */
export default function AdminPasswordField({
  value,
  onChange,
  placeholder = '',
  disabled = false,
  inputClassName = '',
  id,
  name,
  autoComplete = 'new-password',
}) {
  const [copied, setCopied] = useState(false)
  const hasValue = Boolean(String(value || '').trim())

  function handleGenerate() {
    if (disabled) return
    const next = generateStrongPassword(14)
    onChange?.(next)
    setCopied(false)
  }

  async function handleCopy() {
    if (!hasValue || disabled) return
    const ok = await copyTextToClipboard(value)
    if (ok) {
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1800)
    }
  }

  return (
    <div className="space-y-1.5">
      <div className="flex flex-wrap items-center gap-2">
        <input
          id={id}
          name={name}
          type="text"
          autoComplete={autoComplete}
          className={cn(defaultInputClass, inputClassName)}
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          spellCheck={false}
        />
        <button
          type="button"
          onClick={handleGenerate}
          disabled={disabled}
          className="inline-flex h-[40px] shrink-0 items-center gap-1.5 rounded-[8px] border border-[#1aa054] bg-white px-3 text-[12px] font-bold text-[#1aa054] hover:bg-[#f3faf5] disabled:cursor-not-allowed disabled:opacity-60"
        >
          <RefreshCw size={14} strokeWidth={2.2} aria-hidden />
          Generate
        </button>
        <button
          type="button"
          onClick={handleCopy}
          disabled={disabled || !hasValue}
          className="inline-flex h-[40px] shrink-0 items-center gap-1.5 rounded-[8px] border border-[#e4e8e4] bg-white px-3 text-[12px] font-medium text-[#455249] hover:bg-[#f6f8f6] disabled:cursor-not-allowed disabled:opacity-50"
          aria-label={copied ? 'Copied' : 'Copy password'}
        >
          {copied ? <Check size={14} className="text-[#1aa054]" aria-hidden /> : <Copy size={14} aria-hidden />}
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <p className="text-[11px] leading-[14px] text-[#9aa49d]">
        Generates a strong password and shows it here so you can copy it for the vendor.
      </p>
    </div>
  )
}
