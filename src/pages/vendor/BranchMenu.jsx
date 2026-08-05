import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import folderChevronIcon from '../../assets/icon-folder-chevron.png'
import foldersIcon from '../../assets/icon-folders.png'
import { ApiError, getFirstFieldErrorMessage } from '../../api/errors'
import { useApiMutation } from '../../hooks/useApiMutation'
import { useVendorBranch } from '../../hooks/vendor/useVendorBranch'
import { useVendorBranchMenu } from '../../hooks/vendor/useVendorBranchMenu'
import { branchService } from '../../services/vendor/branchService'

function Toggle({ checked, onChange, label, disabled = false }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      aria-disabled={disabled}
      disabled={disabled}
      onClick={disabled ? undefined : onChange}
      className={`box-border flex h-[22px] w-[38px] shrink-0 items-center rounded-[11px] px-[3px] transition-colors ${
        checked ? 'justify-end bg-[#2E9E4D]' : 'justify-start bg-[#C7CFC7]'
      } ${disabled ? 'cursor-not-allowed opacity-50' : ''}`}
    >
      <span className="size-4 shrink-0 rounded-lg bg-white" />
    </button>
  )
}

function VisibilityToggle({ visible, onChange, label, disabled = false }) {
  return (
    <div className={`flex shrink-0 items-center gap-2 ${disabled ? 'opacity-60' : ''}`}>
      <span
        className={`text-[12.5px] font-medium ${
          visible ? 'text-[#2E9E4D]' : 'text-[#949C94]'
        }`}
      >
        {visible ? 'Visible' : 'Hidden'}
      </span>
      <Toggle checked={visible} onChange={onChange} label={label} disabled={disabled} />
    </div>
  )
}

function AvailabilityToggle({ available, onChange, label, disabled = false }) {
  return (
    <div className={`flex shrink-0 items-center gap-2 ${disabled ? 'opacity-60' : ''}`}>
      <span
        className={`text-[12.5px] font-medium ${
          available ? 'text-[#2E9E4D]' : 'text-[#949C94]'
        }`}
      >
        {available ? 'Available' : 'Unavailable'}
      </span>
      <Toggle checked={available} onChange={onChange} label={label} disabled={disabled} />
    </div>
  )
}

function PricePill({ price }) {
  return (
    <span className="inline-flex h-[28px] shrink-0 items-center rounded-[8px] border border-[#E0E6E0] bg-white px-2.5 text-[12.5px] font-medium text-[#1A1A1A]">
      {price}
    </span>
  )
}

function getSaveErrorMessage(error) {
  if (!error) return 'Unable to save menu. Please try again.'
  if (error instanceof ApiError) {
    const fieldMessage = getFirstFieldErrorMessage(error.fieldErrors)
    if (fieldMessage) return fieldMessage
    if (error.message) return error.message
  }
  if (typeof error?.message === 'string' && error.message) return error.message
  return 'Unable to save menu. Please try again.'
}

function updateNodeByPath(nodes, pathIds, updater) {
  if (!pathIds.length) return nodes

  const [head, ...rest] = pathIds
  return (nodes || []).map((node) => {
    if (node.id !== head) return node
    if (rest.length === 0) return updater(node)
    if (node.kind !== 'category') return node
    return {
      ...node,
      children: updateNodeByPath(node.children, rest, updater),
    }
  })
}

function NestArrow() {
  return <span className="text-[12.5px] leading-[15px] font-medium text-[#949C94]">▾</span>
}

function NestDot() {
  return (
    <span className="mx-[3px] size-[6px] shrink-0 rounded-full bg-[#C7CFC7]" aria-hidden />
  )
}

function ProductRow({ item, nested, dimmed, onToggleAvailable, onToggleVisible }) {
  const locked = Boolean(item.lockedByCategory)
  return (
    <div
      className={`mb-2.5 flex items-center gap-2.5 rounded-[12px] bg-[#F4F6F4] px-3.5 py-3 last:mb-0 ${
        nested ? '' : 'mx-3 last:mb-3'
      } ${item.available && item.visible && !dimmed ? '' : 'opacity-60'}`}
    >
      {nested ? <NestDot /> : (
        <span
          className="flex size-8 shrink-0 items-center justify-center rounded-[8px] bg-white text-[14px]"
          aria-hidden
        >
          <span className="text-[14px] leading-[17px] text-[#949C94]">🍽️</span>
        </span>
      )}
      <p className="min-w-0 flex-1 text-[13px] font-medium text-[#1A1A1A]">{item.name}</p>
      <PricePill price={item.price} />
      <AvailabilityToggle
        available={item.available}
        onChange={onToggleAvailable}
        label={`${item.name} availability`}
        disabled={locked}
      />
      <VisibilityToggle
        visible={item.visible}
        onChange={onToggleVisible}
        label={`${item.name} visibility`}
      />
    </div>
  )
}

