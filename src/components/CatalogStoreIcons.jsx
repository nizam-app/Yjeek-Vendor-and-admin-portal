import { useEffect, useState } from 'react'
import iconAll from '../assets/catalog-all.png'
import iconFood from '../assets/catalog-food.png'
import iconGroceries from '../assets/catalog-groceries.png'
import iconPharmacy from '../assets/catalog-pharmacy.png'
import iconCosmetics from '../assets/catalog-cosmetics.png'
import iconVape from '../assets/catalog-vape.png'
import iconDineIn from '../assets/catalog-dine-in.png'
import iconPickup from '../assets/catalog-pickup.png'
import iconGifts from '../assets/catalog-gifts.png'
import iconFashion from '../assets/catalog-fashion.png'
import iconElectronics from '../assets/catalog-electronics.png'
import iconJewelry from '../assets/catalog-jewelry.png'

export const catalogStoreIconSrc = {
  all: iconAll,
  food: iconFood,
  food_drink: iconFood,
  'food-drink': iconFood,
  groceries: iconGroceries,
  grocery: iconGroceries,
  pharmacy: iconPharmacy,
  cosmetics: iconCosmetics,
  vape: iconVape,
  'dine-in': iconDineIn,
  dine_in: iconDineIn,
  pickup: iconPickup,
  gifts: iconGifts,
  fashion: iconFashion,
  electronics: iconElectronics,
  jewelry: iconJewelry,
}

function normalizeIconKey(id) {
  return String(id || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
}

/**
 * Resolve a store-type slug / icon id to a known catalog key.
 * e.g. food_2, food2222, Food-Drink → food
 */
export function resolveCatalogIconKey(id) {
  const key = normalizeIconKey(id)
  if (!key) return null

  const underscored = key.replace(/-/g, '_')
  if (catalogStoreIconSrc[key]) return key
  if (catalogStoreIconSrc[underscored]) return underscored

  const candidates = Object.keys(catalogStoreIconSrc)
    .filter((name) => name !== 'all')
    .sort((a, b) => b.length - a.length)

  for (const candidate of candidates) {
    const cKey = normalizeIconKey(candidate)
    const cUnder = cKey.replace(/-/g, '_')
    if (
      key === cKey ||
      key === cUnder ||
      key.startsWith(`${cKey}-`) ||
      key.startsWith(`${cKey}_`) ||
      key.startsWith(`${cUnder}_`) ||
      key.startsWith(cKey) ||
      key.startsWith(cUnder)
    ) {
      return candidate
    }
  }

  return null
}

export function resolveCatalogIconSrc(id) {
  const resolved = resolveCatalogIconKey(id)
  if (!resolved) return null
  return catalogStoreIconSrc[resolved] || null
}

function isUsableRemoteIconUrl(url) {
  const value = String(url || '').trim()
  if (!value) return false
  return (
    /^https?:\/\//i.test(value) ||
    value.startsWith('data:image/') ||
    value.startsWith('blob:') ||
    value.startsWith('/')
  )
}

export function CatalogStoreIcon({ id, emoji, iconUrl, className = 'size-[22px]' }) {
  const [urlFailed, setUrlFailed] = useState(false)

  useEffect(() => {
    setUrlFailed(false)
  }, [iconUrl])

  const catalogSrc = resolveCatalogIconSrc(id)
  const usableUrl = isUsableRemoteIconUrl(iconUrl) ? String(iconUrl).trim() : null

  if (usableUrl && !urlFailed) {
    return (
      <img
        src={usableUrl}
        alt=""
        className={`object-contain ${className}`}
        onError={() => setUrlFailed(true)}
      />
    )
  }

  if (catalogSrc) {
    return <img src={catalogSrc} alt="" className={`object-contain ${className}`} />
  }

  if (emoji) {
    return (
      <span className={`grid place-items-center text-[20px] leading-none ${className}`} aria-hidden>
        {emoji}
      </span>
    )
  }

  return <img src={catalogStoreIconSrc.all} alt="" className={`object-contain ${className}`} />
}
