# Fase 4.9 — Restaurantes B: Cardápio Digital e Pedidos

## Resultado e comparação com SABORÊ

Implementado o oitavo renderer, `restaurantes-b`. Ele tem composição independente do A: header claro com marca e contador, hero escuro com destaque laranja, barra de benefícios, categorias com ícones, produtos à esquerda e carrinho à direita, banner condicionado a categoria, etapas, apresentação, contato e footer grafite. A tipografia usa sans-serif moderna ou humanista e a paleta inicial solicitada, configurável.

Não foram incorporados o nome SABORÊ, seu cardápio, preços, endereço ou história. Os dados confirmados do lead definem a identidade e os contatos. Produtos e categorias vêm do mesmo catálogo do Template A. O link “Destaques” usa produtos explicitamente destacados, sem afirmar popularidade ou volume de vendas como “mais pedidos”. Nenhuma categoria ou promoção é inferida pelo nome do restaurante.

O comportamento é funcional em React, mas não há aceite visual: o host do navegador estava indisponível. Ainda precisam de revisão real as cinco larguras, o drawer, o menu, as categorias e os controles. A ausência de fotos de produtos também impede reproduzir integralmente a referência neste momento.

## Imagens disponíveis e pendentes

O repositório contém somente estas quatro imagens compartilhadas de restaurantes:

- `restaurant-dining-room.png`: fallback de ambiente para hero/banner, sem afirmar ser instalação real.
- `restaurant-service.png`: apresentação institucional ilustrativa.
- `restaurant-bar-ambience.png`: contato ilustrativo.
- `restaurant-dish-closeup.png`: continua disponível no catálogo compartilhado do A; o B não a usa automaticamente para produtos ou hero.

Não existem fotos locais de hambúrgueres, combos, batatas, bebidas ou sobremesas. Produtos sem foto usam um fallback tipográfico com utensílios, sem associar salmão a hambúrguer. Assets de produtos compatíveis e autorizados permanecem pendentes. Não foram inventados arquivos nem usadas URLs externas.

As fotos usam o componente existente com `next/image`, tamanhos responsivos, enquadramento, alt, legenda e identificação ilustrativa. Os controles do B permitem substituir suas imagens sem modificar as opções visuais do A. Os caminhos devem corresponder a arquivos existentes em `public/templates/restaurants/`; não foi criado um serviço de upload.

## Cardápio e integridade

O catálogo permanece em `restaurantDesign.items` e `restaurantDesign.categories`, com os mesmos IDs, limites, editor, validação e persistência. Categorias ocultas e seus produtos não aparecem. Produtos indisponíveis aparecem identificados no B, com “Adicionar” desabilitado. Produtos demonstrativos são identificados e também ficam bloqueados para pedidos. Não se cadastram produtos ou preços automaticamente.

Categorias exibem somente registros configurados com produtos associados. Os botões indicam a categoria ativa e a quantidade de produtos, filtram os cards e são acessíveis pela navegação normal de teclado. Os ícones são controlados explicitamente; o padrão é utensílios, sem impor hambúrguer a todos os segmentos. Destaques aparecem primeiro, respeitando a ordem configurada dentro dos grupos.

Sem cardápio, há um estado vazio explicativo, apresentação e contatos. Benefícios, links e etapas dependem das funcionalidades disponíveis. O banner só aparece quando sua categoria foi explicitamente configurada, está visível e contém produto real elegível para pedido; não se criam ofertas nem descontos.

## Carrinho

O estado React mantém somente IDs e quantidades. O resumo é derivado do catálogo atual, com nome, valor unitário e subtotal por linha. Há adição, aumento, redução, remoção, limpeza, contador, observações, subtotal e total estimado.

- Quantidade padrão máxima: 20 por produto, configurável entre 1 e 99.
- Reduzir a quantidade de um item até zero o remove.
- Alterações no catálogo revalidam itens, disponibilidade, categoria, preço e limite.
- Produtos removidos, ocultos, demonstrativos ou sem preço elegível saem do resumo.
- O escopo do componente é o lead do restaurante; trocar de restaurante recria o carrinho.
- Não há `localStorage`, cookies de carrinho ou backend de pedidos. Atualizar/sair da página limpa o carrinho, inclusive as observações.

