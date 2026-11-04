# Fase 4.6 — Imobiliárias e Corretores A

## Entrega e referência

Template Imobiliária Premium implementado no repositório existente, sem deploy, commit, push ou publicação. Preserva os renderizadores aprovados de Clínicas A/B e Advocacia A/B.

A composição segue a referência AURORA: header azul-marinho, identidade dinâmica com símbolo de edificação, hero fotográfico com texto serifado sobreposto à esquerda, busca sobreposta, catálogo em três colunas, apresentação em duas colunas, categorias fotográficas, etapas numeradas, editorial, faixa de contato, contato e rodapé. A marca AURORA e seus anúncios não foram copiados. O catálogo vazio usa uma composição institucional com imagem ilustrativa e aviso de ausência de anúncios, sem busca ou categorias vazias. Sem catálogo confirmado, não há promessa de imóveis disponíveis.

Paleta padrão: #142B35, #596A53, #F8F7F3, #EAE5DC, #C0A77B, #FFFFFF e #252B2B. Títulos Georgia/Times e corpo Arial/Helvetica. Breakpoints dedicados para desktop, tablet e smartphone, incluindo navegação mobile e composição específica para busca, etapas e detalhes.

## Arquivos da fase

Novos:

- `src/lib/generation/real-estate-design.ts`: contratos Zod e limites.
- `src/templates/real-estate/premium/index.tsx`: composição, catálogo, busca, categorias e detalhes em dialog nativo.
- `src/templates/real-estate/premium/catalog.ts`: filtros tipados e formatação monetária.
- `src/templates/real-estate/premium/model.ts`: adaptação dos dados confirmados.
- `src/templates/real-estate/premium/photo.tsx`, `photography.ts` e `premium.css`: fotos otimizadas, fallback e CSS isolado.
- `src/components/prototypes/real-estate-controls.tsx`: edição integrada.
- `supabase/migrations/202611030005_real_estate_premium.sql`: validação SQL incremental.
- `tests/real-estate-templates.test.ts`: cobertura do template, catálogo, busca, dados e privacidade.

Integrações alteradas: `contracts.ts`, registros de geração e renderização, catálogo do Studio, editor/listagem de protótipos, CSS da prévia privada e testes de geração/banco. Nenhuma migration anterior foi modificada. Os 24 arquivos dos templates anteriormente aprovados foram comparados por hash e permanecem idênticos.

## Fotografias

As quatro fotografias (1448 × 1086 pixels) existentes foram verificadas no disco e inspecionadas visualmente, sem geração ou alteração nesta fase:

| Uso                        | Arquivo em public/templates/real-estate/shared/ |
| -------------------------- | ----------------------------------------------- |
| Hero                       | real-estate-luxury-house-hero.png               |
| Sobre                      | real-estate-property-tour.png                   |
| Editorial e catálogo vazio | real-estate-apartment-interior.png              |
| Contato                    | real-estate-client-consultation.png             |

Todas recebem identificação de imagem ilustrativa e texto alternativo correspondente. Não são apresentadas como imóveis reais ou como integrantes reais da equipe. Usam Next Image, prioridade no hero, carregamento sob demanda nas demais e fallback quando a foto estiver ausente. Fotos e enquadramento são editáveis. O editor recebe caminhos locais seguros; esta fase não inclui upload ou armazenamento externo.

## Catálogo e busca

Até 48 imóveis, 10 fotografias por imóvel e 400.000 bytes na extensão. Cada anúncio contém UUID, título, finalidade, tipo, cidade/bairro/endereço opcionais, preço/área/quartos/banheiros/vagas opcionais, descrição, imagens, status, destaque, identificação demonstrativa e informações adicionais. Campos ausentes ficam ocultos. Preços usam BRL e unidade mensal para locação.

O editor permite adicionar, editar, excluir, reordenar, alterar status/destaque/finalidade e fotos. O modo demonstração é explícito, aparece permanentemente nos cards e nos detalhes e não oferece negociação do exemplo. As fotos compartilhadas são rejeitadas em anúncios marcados como reais; fotos reais devem ser locais e autorizadas pelo administrador.