function CategoryChildren({ children, pathPrefix, depth, parentVisible, onToggle }) {
  if (!children?.length) return null

  const allProducts = children.every((child) => child.kind === 'product')

  if (allProducts) {
    return (
      <div className={depth === 0 ? '' : 'pl-5'}>
        {children.map((item) => (
          <ProductRow
            key={item.id}
            item={item}
            nested={depth > 0}
            dimmed={!parentVisible}
            onToggleAvailable={() => onToggle([...pathPrefix, item.id], 'available')}
            onToggleVisible={() => onToggle([...pathPrefix, item.id], 'visible')}
          />
        ))}
      </div>
    )
  }

  return (
    <div className={depth === 0 ? 'px-2 pb-1' : 'pl-6'}>
      {children.map((child) => {
        if (child.kind === 'product') {
          return (
            <ProductRow
              key={child.id}
              item={child}
              nested
              dimmed={!parentVisible}
              onToggleAvailable={() => onToggle([...pathPrefix, child.id], 'available')}
              onToggleVisible={() => onToggle([...pathPrefix, child.id], 'visible')}
            />
          )
        }

        return (
          <div key={child.id} className="mb-1">
            <div
              className={`mb-1.5 flex items-center justify-between gap-3 py-1.5 ${
                depth === 0 ? 'px-3' : 'pr-1 pl-1'
              }`}
            >
              <div className={`flex min-w-0 items-center gap-1.5 ${depth === 0 ? 'pl-1' : ''}`}>
                <NestArrow />
                <p
                  className={`text-[13px] ${
                    depth === 0
                      ? 'font-bold text-[#1A1A1A]'
                      : child.visible
                        ? 'font-medium text-[#127036]'
                        : 'font-medium text-[#949C94]'
                  }`}
                >
                  {child.name}
                </p>
              </div>
              <VisibilityToggle
                visible={child.visible}
                onChange={() => onToggle([...pathPrefix, child.id], 'visible')}
                label={`${child.name} visibility`}
              />
            </div>
            <CategoryChildren
              children={child.children}
              pathPrefix={[...pathPrefix, child.id]}
              depth={depth + 1}
              parentVisible={parentVisible && child.visible}
              onToggle={onToggle}
            />
          </div>
        )
      })}
    </div>
  )
}

function MenuSection({ section, onToggle }) {
  const hasNestedCategories = (section.children || []).some((child) => child.kind === 'category')

  return (
    <section className="rounded-[14px] border border-border bg-white pb-1">
      <div className="flex items-center justify-between gap-3 px-4 py-3.5">
        <div className="flex items-center gap-2">
          {hasNestedCategories ? (
            <img
              src={folderChevronIcon}
              alt=""
              className="h-[18px] w-auto shrink-0 object-contain"
              aria-hidden
            />
          ) : null}
          <h2 className="text-[16px] font-bold text-ink">{section.name}</h2>
        </div>
        <VisibilityToggle
          visible={section.visible}
          onChange={() => onToggle([section.id], 'visible')}
          label={`${section.name} visibility`}
          disabled={Boolean(section.isSynthetic)}
        />
      </div>
      <CategoryChildren
        children={section.children}
        pathPrefix={[section.id]}
        depth={0}
        parentVisible={section.visible}
        onToggle={onToggle}
      />
    </section>
  )
}

