# AYORUME — cardápio digital e fluxos demonstrativos

**Data:** 21 de novembro de 2026  
**Status:** design aprovado  
**Escopo:** evolução do site de portfólio AYORUME  

## 1. Contexto

O site atual possui uma identidade visual forte, uma apresentação 3D interativa e um catálogo demonstrativo com seis produtos. A próxima evolução deve transformar o catálogo em uma experiência de cardápio digital convincente para clientes de restaurantes e para recrutadores/agências, sem apresentar o projeto como uma operação comercial real.

Esta especificação foi informada por referências brasileiras e internacionais de restaurantes japoneses premium. As práticas selecionadas são: cardápio em HTML, preços transparentes, filtros alimentares, ingredientes e alergênicos, ações claras para pedido e reserva, detalhes operacionais e confirmação explícita de fluxos demonstrativos.

## 2. Objetivos

- Preservar integralmente a caixa 3D, sua aparência e sua interação.
- Expandir o catálogo para 24 produtos fictícios fotografados.
- Equilibrar apresentação editorial premium e eficiência comercial.
- Criar busca, categorias, filtros, detalhes de produto e sacola funcional.
- Criar checkout e reserva completos, porém inteiramente simulados.
- Tornar o projeto convincente em desktop e celular.
- Separar conteúdo, estado e componentes para facilitar manutenção futura.
- Manter transparência: nenhuma compra, reserva ou transmissão de dados será real.

## 3. Fora do escopo

- Alterar a caixa 3D, suas composições ou seus controles.
- Criar backend, banco de dados, painel administrativo ou autenticação.
- Processar pagamentos reais.
- Enviar pedidos ou reservas para WhatsApp, e-mail ou serviços externos.
- Geocodificar endereços ou calcular distância real.
- Transformar o portfólio em uma operação real de restaurante.

## 4. Decisões aprovadas

### 4.1 Direção da experiência

A estrutura escolhida é **Editorial comercial**: aparência premium com busca, categorias, filtros, detalhes de produto e carrinho persistente. O cardápio será o fluxo primário. Reserva será uma ação secundária, porém sempre acessível.

### 4.2 Contexto fictício

**AYORUME Savassi**  
Alameda do Horizonte, 118 — Savassi  
Belo Horizonte — MG  

O endereço é fictício e deve ser identificado como tal em local próximo às informações operacionais. Não haverá link para navegação real nem coordenadas de mapa.

Parâmetros demonstrativos:

- entrega em um raio ilustrativo de 8 km;
- retirada na unidade fictícia;
- horários e taxas apresentados como simulação;
- aviso permanente de portfólio no checkout, na reserva e no rodapé.

A validação do raio não usará mapa, GPS ou CEP real. O checkout apresentará uma lista determinística de bairros demonstrativos atendidos: Savassi, Funcionários, Lourdes, Santo Agostinho, Serra, Anchieta e Sion. A opção “Outro bairro” reproduzirá o estado fora da área e oferecerá retirada.

Horários fictícios, no fuso `America/Sao_Paulo`:

- terça a quinta: 18h às 22h30;
- sexta e sábado: 18h às 23h30;
- domingo: 12h às 21h30;
- segunda-feira: fechado.

Reservas poderão ser simuladas para os próximos 30 dias, em intervalos de 30 minutos e para grupos de 1 a 8 pessoas.

## 5. Arquitetura da informação

### 5.1 Navegação principal

- Início
- Cardápio
- A experiência
- Localização
- Reservar
- Sacola

No celular, uma barra inferior fixa oferece três ações: **Cardápio**, **Pedir** e **Reservar**.

- **Cardápio:** rola até o início do catálogo.
- **Pedir:** abre a sacola quando houver itens; quando estiver vazia, rola até o catálogo.
- **Reservar:** abre o fluxo demonstrativo de reserva.

A seção **Localização** mostrará endereço fictício, horários, bairros demonstrativos atendidos e um mapa meramente ilustrativo, sem link ou coordenadas reais. O CTA de reserva existente na seção de experiência passará a abrir `ReservationDemo`.

### 5.2 Estrutura do cardápio

O cardápio terá:

- busca por nome e ingrediente;
- filtro editorial **Destaques**;
- seis categorias reais;
- filtros alimentares e de preferência;
- 24 produtos;
- estado de indisponibilidade;
- painel de detalhes;
- sacola e checkout demonstrativo.

Categorias:

1. Entradas
2. Niguiris & sashimis
3. Rolls
4. Combinados
5. Sobremesas
6. Bebidas