Desktop: painel lateral com resumo, controles e finalização. Até 900 px: resumo em `dialog` nativo, com foco modal, Escape e botão de fechar; header mantém acesso ao carrinho e surge botão fixo quando há itens. O painel usa rolagem própria e o layout reserva espaço para o botão fixo. Esse comportamento foi implementado, mas falta inspeção interativa em navegador.

## Valores e WhatsApp

Preços são normalizados em centavos inteiros. Valores ausentes, negativos, não finitos, maiores que R$ 1 milhão ou com fração inferior a um centavo não podem entrar no carrinho. A tolerância numérica aceita representações equivalentes, como `0.1 + 0.2`, sem produzir erro de soma. Quantidade, subtotal e total usam inteiros seguros. `Intl.NumberFormat` faz a apresentação em reais.

O total corresponde aos itens selecionados. Não há cálculo de taxa de entrega, descontos, pagamento ou confirmação de disponibilidade. O aviso de estimativa e confirmação do restaurante é obrigatório e não pode ser desativado pelo editor.

A função de finalização:

1. Valida o WhatsApp confirmado com prefixo internacional explícito, sem inferir país.
2. Revalida os itens e quantidades contra o catálogo carregado na página, bloqueando carrinho vazio ou inválido.
3. Limita observações a 500 caracteres de texto simples e trata Unicode sem gerar URLs inválidas.
4. Gera mensagem com introdução, quantidades, produtos, totais por linha, subtotal opcional, total estimado, observações e confirmação.
5. Codifica a mensagem com `encodeURIComponent` em `https://wa.me/...`.
6. Bloqueia resumos cuja URL exceda 12 mil caracteres, orientando reduzir itens/observações.

O link só fica funcional com WhatsApp válido e carrinho elegível. Ele é revalidado na ação do visitante e abre uma nova aba com `noopener noreferrer`. Não envia automaticamente, não grava pedido e não declara conclusão ao abrir o WhatsApp. Nenhuma mensagem foi enviada durante os testes. Sem WhatsApp válido, outros canais confirmados continuam disponíveis na apresentação e contato.

## Editor e compatibilidade

O mesmo formulário administrativo de personalização contém os controles compartilhados do restaurante e a extensão digital do B. Não há segundo editor ou catálogo.

Campos exclusivos do B em `restaurantDesign.digital.version = 1`:

- Sete cores, duas tipografias e ícone da marca.
- Título, destaque, texto e CTAs do hero.
- Títulos e textos de categorias, cardápio, destaques e estado vazio.
- Fotos independentes de hero, apresentação e contato.
- Benefícios editáveis, respeitando a disponibilidade real das funções.
- Título do carrinho, CTA, introdução e confirmação do WhatsApp.
- Limite de quantidade e visibilidade do subtotal.
- Ícones por categoria, categoria do banner, título, CTA e fotografia.
- Etapas, apresentação, contato e footer.
- Ordem e visibilidade de menu/carrinho, banner, etapas, sobre e contato.

Nome, logo, subtítulo, contatos e catálogo são compartilhados entre A/B. Cores, textos e imagens exclusivos do B não alteram o renderizador A. A restauração visual do B preserva a configuração do A, produtos e dados confirmados. Excluir uma categoria limpa também as referências digitais de ícone/banner, preservando produtos sem categoria.

Mantidos `schemaVersion = 1` e `restaurantDesign.version = 1`; a extensão digital é opcional. Registros anteriores continuam válidos.

## Migration e segurança

Nova migration incremental: `supabase/migrations/202611040001_restaurant_digital.sql`. Ela envolve o validador de restaurantes existente e valida a extensão digital, incluindo versões, limites, imagens, enums e referências a categorias. Não altera migrations anteriores nem cria tabelas ou endpoints de pedidos.

Zod valida no cliente e no serviço de escrita; PostgreSQL valida a persistência. Mantidos Auth, `admin_users`, RLS, revisão otimista, slugs, distribuição A/B e prévia autenticada. A migration foi aplicada somente ao PGlite dos testes, sem escrita no Supabase remoto. Nenhuma publicação, deploy, commit ou push foi realizado.

