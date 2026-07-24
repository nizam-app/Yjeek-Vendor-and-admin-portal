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

export function CatalogStoreIcon({ id, emoji, iconUrl, className = 'size-[22px]' }) {
  if (iconUrl) {
    return <img src={iconUrl} alt="" className={`object-contain ${className}`} />
  }

  const key = normalizeIconKey(id)
  const underscored = key.replace(/-/g, '_')
  const src = catalogStoreIconSrc[key] || catalogStoreIconSrc[underscored]

  if (src) {
    return <img src={src} alt="" className={`object-contain ${className}`} />
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
