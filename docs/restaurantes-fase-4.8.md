# Fase 4.8 — Restaurantes A: Gastronômico Premium

## Implementação e referência OLIVA

Renderer `restaurantes-a` integrado ao motor e às prévias privadas. A composição segue a referência: header verde-floresta com símbolo botânico original, hero fotográfico com título serifado, botões dourado e transparente, introdução creme, fotografia gastronômica em duas colunas, cardápio em cards, apresentação/história, galeria, faixa verde de contato, informações e rodapé.

As cores iniciais são `#18382D`, `#14241D`, `#F7F2E9`, `#E7DDCE`, `#BDA477`, `#FFFFFF` e `#49382D`. Títulos usam Georgia ou Palatino, sem dependência de fontes externas. Todos os estilos ficam sob `.restaurantPremium`, sem alterar o visual administrativo ou os seis templates anteriores.

O nome OLIVA, seus pratos, preços, endereço e história não foram incorporados aos dados reais. Nome e contatos vêm dos campos confirmados do lead. Textos padrão são neutros e editáveis; não afirmam tradição, ingredientes, técnicas, reservas ou serviços específicos. O segmento é selecionado explicitamente e define o complemento da marca; fotos e seções incompatíveis podem ser substituídas ou ocultadas pelo administrador.

Não há aceite visual: o host de acesso ao navegador estava indisponível. Os breakpoints foram implementados, mas as proporções finais, overflow e interações precisam de inspeção real em navegador.

## Imagens verificadas

Os quatro arquivos existentes foram inspecionados visualmente, sem novos downloads:

| Arquivo em `public/templates/restaurants/shared/` | Uso padrão                                                                |
| ------------------------------------------------- | ------------------------------------------------------------------------- |
| `restaurant-dining-room.png`                      | Hero e primeira/terceira imagem da galeria, com enquadramentos diferentes |
| `restaurant-dish-closeup.png`                     | Gastronomia e referência visual do estado sem cardápio                    |
| `restaurant-service.png`                          | Apresentação/história                                                     |
| `restaurant-bar-ambience.png`                     | Galeria e fotografia complementar do contato                              |

Todas as imagens padrão têm identificação de referência ilustrativa. Não representam necessariamente as instalações ou os pratos do estabelecimento. O símbolo botânico é SVG original em código, sem copiar o logotipo OLIVA.

As fotografias usam `next/image`, `fill`, `sizes`, proporções controladas, carregamento prioritário somente no hero e fallback em erro. O editor aceita caminhos locais de arquivos autorizados em `public/templates/restaurants/`, enquadramento, alt, legenda e classificação ilustrativa. Não foi criado serviço de upload. Um caminho sem arquivo real exibe fallback, sem inventar URL.

## Cardápio e personalização

O editor administrativo existente ganhou o bloco **Gastronômico Premium — Restaurantes A**. Nenhum produto é cadastrado automaticamente.

| Recurso               | Comportamento                                                                                               |
| --------------------- | ----------------------------------------------------------------------------------------------------------- |
| Produtos              | ID, nome, descrição, categoria, fotografia, preço opcional, disponibilidade, destaque e ordem               |
| Categorias            | Nome, ordem e visibilidade; ocultar uma categoria oculta seus produtos                                      |
| Reordenação           | Produtos e categorias possuem controles de subir/descer                                                     |
| Exclusão de categoria | Preserva os produtos, deixando-os sem categoria                                                             |
| Destaques             | Aparecem primeiro; a ordem é preservada dentro de cada grupo                                                |
| Disponibilidade       | Produtos indisponíveis não aparecem no site                                                                 |
| Exibição inicial      | Três produtos por padrão, configurável entre 1 e 24; botão expande o restante                               |
| Filtros               | Categorias visíveis com produtos disponíveis; links de categorias no rodapé                                 |
| Preço                 | Número finito entre zero e R$ 1 milhão, formatado em reais; nulo fica oculto                                |
| Demonstração          | Produto ilustrativo exige marcação explícita e recebe aviso de que não é oferta                             |
| Fotos dos produtos    | Produto real exige fotografia própria quando há imagem; assets compartilhados só em exemplos demonstrativos |
| Sem cardápio          | Bloco ilustrativo sem produto/preço fictício; CTA principal usa contato confirmado                          |
| Sem produtos visíveis | Estado informa ausência de produtos disponíveis, preservando o cadastro                                     |

Limites: 60 produtos, 16 categorias, 12 fotografias de galeria, 250 KB de configuração. A galeria permite adicionar, remover, ordenar, legendar e reenquadrar imagens.

Campos visuais e institucionais: logo, símbolo botânico/monograma/nenhum, subtítulo, segmento, duas tipografias, sete cores, hero e CTAs, introdução, gastronomia, história, títulos e textos das demais seções, fotografias, galeria, e-mail, horários confirmados, ordem e visibilidade das sete seções de conteúdo. Header, hero e footer são estruturais. Restaurar padrões visuais pede confirmação e preserva produtos, categorias, e-mail, horários e segmento.

