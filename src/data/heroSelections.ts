import type { MenuItemId, SceneIndex } from '../types/menu'

export interface HeroSelection {
  readonly productId: MenuItemId
  readonly sceneIndex: SceneIndex
  readonly poster: string
}

export const heroSelections: readonly HeroSelection[] = [
  {
    productId: 'box-signature',
    sceneIndex: 0,
    poster: 'assets/sushi-0.png',
  },
  {
    productId: 'garden-box',
    sceneIndex: 1,
    poster: 'assets/sushi-1.png',
  },
  {
    productId: 'salmao-box',
    sceneIndex: 2,
    poster: 'assets/sushi-2.png',
  },
] as const satisfies readonly HeroSelection[]