**Vegetariano** não será uma categoria duplicada. Será um filtro que atravessa todas as categorias. **Destaques** será uma seleção editorial baseada no campo `featured`.

Filtros planejados:

- vegetariano;
- sem itens crus;
- picante;
- alergênicos.

No filtro de alergênicos, a pessoa seleciona itens que deseja evitar. Produtos que contenham qualquer alergênico selecionado serão excluídos dos resultados. Lista inicial: glúten, crustáceos, peixe, soja, gergelim, leite e castanhas. O painel exibirá o aviso de que uma cozinha compartilhada pode ter contaminação cruzada e que os dados são demonstrativos.

## 6. Catálogo aprovado

| Categoria | Produto | Porção | Preço |
|---|---|---:|---:|
| Entradas | Sunomono AYORUME | porção | R$ 26 |
| Entradas | Edamame cítrico | porção | R$ 28 |
| Entradas | Guioza de legumes | 6 unidades | R$ 34 |
| Entradas | Tataki de salmão | porção | R$ 46 |
| Niguiris & sashimis | Dupla de salmão | 2 peças | R$ 18 |
| Niguiris & sashimis | Dupla de atum | 2 peças | R$ 24 |
| Niguiris & sashimis | Dupla de camarão | 2 peças | R$ 26 |
| Niguiris & sashimis | Sashimi do chef | 8 cortes | R$ 68 |
| Rolls | Roll AYORUME | 8 peças | R$ 52 |
| Rolls | Salmão e cebolinha | 8 peças | R$ 44 |
| Rolls | Atum picante | 8 peças | R$ 48 |
| Rolls | Camarão crocante | 8 peças | R$ 54 |
| Rolls | Garden Roll | 8 peças | R$ 42 |
| Combinados | Box Signature | 18 peças | R$ 128 |
| Combinados | Garden Box | 12 peças | R$ 84 |
| Combinados | Salmão Box | 12 peças | R$ 98 |
| Combinados | Garden para dois | 16 peças | R$ 72 |
| Combinados | Experiência AYORUME | 16 peças | R$ 118 |
| Sobremesas | Trio de mochi | 3 unidades | R$ 32 |
| Sobremesas | Chocolate, gergelim e caramelo | porção | R$ 36 |
| Sobremesas | Cheesecake de yuzu | fatia | R$ 34 |
| Bebidas | Chá cítrico da casa | 300 ml | R$ 16 |
| Bebidas | Soda de frutas amarelas | 350 ml | R$ 22 |
| Bebidas | Horizonte Tônica | 350 ml | R$ 26 |

Os seis produtos já existentes permanecem como núcleo do catálogo. Preços e conteúdos são fictícios.

## 7. Cartões e detalhes de produto

Cada cartão apresentará:

- foto;
- nome;
- descrição de uma ou duas linhas;
- porção;
- preço;
- no máximo dois selos úteis;
- ação de abrir detalhes.

Selos permitidos: **mais pedido**, **vegetariano**, **cru**, **picante**, **novo** e **esgotado**.

Ao selecionar um produto:

- no desktop, abrir um painel lateral;
- no celular, abrir um painel inferior;
- exibir imagem ampliada, descrição, ingredientes, alergênicos e porção;
- oferecer opções e adicionais somente quando fizerem sentido;
- permitir escolher quantidade;
- informar subtotal antes de adicionar;
- manter foco acessível e devolver o foco ao cartão ao fechar.

O estado **esgotado** permanece visível para demonstrar disponibilidade, mas bloqueia a adição à sacola.

Matriz inicial de opções, suficiente para demonstrar linhas distintas na sacola:

- rolls e combinados: shoyu extra (+ R$ 3), gengibre extra (+ R$ 4) e wasabi extra (+ R$ 3);
- Atum picante: intensidade suave ou tradicional, sem diferença de preço;
- bebidas: com gelo ou sem gelo, sem diferença de preço.

## 8. Direção visual

- Preservar creme, verde profundo e terracota da identidade atual.
- Preservar tipografia editorial nos títulos e fonte funcional nas informações práticas.
- Usar grade de três produtos no desktop, duas no tablet e lista compacta no celular.
- Usar fotografia gastronômica consistente: louça escura, luz suave, fundo neutro e enquadramento editorial.
- Fornecer foto para todos os 24 produtos.
- Evitar excesso de cartões, sombras, gradientes e decorações genéricas.
- Usar animações curtas e discretas, respeitando `prefers-reduced-motion`.

### 8.1 Expressões em japonês

Expressões em japonês podem aparecer como acentos gráficos em áreas não essenciais, por exemplo:

