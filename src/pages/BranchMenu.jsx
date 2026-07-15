import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { branches } from '../data/mockData'
import folderChevronIcon from '../assets/icon-folder-chevron.png'
import foldersIcon from '../assets/icon-folders.png'

function findBranch(branchId) {
  if (!branchId) return null
  const decoded = decodeURIComponent(branchId)
  return (
    branches.find((b) => b.id === decoded) ||
    branches.find((b) => b.name === decoded) ||
    branches.find((b) => b.id === decoded.toLowerCase())
  )
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

function VisibilityToggle({ visible, onChange, label }) {
  return (
    <div className="flex shrink-0 items-center gap-2">
      <span
        className={`text-[12.5px] font-semibold ${
          visible ? 'text-[#2E9E4D]' : 'text-[#949C94]'
        }`}
      >
        {visible ? 'Visible' : 'Hidden'}
      </span>
      <Toggle checked={visible} onChange={onChange} label={label} />
    </div>
  )
}

function AvailabilityToggle({ available, onChange, label }) {
  return (
    <div className="flex shrink-0 items-center gap-2">
      <span
        className={`text-[12.5px] font-semibold ${
          available ? 'text-[#2E9E4D]' : 'text-[#949C94]'
        }`}
      >
        {available ? 'Available' : 'Unavailable'}
      </span>
      <Toggle checked={available} onChange={onChange} label={label} />
    </div>
  )
}

function PricePill({ price }) {
  return (
    <span className="inline-flex h-[28px] shrink-0 items-center rounded-[8px] border border-[#E0E6E0] bg-white px-2.5 text-[12.5px] font-semibold text-[#1A1A1A]">
      {price}
    </span>
  )
}

function MenuItemRow({ item, onToggle }) {
  return (
    <div
      className={`mx-3 mb-2.5 flex items-center gap-3 rounded-[12px] bg-[#F4F6F4] px-3.5 py-3 last:mb-3 ${
        item.available ? '' : 'opacity-70'
      }`}
    >
      <span
        className="flex size-8 shrink-0 items-center justify-center rounded-[8px] bg-white text-[14px]"
        aria-hidden
      >
        <span className="text-[14px] leading-[17px] text-[#949C94]">🍽️</span>
      </span>
      <p className="min-w-0 flex-1 text-[13.5px] font-semibold text-[#1A1A1A]">{item.name}</p>
      <PricePill price={item.price} />
      <AvailabilityToggle
        available={item.available}
        onChange={onToggle}
        label={`${item.name} availability`}
      />
    </div>
  )
}

function buildInitialMenu() {
  return {
    starters: {
      id: 'starters',
      kind: 'flat',
      name: 'Starters',
      visible: true,
      items: [
        { id: 'hummus', name: 'Hummus Beiruti', price: 'BHD 1.500', available: true },
        { id: 'mezze', name: 'Gourmet Mezze Platter', price: 'BHD 3.600', available: true },
        { id: 'falafel', name: 'Falafel (6 pcs)', price: 'BHD 1.200', available: false },
      ],
    },
    mains: {
      id: 'mains',
      kind: 'nested',
      name: 'Main dishes',
      visible: true,
      children: [
        {
          id: 'grilled',
          name: 'Grilled',
          visible: true,
          children: [
            {
              id: 'charcoal',
              name: 'Charcoal grills',
              visible: true,
              items: [
                { id: 'mixed-grill', name: 'Mixed Grill', price: 'BHD 5.000', available: true },
                { id: 'lamb-chops', name: 'Lamb chops', price: 'BHD 6.000', available: true },
              ],
            },
            {
              id: 'skewers',
              name: 'Skewers',
              visible: false,
              items: [
                { id: 'tawook', name: 'Shish tawook', price: 'BHD 4.000', available: false },
                { id: 'kofta', name: 'Kofta', price: 'BHD 3.500', available: false },
              ],
            },
          ],
        },
        {
          id: 'rice',
          name: 'Rice dishes',
          visible: true,
          children: [
            {
              id: 'biryani',
              name: 'Biryani',
              visible: true,
              items: [
                {
                  id: 'chicken-biryani',
                  name: 'Chicken biryani',
                  price: 'BHD 3.500',
                  available: true,
                },
              ],
            },
          ],
        },
      ],
    },
    drinks: {
      id: 'drinks',
      kind: 'flat',
      name: 'Drinks',
      visible: true,
      items: [
        { id: 'juice', name: 'Fresh Juice', price: 'BHD 1.500', available: true },
        { id: 'soft', name: 'Soft drink', price: 'BHD 0.500', available: true },
      ],
    },
  }
}

export default function BranchMenu() {
  const { branchId } = useParams()
  const navigate = useNavigate()
  const branch = useMemo(() => findBranch(branchId), [branchId])
  const [menu, setMenu] = useState(null)

  useEffect(() => {
    if (!branch) return
    setMenu(buildInitialMenu())
  }, [branch])

  if (!branch) {
    return (
      <div className="px-[28px] pt-[26px] pb-10">
        <Link
          to="/branches"
          className="mb-4 inline-flex items-center gap-1 rounded-[18px] border border-[#E0E5E0] bg-white py-1.5 pr-3.5 pl-2.5 text-[12px] font-semibold text-ink-muted hover:bg-[#fafbfa]"
        >
          ‹ Branches
        </Link>
        <p className="text-[14px] text-ink-muted">Branch not found.</p>
      </div>
    )
  }

  if (!menu) return null

  const editPath = `/branches/${encodeURIComponent(branch.id || branchId)}/edit`

  function toggleSectionVisible(sectionKey) {
    setMenu((c) => ({
      ...c,
      [sectionKey]: { ...c[sectionKey], visible: !c[sectionKey].visible },
    }))
  }

  function toggleFlatItem(sectionKey, itemId) {
    setMenu((c) => ({
      ...c,
      [sectionKey]: {
        ...c[sectionKey],
        items: c[sectionKey].items.map((item) =>
          item.id === itemId ? { ...item, available: !item.available } : item
        ),
      },
    }))
  }

  function toggleNestedNode(sectionKey, pathIds, field) {
    setMenu((c) => {
      const section = structuredClone(c[sectionKey])
      let node = section
      for (const id of pathIds) {
        if (node.children) {
          node = node.children.find((n) => n.id === id)
        } else if (node.items) {
          node = node.items.find((n) => n.id === id)
        }
      }
      if (node) node[field] = !node[field]
      return { ...c, [sectionKey]: section }
    })
  }

  function handleSave() {
    navigate(editPath)
  }

  return (
    <div className="px-[28px] pt-[18px] pb-10">
      {/* Header */}
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <Link
          to={editPath}
          className="inline-flex items-center gap-1 rounded-[18px] border border-[#E0E5E0] bg-white py-1.5 pr-3.5 pl-2.5 text-[12px] font-semibold text-ink-muted hover:bg-[#fafbfa]"
        >
          ‹ Edit branch
        </Link>

        <h1 className="min-w-0 flex-1 text-[22px] font-bold tracking-[-0.02em] text-ink sm:text-[24px]">
          Branch menu · {branch.name}
        </h1>

        <button
          type="button"
          onClick={handleSave}
          className="inline-flex h-[40px] items-center justify-center rounded-full bg-[#1AA34D] px-6 text-[13px] font-semibold text-white hover:brightness-[0.96]"
        >
          Save
        </button>
      </div>

      {/* Organize categories */}
      <section className="mb-4 flex items-center gap-3 rounded-[12px] border border-[#E0E6E0] bg-white px-4 py-3.5">
        <img
          src={foldersIcon}
          alt=""
          className="size-8 shrink-0 object-contain"
          aria-hidden
        />
        <div className="min-w-0 flex-1">
          <h2 className="text-[14.5px] font-bold text-ink">
            Organize categories (Category › Subcategory › Type)
          </h2>
          <p className="text-[12.5px] leading-relaxed text-ink-muted">
            Manage the full nested structure for this branch
          </p>
        </div>
        <button
          type="button"
          className="shrink-0 text-[13px] font-semibold text-[#127036] hover:underline"
        >
          Open ›
        </button>
      </section>

      <div className="flex flex-col gap-4">
        {/* Starters */}
        <FlatSection
          section={menu.starters}
          onToggleVisible={() => toggleSectionVisible('starters')}
          onToggleItem={(id) => toggleFlatItem('starters', id)}
        />

        {/* Main dishes — nested */}
        <NestedSection
          section={menu.mains}
          onToggleVisible={() => toggleSectionVisible('mains')}
          onToggleNode={(pathIds, field) => toggleNestedNode('mains', pathIds, field)}
        />

        {/* Drinks */}
        <FlatSection
          section={menu.drinks}
          onToggleVisible={() => toggleSectionVisible('drinks')}
          onToggleItem={(id) => toggleFlatItem('drinks', id)}
        />
      </div>
    </div>
  )
}

function FlatSection({ section, onToggleVisible, onToggleItem }) {
  return (
    <section className="rounded-[14px] border border-border bg-white pb-1">
      <div className="flex items-center justify-between gap-3 px-4 py-3.5">
        <h2 className="text-[15px] font-bold text-ink">{section.name}</h2>
        <VisibilityToggle
          visible={section.visible}
          onChange={onToggleVisible}
          label={`${section.name} visibility`}
        />
      </div>
      <div>
        {section.items.map((item) => (
          <MenuItemRow key={item.id} item={item} onToggle={() => onToggleItem(item.id)} />
        ))}
      </div>
    </section>
  )
}

function NestArrow() {
  return (
    <span className="text-[12.5px] leading-[15px] font-semibold text-[#949C94]">▾</span>
  )
}

function NestDot() {
  return (
    <span
      className="mx-[3px] size-[6px] shrink-0 rounded-full bg-[#C7CFC7]"
      aria-hidden
    />
  )
}

function NestedSection({ section, onToggleVisible, onToggleNode }) {
  return (
    <section className="rounded-[14px] border border-border bg-white pb-2">
      <div className="flex items-center justify-between gap-3 px-4 py-3.5">
        <div className="flex items-center gap-2">
          <img
            src={folderChevronIcon}
            alt=""
            className="h-[18px] w-auto shrink-0 object-contain"
            aria-hidden
          />
          <h2 className="text-[15px] font-bold text-ink">{section.name}</h2>
        </div>
        <VisibilityToggle
          visible={section.visible}
          onChange={onToggleVisible}
          label={`${section.name} visibility`}
        />
      </div>

      <div className="px-2 pb-1">
        {section.children.map((sub) => (
          <div key={sub.id}>
            {/* Subcategory — down arrow */}
            <div className="mb-1 flex items-center justify-between gap-3 px-3 py-2">
              <div className="flex min-w-0 items-center gap-1.5 pl-1">
                <NestArrow />
                <p className="text-[13.5px] font-bold text-[#1A1A1A]">{sub.name}</p>
              </div>
              <VisibilityToggle
                visible={sub.visible}
                onChange={() => onToggleNode([sub.id], 'visible')}
                label={`${sub.name} visibility`}
              />
            </div>

            {/* Types — down arrow; items — dot */}
            <div className="pl-6">
              {sub.children.map((type) => (
                <div key={type.id} className="mb-1">
                  <div className="mb-1.5 flex items-center justify-between gap-3 py-1.5 pr-1 pl-1">
                    <div className="flex min-w-0 items-center gap-1.5">
                      <NestArrow />
                      <p
                        className={`text-[13px] font-semibold ${
                          type.visible ? 'text-[#127036]' : 'text-[#949C94]'
                        }`}
                      >
                        {type.name}
                      </p>
                    </div>
                    <VisibilityToggle
                      visible={type.visible}
                      onChange={() => onToggleNode([sub.id, type.id], 'visible')}
                      label={`${type.name} visibility`}
                    />
                  </div>

                  <div className="pl-5">
                    {type.items.map((item) => (
                      <div
                        key={item.id}
                        className={`mb-2 flex items-center gap-2.5 rounded-[12px] bg-[#F4F6F4] px-3.5 py-3 ${
                          item.available && type.visible ? '' : 'opacity-60'
                        }`}
                      >
                        <NestDot />
                        <p className="min-w-0 flex-1 text-[13px] font-semibold text-[#1A1A1A]">
                          {item.name}
                        </p>
                        <PricePill price={item.price} />
                        <AvailabilityToggle
                          available={item.available}
                          onChange={() =>
                            onToggleNode([sub.id, type.id, item.id], 'available')
                          }
                          label={`${item.name} availability`}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