Nome, endereço, cidade, estado, telefone, WhatsApp, Instagram, descrição e site usam os campos confirmados existentes. Campos ausentes ficam ocultos. WhatsApp só é usado com número válido e prefixo internacional explícito; na ausência dele, prioriza telefone, e-mail, site ou Instagram confirmados. Sem canal, os CTAs de informação não abrem contatos inventados. Não há checkout, pedidos ou reservas automáticas.

## Persistência e segurança

Extensão opcional `restaurantDesign.version = 1` dentro de `customization_data`, mantendo `schemaVersion = 1` e a compatibilidade com registros anteriores. Não foi criada tabela de produtos nem um segundo editor.

Migration incremental: `supabase/migrations/202611030007_restaurant_premium.sql`. Ela adiciona validadores SQL e envolve o validador anterior sem modificar migrations já existentes. Valida versão, nicho, textos simples, limites, identificadores, referências de categorias, preços, booleanos, imagens, cores e chaves desconhecidas. Zod valida o mesmo contrato no editor e no serviço de escrita.

Preservados Auth, `admin_users`, RLS, controle otimista de revisão, slugs, rascunhos e prévia autenticada. A migration foi aplicada somente no PGlite de testes. Nenhuma escrita no Supabase remoto, publicação, deploy, commit ou push foi executada.

## Arquivos desta fase

Criados:

- `src/lib/generation/restaurant-design.ts`
- `src/templates/restaurants/premium/index.tsx`
- `src/templates/restaurants/premium/model.ts`
- `src/templates/restaurants/premium/photo.tsx`
- `src/templates/restaurants/premium/photography.ts`
- `src/templates/restaurants/premium/premium.css`
- `src/components/prototypes/restaurant-controls.tsx`
- `supabase/migrations/202611030007_restaurant_premium.sql`
- `tests/fixtures/restaurant.ts`
- `tests/restaurant-templates.test.ts`
- Este documento.

Modificados:

- `src/lib/generation/contracts.ts`: extensão opcional e restrição ao nicho Restaurantes.
- `src/lib/generation/registry.ts`: disponibiliza somente Restaurantes A; B permanece sem renderer.
- `src/templates/registry.tsx`: componente e adaptador do A.
- `src/config/catalog.ts`: conceito A marcado como disponível.
- `src/components/prototypes/prototype-list.tsx`: estado, salvamento e controles do restaurante no editor existente.
- `src/app/preview/prototipos/[id]/page.tsx`: stylesheet isolado.
- `tests/generation.test.ts`: expectativa do registro atualizado.
- `tests/generation-database.test.ts`: migration, CRUD, revisão e autorização do cardápio.

O botão **Ver site** já consulta o registro central desde a correção anterior e foi coberto por teste específico para Restaurantes A. Os dados e componentes dos templates anteriores foram preservados. O repositório já continha alterações de outras fases antes deste trabalho.

## Verificações

- ESLint: passou, sem avisos na rodada final.
- TypeScript strict: passou.
- Build de produção: passou.
- Suíte automatizada: 123 testes passaram, nenhum falhou.
- HTTP contra build local: teste de proteção das prévias passou; visitante é redirecionado ao login sem receber personalização; `/p` permanece inexistente.
- Testes do restaurante: composição, existência dos assets, menu vazio/preenchido/indisponível, preços, categorias, ordem, destaque, limite inicial, contatos, campos ausentes, fotos próprias/ilustrativas, personalização, editor, renderer e botão Ver site.
- Banco PGlite: gravação/releitura, alteração/exclusão, compatibilidade, bloqueio de revisão antiga, validação SQL e ocultação/rejeição de escrita para usuário não administrador.
- Sem testes contra Supabase remoto.

## Como visualizar no Studio

1. Aplicar a migration incremental no ambiente de desenvolvimento pelo processo habitual, após as migrations anteriores. Ela é necessária para salvar `restaurantDesign` no banco desse ambiente.
2. Entrar como administrador e gerar um rascunho do nicho **Restaurantes**, variante **A — Gastronômico Premium**. Também é possível trocar um rascunho compatível para A no editor.
3. Em **Protótipos**, clicar no ícone de edição, abrir **Gastronômico Premium — Restaurantes A** e ajustar os dados, fotos e cardápio.
4. Salvar a revisão e clicar em **Ver site**. A página `/prototipos/{id}/preview` abre a prévia autenticada `/preview/prototipos/{id}`.
5. Usar o seletor existente para revisar 360, 390, 768, 1024 e 1440 px.

Pendências para aceite comercial: aplicar a migration no ambiente de desenvolvimento, preencher dados e imagens autorizados, revisar efetivamente as cinco larguras, menu mobile, filtros/expansão do cardápio, contraste e proporções. Não se declara validação visual nem aprovação mobile sem essa inspeção.