- `おまかせ` junto de “Seleção do chef”;
- `旬` junto de “Sazonal”;
- `いただきます` como detalhe editorial de abertura.

Regras:

- nunca substituir navegação, botões, categorias, preços, ingredientes, alergênicos ou instruções;
- sempre haver contexto ou equivalente em português;
- textos meramente duplicados/decorativos devem ser `aria-hidden`;
- não adicionar texto japonês à caixa 3D, que permanece inalterada;
- limitar a presença para preservar legibilidade e evitar ornamentação excessiva.

Usar fallback do sistema para os glifos, sem baixar uma nova família tipográfica pesada: `"Noto Serif JP", "Yu Mincho", "Hiragino Mincho ProN", serif`.

## 9. Fluxo de pedido demonstrativo

Sequência:

1. Explorar ou buscar produtos.
2. Abrir detalhes e selecionar opções.
3. Adicionar à sacola.
4. Revisar itens, quantidades e subtotal.
5. Selecionar **entrega** ou **retirada**.
6. Selecionar “o mais rápido possível” ou um horário fictício.
7. Preencher contato; solicitar endereço apenas para entrega.
8. Selecionar pagamento demonstrativo: Pix, cartão na entrega ou dinheiro.
9. Revisar pedido, taxa fictícia e total.
10. Confirmar e exibir número de pedido simulado.

Regras:

- nenhuma informação será enviada;
- não solicitar número de cartão, chave Pix, documento ou outro dado financeiro;
- mostrar “Simulação para portfólio — nenhum pedido será realizado” antes da confirmação;
- permitir voltar e editar qualquer etapa;
- retirar os campos de endereço quando a modalidade for retirada;
- após a confirmação, descartar nome, telefone e endereço;
- oferecer ação para voltar ao cardápio, não rastreamento fictício.

## 10. Fluxo de reserva demonstrativo

Campos:

- número de pessoas;
- data;
- horário fictício disponível;
- nome;
- telefone;
- ocasião especial opcional;
- restrições alimentares opcionais;
- revisão.

Após a confirmação, exibir um código de reserva simulado e descartar os dados pessoais. O aviso de simulação deve aparecer antes da ação final e na confirmação.

## 11. Estados e respostas do sistema

- **Busca sem resultado:** mensagem clara e ação para limpar filtros.
- **Sacola vazia:** explicação curta e atalho para o cardápio.
- **Produto esgotado:** cartão visível, ação bloqueada e selo explícito.
- **Formulário incompleto:** erros próximos aos campos e resumo acessível no topo da etapa.
- **Endereço fora do raio:** selecionar “Outro bairro” reproduz esse estado, sem consulta externa, com opção de retirada.
- **Dados antigos da sacola:** migração ou descarte seguro da versão anterior baseada em índices.
- **Falha de imagem:** fundo coerente e nome do produto preservado.

## 12. Arquitetura técnica proposta

### 12.1 Dados

- `src/types/menu.ts`: tipos de produto, categoria, opção, marcador e alergênico.
- `src/data/menu.ts`: catálogo dos 24 produtos e categorias.
- `src/data/heroSelections.ts`: apenas os três produtos ligados às composições 3D.
- `src/data/restaurant.ts`: endereço fictício, horários, raio e avisos demonstrativos.

Modelo mínimo de produto:

```ts
type MenuItem = {
  id: string
  name: string
  categoryId: string
  description: string
  price: number
  image: string
  alt: string
  portionLabel: string
  ingredients: string[]
  tags: string[]
  allergens: string[]
  badge?: string
  featured?: boolean
  available: boolean
  options?: ProductOption[]
}
```

`portionLabel` substitui a dependência atual de `pieces` e acomoda peças, porções, unidades e mililitros.

O mapeamento 3D deve ser explícito e coberto por teste:

```ts
[
  { productId: 'box-signature', sceneIndex: 0 },
  { productId: 'garden-box', sceneIndex: 1 },
  { productId: 'salmao-box', sceneIndex: 2 },
]
```

Essa ordem preserva exatamente as três composições atuais e impede que a reorganização do catálogo altere a caixa.

### 12.2 Componentes

- `MenuSection`
- `MenuSearch`
- `MenuFilters`
- `MenuCard`
- `ProductDetails`
- `CartDrawer`
- `CheckoutDemo`
- `ReservationDemo`
- `MobileActionBar`
- `DemoNotice`

Os nomes são orientativos; a implementação pode ajustar a divisão sem alterar responsabilidades ou comportamento.

### 12.3 Estado e persistência

