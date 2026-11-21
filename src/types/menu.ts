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

export type MenuItemId =
  | 'sunomono-ayorume'
  | 'edamame-citrico'
  | 'guioza-legumes'
  | 'tataki-salmao'
  | 'dupla-salmao'
  | 'dupla-atum'
  | 'dupla-camarao'
  | 'sashimi-chef'
  | 'roll-ayorume'
  | 'salmao-cebolinha'
  | 'atum-picante'
  | 'camarao-crocante'
  | 'garden-roll'
  | 'box-signature'
  | 'garden-box'
  | 'salmao-box'
  | 'garden-para-dois'
  | 'experiencia-ayorume'
  | 'trio-mochi'
  | 'chocolate-gergelim-caramelo'
  | 'cheesecake-yuzu'
  | 'cha-citrico'
  | 'soda-frutas-amarelas'
  | 'horizonte-tonica'

export interface ProductOption {
  readonly id: string
  readonly label: string
  readonly priceDelta: number
}

export interface ProductOptionGroup {
  readonly id: string
  readonly label: string
  readonly selection: 'single' | 'multiple'
  readonly required?: boolean
  readonly options: readonly ProductOption[]
}

export interface MenuItem {
  readonly id: MenuItemId
  readonly name: string
  readonly categoryId: MenuCategoryId
  readonly description: string
  readonly ingredients: readonly string[]
  readonly portionLabel: string
  readonly price: number
  readonly image: string
  readonly alt: string
  readonly tags: readonly DietaryTag[]
  readonly allergens: readonly Allergen[]
  readonly available: boolean
  readonly badge?: string
  readonly featured?: boolean
  readonly optionGroups?: readonly ProductOptionGroup[]
}

export interface MenuCategory {
  readonly id: MenuCategoryId
  readonly label: string
  readonly description: string
}

export interface CartLine {
  key: string
  productId: MenuItemId
  quantity: number
  optionIds: readonly string[]
}
