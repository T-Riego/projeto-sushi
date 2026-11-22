import { useEffect, useRef, useState } from 'react'
import {
  ArrowUpRight,
  Check,
  Menu,
  MoveUpRight,
  ShoppingBag,
  X,
} from 'lucide-react'

import { CartDrawer } from './components/cart/CartDrawer'
import { HeroShowcase } from './components/hero/HeroShowcase'
import { DigitalMenu } from './components/menu/DigitalMenu'
import { menuItems } from './data/menu'
import { useCart } from './hooks/useCart'
import { useToast } from './hooks/useToast'
import type { MenuItemId } from './types/menu'

const assetPath = (path: string) =>
  `${import.meta.env.BASE_URL}${path.replace(/^\/+/, '')}`

function FallbackArt() {
  return (
    <img
      className="fallback-art"
      src={assetPath('assets/sushi-0.png')}
      alt="Seleção de sushi AYORUME"
      width="720"
      height="600"
    />
  )
}

export default function App() {
  const [images] = useState<string[]>(
    [0, 1, 2].map((index) => assetPath(`assets/sushi-${index}.png`)),
  )
  const [cartOpen, setCartOpen] = useState(false)
  const [bagFocusRequest, setBagFocusRequest] = useState(0)
  const [navOpen, setNavOpen] = useState(false)
  const bagButtonRef = useRef<HTMLButtonElement>(null)
  const {
    lines,
    count,
    total,
    addLine,
    changeQuantity,
    removeLine,
    clearCart,
  } = useCart()
  const { message, notify } = useToast()

  const handleHeroAdd = (productId: MenuItemId) => {
    addLine(productId, [], 1)
    const product = menuItems.find(({ id }) => id === productId)
    notify(`${product?.name ?? 'Item'} adicionado à sacola.`)
    setCartOpen(true)
  }

  const closeCart = () => {
    setCartOpen(false)
    setBagFocusRequest((request) => request + 1)
  }

  useEffect(() => {
    if (bagFocusRequest === 0) {
      return
    }

    const focusTimer = window.setTimeout(() => {
      if (!document.querySelector('.checkout-dialog[open]')) {
        bagButtonRef.current?.focus({ preventScroll: true })
      }
    }, 0)

    return () => window.clearTimeout(focusTimer)
  }, [bagFocusRequest])

  const bagItemLabel = `${count} ${count === 1 ? 'item' : 'itens'}`

  return (
    <>
      <header className="site-header wrap">
        <a className="logo" href="#" aria-label="AYORUME, início">
          ayorume
        </a>
        <nav
          className={navOpen ? 'main-nav is-open' : 'main-nav'}
          aria-label="Navegação principal"
        >
          <a href="#menu" onClick={() => setNavOpen(false)}>
            O menu <ArrowUpRight size={13} />
          </a>
          <a href="#filosofia" onClick={() => setNavOpen(false)}>
            O nosso ritual
          </a>
          <a href="#experiencia" onClick={() => setNavOpen(false)}>
            A experiência
          </a>
        </nav>
        <div className="header-actions">
          <button
            ref={bagButtonRef}
            className="bag-button"
            type="button"
            aria-label={`Abrir sacola, ${bagItemLabel}`}
            onClick={() => setCartOpen(true)}
          >
            <ShoppingBag size={19} />
            <span className="bag-count">{count.toString().padStart(2, '0')}</span>
          </button>
          <a href="#menu" className="button button-small">
            Fazer pedido <ArrowUpRight size={16} />
          </a>
          <button
            className="mobile-toggle"
            type="button"
            aria-label={navOpen ? 'Fechar navegação' : 'Abrir navegação'}
            aria-expanded={navOpen}
            onClick={() => setNavOpen(!navOpen)}
          >
            {navOpen ? <X /> : <Menu />}
          </button>
        </div>
      </header>

      <main>
        <HeroShowcase onAddProduct={handleHeroAdd} />

        <div className="ritual-strip" aria-hidden="true">
          <span>CORTE PRECISO</span>
          <span className="strip-flower">✳</span>
          <span>SABOR QUE FICA</span>
          <span className="strip-flower">✳</span>
          <span>FEITO NO SEU TEMPO</span>
          <span className="strip-flower">✳</span>
          <span>ESSÊNCIA JAPONESA</span>
          <span className="strip-flower">✳</span>
          <span>SEM PRESSA. COM ALMA.</span>
        </div>

        <DigitalMenu onAddLine={addLine} onNotify={notify} />

        <section id="filosofia" className="philosophy">
          <div className="philosophy-inner wrap">
            <div className="philosophy-art">
              <span className="philosophy-monogram" aria-hidden="true">
                A
              </span>
              <div className="art-circle" />
              {images[2] ? (
                <img
                  src={images[2]}
                  alt="Seleção de sushi AYORUME, vista em perspectiva"
                  width="720"
                  height="600"
                  loading="lazy"
                />
              ) : (
                <FallbackArt />
              )}
              <span className="art-note">
                FEITO COM ALMA
                <br />
                <small>DE CORAÇÃO, PARA A MESA.</small>
              </span>
            </div>
            <div className="philosophy-copy">
              <div className="eyebrow">02 — O NOSSO RITUAL</div>
              <h2>
                O essencial
                <br />
                se sente.
                <br />
                <em>Não se explica.</em>
              </h2>
              <p>
                Na AYORUME, imaginamos a mesa como um ponto de encontro. Entre o
                cuidado japonês e a liberdade de criar. Entre quem prepara e quem
                prova.
              </p>
              <p>
                Um bom sushi pede presença. Por isso, nosso convite é simples:
                escolha seu prato, encontre sua companhia e aproveite cada pedaço.
              </p>
              <a className="light-link" href="#menu">
                Encontre o seu ritual <ArrowUpRight size={19} />
              </a>
            </div>
          </div>
        </section>

        <section id="experiencia" className="experience wrap">
          <div>
            <div className="eyebrow">03 — RESERVE UM MOMENTO PARA O SABOR</div>
            <h2>
              Sua próxima pausa
              <br />
              merece <em>AYORUME.</em>
            </h2>
          </div>
          <a href="#menu" className="button">
            Vamos escolher? <MoveUpRight size={22} />
          </a>
          <span className="experience-mark" aria-hidden="true">
            À MESA.
          </span>
        </section>
      </main>

      <footer className="site-footer wrap">
        <a href="#" className="logo" aria-label="AYORUME, voltar ao início">
          ayorume
        </a>
        <span>Pequenos rituais. Grandes sabores.</span>
        <a href="#menu">
          O menu <ArrowUpRight size={14} />
        </a>
        <a href={assetPath('creditos-fotograficos.html')}>Créditos das fotos</a>
        <small>Projeto conceito · Restaurante e menu ilustrativos</small>
      </footer>

      <CartDrawer
        open={cartOpen}
        lines={lines}
        count={count}
        total={total}
        onClose={closeCart}
        onChangeQuantity={changeQuantity}
        onRemoveLine={removeLine}
        onClearCart={clearCart}
        onNotify={notify}
      />

      <div
        className={`toast ${message ? 'visible' : ''}`}
        role="status"
        aria-live="polite"
      >
        {message ? (
          <>
            <Check size={16} />
            {message}
          </>
        ) : null}
      </div>
    </>
  )
}
