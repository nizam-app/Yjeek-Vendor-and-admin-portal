import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Check } from 'lucide-react'
import { CatalogStoreIcon } from '../components/CatalogStoreIcons'
import { catalogStoreTypes } from '../data/mockData'

export default function Catalog() {
  const navigate = useNavigate()
  const [selectedId, setSelectedId] = useState('all')

  function handleSelect(type) {
    setSelectedId(type.id)
    if (type.id === 'food') {
      navigate('/catalog/food')
    }
  }

  return (
    <div className="px-[28px] pt-[26px] pb-10">
      <h1 className="mb-2 text-[28px] font-bold tracking-[-0.02em] text-ink">Set up your catalog</h1>
      <p className="mb-7 max-w-[560px] text-[14px] leading-[1.55] text-ink-muted">
        Pick your store type and we’ll tailor the product fields. One catalog system — works for any category, and you
        can mix or change anytime.
      </p>

      <div className="grid max-w-[744px] grid-cols-1 gap-[14px] sm:grid-cols-2">
        {catalogStoreTypes.map((type) => {
          const selected = selectedId === type.id
          return (
            <button
              key={type.id}
              type="button"
              onClick={() => handleSelect(type)}
              className={`flex h-[118px] w-full items-center gap-3.5 rounded-[16px] px-5 text-left transition-colors ${
                selected
                  ? 'border-[1.5px] border-[#1AA64D] bg-[#E8F5EC]'
                  : 'border border-[#E5E8E5] bg-white hover:border-[#D0D5D0]'
              }`}
            >
              {/* Icon tile: white when selected, soft gray when not */}
              <span
                className={`flex size-11 shrink-0 items-center justify-center rounded-[10px] ${
                  selected ? 'bg-white' : 'bg-[#F0F2F0]'
                }`}
              >
                <CatalogStoreIcon id={type.id} />
              </span>

              <span className="min-w-0 flex-1">
                {/* Title always black / bold */}
                <span className="block text-[16px] font-bold leading-[1.2] text-[#1A1A1A]">{type.title}</span>
                {/* Description: green when selected, gray when not (see Figma arrows) */}
                <span
                  className={`mt-1 block text-[13px] font-normal leading-[1.35] ${
                    selected ? 'text-[#1AA64D]' : 'text-[#8A938C]'
                  }`}
                >
                  {type.description}
                </span>
              </span>

              {selected ? (
                <span className="inline-flex size-6 shrink-0 items-center justify-center rounded-full bg-[#1AA64D]">
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
