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
  groceries: iconGroceries,
  pharmacy: iconPharmacy,
  cosmetics: iconCosmetics,
  vape: iconVape,
  'dine-in': iconDineIn,
  pickup: iconPickup,
  gifts: iconGifts,
  fashion: iconFashion,
  electronics: iconElectronics,
  jewelry: iconJewelry,
}

export function CatalogStoreIcon({ id, className = 'size-[22px]' }) {
  const src = catalogStoreIconSrc[id] || catalogStoreIconSrc.all
  return <img src={src} alt="" className={`object-contain ${className}`} width={22} height={22} />
}
