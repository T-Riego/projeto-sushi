# AYORUME Digital Menu Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transformar o catálogo conceitual da AYORUME em um cardápio digital de 24 produtos com busca, filtros, detalhes, sacola estável, checkout e reserva demonstrativos, preservando integralmente a caixa 3D.

**Architecture:** O catálogo e a unidade fictícia serão dados tipados com IDs permanentes; a cena 3D receberá somente o índice explícito `0 | 1 | 2`, resolvido por `heroSelections`. Funções puras cuidarão de filtros, carrinho e validações, enquanto componentes React focados cuidarão de catálogo, painéis, checkout e reserva. Nenhum fluxo enviará dados para rede.

**Tech Stack:** React 19, TypeScript 5.7, Vite 6, CSS global segmentado, Vitest 5, Testing Library, jsdom, Three.js existente.

---

## Estrutura de arquivos

Criar:

- `vitest.config.ts` — ambiente e setup dos testes.
- `src/test/setup.ts` — polyfills de diálogo, mídia e scroll.
- `src/types/menu.ts` — contratos de catálogo, opções e sacola.
- `src/types/flows.ts` — contratos de checkout e reserva.
- `src/data/menu.ts` — 24 produtos e seis categorias.
- `src/data/heroSelections.ts` — mapeamento imutável produto/cena/poster.
- `src/data/restaurant.ts` — unidade fictícia e parâmetros operacionais.
- `src/lib/menuFilters.ts` — busca e filtros puros.
- `src/lib/cart.ts` — leitura, escrita, linhas e totais da sacola.
- `src/lib/flowValidation.ts` — validação pura de checkout e reserva.
- `src/hooks/useCart.ts` — estado e persistência `ayorume-cart-v2`.
- `src/hooks/useToast.ts` — feedback temporizado.
- `src/components/hero/HeroShowcase.tsx` — hero existente, desacoplado do catálogo.
- `src/components/menu/DigitalMenu.tsx` — composição do cardápio.
- `src/components/menu/MenuFilters.tsx` — busca, categorias e preferências.
- `src/components/menu/MenuCard.tsx` — resumo do produto.
- `src/components/menu/ProductDetails.tsx` — detalhes, opções e quantidade.
- `src/components/cart/CartDrawer.tsx` — sacola e entrada do checkout.
- `src/components/checkout/CheckoutDemo.tsx` — fluxo de pedido simulado.
- `src/components/reservation/ReservationDemo.tsx` — reserva simulada.
- `src/components/site/LocationSection.tsx` — unidade e horários fictícios.
- `src/components/site/MobileActionBar.tsx` — ações móveis fixas.
- `src/components/site/DemoNotice.tsx` — aviso reutilizável.
- `src/styles/catalog.css` — cardápio e detalhes.
- `src/styles/flows.css` — sacola, checkout, reserva, localização e barra móvel.

Modificar:

- `package.json`, `package-lock.json`, `tsconfig.json` — testes.
- `src/App.tsx` — composição e abertura dos fluxos.
- `src/main.tsx` — importar os novos estilos.
- `src/style.css` — somente ajustes de integração; não alterar seletores da caixa 3D.
- `public/creditos-fotograficos.html` — registrar os novos ativos gerados.
- `README.md` — documentar o fluxo demonstrativo.

Preservar sem alterações visuais ou geométricas:

- `src/SushiScene.tsx`
- `src/foodModels.ts`
- `src/takeoutBox.ts`
- `src/rollGeometry.ts`
- `public/assets/ingredients/**`

---

