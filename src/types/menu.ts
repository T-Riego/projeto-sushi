export type SceneIndex = 0 | 1 | 2

export type DietaryTag = 'vegetariano' | 'sem-cru' | 'cru' | 'picante'

export type Allergen =
  | 'gluten'
  | 'crustaceos'
  | 'peixe'
  | 'soja'
  | 'gergelim'
  | 'leite'
  | 'castanhas'

export type MenuCategoryId =
  | 'entradas'
  | 'niguiris-sashimis'
  | 'rolls'
  | 'combinados'
  | 'sobremesas'
  | 'bebidas'

export interface ProductOption {
  id: string
  label: string
  priceDelta: number
}

export interface ProductOptionGroup {
  id: string
  label: string
  selection: 'single' | 'multiple'
  required?: boolean
  options: ProductOption[]
}

export interface MenuItem {
  id: string
  name: string
  categoryId: MenuCategoryId
  description: string
  ingredients: string[]
  portionLabel: string
  price: number
  image: string
  alt: string
  tags: DietaryTag[]
  allergens: Allergen[]
  available: boolean
  badge?: string
  featured?: boolean
  optionGroups?: ProductOptionGroup[]
}

export interface MenuCategory {
  id: MenuCategoryId
  label: string
  description: string
}

export interface CartLine {
  key: string
  productId: string
  quantity: number
  optionIds: string[]
}
