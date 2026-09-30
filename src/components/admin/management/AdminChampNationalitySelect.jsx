import { useEffect, useMemo, useState } from 'react'
import { cn } from '../cn'
import { formatApiErrorMessage } from '../../../api/errors'
import { adminService } from '../../../services/adminService'

const ADD_VALUE = '__add_nationality__'

const selectClass =
  'box-border h-[40px] w-full rounded-[8px] border border-[rgba(0,0,0,0.1)] bg-white px-3 text-[13px] text-[#17231c] outline-none transition focus:border-[#1aa054]'

const inputClass =
  'box-border h-[40px] min-w-0 flex-1 rounded-[8px] border border-[rgba(0,0,0,0.1)] bg-white px-3 text-[13px] text-[#17231c] outline-none transition placeholder:text-[#9aa49d] focus:border-[#1aa054]'

/**
 * @param {object} props
 * @param {string} props.value
 * @param {(e: { target: { value: string } }) => void} props.onChange
 * @param {boolean} [props.disabled]
 */
export default function AdminChampNationalitySelect({ value, onChange, disabled = false }) {
  const [nationalities, setNationalities] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [showAdd, setShowAdd] = useState(false)
  const [newLabel, setNewLabel] = useState('')
  const [adding, setAdding] = useState(false)
  const [addError, setAddError] = useState('')

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setLoadError('')
    ;(async () => {
      try {
        const result = await adminService.listAdminChampNationalities()
        if (cancelled) return
        setNationalities(result?.data?.nationalities || [])
      } catch (err) {
        if (!cancelled) {
          setLoadError(formatApiErrorMessage(err, 'Failed to load nationalities.'))
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const options = useMemo(() => {
    const list = [...nationalities]
    const current = String(value || '').trim()
    if (current && !list.some((item) => item.toLowerCase() === current.toLowerCase())) {
      list.push(current)
    }
    return list
  }, [nationalities, value])

  const handleSelectChange = (e) => {
    const next = e.target.value
    if (next === ADD_VALUE) {
      setShowAdd(true)
      setAddError('')
      return
    }
    setShowAdd(false)
    onChange(e)
  }

  async function handleAddNationality() {
    const label = String(newLabel || '').trim()
    if (label.length < 2) {
      setAddError('Enter at least 2 characters.')
      return
    }
    setAdding(true)
    setAddError('')
    try {
      const result = await adminService.addAdminChampNationality(label)
      const nextList = result?.data?.nationalities || []
      setNationalities(nextList)
      const match =
        nextList.find((item) => item.toLowerCase() === label.toLowerCase()) || label
      onChange({ target: { value: match } })
      setNewLabel('')
      setShowAdd(false)
    } catch (err) {
      setAddError(formatApiErrorMessage(err, 'Failed to add nationality.'))
    } finally {
      setAdding(false)
    }
  }

  return (
    <div className="space-y-2">
      <select
        className={cn(selectClass, disabled && 'cursor-not-allowed opacity-60')}
        value={value || ''}
        onChange={handleSelectChange}
        disabled={disabled || loading}
      >
        <option value="" disabled>
          {loading ? 'Loading nationalities…' : 'Select nationality'}
        </option>
        {options.map((item) => (
          <option key={item} value={item}>
            {item}
          </option>
        ))}
        <option value={ADD_VALUE}>+ Add nationality…</option>
      </select>

      {loadError ? <p className="text-[12px] text-[#b42318]">{loadError}</p> : null}

      {showAdd ? (
        <div className="flex flex-wrap items-start gap-2">
          <input
            type="text"
            className={inputClass}
            value={newLabel}
            onChange={(e) => setNewLabel(e.target.value)}
            placeholder="e.g. Bangladeshi"
            maxLength={100}
            disabled={disabled || adding}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                void handleAddNationality()
              }
            }}
          />
          <button
            type="button"
            disabled={disabled || adding}
            onClick={() => void handleAddNationality()}
            className="h-[40px] shrink-0 rounded-[8px] bg-[#1aa054] px-4 text-[13px] font-semibold text-white transition hover:bg-[#147940] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {adding ? 'Saving…' : 'Add'}
          </button>
          <button
            type="button"
            disabled={adding}
            onClick={() => {
              setShowAdd(false)
              setNewLabel('')
              setAddError('')
            }}
            className="h-[40px] shrink-0 rounded-[8px] border border-[#dfe4e0] bg-white px-3 text-[13px] font-medium text-[#59655e]"
          >
            Cancel
          </button>
        </div>
      ) : null}

      {addError ? <p className="text-[12px] text-[#b42318]">{addError}</p> : null}
    </div>
  )
}
