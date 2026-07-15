import productBurger from '../assets/product-burger.png'
import productPizza from '../assets/product-pizza.png'
import productSalad from '../assets/product-salad.png'
import productDrink from '../assets/product-drink.png'
import productCake from '../assets/product-cake.png'

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
  return productImages[product.id] || productBurger
}