export default function BranchMenu() {
  const { branchId } = useParams()
  const navigate = useNavigate()
  const decodedId = branchId ? decodeURIComponent(branchId) : ''
  const {
    data: branch,
    error: branchError,
    isLoading: branchLoading,
  } = useVendorBranch(decodedId)
  const {
    data: menuData,
    error: menuError,
    isLoading: menuLoading,
    refetch: refetchMenu,
  } = useVendorBranchMenu(decodedId)
  const { mutate: saveMenu, isLoading: isSaving } = useApiMutation((payload) =>
    branchService.updateBranchMenu(decodedId, payload),
  )

  const [menu, setMenu] = useState(null)
  const [saveError, setSaveError] = useState('')

  useEffect(() => {
    if (!menuData) return
    setMenu(structuredClone(menuData))
    setSaveError('')
  }, [menuData])

  const editPath = `/branches/${encodeURIComponent(branch?.id || decodedId)}/edit`
  const isLoading = branchLoading || menuLoading
  const error = branchError || menuError

  if (isLoading) {
    return <div className="px-[28px] pt-[26px] pb-10 text-[13px] text-ink-muted">Loading menu…</div>
  }

  if (error || !branch) {
    return (
      <div className="px-[28px] pt-[26px] pb-10">
        <Link
          to="/branches"
          className="mb-4 inline-flex items-center gap-1 rounded-[18px] border border-[#E0E5E0] bg-white py-1.5 pr-3.5 pl-2.5 text-[12px] font-medium text-ink-muted hover:bg-[#fafbfa]"
        >
          ‹ Branches
        </Link>
        <p className="text-[14px] text-ink-muted">
          {error?.status === 404 || !branch ? 'Branch not found.' : 'Unable to load branch menu.'}{' '}
          {error ? (
            <button type="button" onClick={refetchMenu} className="underline">
              Try again
            </button>
          ) : null}
        </p>
      </div>
    )
  }

  if (!menu) {
    return (
      <div className="px-[28px] pt-[26px] pb-10">
        <Link
          to={editPath}
          className="mb-4 inline-flex items-center gap-1 rounded-[18px] border border-[#E0E5E0] bg-white py-1.5 pr-3.5 pl-2.5 text-[12px] font-medium text-ink-muted hover:bg-[#fafbfa]"
        >
          ‹ Edit branch
        </Link>
        <p className="text-[14px] text-ink-muted">No menu items for this branch yet.</p>
      </div>
    )
  }

  function toggleNode(pathIds, field) {
    setMenu((current) =>
      updateNodeByPath(current, pathIds, (node) => {
        if (field === 'available' && node.kind === 'product') {
          if (node.lockedByCategory) return node
          return { ...node, available: !node.available }
        }
        if (field === 'visible') {
          return { ...node, visible: !node.visible }
        }
        return node
      }),
    )
    setSaveError('')
  }

  async function handleSave() {
    if (isSaving) return
    setSaveError('')
    try {
      const result = await saveMenu(menu)
      if (result?.data) setMenu(structuredClone(result.data))
      navigate(editPath)
    } catch (err) {
      setSaveError(getSaveErrorMessage(err))
    }
  }

  return (
    <div className="px-[28px] pt-[18px] pb-10">
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <Link
          to={editPath}
          className="inline-flex items-center gap-1 rounded-[18px] border border-[#E0E5E0] bg-white py-1.5 pr-3.5 pl-2.5 text-[12px] font-medium text-ink-muted hover:bg-[#fafbfa]"
        >
          ‹ Edit branch
        </Link>

        <h1 className="min-w-0 flex-1 text-[20px] font-bold tracking-[-0.02em] text-ink sm:text-[20px]">
          Branch menu · {branch.name}
        </h1>

        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving}
          className="inline-flex h-[40px] items-center justify-center rounded-full bg-[#1AA34D] px-6 text-[13px] font-medium text-white hover:brightness-[0.96] disabled:opacity-60 disabled:pointer-events-none"
        >
          {isSaving ? 'Saving…' : 'Save'}
        </button>
      </div>

      {saveError ? (
        <div className="mb-4 flex items-center gap-2.5 rounded-md bg-danger-soft px-[14px] py-3 text-[13px] text-danger">
          <span>⚠️</span>
          <span>{saveError}</span>
        </div>
      ) : null}

      <section className="mb-4 flex items-center gap-3 rounded-[12px] border border-[#E0E6E0] bg-white px-4 py-3.5">
        <img
          src={foldersIcon}
          alt=""
          className="size-8 shrink-0 object-contain"
          aria-hidden
        />
        <div className="min-w-0 flex-1">
          <h2 className="text-[14px] font-bold text-ink">
            Organize categories (Category › Subcategory › Type)
          </h2>
          <p className="text-[12.5px] leading-relaxed text-ink-muted">
            Manage the full nested structure for this branch
          </p>
        </div>
        <button
          type="button"
          className="shrink-0 text-[13px] font-medium text-[#127036] hover:underline"
        >
          Open ›
        </button>
      </section>

      <div className="flex flex-col gap-4">
        {menu.map((section) => (
          <MenuSection key={section.id} section={section} onToggle={toggleNode} />
        ))}
      </div>
    </div>
  )
}