### Task 1: Configurar testes e criar o domínio do catálogo

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`
- Modify: `tsconfig.json`
- Create: `vitest.config.ts`
- Create: `src/test/setup.ts`
- Create: `src/types/menu.ts`
- Create: `src/types/flows.ts`
- Create: `src/data/menu.test.ts`
- Create: `src/data/menu.ts`
- Create: `src/data/heroSelections.ts`
- Create: `src/data/restaurant.ts`

- [ ] **Step 1: Instalar o runner e o ambiente DOM**

Run:

```powershell
npm install --save-dev vitest@^5.1.1 jsdom@29.1.1 @testing-library/react@^16.3.3 @testing-library/dom@^10.4.2 @testing-library/jest-dom@^8.0.0 @testing-library/user-event@^14.6.13 @types/node@^24.0.0
```

Adicionar scripts `"test": "vitest run"` e `"test:watch": "vitest"`. Configurar `vitest.config.ts` com `environment: 'jsdom'`, `setupFiles: ['./src/test/setup.ts']`, `clearMocks: true` e `restoreMocks: true`. Incluir `vitest.config.ts` no `tsconfig.json`.

- [ ] **Step 2: Criar o teste de catálogo antes dos dados**

```ts
import { describe, expect, it } from 'vitest'
import { heroSelections } from './heroSelections'
import { menuCategories, menuItems } from './menu'

