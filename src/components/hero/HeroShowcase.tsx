import {
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useState,
} from 'react'
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  ChevronDown,
  Fish,
  MousePointer2,
  Rotate3D,
  UtensilsCrossed,
} from 'lucide-react'

import { heroSelections } from '../../data/heroSelections'
import { menuItems } from '../../data/menu'
import type { MenuItemId } from '../../types/menu'

const SushiScene = lazy(() => import('../../SushiScene'))

const assetPath = (path: string) =>
  `${import.meta.env.BASE_URL}${path.replace(/^\/+/, '')}`

const money = (value: number) =>
  new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 2,
  }).format(value)

const menuItemsById = new Map(
  menuItems.map((item) => [item.id, item] as const),
)

const heroLegends: Readonly<Partial<Record<MenuItemId, string>>> = {
  'box-signature': 'Seu ritual, completo',
  'garden-box': 'Leve por natureza',
  'salmao-box': 'O clássico, elevado',
}

type HeroShowcaseProps = {
  onAddProduct: (productId: MenuItemId) => void
}

export function HeroShowcase({ onAddProduct }: HeroShowcaseProps) {
  const [selectedHero, setSelectedHero] = useState(0)
  const [exploded, setExploded] = useState(false)
  const [failed, setFailed] = useState(false)
  const [sceneReady, setSceneReady] = useState(false)
  const [startScene, setStartScene] = useState(false)

  useEffect(() => {
    let afterPaint = 0
    const firstFrame = requestAnimationFrame(() => {
      afterPaint = requestAnimationFrame(() => setStartScene(true))
    })

    return () => {
      cancelAnimationFrame(firstFrame)
      cancelAnimationFrame(afterPaint)
    }
  }, [])

  const select = (index: number) => {
    setSelectedHero(index)
    setExploded(false)
  }
  const onReady = useCallback(() => setSceneReady(true), [])
  const onFail = useCallback(() => setFailed(true), [])

  const selection = heroSelections[selectedHero]
  const product = menuItemsById.get(selection.productId)

  if (!product) {
    throw new Error(`Hero product not found: ${selection.productId}`)
  }

  const legend = heroLegends[selection.productId] ?? product.description

  return (
    <section className="hero wrap" aria-labelledby="hero-title">
      <div className="hero-copy"><h1 id="hero-title"><span>Pequenos rituais.</span> <span>Grandes <em>sabores.</em></span></h1><p>O cuidado em cada corte. A surpresa em cada encontro.<br className="desktop-break"/> Descubra um novo jeito de sentir a cozinha japonesa.</p><div className="hero-ctas"><a href="#menu" className="button">Explorar o menu <ArrowUpRight size={19}/></a><button className="text-button" onClick={() => onAddProduct(selection.productId)}>Quero experimentar <ArrowRight size={16}/></button></div><div className="hero-principles"><span><Fish size={17} strokeWidth={1.4}/> Ingredientes selecionados</span><i/><span><UtensilsCrossed size={16} strokeWidth={1.4}/> Feito à mão</span></div></div>
      <div className="hero-visual">
        <div className="visual-topline"><span>UM CONVITE AOS SENTIDOS</span><span>SUSHI AUTORAL</span></div>
        <div className="sun-disc"/><div className="disc-ring"/><span className="vertical-note" aria-hidden="true">SABOR<br/>PRESENÇA</span>
        <div className="craft-seal" aria-hidden="true"><span>FEI<br/>TO</span><small>COM<br/>ALMA</small></div>
        <div className="scene-shell" data-ready={sceneReady && !failed}>
          {failed?<img className="scene-poster" src={assetPath(selection.poster)} width="720" height="600" alt="Seleção de sushi AYORUME"/>:<div className="scene-poster scene-poster-placeholder" aria-hidden="true"><div className="poster-box"><span>ayorume</span><i/></div></div>}
          {startScene && !failed && <Suspense fallback={null}><SushiScene selected={selection.sceneIndex} exploded={exploded} onReady={onReady} onFail={onFail} onTap={() => setExploded((value) => !value)}/></Suspense>}
        </div>
        <div className="plate-caption" aria-live="polite"><span className="caption-line"/><div><span className="eyebrow">{legend}</span><strong>{product.name}</strong><small>{product.portionLabel} <span>·</span> {money(product.price)}</small></div></div>
        <div className="scene-toolbar"><span><MousePointer2 size={14}/>{failed?'Explore nossos sabores':'Passe sobre as peças · arraste para girar'}</span><button className={exploded?'view-button active':'view-button'} disabled={failed} onClick={() => setExploded(!exploded)} aria-pressed={exploded}><Rotate3D size={16}/>{exploded?'Acomodar peças':'Levantar todas'}</button></div>
      </div>
      <div className="hero-bottom"><a href="#menu" className="discover-link"><span className="circle-arrow"><ChevronDown size={16}/></span>SEU PRÓXIMO FAVORITO ESTÁ AQUI</a><div className="plate-picker" aria-label="Escolher prato em destaque"><div className="picker-options">{heroSelections.map((heroSelection, index) => {
        const heroProduct = menuItemsById.get(heroSelection.productId)

        if (!heroProduct) {
          throw new Error(`Hero product not found: ${heroSelection.productId}`)
        }

        return <button className={`picker ${index===selectedHero?'selected':''}`} onClick={() => select(index)} key={heroSelection.productId} aria-pressed={index===selectedHero}><span className="picker-number">0{index+1}</span><span>{heroProduct.name}</span><span className="picker-indicator"/></button>
      })}</div><div className="picker-arrows"><button aria-label="Prato anterior" onClick={() => select((selectedHero+heroSelections.length-1)%heroSelections.length)}><ArrowLeft size={17}/></button><button aria-label="Próximo prato" onClick={() => select((selectedHero+1)%heroSelections.length)}><ArrowRight size={17}/></button></div></div></div>
    </section>
  )
}
