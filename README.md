# AYORUME Sushi

Experiência digital de um restaurante fictício criada como projeto de portfólio
com Vite, React, TypeScript, Tailwind CSS e Three.js. A unidade AYORUME Savassi,
seu endereço, seus pedidos e suas reservas são integralmente demonstrativos.

## Executar

Use Node 24 LTS ou 26+, como no ambiente em que o projeto foi testado.

~~~bash
npm ci
npm run dev
~~~

Abra a URL que o Vite imprimir. A porta padrão é 5173.

## Testes e verificação

~~~bash
npm test
npm run typecheck
npm run build
~~~

O primeiro comando executa a suíte Vitest uma vez. O segundo valida os tipos sem
emitir arquivos, e o terceiro também produz o pacote estático de produção.

## Produção

~~~bash
npm run build
npm run preview
~~~

O Vite usa `base: './'` e os recursos da aplicação respeitam
`import.meta.env.BASE_URL`. Assim, a publicação estática usa caminhos relativos e
funciona tanto na raiz quanto em subdiretórios, como uma prévia no GitHub Pages.

## Demonstração local e privacidade

- A sacola persiste localmente apenas identificadores dos pratos, opções e
  quantidades para preservar a navegação.
- Pedido e reserva são fluxos locais de demonstração, sem transmitir nem
  persistir dados pessoais (PII). Nome, telefone, endereço e observações existem
  apenas no estado temporário da interface e são descartados ao fechar ou
  concluir a simulação.
- Nenhuma compra, cobrança, entrega ou reserva real é efetuada.

## Imagens e créditos

O cardápio combina 18 imagens gastronômicas geradas especificamente para o
projeto AYORUME com 6 fotografias externas de referência do Wikimedia Commons.
Autores, fontes e licenças das seis imagens externas estão documentados em
`public/creditos-fotograficos.html`.

## Hero e menu

- O hero mostra um placeholder vetorial da caixa fechada enquanto prepara o 3D. A tampa só abre quando a primeira cena está pronta, com o sushi já acomodado.
- Passe o mouse para levantar e girar uma peça. Clique ou toque para fixá-la ou soltá-la. Arraste para girar a caixa.
- Use Levantar todas e Acomodar peças para alternar a elevação coletiva. Com o 3D em foco, use as setas laterais para girar a caixa, as verticais para escolher peças, Enter ou Espaço para alternar a elevação coletiva, Home para restaurar a orientação e Escape para desmarcar.
- O seletor alterna entre três combinações. As peças da nova combinação entram em sequência.
- Com movimento reduzido, a tampa aparece aberta assim que o carregamento termina. Sem WebGL, imagens estáticas dos pratos acompanham a seleção.
- O cardápio usa imagens locais e aceita filtros por categoria. A sacola local mantém as quantidades no navegador e gera um resumo copiável. O pedido é uma demonstração local.
- A área do hero é reservada por breakpoint. Placeholder, fallback e canvas compartilham o enquadramento. As fontes locais são pré-carregadas e usam `font-display: optional`.

## Arquivos principais

| Caminho | Conteúdo |
| --- | --- |
| `src/App.tsx` | Marca, textos, menu, estado do carregamento e sacola. |
| `src/style.css` | Tipografia, layout e comportamento responsivo. |
| `src/SushiScene.tsx` | Câmera, iluminação, abertura e interações. |
| `src/takeoutBox.ts` | Geometria, materiais e dobradiça da caixa. |
| `src/foodModels.ts` e `src/rollGeometry.ts` | Geometrias dos alimentos, texturas e grupos dos pratos. |
| `public/assets/ingredients/` | Mapas ativos de cor e relevo de arroz, peixe, camarão, tamago, nori e rolls. |
| `public/assets/sushi-0.png` a `sushi-2.png` | Alternativas estáticas dos pratos para ambientes sem WebGL. |
| `public/assets/menu/` | Imagens do cardápio. Consulte `public/creditos-fotograficos.html` para geração, fontes e atribuições. |
| `public/fonts/` | Fontes e licenças OFL. |

O prompt de replicação pode ser enviado junto com o ZIP. O ZIP contém o código, o lockfile e os recursos locais para reproduzir a aparência original.