Busca combina finalidade, tipo, cidade/bairro e faixa de preço. Normaliza acentos e caixa, usa somente o catálogo salvo e mostra estado sem resultados com botão de limpar filtros. Anúncios inativos não aparecem. Categorias derivam dos anúncios visíveis, podem ser ocultadas e aplicam o filtro de tipo. Não existem categorias com anúncios inventados.

Detalhes usam `dialog.showModal()`, com foco modal nativo, fechamento por Escape, botão ou clique no fundo, galeria, preço, descrição e características confirmadas. Não há compra, reserva ou pagamento. Seu funcionamento interativo ainda depende da revisão no navegador.

## Personalização e persistência

Extensão opcional `realEstateDesign.version=1` no JSONB existente; versão raiz 1 preservada. Mantém slugs, origem do lead, dados confirmados e controle de concorrência por revisão esperada. Validação Zod no fluxo cliente/servidor e validação SQL na RPC. Não cria tabelas ou arquitetura comercial adicional.

Personalizáveis: nome e contatos confirmados, logo/símbolo/monograma, rótulo profissional, modo imobiliária ou corretor, CRECI informado, sete cores, duas famílias serifadas, títulos e textos de todas as seções, CTAs, fotos/alt/enquadramento, etapas, categorias, catálogo, ordem e visibilidade. Restaurar padrões visuais pede confirmação e preserva o catálogo e os contatos. Modo corretor adapta a apresentação e CTAs; não inventa equipe nem registro.

Aplicar a migration incremental `202611030005_real_estate_premium.sql` pelo fluxo habitual do projeto antes de salvar essa extensão no Supabase remoto. Ela foi testada localmente com PGlite; não foi aplicada remotamente nesta fase. Exige migrations anteriores, incluindo 004. Auth, admin_users, RLS, guards e controle de revisão foram mantidos. Prévia continua privada; `/p/[slug]` não é implementada.

## Como visualizar

No Studio autenticado, abra um protótipo de Imobiliárias, escolha A e clique em Ver site ou use a prévia do editor. Para testar o catálogo sem atribuir imóveis reais ao lead, escolha Adicionar exemplo demonstrativo, informe um título e selecione uma fotografia ilustrativa. Salve pelo fluxo normal após aplicar a migration. Use larguras 360, 390, 768, 1024 e 1440 no seletor de prévia.

## Validação e pendências

Validação final após estabilização dos arquivos compartilhados:

- ESLint: aprovado.
- TypeScript: aprovado.
- Build de produção Next.js: aprovado.
- Suíte conjunta: 111 testes aprovados, zero falhas; inclui os nove testes específicos de Imobiliárias A e CRUD SQL com releitura e concorrência.
- HTTP no build de produção em porta isolada: 1 teste aprovado, bloqueando acesso anônimo às duas prévias e mantendo `/p/[slug]` inexistente.
- Quatro fotografias: HTTP 200; hero 2.518.160 bytes, apresentação 2.221.650 bytes, interior 2.905.547 bytes e contato 2.183.171 bytes.
- Otimizador Next Image: HTTP 200, WebP de 121.060 bytes para hero com largura 1080.
- 24 arquivos dos templates anteriores: hashes idênticos ao início desta fase.

Durante a validação, outra sessão adicionou o Template B imobiliário, alterando registros, controles compartilhados e adicionando a migration 006. Essas alterações externas foram preservadas; a validação final já considera o estado integrado. A entrega específica da fase 4.6 é o Template A e a migration 005; a implementação do B não é atribuída a esta fase. A primeira tentativa HTTP no servidor de desenvolvimento existente retornou 404; a verificação válida acima foi executada no build de produção isolado na porta 3100. O servidor de desenvolvimento existente não foi encerrado ou reiniciado.

Revisão visual nas cinco larguras pendente: a ferramenta retornou `browsers: []` e `The browser access host is unavailable`. Não há aceite visual, nem afirmação de ausência de overflow baseada apenas em testes de código. As quatro fotografias foram inspecionadas individualmente, o que não substitui a conferência da página no navegador.
