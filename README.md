# Kōri Sushi

Landing page conceito com Vite, React, TypeScript, Tailwind CSS e Three.js.

## Executar

Use Node 22 como no ambiente em que o projeto foi testado.

~~~bash
npm ci
npm run dev
~~~

Abra a URL que o Vite imprimir. A porta padrão é 5173.

## Produção

~~~bash
npm run build
npm run preview
~~~

## Hero e menu

- O hero mostra um pôster da caixa fechada enquanto prepara o 3D. A tampa só abre quando a primeira cena está pronta, com o sushi já acomodado.
- Passe o mouse para levantar e girar uma peça. Clique ou toque para fixá-la ou soltá-la. Arraste para girar a caixa.
- Use Levantar todas e Acomodar peças para alternar a elevação coletiva. Com o 3D em foco, use as setas laterais para girar a caixa, as verticais para escolher peças, Enter ou Espaço para alternar a elevação coletiva, Home para restaurar a orientação e Escape para desmarcar.
- O seletor alterna entre três combinações. As peças da nova combinação entram em sequência.
- Com movimento reduzido, a tampa aparece aberta assim que o carregamento termina. Sem WebGL, os pôsteres abertos acompanham a seleção.
- O cardápio usa fotografias locais e aceita filtros por categoria. A sacola local mantém as quantidades no navegador e gera um resumo copiável. O pedido é uma demonstração local.
- A área do hero é reservada por breakpoint. Pôster e canvas compartilham o enquadramento. As fontes locais são pré-carregadas e usam `font-display: optional`.

## Arquivos principais

| Caminho | Conteúdo |
| --- | --- |
| `src/App.tsx` | Marca, textos, menu, estado do carregamento e sacola. |
| `src/style.css` | Tipografia, layout e comportamento responsivo. |
| `src/SushiScene.tsx` | Câmera, iluminação, abertura e interações. |
| `src/takeoutBox.ts` | Geometria, materiais e dobradiça da caixa. |
| `src/foodModels.ts` e `src/rollGeometry.ts` | Geometrias dos alimentos, texturas e grupos dos pratos. |
| `public/assets/ingredients/` | Mapas ativos de cor e relevo de arroz, peixe, camarão, tamago, nori e rolls. |
| `public/assets/box-closed.webp` | Primeiro quadro da cena com a tampa fechada. |
| `public/assets/box-0.webp` a `box-2.webp` | Alternativas estáticas por variante. |
| `public/assets/menu/` | Fotos do cardápio. Consulte `public/creditos-fotograficos.html` para as atribuições. |
| `public/fonts/` | Fontes e licenças OFL. |

O prompt de replicação pode ser enviado junto com o ZIP. O ZIP contém o código, o lockfile e os recursos locais para reproduzir a aparência original.
