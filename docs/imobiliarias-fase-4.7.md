# Fase 4.7 — Corretor Pessoal (Template B)

Implementação do renderer `imobiliarias-b`, integrada ao Studio e ao editor de personalização existente. O Template A não teve seus componentes, estilos, catálogo ou modelo modificados. O repositório já continha alterações de fases anteriores; esta entrega não as remove.

## Composição e referência

O B adota a sequência da referência Marina Costa: header claro, marca pessoal com monograma, hero com texto à esquerda e fotografia à direita, destaque terracota, barra sobreposta de três diferenciais, biografia, catálogo editorial, etapas, banner fotográfico, consultoria, contato e rodapé escuro. Usa títulos Georgia, textos sans-serif, linhas discretas, botões arredondados e as cores iniciais solicitadas.

Há diferenças intencionais: o nome vem dos dados confirmados; não há imóveis fictícios criados automaticamente; não há retrato local disponível. A composição padrão usa ambientes ilustrativos no lugar do retrato. O catálogo vazio é explicitamente identificado. A fidelidade visual não foi aprovada: não foi possível inspecionar o resultado no navegador.

## Fotografias

Reutilizadas, sem downloads ou arquivos inventados:

- `/templates/real-estate/shared/real-estate-apartment-interior.png`: hero neutro, banner e fotografia complementar.
- `/templates/real-estate/shared/real-estate-property-tour.png`: apresentação.
- `/templates/real-estate/shared/real-estate-client-consultation.png`: consultoria.

O asset `real-estate-luxury-house-hero.png` continua disponível no seletor compartilhado. Todas as fotografias padrão têm identificação ilustrativa, `next/image`, enquadramento configurável e fallback de carregamento.

Não há catálogo de retratos disponíveis, nem URLs externas. Os caminhos de fotografias reais devem corresponder a arquivos autorizados instalados em `public/templates/real-estate/`. O editor recebe o caminho local; não foi criado um serviço de upload. Caminhos válidos sem arquivo resultam no fallback. Retratos substitutos têm classificação demonstrativa explícita, texto alternativo e posição. Ao remover o caminho de um retrato configurado, o B apresenta uma composição tipográfica com monograma.

## Personalização e catálogo

Mantido `realEstateDesign.version = 1`, com extensão opcional `personal.version = 1`. Registros antigos continuam válidos. A extensão contém nome de apresentação, destaque do hero, diferenciais e retratos hero/about. Nome comercial e contatos continuam nos dados confirmados existentes.

O mesmo editor permite cores, tipografia, logo, monograma, complemento profissional, CRECI confirmado, e-mail, textos, CTAs, biografia, fotos, enquadramento, etapas, ordem e visibilidade das seções de conteúdo e restauração com confirmação. Hero, header, barra de diferenciais e footer fazem parte da estrutura fixa. A linguagem institucional é selecionada explicitamente pelo tipo de atendimento; não se infere gênero ou experiência.

`realEstateDesign.properties` permanece o único catálogo: até 48 imóveis, 10 fotos por imóvel, inclusão, edição, exclusão, ordem, destaque, finalidade, tipo, status, valores e características opcionais. Os cards do B apresentam detalhes expansíveis e galeria; exemplos demonstrativos recebem aviso e não têm CTA de negociação. Imóveis inativos ficam ocultos. Nenhuma propriedade é criada por padrão. WhatsApp depende de número válido com prefixo internacional explícito; outro canal confirmado é usado quando necessário. Seções ocultas não deixam links de navegação correspondentes.

## Persistência e segurança

Migration incremental: `supabase/migrations/202611030006_real_estate_personal.sql`. Ela preserva o validador anterior como base e valida a extensão pessoal, com limites, tipos, caminhos locais e rejeição de chaves desconhecidas. Nenhuma tabela adicional foi criada. A migration foi executada somente no banco PGlite dos testes, não no Supabase remoto.

Mantidos Supabase Auth, autorização administrativa, RLS, revisão otimista, slug, motor A/B e prévia autenticada. Não houve publicação, deploy, commit ou push.

## Arquivos desta fase

- `src/templates/real-estate/personal/index.tsx`
- `src/templates/real-estate/personal/content.ts`
- `src/templates/real-estate/personal/personal.css`
- `src/templates/registry.tsx`
- `src/lib/generation/registry.ts`
- `src/lib/generation/real-estate-design.ts`
- `src/components/prototypes/real-estate-controls.tsx`
- `src/components/prototypes/prototype-list.tsx`
- `src/app/preview/prototipos/[id]/page.tsx`
- `src/config/catalog.ts`
- `supabase/migrations/202611030006_real_estate_personal.sql`
- `tests/real-estate-personal.test.ts`
- `tests/real-estate-templates.test.ts`
- `tests/generation.test.ts`
- `tests/generation-database.test.ts`
- Este documento.

## Verificações

- ESLint: passou.
- TypeScript: passou.
- Build de produção: passou.
- Suíte automatizada: 112 testes passaram, nenhum falhou.
- HTTP contra build local: 1 teste passou; prévias redirecionam visitantes, não expõem personalização e usam cabeçalhos de proteção; rota pública `/p` continua inexistente.
- Testes do B: composição, ausência de dados inventados, substituição/classificação/remoção de retratos, enquadramento, contatos, campos opcionais, linguagem institucional, ordem e ocultação, catálogo compartilhado, versões, validação e gravação/releitura com revisão administrativa.
- Não foram executados testes contra o Supabase remoto.

O primeiro comando de testes encontrou `spawn EPERM` no sandbox; a execução autorizada com subprocessos concluiu. O controle de navegador não disponibilizou acesso ao host e encerrou a tentativa nativa por não conseguir confirmar a URL ativa. Nenhuma aprovação visual é declarada.

## Como visualizar

1. Aplicar a migration incremental no ambiente de desenvolvimento pelo processo habitual do projeto, após as migrations anteriores.
2. Entrar no Studio como administrador e abrir **Protótipos**.
3. Gerar um protótipo do nicho Imobiliárias com variante B, ou editar um existente e selecionar **Corretor Pessoal**, desde que o registro do template esteja ativo.
4. Ajustar os dados confirmados e abrir **Corretor Pessoal — Template B** no editor. Salvar a revisão.
5. Abrir a prévia privada em `/prototipos/{id}/preview`; o iframe usa `/preview/prototipos/{id}`.
6. Revisar as larguras 360, 390, 768, 1024 e 1440 px no seletor existente.

Pendências: inspeção visual real nessas cinco larguras, interação do menu mobile no navegador, seleção de retratos autorizados e aplicação da migration no ambiente de desenvolvimento. Os breakpoints foram implementados, mas overflow e proporções ainda precisam dessa revisão visual.
