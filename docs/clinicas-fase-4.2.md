# Clínicas — Template A, fase 4.2

## Implementação

O Template A passa a seguir a referência de composição: header claro, hero fotográfico com texto sobreposto, faixa de atalhos, especialidades, Sobre em duas colunas, galeria, faixa verde de contato, avaliações opcionais e rodapé com canais confirmados. Tipografia sem serifa, verde natural e marfim, cantos suaves e espaçamentos responsivos. O menu mobile reutiliza o componente existente, incluindo Escape e navegação por âncoras.

Serviços só são exibidos quando informados nos dados confirmados. Não são geradas avaliações, profissionais, horários ou promessas de agendamento. Avaliações exigem nome, texto, fonte HTTP(S) e confirmação administrativa de autorização. Essa confirmação não verifica automaticamente a autenticidade da fonte.

## Imagens

Os quatro arquivos foram verificados em `public/templates/clinics/shared/`:

| Arquivo | Aplicação | Dimensões |
| --- | --- | --- |
| clinic-reception-hero.png | Hero e terceira imagem da galeria | 1448 × 1086 |
| doctor-consultation-main.png | Sobre | 1122 × 1402 |
| clinic-room-structure.png | Primeira imagem da galeria | 1448 × 1086 |
| consultation-detail.png | Segunda imagem da galeria | 1122 × 1402 |

São imagens ilustrativas, identificadas junto às fotografias e na galeria. `next/image` mantém otimização, prioridade do hero, dimensões e `sizes`; as imagens restantes usam carregamento tardio. Há fallback de erro. Imagens médicas só são padrão para a especialidade generalista. Odontologia, estética, fisioterapia, psicologia e veterinária usam fallback neutro até a escolha administrativa de assets compatíveis. Não foram obtidas imagens externas.

Substituições usam caminhos locais sob `/templates/clinics/`, nos formatos PNG, JPEG ou WebP. Adicionar arquivos reais nesse diretório e informar o caminho no editor; não há upload para Storage nesta fase. O editor oferece seleção dos quatro assets existentes e enquadramento à esquerda, ao centro ou à direita. As legendas permanecem conservadoramente ilustrativas.

## Personalização e compatibilidade

O contrato principal continua em `schemaVersion: 1`. Uma extensão opcional `clinicDesign`, com `version: 1` própria, acrescenta opções sem reescrever snapshots existentes. O renderizador usa defaults quando a extensão está ausente. Nome, especialidade, serviços, descrição e contatos continuam nos dados confirmados; título e introdução continuam nos campos ilustrativos existentes. O Template B não foi modificado.

Novas opções: logotipo local, subtítulo da marca, descrição do hero, títulos das seções, descrições por serviço, CTA, cores controladas para identidade/fundo/botões, quatro slots de imagem, enquadramentos, ordem e visibilidade de quatro seções, avaliações autorizadas com fonte. Ordem é controlada sem drag-and-drop: desativar e reativar move a seção ao final. O contato básico continua acessível mesmo com a faixa de contato desativada.

## Editor

Em **Protótipos → editar/conferir**, os campos comerciais e textos existentes continuam disponíveis. A área de personalização visual organiza identidade/conteúdo, imagens, aparência, serviços e avaliações em grupos expansíveis, preservando a identidade do painel.

**Pré-visualizar alterações sem salvar** renderiza o rascunho em um iframe com estilos e viewport próprios. Larguras disponíveis: 360, 390, 768, 1024 e 1440px. A restauração exige confirmação e afeta somente a extensão visual, preservando dados comerciais e textos-base. Erros do schema impedem salvar e aparecem no painel. A gravação usa a ação existente e `expectedRevision`, mantendo a proteção contra edição concorrente. Reabrir o registro carrega os dados persistidos.

## Migration necessária

Revisar e aplicar `supabase/migrations/202611030001_clinic_design.sql` em homologação **antes de salvar opções novas**. A migration substitui somente a função de validação para aceitar a extensão opcional e validar suas chaves, versão, cores, caminhos locais, seções, enquadramentos e autorização das avaliações. Mantém a validação original dos demais campos e as proteções existentes de Auth, administradores, RLS e revisão. Nenhuma migration anterior foi editada. A migration não foi aplicada no Supabase remoto por esta execução.

## Arquivos desta implementação

- `src/templates/clinics/premium/index.tsx`: composição e conteúdo dinâmico.
- `src/templates/clinics/premium/premium.css`: direção visual e breakpoints do A.
- `src/templates/clinics/premium/photography.ts`: pacote local e dimensões verificadas.
- `src/templates/clinics/premium/photo.tsx`: imagem responsiva e slot de consultório.
- `src/templates/clinics/shared/adapter.ts`: transporte da extensão ao modelo.
- `src/lib/generation/contracts.ts`: validação e tipo da extensão opcional.
- `src/components/prototypes/clinic-design-editor.tsx`: novos controles administrativos.
- `src/components/prototypes/draft-preview.tsx`: documento isolado para prévia responsiva.
- `src/components/prototypes/prototype-list.tsx`: integração com o fluxo existente.
- `supabase/migrations/202611030001_clinic_design.sql`: validação incremental.
- `tests/clinic-templates.test.ts`: renderização, compatibilidade, especialidades e dados inválidos.
- `tests/generation-database.test.ts`: migration, gravação e releitura da extensão no PostgreSQL de testes, preservando cenários de RLS e concorrência.
- Este documento.

O workspace já tinha alterações de fases anteriores; elas foram preservadas. Não houve commit, push, deploy, novo projeto ou instalação de dependências.

## Verificações e pendências

ESLint e TypeScript aprovados. Suíte automatizada: **78 testes aprovados, zero falhas e zero skips**, incluindo gravação/releitura da extensão, RLS e concorrência. Build de produção aprovado. O teste de banco usa PostgreSQL local via PGlite e não equivale a testar uma conta de homologação no Supabase.

**Aceite visual pendente:** a revisão no navegador não pôde ser concluída. O acesso ao browser informou host indisponível e a alternativa de computer-use encerrou o acesso por não conseguir determinar a URL atual do Chrome com confiança suficiente. Nenhuma das cinco larguras pode ser declarada visualmente aprovada. Faltam inspecionar enquadramento, contraste, overflow, menu interativo, foco e leitura nas cinco larguras, além de salvar/reabrir um protótipo em homologação após aplicar a migration.

## Como visualizar

1. Executar `npm.cmd run dev` no Windows e entrar com um administrador.
2. Abrir **Protótipos → Ver site** em um protótipo de Clínicas, variante **A — Institucional Premium**.
3. Para editar, abrir o editor do rascunho, alterar os campos e usar a prévia antes de salvar.
4. Após a migration em homologação, salvar, reabrir e conferir a persistência. Na visualização, usar **Recarregar dados salvos**.
5. Conferir desktop e mobile nas cinco larguras. A rota `/preview/prototipos/[id]` permanece privada; `/p/[slug]` continua sem publicação.