describe('AYORUME menu data', () => {
  it('contains 24 products across the six approved categories', () => {
    expect(menuItems).toHaveLength(24)
    expect(menuCategories.map((category) => category.id)).toEqual([
      'entradas', 'niguiris-sashimis', 'rolls', 'combinados', 'sobremesas', 'bebidas',
    ])
    expect(new Set(menuItems.map((item) => item.id)).size).toBe(24)
  })

  it('maps the original hero products to the original scene variants', () => {
    expect(heroSelections).toEqual([
      { productId: 'box-signature', sceneIndex: 0, poster: 'assets/sushi-0.png' },
      { productId: 'garden-box', sceneIndex: 1, poster: 'assets/sushi-1.png' },
      { productId: 'salmao-box', sceneIndex: 2, poster: 'assets/sushi-2.png' },
    ])
  })

  it('provides complete commercial information for every product', () => {
    for (const item of menuItems) {
      expect(item.description.length).toBeGreaterThan(20)
      expect(item.ingredients.length).toBeGreaterThan(0)
      expect(item.portionLabel.length).toBeGreaterThan(0)
      expect(item.price).toBeGreaterThan(0)
      expect(item.image).toMatch(/^assets\/menu\//)
      expect(item.alt.length).toBeGreaterThan(10)
    }
  })
})
```

- [ ] **Step 3: Executar o teste e confirmar RED**

Run: `npm test -- src/data/menu.test.ts`  
Expected: FAIL porque `menu`, `heroSelections` e os tipos ainda não existem.

- [ ] **Step 4: Implementar tipos e dados mínimos para GREEN**

Tipos obrigatórios:

```ts
export type SceneIndex = 0 | 1 | 2
export type DietaryTag = 'vegetariano' | 'sem-cru' | 'cru' | 'picante'
export type Allergen = 'gluten' | 'crustaceos' | 'peixe' | 'soja' | 'gergelim' | 'leite' | 'castanhas'
export type ProductOption = { id: string; label: string; priceDelta: number }
export type ProductOptionGroup = { id: string; label: string; required?: boolean; options: ProductOption[] }
export type MenuItem = {
  id: string; name: string; categoryId: string; description: string; price: number;
  image: string; alt: string; portionLabel: string; ingredients: string[];
  tags: DietaryTag[]; allergens: Allergen[]; badge?: string; featured?: boolean;
  available: boolean; optionGroups?: ProductOptionGroup[];
}
export type MenuCategory = { id: string; label: string }
export type CartLine = { key: string; productId: string; quantity: number; optionIds: string[] }
```

Criar os 24 IDs e preços exatamente nesta ordem:

```text
sunomono-ayorume 26; edamame-citrico 28; guioza-legumes 34; tataki-salmao 46;
dupla-salmao 18; dupla-atum 24; dupla-camarao 26; sashimi-chef 68;
roll-ayorume 52; salmao-cebolinha 44; atum-picante 48; camarao-crocante 54; garden-roll 42;
box-signature 128; garden-box 84; salmao-box 98; garden-para-dois 72; experiencia-ayorume 118;
trio-mochi 32; chocolate-gergelim-caramelo 36; cheesecake-yuzu 34;
cha-citrico 16; soda-frutas-amarelas 22; horizonte-tonica 26.
```

Usar as seis imagens existentes para os seis produtos antigos e caminhos locais individuais para os 18 novos. Adicionar as opções aprovadas: extras de shoyu/gengibre/wasabi para rolls e combinados; intensidade suave/tradicional para `atum-picante`; gelo/sem gelo nas bebidas.

Em `restaurant.ts`, exportar endereço fictício, bairros, horários, fuso e janela:

```ts
export const restaurant = {
  name: 'AYORUME Savassi',
  address: 'Alameda do Horizonte, 118 — Savassi, Belo Horizonte — MG',
  fictional: true,
  timezone: 'America/Sao_Paulo',
  deliveryNeighborhoods: ['Savassi', 'Funcionários', 'Lourdes', 'Santo Agostinho', 'Serra', 'Anchieta', 'Sion'],
  reservationWindowDays: 30,
  maxPartySize: 8,
} as const
```

- [ ] **Step 5: Executar testes e build**

Run: `npm test -- src/data/menu.test.ts`  
Expected: 3 tests PASS.

Run: `npm run build`  
Expected: exit 0.

- [ ] **Step 6: Commit**

```powershell
git add package.json package-lock.json tsconfig.json vitest.config.ts src/test src/types src/data
git commit -m "feat: define AYORUME menu domain"
```

---

### Task 2: Implementar filtros e sacola estável

**Files:**
- Create: `src/lib/menuFilters.test.ts`
- Create: `src/lib/menuFilters.ts`
- Create: `src/lib/cart.test.ts`
- Create: `src/lib/cart.ts`
- Create: `src/hooks/useCart.ts`
- Create: `src/hooks/useToast.ts`

- [ ] **Step 1: Escrever testes RED para filtros**

```ts
import { describe, expect, it } from 'vitest'
import { menuItems } from '../data/menu'
import { filterMenuItems } from './menuFilters'

describe('filterMenuItems', () => {
  it('normalizes accents in search', () => {
    expect(filterMenuItems(menuItems, { query: 'salmao', categoryId: 'todos', tags: [], avoidAllergens: [] })
      .some((item) => item.id === 'dupla-salmao')).toBe(true)
  })
  it('combines category, dietary preferences and avoided allergens', () => {
    const result = filterMenuItems(menuItems, {
      query: '', categoryId: 'rolls', tags: ['vegetariano'], avoidAllergens: ['crustaceos'],
    })
    expect(result.map((item) => item.id)).toEqual(['garden-roll'])
  })
})
```

- [ ] **Step 2: Escrever testes RED para carrinho e migração**

```ts
import { describe, expect, it } from 'vitest'
import { createCartLine, getCartTotal, readCart } from './cart'
import { menuItems } from '../data/menu'

describe('cart', () => {
  it('uses product and sorted options to create a stable line key', () => {
    expect(createCartLine('atum-picante', ['picante-tradicional', 'wasabi-extra'], 1).key)
      .toBe('atum-picante::picante-tradicional|wasabi-extra')
  })
  it('discards the index-based v1 state', () => {
    localStorage.setItem('ayorume-cart-v1', JSON.stringify({ 0: 2 }))
    expect(readCart()).toEqual([])
    expect(localStorage.getItem('ayorume-cart-v1')).toBeNull()
  })
  it('totals products, options and quantities', () => {
    const lines = [createCartLine('box-signature', ['shoyu-extra'], 2)]
    expect(getCartTotal(lines, menuItems)).toBe((128 + 3) * 2)
  })
})
```

- [ ] **Step 3: Executar e confirmar RED**

Run: `npm test -- src/lib/menuFilters.test.ts src/lib/cart.test.ts`  
Expected: FAIL por módulos ausentes.

- [ ] **Step 4: Implementar funções puras e hooks**

`filterMenuItems` deve normalizar acentos, buscar em nome/descrição/ingredientes, aplicar categoria, exigir todos os marcadores selecionados e excluir qualquer produto que contenha alergênico evitado.

`cart.ts` deve exportar:

```ts
export const CART_STORAGE_KEY = 'ayorume-cart-v2'
export function createCartLine(productId: string, optionIds: string[], quantity = 1): CartLine
export function readCart(storage?: Storage): CartLine[]
export function writeCart(lines: CartLine[], storage?: Storage): void
export function getLineUnitPrice(line: CartLine, items: MenuItem[]): number
export function getCartTotal(lines: CartLine[], items: MenuItem[]): number
```

`useCart` deve expor `lines`, `count`, `total`, `addLine`, `changeQuantity`, `removeLine`, `clearCart` e persistir somente `CartLine[]`. `useToast` deve expor `message` e `notify` com limpeza do timer no unmount.

- [ ] **Step 5: Executar testes**

Run: `npm test -- src/lib/menuFilters.test.ts src/lib/cart.test.ts`  
Expected: 5 tests PASS.

- [ ] **Step 6: Commit**

```powershell
git add src/lib src/hooks
git commit -m "feat: add menu filtering and stable cart"
```

---

### Task 3: Desacoplar o hero sem alterar a caixa 3D

**Files:**
- Create: `src/components/hero/HeroShowcase.test.tsx`
- Create: `src/components/hero/HeroShowcase.tsx`
- Modify: `src/App.tsx`

- [ ] **Step 1: Criar teste RED do contrato do hero**

Mockar `SushiScene` como um elemento que imprime `data-scene={selected}`. Renderizar `HeroShowcase` com `onAddProduct` e validar:

```ts
expect(screen.getByText('Box Signature')).toBeInTheDocument()
await user.click(screen.getByRole('button', { name: /Garden Box/i }))
expect(screen.getByTestId('sushi-scene')).toHaveAttribute('data-scene', '1')
await user.click(screen.getByRole('button', { name: /Quero experimentar/i }))
expect(onAddProduct).toHaveBeenCalledWith('garden-box')
```

- [ ] **Step 2: Executar e confirmar RED**

Run: `npm test -- src/components/hero/HeroShowcase.test.tsx`  
Expected: FAIL porque o componente ainda não existe.

- [ ] **Step 3: Extrair o markup atual sem mudar seletores**

Mover para `HeroShowcase.tsx` o conteúdo atual de `<section className="hero wrap">`. Manter classes, textos, Lazy/Suspense, fallback, `exploded`, `sceneReady`, `startScene`, teclado e posters. Trocar somente a fonte de produto:

```ts
const selection = heroSelections[selectedHero]
const product = menuById[selection.productId]
<SushiScene selected={selection.sceneIndex} exploded={exploded} onReady={onReady} onFail={onFail} onTap={() => setExploded((value) => !value)} />
```

O CTA chama `onAddProduct(selection.productId)`. Setas usam `heroSelections.length`. Não modificar `SushiScene.tsx`, `foodModels.ts`, `takeoutBox.ts` ou os seletores hero/scene em `style.css`.

- [ ] **Step 4: Executar teste, suíte e build**

Run: `npm test -- src/components/hero/HeroShowcase.test.tsx`  
Expected: PASS.

Run: `npm test`  
Expected: todos PASS.

Run: `npm run build`  
Expected: exit 0; chunk 3D continua separado.

- [ ] **Step 5: Commit**

```powershell
git add src/App.tsx src/components/hero
git commit -m "refactor: decouple hero from menu order"
```

---

### Task 4: Construir cardápio, filtros e detalhes do produto

**Files:**
- Create: `src/components/menu/DigitalMenu.test.tsx`
- Create: `src/components/menu/DigitalMenu.tsx`
- Create: `src/components/menu/MenuFilters.tsx`
- Create: `src/components/menu/MenuCard.tsx`
- Create: `src/components/menu/ProductDetails.tsx`
- Create: `src/styles/catalog.css`
- Modify: `src/main.tsx`
- Modify: `src/App.tsx`

- [ ] **Step 1: Criar testes RED do fluxo do catálogo**

Cobrir três comportamentos reais:

```ts
it('searches with accents and announces the result count', async () => {
  render(<DigitalMenu onAddLine={vi.fn()} />)
  await user.type(screen.getByRole('searchbox', { name: /buscar no cardápio/i }), 'salmao')
  expect(screen.getByText(/produtos encontrados/i)).toHaveTextContent('5')
})

it('clears an empty combination of filters', async () => {
  // selecionar categoria Sobremesas e filtro Picante para zerar resultados
  expect(screen.getByText(/nenhum sabor encontrado/i)).toBeInTheDocument()
  await user.click(screen.getByRole('button', { name: /limpar filtros/i }))
  expect(screen.getAllByRole('article')).toHaveLength(24)
})

it('opens details and adds chosen options', async () => {
  // abrir Atum picante, selecionar intensidade e wasabi, adicionar
  expect(onAddLine).toHaveBeenCalledWith('atum-picante', expect.arrayContaining(['picante-tradicional', 'wasabi-extra']), 1)
})
```

- [ ] **Step 2: Executar e confirmar RED**

Run: `npm test -- src/components/menu/DigitalMenu.test.tsx`  
Expected: FAIL por componentes ausentes.

- [ ] **Step 3: Implementar o cardápio editorial comercial**

`DigitalMenu` mantém `query`, `categoryId`, `tags`, `avoidAllergens` e `selectedProductId`. `MenuFilters` oferece busca, Destaques, seis categorias, vegetariano, sem cru, picante e alergênicos a evitar. `MenuCard` é acionável por teclado, mostra no máximo dois selos e mantém adicionar rápido. `ProductDetails` usa `<dialog>`, contém ingredientes, alergênicos, aviso de cozinha compartilhada, opções, quantidade e subtotal.

`catalog.css` deve preservar os tokens existentes e aplicar:

```css
.menu-toolbar { display:grid; gap:18px; margin:32px 0 28px; }
.menu-search { min-height:52px; border:1px solid var(--line); background:#f8f5ed; }
.menu-category-row { display:flex; gap:8px; overflow-x:auto; scrollbar-width:none; }
.dish-grid { grid-template-columns:repeat(3,minmax(0,1fr)); }
.editorial-jp { font-family:"Noto Serif JP","Yu Mincho","Hiragino Mincho ProN",serif; }
@media (max-width:850px) { .dish-grid { grid-template-columns:repeat(2,minmax(0,1fr)); } }
@media (max-width:640px) {
  .dish-grid { grid-template-columns:1fr; }
  .dish-card { display:grid; grid-template-columns:124px 1fr; gap:14px; }
}
```

Não usar japonês em controles ou informações essenciais. Usar `旬`, `おまかせ` ou `いただきます` somente com `aria-hidden="true"` e equivalente próximo em português.

- [ ] **Step 4: Executar testes e build**

Run: `npm test -- src/components/menu/DigitalMenu.test.tsx`  
Expected: PASS.

Run: `npm test`  
Expected: todos PASS.

Run: `npm run build`  
Expected: exit 0.

- [ ] **Step 5: Commit**

```powershell
git add src/App.tsx src/main.tsx src/components/menu src/styles/catalog.css
git commit -m "feat: build AYORUME digital menu"
```

---

### Task 5: Implementar sacola e checkout demonstrativo

**Files:**
- Create: `src/lib/flowValidation.test.ts`
- Create: `src/lib/flowValidation.ts`
- Create: `src/components/cart/CartDrawer.test.tsx`
- Create: `src/components/cart/CartDrawer.tsx`
- Create: `src/components/checkout/CheckoutDemo.test.tsx`
- Create: `src/components/checkout/CheckoutDemo.tsx`
- Create: `src/components/site/DemoNotice.tsx`
- Create: `src/styles/flows.css`
- Modify: `src/main.tsx`
- Modify: `src/App.tsx`

- [ ] **Step 1: Criar testes RED das regras de checkout**

```ts
expect(validateCheckout({ mode: 'pickup', contact: validContact, schedule: 'asap' })).toEqual({})
expect(validateCheckout({ mode: 'delivery', contact: validContact, schedule: 'asap', neighborhood: '' }))
  .toMatchObject({ neighborhood: expect.any(String) })
expect(isDeliveryNeighborhood('Savassi')).toBe(true)
expect(isDeliveryNeighborhood('Outro bairro')).toBe(false)
```

No componente, testar: abrir sacola, avançar, escolher retirada sem endereço, voltar, escolher entrega, obter estado fora da área com “Outro bairro”, selecionar bairro válido, revisar e confirmar. Verificar que a tela final contém “Nenhum pedido foi realizado”.

- [ ] **Step 2: Executar e confirmar RED**

Run: `npm test -- src/lib/flowValidation.test.ts src/components/cart/CartDrawer.test.tsx src/components/checkout/CheckoutDemo.test.tsx`  
Expected: FAIL por módulos ausentes.

- [ ] **Step 3: Implementar sacola e fluxo em quatro etapas**

Etapas: `sacola → modalidade/horário → contato/endereço/pagamento → revisão/confirmação`.

Pagamentos são apenas escolhas textuais: Pix, cartão na entrega ou dinheiro. Nunca solicitar cartão, chave Pix ou documento. A modalidade retirada oculta endereço. Entrega usa a lista determinística de bairros. A confirmação gera um código local no formato `AYO-BH-####`, limpa dados pessoais e oferece voltar ao cardápio.

`DemoNotice` deve renderizar: “Simulação para portfólio — nenhum pedido ou reserva será realizado e nenhum dado será enviado.” imediatamente antes da ação final.

`flows.css` reutiliza a linguagem do diálogo atual, com painel de até 600 px, cabeçalho/rodapé fixos, conteúdo rolável, bordas `var(--line)` e CTA terracota.

- [ ] **Step 4: Executar testes, suíte e build**

Run: `npm test -- src/lib/flowValidation.test.ts src/components/cart/CartDrawer.test.tsx src/components/checkout/CheckoutDemo.test.tsx`  
Expected: PASS.

Run: `npm test`  
Expected: todos PASS.

Run: `npm run build`  
Expected: exit 0.

- [ ] **Step 5: Commit**

```powershell
git add src/App.tsx src/main.tsx src/lib/flowValidation* src/components/cart src/components/checkout src/components/site/DemoNotice.tsx src/styles/flows.css
git commit -m "feat: add simulated ordering flow"
```

---

### Task 6: Implementar reserva, localização e ações móveis

**Files:**
- Create: `src/components/reservation/ReservationDemo.test.tsx`
- Create: `src/components/reservation/ReservationDemo.tsx`
- Create: `src/components/site/LocationSection.test.tsx`
- Create: `src/components/site/LocationSection.tsx`
- Create: `src/components/site/MobileActionBar.test.tsx`
- Create: `src/components/site/MobileActionBar.tsx`
- Modify: `src/lib/flowValidation.ts`
- Modify: `src/App.tsx`
- Modify: `src/styles/flows.css`

- [ ] **Step 1: Criar testes RED**

Reserva deve validar 1–8 pessoas, data dentro de 30 dias, horário, nome e telefone. O teste do componente preenche restrição alimentar, confirma e encontra “Nenhuma reserva foi enviada”.

Localização deve exibir `AYORUME Savassi`, endereço, “Endereço fictício”, horários e sete bairros atendidos.

Barra móvel deve chamar:

```ts
onMenu() // Cardápio
onOrder() // abre sacola se houver itens; App decide scroll quando vazia
onReservation() // Reservar
```

- [ ] **Step 2: Executar e confirmar RED**

Run: `npm test -- src/components/reservation src/components/site`  
Expected: FAIL por componentes ausentes.

- [ ] **Step 3: Implementar componentes e integração**

`ReservationDemo` usa horários derivados da configuração fictícia, formulário revisável e confirmação local `AYO-RES-####`. Descartar nome, telefone e observações após confirmação.

`LocationSection` usa um quadro gráfico CSS, não mapa real. O CTA atual da seção experiência passa a abrir a reserva. Adicionar itens “Localização” e “Reservar” à navegação.

`MobileActionBar` aparece somente até 640 px:

```css
.mobile-action-bar { display:none; }
@media (max-width:640px) {
  .mobile-action-bar { position:fixed; inset:auto 0 0; z-index:30; display:grid; grid-template-columns:repeat(3,1fr); min-height:64px; padding-bottom:env(safe-area-inset-bottom); background:#f3f0e7f2; border-top:1px solid var(--line); backdrop-filter:blur(12px); }
  body { padding-bottom:calc(64px + env(safe-area-inset-bottom)); }
}
```

- [ ] **Step 4: Executar testes e build**

Run: `npm test -- src/components/reservation src/components/site`  
Expected: PASS.

Run: `npm test`  
Expected: todos PASS.

Run: `npm run build`  
Expected: exit 0.

- [ ] **Step 5: Commit**

```powershell
git add src/App.tsx src/lib/flowValidation.ts src/components/reservation src/components/site src/styles/flows.css
git commit -m "feat: add reservation and local experience"
```

---

### Task 7: Produzir e integrar as 18 fotografias faltantes

**Files:**
- Create: `src/data/menuAssets.test.ts`
- Create: `public/assets/menu/*.png` for the 18 new products
- Modify: `public/creditos-fotograficos.html`
- Modify: `src/data/menu.ts` only if generated extensions differ

- [ ] **Step 1: Criar teste RED do manifesto de imagens**

O teste deve percorrer `menuItems`, resolver cada caminho dentro de `public/`, exigir 24 caminhos únicos, arquivo existente e tamanho maior que 10 KB. Também deve verificar que `creditos-fotograficos.html` menciona “Imagens gastronômicas geradas para o projeto AYORUME”.

- [ ] **Step 2: Executar e confirmar RED**

Run: `npm test -- src/data/menuAssets.test.ts`  
Expected: FAIL listando os 18 ativos ausentes.

- [ ] **Step 3: Gerar uma imagem por produto com a ferramenta integrada de imagens**

Usar uma chamada por ativo. Prompt-base:

```text
Use case: photorealistic-natural
Asset type: fotografia 4:3 para cartão de cardápio digital premium
Scene/backdrop: mesa mineral clara ou verde profundo, louça artesanal escura, sem cenário de restaurante
Subject: <produto e ingredientes específicos>
Style/medium: fotografia gastronômica editorial fotorealista, textura natural, sem aparência plástica
Composition/framing: ângulo de 35–45 graus, prato inteiro, margens seguras para corte responsivo
Lighting/mood: luz lateral suave e quente, sombras delicadas, atmosfera japonesa contemporânea
Color palette: creme, verde profundo e terracota discreto
Constraints: somente comida e louça; sem pessoas; sem texto; sem logotipo; sem caracteres; sem marca d'água
Avoid: talheres ocidentais, excesso de decoração, saturação alta, fundo preto absoluto
```

Gerar e salvar, no mínimo, estes arquivos: `sunomono-ayorume`, `edamame-citrico`, `guioza-legumes`, `tataki-salmao`, `dupla-atum`, `dupla-camarao`, `sashimi-chef`, `roll-ayorume`, `salmao-cebolinha`, `atum-picante`, `camarao-crocante`, `garden-roll`, `trio-mochi`, `chocolate-gergelim-caramelo`, `cheesecake-yuzu`, `cha-citrico`, `soda-frutas-amarelas`, `horizonte-tonica`.

Mover cada saída final de `$CODEX_HOME/generated_images/` para `public/assets/menu/`, sem sobrescrever as seis imagens existentes.

- [ ] **Step 4: Atualizar créditos e executar o teste**

Registrar que as 18 imagens novas foram geradas especificamente para o conceito fictício AYORUME; manter os créditos/licenças das seis imagens atuais.

Run: `npm test -- src/data/menuAssets.test.ts`  
Expected: PASS.

Run: `npm run build`  
Expected: exit 0.

- [ ] **Step 5: Commit**

```powershell
git add src/data/menuAssets.test.ts src/data/menu.ts public/assets/menu public/creditos-fotograficos.html
git commit -m "assets: add AYORUME menu photography"
```

---

### Task 8: Fechar integração, acessibilidade e publicação relativa

**Files:**
- Create: `src/App.test.tsx`
- Modify: `src/App.tsx`
- Modify: `src/style.css`
- Modify: `src/styles/catalog.css`
- Modify: `src/styles/flows.css`
- Modify: `README.md`

- [ ] **Step 1: Criar teste RED de integração**

Mockar `SushiScene` e validar:

- navegação contém Cardápio, Localização e Reservar;
- exatamente 24 produtos aparecem sem filtros;
- adicionar um produto atualiza a contagem da sacola;
- botão móvel Pedir leva ao cardápio quando a sacola está vazia;
- depois de adicionar, Pedir abre a sacola;
- aviso de projeto conceitual aparece no rodapé;
- nenhum controle essencial depende apenas de texto japonês.

- [ ] **Step 2: Executar e confirmar RED**

Run: `npm test -- src/App.test.tsx`  
Expected: FAIL até a integração final ser ajustada.

- [ ] **Step 3: Corrigir integração e acessibilidade**

Adicionar link “Pular para o conteúdo”, `aria-live` para contagem de resultados/sacola, foco visível em `input`, `select` e elementos acionáveis, rótulos associados, retorno de foco de todos os diálogos e tamanhos mínimos de 44 px no celular. Garantir que toast fique acima da barra móvel e diálogos acima de ambos.

Atualizar README com execução, testes, natureza fictícia, nenhuma transmissão de dados e publicação relativa.

- [ ] **Step 4: Executar verificação automatizada completa**

Run: `npm test`  
Expected: todos os testes PASS, 0 failures.

Run: `npm run build`  
Expected: exit 0 e chunk `SushiScene` separado.

Run:

```powershell
rg -n "Sujeito Programador|SujeitoProgramador|Matheus|Kōri|Kori" src public index.html README.md
```

Expected: nenhum resultado.

Run:

```powershell
rg -n 'src="/|href="/|url\("/' dist
```

Expected: nenhum caminho absoluto incompatível com GitHub Pages.

- [ ] **Step 5: Verificar visualmente no navegador**

Iniciar `npm run dev`, testar desktop e viewport móvel. Verificar caixa 3D, três seletores originais, busca, filtros, detalhes, sacola, entrega, retirada, reserva, localização, teclado, movimento reduzido e ausência de overflow horizontal.

- [ ] **Step 6: Commit**

```powershell
git add src README.md
git commit -m "test: verify AYORUME digital experience"
```

---

## Verificação final obrigatória

Executar novamente, a partir de estado limpo:

```powershell
npm test
npm run build
git status --short
```

Esperado: testes sem falhas, build com exit 0 e apenas mudanças intencionais já commitadas.

