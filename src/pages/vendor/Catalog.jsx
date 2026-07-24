import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Check } from 'lucide-react'
import { CatalogStoreIcon } from '../../components/CatalogStoreIcons'
import { useVendorCatalogStoreTypes } from '../../hooks/vendor/useVendorCatalog'

function isFoodStoreType(type) {
  const slug = String(type?.slug || type?.iconKey || '').toLowerCase()
  return slug === 'food' || slug === 'food_drink' || slug === 'food-drink' || /food/i.test(type?.title || '')
}

/**
 * Store-type picker ("Set up your catalog").
 * Data: GET /vendor-panel/catalog/store-types
 * Selecting Food opens the products catalog.
 */
export default function Catalog() {
  const navigate = useNavigate()
  const [selectedId, setSelectedId] = useState('all')
  const { data: catalogStoreTypes, error, isLoading, refetch } = useVendorCatalogStoreTypes()
  const types = Array.isArray(catalogStoreTypes) ? catalogStoreTypes : []

  if (isLoading && types.length === 0) {
    return <div className="p-7 text-[13px] text-ink-muted">Loading catalog…</div>
  }
  if (error && types.length === 0) {
    return (
      <div className="p-7 text-[13px] text-danger">
        Unable to load catalog.{' '}
        <button type="button" onClick={refetch} className="underline">
          Try again
        </button>
      </div>
    )
  }

  function handleSelect(type) {
    setSelectedId(type.id)
    if (isFoodStoreType(type)) {
      navigate('/catalog/food')
    }
  }

  return (
    <div className="px-[28px] pt-[26px] pb-10">
      <h1 className="mb-2 text-[20px] font-bold tracking-[-0.02em] text-ink">Set up your catalog</h1>
      <p className="mb-7 max-w-[560px] text-[14px] leading-[1.55] text-ink-muted">
        Pick your store type and we’ll tailor the product fields. One catalog system — works for any category, and you
        can mix or change anytime.
      </p>

      <div className="grid max-w-[744px] grid-cols-1 gap-[14px] sm:grid-cols-2">
        {types.map((type) => {
          const selected = selectedId === type.id || selectedId === type.slug || selectedId === type.iconKey
          return (
            <button
              key={type.id}
              type="button"
              onClick={() => handleSelect(type)}
              className={`relative flex h-[118px] w-full items-start gap-3.5 rounded-[16px] px-5 pt-5 text-left transition-colors ${
                selected
                  ? 'border-[1.5px] border-[#1AA64D] bg-[#E8F5EC]'
                  : 'border border-[#E5E8E5] bg-white hover:border-[#D0D5D0]'
              }`}
            >
              <span
                className={`flex size-11 shrink-0 items-center justify-center rounded-[10px] ${
                  selected ? 'bg-white' : 'bg-[#F0F2F0]'
                }`}
              >
                <CatalogStoreIcon
                  id={type.iconKey || type.slug || type.id}
                  emoji={type.iconEmoji}
                  iconUrl={type.iconUrl}
                />
              </span>

              <span className="min-w-0 flex-1 pt-0.5">
                <span className="block text-[16px] font-bold leading-[1.2] text-[#1A1A1A]">{type.title}</span>
                <span
                  className={`mt-1 block text-[13px] font-normal leading-[1.35] ${
                    selected ? 'text-[#1AA64D]' : 'text-[#8A938C]'
                  }`}
                >
                  {type.description}
                </span>
              </span>

              {selected ? (
                <span className="absolute top-4 right-4 inline-flex size-6 items-center justify-center rounded-full bg-[#1AA64D]">
                  <Check size={14} strokeWidth={3} className="text-white" />
                </span>
              ) : null}
            </button>
          )
        })}
      </div>
    </div>
  )
}