- substituir índices por `productId` estável;
- diferenciar linhas da sacola pela assinatura de opções selecionadas;
- adotar a chave `ayorume-cart-v2` e descartar com segurança o conteúdo legado `ayorume-cart-v1`, baseado em índices;
- persistir somente itens e opções da sacola;
- manter busca, filtros e etapas de formulário em estado de sessão;
- nunca persistir nome, telefone, endereço ou observações do pedido;
- não realizar requisições de pedido, reserva, pagamento ou geolocalização.

## 13. Responsividade

- **Desktop:** grade de três colunas, filtros visíveis e sacola lateral/fixa.
- **Tablet:** grade de duas colunas e painéis sobrepostos.
- **Celular:** lista compacta com fotos, chips roláveis e barra inferior de ações.
- Áreas interativas terão pelo menos 44 × 44 px.
- O cardápio será utilizável independentemente do carregamento da cena 3D.

## 14. Acessibilidade

- Navegação por teclado em busca, filtros, cartões, painéis, sacola e formulários.
- Foco inicial, contenção e retorno de foco em diálogos/painéis.
- `aria-live` para quantidade de resultados, adição à sacola e erros relevantes.
- Rótulos explícitos e mensagens de validação associadas aos campos.
- Contraste compatível com WCAG AA.
- Informações de alergênicos disponíveis em texto, nunca apenas por cor ou ícone.
- Suporte a movimento reduzido.
- Expressões japonesas decorativas ignoradas por tecnologia assistiva quando duplicarem conteúdo.

## 15. Performance e imagens

- Produzir todas as fotos em proporção consistente.
- Manter as 24 imagens localmente, sem hotlink, e registrar origem/licença ou geração na página de créditos.
- Gerar versões de 480 e 960 px, em proporção 4:3, WebP ou AVIF, visando até 160 KB na versão de 960 px sempre que a qualidade permitir.
- Definir largura e altura para evitar deslocamento de layout.
- Carregar imagens fora da primeira tela sob demanda.
- Preservar o carregamento dinâmico da experiência 3D.
- Remover ativos comprovadamente não utilizados após validação.
- Evitar aumento desnecessário do bundle principal ao separar fluxos pesados.

## 16. Privacidade e transparência

O projeto é um portfólio. Os seguintes avisos devem ser claros e consistentes:

- restaurante, endereço, produtos, preços e horários são fictícios;
- pedidos e reservas são simulações;
- nenhum pagamento será processado;
- nenhum dado preenchido será persistido nem transmitido pela aplicação;
- fotografias devem possuir origem e crédito compatíveis com seu uso.

## 17. Critérios de aceitação

- A caixa 3D está visual e funcionalmente inalterada.
- Existem exatamente 24 produtos nas seis categorias aprovadas.
- Todos os produtos possuem foto, descrição, preço, porção, ingredientes e alergênicos.
- Busca, categorias e filtros podem ser combinados e limpos.
- Produto esgotado não pode ser adicionado.
- Detalhes funcionam por mouse, toque e teclado.
- A sacola usa IDs estáveis e sobrevive a recarregamento.
- Checkout alterna corretamente entre entrega e retirada.
- Pedido e reserva terminam em confirmação explicitamente simulada.
- Dados pessoais não são persistidos nem transmitidos pela aplicação.
- O endereço fictício é identificado junto à localização, o aviso de portfólio aparece no rodapé e o aviso de simulação aparece imediatamente antes das confirmações de pedido e reserva.
- O fluxo principal funciona nos breakpoints de celular, tablet e desktop.
- `npm run build` conclui sem erros.
- Os fluxos principais funcionam por teclado, inclusive abertura e fechamento dos painéis.
- Expressões em japonês nunca substituem informação essencial e possuem contexto equivalente em português.
- A sacola v2 permanece correta após recarregar a página e descarta de forma segura o estado v1.
- Confirmar pedido ou reserva não produz requisições de rede.
- Não surgem referências indesejadas às marcas ou autores removidos anteriormente.
- A publicação no GitHub Pages continua funcionando sob caminho relativo.

## 18. Sequência recomendada de implementação

1. Extrair tipos, dados e configuração fictícia.
2. Desacoplar seleção 3D do índice do catálogo.
3. Implementar busca, filtros, cartões e detalhes.
4. Migrar sacola para IDs estáveis.
5. Implementar checkout demonstrativo.
6. Implementar reserva demonstrativa.
7. Adicionar fotos e otimizações responsivas.
8. Validar acessibilidade, responsividade, build e GitHub Pages.

