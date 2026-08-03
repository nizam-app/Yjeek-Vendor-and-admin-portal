import productBurger from '../assets/product-burger.png'
import productPizza from '../assets/product-pizza.png'
import productSalad from '../assets/product-salad.png'
import productDrink from '../assets/product-drink.png'
import productCake from '../assets/product-cake.png'
import { resolveAdminMediaUrl } from '../mappers/admin/mapAdminUpload'

/** Food product photos from src/assets */
export const productImages = {
  'classic-burger': productBurger,
  'margherita-pizza': productPizza,
  'caesar-salad': productSalad,
  'orange-juice': productDrink,
  'chocolate-cake': productCake,
}

export function getProductImage(product) {
  if (!product) return productBurger
  const remote =
    product.imageUrl ||
    (Array.isArray(product.imageUrls) ? product.imageUrls.find(Boolean) : null) ||
    product.image ||
    null
  if (remote) return resolveAdminMediaUrl(remote) || remote
  // Local demo asset ids only; real API products without a URL use the default placeholder.
  return productImages[product.id] || productBurger
}