## Arquivos

Criados:

- `src/templates/restaurants/digital/index.tsx`
- `src/templates/restaurants/digital/cart.ts`
- `src/templates/restaurants/digital/cart-panel.tsx`
- `src/templates/restaurants/digital/model.ts`
- `src/templates/restaurants/digital/icons.tsx`
- `src/templates/restaurants/digital/digital.css`
- `src/components/prototypes/restaurant-digital-controls.tsx`
- `supabase/migrations/202611040001_restaurant_digital.sql`
- `tests/restaurant-digital.test.ts`
- Este documento.

Modificados:

- `src/lib/generation/restaurant-design.ts`: contrato opcional digital e referências a categorias.
- `src/templates/registry.tsx` e `src/lib/generation/registry.ts`: renderer B.
- `src/config/catalog.ts`: oitavo conceito disponível.
- `src/components/prototypes/prototype-list.tsx`: integração dos controles B e stylesheet.
- `src/components/prototypes/restaurant-controls.tsx`: seleção A/B dentro do mesmo editor e preservação dos dados compartilhados.
- `src/app/preview/prototipos/[id]/page.tsx`: stylesheet isolado do B.
- `tests/generation-database.test.ts`: migration, gravação/releitura, compatibilidade e RLS.
- `tests/generation.test.ts`, `tests/restaurant-templates.test.ts` e `tests/real-estate-personal.test.ts`: expectativas do registro completo de oito renderizadores.

Os componentes e estilos dos sete templates anteriores não foram modificados. As alterações preexistentes no repositório foram preservadas.

## Testes e pendências

- 133 testes automatizados passaram, sem falhas.
- Testes específicos: cards, disponibilidade, categorias ocultas, carrinho, limites, cálculos em centavos, atualização de preços, bloqueio de demonstrações, observações e Unicode, número/URL do WhatsApp, banner, personalização, editor, registro e botão “Ver site”.
- Banco de teste: configuração digital com o mesmo catálogo, persistência/releitura, revisão antiga rejeitada, opções inválidas rejeitadas e ausência de acesso para não administradores.
- Teste de regressão compara o HTML do A antes/depois de configurar a identidade exclusiva do B.
- ESLint e TypeScript passaram. Build de produção passou.
- Teste HTTP de proteção das prévias contra o build local passou; visitante não recebe personalização e `/p` continua inexistente.
- Não foram realizados testes no Supabase remoto nem envio de pedidos reais.

Pendências: aplicar a migration no ambiente de desenvolvimento, fornecer fotos de produtos compatíveis, cadastrar o cardápio confirmado e revisar o resultado em navegador nas larguras 360, 390, 768, 1024 e 1440 px. É necessário testar visualmente menu mobile, filtros, drawer, foco, retorno de foco, contador, botões de quantidade, acessibilidade e overflow. Não há declaração de aceite visual ou validação mobile sem essa revisão.

## Como visualizar e testar

1. Aplicar `202611040001_restaurant_digital.sql` no ambiente de desenvolvimento após as migrations anteriores. Ela é necessária para salvar a configuração digital.
2. Entrar como administrador no Studio e gerar **Restaurantes → Variante B**, ou trocar um rascunho compatível para B.
3. No editor, abrir **Cardápio Digital e Pedidos — Restaurantes B**. Confirmar o WhatsApp com prefixo internacional, como `+55...`, e os demais contatos reais.
4. Cadastrar categorias e produtos com nomes, preços e fotos próprios. Exemplos demonstrativos permanecem bloqueados para pedido.
5. Configurar a aparência digital, salvar a revisão e usar **Ver site**. A prévia continua privada em `/prototipos/{id}/preview` e `/preview/prototipos/{id}`.
6. Selecionar categorias, adicionar produtos disponíveis, alterar quantidades, remover, limpar e preencher observações. Conferir o total estimado e o limite configurado.
7. Conferir o resumo antes de clicar em finalizar. O botão abre a mensagem no WhatsApp, sem envio automático; abrir não conclui o pedido.
8. Usar o seletor de larguras existente para a revisão responsiva. Em mobile, testar header, botão fixo e drawer.
