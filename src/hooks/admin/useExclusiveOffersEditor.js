import { useCallback, useEffect, useRef, useState } from 'react'
import { useAdminUiEditorExclusiveOffers } from './useAdminUiEditor'
import { adminUiEditorService } from '../../services/admin/uiEditorService'

const DEFAULT_SECTION = {
  title: 'Super Exclusive offers',
  titleAr: '',
  isVisible: true,
}

export function useExclusiveOffersEditor({ onMessage } = {}) {
  const {
    section: apiSection,
    summary: apiSummary,
    items: apiItems,
    isLoading,
    error,
    refetch,
    enabled,
  } = useAdminUiEditorExclusiveOffers()

  const [section, setSection] = useState(DEFAULT_SECTION)
  const [items, setItems] = useState([])
  const itemsRef = useRef(items)
  const [dragIndex, setDragIndex] = useState(null)
  const [busy, setBusy] = useState(false)
  const [localError, setLocalError] = useState(null)
  const sectionSaveTimer = useRef(null)
  const fieldSaveTimers = useRef({})

  useEffect(() => {
    itemsRef.current = items
  }, [items])

  useEffect(() => {
    if (!enabled) return
    setSection({
      title: apiSection.title || DEFAULT_SECTION.title,
      titleAr: apiSection.titleAr || '',
      isVisible: apiSection.isVisible !== false,
    })
    setItems(apiItems)
  }, [apiSection, apiItems, enabled])

  const summary = apiSummary || {
    itemCount: items.length,
    visibleCount: items.filter((item) => item.isVisible).length,
    liveOnCustomerCount: items.filter((item) => item.liveOnCustomer).length,
    unpublishedChanges: false,
  }

  const persistSection = async (patch) => {
    if (!enabled) return
    setLocalError(null)
    try {
      await adminUiEditorService.updateExclusiveOffersSection(patch)
      await refetch()
    } catch (err) {
      setLocalError(err)
    }
  }

  const scheduleSectionSave = (nextSection) => {
    if (!enabled) return
    if (sectionSaveTimer.current) clearTimeout(sectionSaveTimer.current)
    sectionSaveTimer.current = setTimeout(() => {
      persistSection({
        title: nextSection.title,
        titleAr: nextSection.titleAr,
        isVisible: nextSection.isVisible,
      })
    }, 500)
  }

  const handleSectionChange = useCallback((patch) => {
    setSection((prev) => {
      const next = { ...prev, ...patch }
      scheduleSectionSave(next)
      return next
    })
  }, [enabled])

  const handleSectionToggle = useCallback(
    (isVisible) => {
      handleSectionChange({ isVisible })
      onMessage?.(
        isVisible
          ? 'Section will show on customer home after publish.'
          : 'Section hidden from customer home after publish.',
      )
    },
    [handleSectionChange, onMessage],
  )

  const handleAddProducts = useCallback(
    async ({ productIds }) => {
      setBusy(true)
      setLocalError(null)
      try {
        await adminUiEditorService.addExclusiveOfferItems({ productIds })
        await refetch()
        onMessage?.('Products added to Super Exclusive offers.')
      } catch (err) {
        setLocalError(err)
        throw err
      } finally {
        setBusy(false)
      }
    },
    [enabled, onMessage, refetch],
  )

  const patchItem = useCallback(
    async (itemId, patch) => {
      if (!enabled) return
      setLocalError(null)
      try {
        await adminUiEditorService.patchExclusiveOfferItem(itemId, patch)
        await refetch()
      } catch (err) {
        setLocalError(err)
        await refetch()
      }
    },
    [enabled, refetch],
  )

  const scheduleItemSave = useCallback(
    (item, patch) => {
      setItems((prev) => prev.map((row) => (row.id === item.id ? { ...row, ...patch } : row)))
      if (!enabled) return
      if (fieldSaveTimers.current[item.id]) clearTimeout(fieldSaveTimers.current[item.id])
      fieldSaveTimers.current[item.id] = setTimeout(() => {
        patchItem(item.id, patch)
      }, 450)
    },
    [enabled, patchItem],
  )

  const handleToggleVisible = useCallback(
    async (item) => {
      const nextVisible = !item.isVisible
      setItems((prev) =>
        prev.map((row) => (row.id === item.id ? { ...row, isVisible: nextVisible } : row)),
      )
      await patchItem(item.id, { isVisible: nextVisible })
    },
    [patchItem],
  )

  const handlePriceChange = useCallback(
    (item, patch) => {
      scheduleItemSave(item, patch)
    },
    [scheduleItemSave],
  )

  const handleTitleChange = useCallback(
    (item, title) => {
      scheduleItemSave(item, { title })
    },
    [scheduleItemSave],
  )

  const handleImageChange = useCallback(
    async (item, imageUrl) => {
      setItems((prev) => prev.map((row) => (row.id === item.id ? { ...row, imageUrl } : row)))
      await patchItem(item.id, { imageUrl })
    },
    [patchItem],
  )

  const handleRemove = useCallback(
    async (item) => {
      if (!window.confirm(`Remove “${item.title}” from Super Exclusive offers?`)) return
      if (!enabled) {
        setItems((prev) => prev.filter((row) => row.id !== item.id))
        return
      }
      setBusy(true)
      setLocalError(null)
      try {
        await adminUiEditorService.deleteExclusiveOfferItem(item.id)
        await refetch()
        onMessage?.('Product removed.')
      } catch (err) {
        setLocalError(err)
      } finally {
        setBusy(false)
      }
    },
    [enabled, onMessage, refetch],
  )

  const onDragStart = useCallback((index) => setDragIndex(index), [])

  const onDragOver = useCallback(
    (event, index) => {
      event.preventDefault()
      if (dragIndex === null || dragIndex === index) return
      setItems((prev) => {
        const next = [...prev]
        const [moved] = next.splice(dragIndex, 1)
        next.splice(index, 0, moved)
        const ordered = next.map((row, sortOrder) => ({ ...row, sortOrder }))
        itemsRef.current = ordered
        return ordered
      })
      setDragIndex(index)
    },
    [dragIndex],
  )

  const onDragEnd = useCallback(async () => {
    setDragIndex(null)
    if (!enabled) return
    setLocalError(null)
    const ordered = itemsRef.current.map((row, sortOrder) => ({ ...row, sortOrder }))
    setItems(ordered)
    try {
      await adminUiEditorService.reorderExclusiveOfferItems(ordered)
      await refetch()
      onMessage?.('Serial order updated.')
    } catch (err) {
      setLocalError(err)
      await refetch()
    }
  }, [enabled, onMessage, refetch])

  return {
    section,
    items,
    summary,
    dragIndex,
    busy,
    isLoading,
    error: localError || error,
    enabled,
    refetch,
    handleSectionChange,
    handleSectionToggle,
    handleAddProducts,
    handleToggleVisible,
    handlePriceChange,
    handleTitleChange,
    handleImageChange,
    handleRemove,
    onDragStart,
    onDragOver,
    onDragEnd,
    setLocalError,
  }
}
