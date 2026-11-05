# Central de Publicação — Fase 5.2

## Arquitetura e arquivos

A rota administrativa `/publicacoes` concentra listagem, seleção, revisão e compartilhamento, sem sobrecarregar o editor em `/prototipos`. A navegação administrativa e o resultado da geração apontam para a Central; os IDs recém-gerados restringem a listagem, sem publicar automaticamente.

Arquivos novos: `src/app/(admin)/publicacoes/page.tsx`, `actions.ts`, `src/components/prototypes/publication-center.tsx`, `src/lib/publication-center.ts`, `supabase/migrations/202611050001_publication_center.sql` e `tests/publication-center.test.ts`.

Integrações modificadas: ações, página e lista de protótipos; ações e painel individuais de publicação; painel de geração; navegação administrativa; proxy de autenticação; estilos administrativos; tipos do banco; testes HTTP da marca e testes SQL de publicação. Os oito renderizadores comerciais permanecem intactos.

## Consulta e banco

A migration incremental adiciona somente a RPC de leitura `list_publication_center(jsonb)`, com `security invoker`, checagem de administrador e RLS existente. O SQL completo está no arquivo da migration para revisão. Não modifica migrations anteriores, tabelas, políticas ou funções de escrita. Não foi aplicada ao Supabase remoto.

A projeção retorna metadados, nome público e revisões, sem transportar os snapshots completos. Busca normalizada, filtros combinados, ordenação estável e paginação de 25 são executados no banco. As métricas globais vêm da mesma consulta. Bloqueios são apresentados explicitamente como resultados da revisão da sessão, sem supor validação profunda da base inteira. A consulta percorre metadados da base para os contadores; para volumes muito superiores a centenas, medir o plano antes de adicionar índices ou agregações persistentes.

## Fluxo e segurança

1. Filtrar e selecionar até 25 itens. A seleção entre páginas e filtros permanece visível, com nomes e remoção individual. Selecionar a página afeta somente os itens visíveis.
2. Revisar os selecionados. Cada requisição chama a ação individual `reviewPublication`, com autenticação, `admin_users`, compatibilidade do template, `publicSnapshot`, schema público e verificação de assets existentes. Itens bloqueados não são enviados para publicação.
3. Conferir conteúdo e avisos e marcar a autorização explícita. A confirmação publica os aptos, incluindo aqueles com avisos não impeditivos.
4. O navegador coordena requisições sequenciais à ação existente `publishPrototype`. Cada requisição reautentica, revalida conteúdo e revisão e usa a RPC transacional da Fase 5.1. Não existe outro mecanismo de gravação.
5. A RPC bloqueia a linha do protótipo e verifica revisão do rascunho, versão da publicação e igualdade do snapshot. Concorrência conflitante e revisão obsoleta são rejeitadas. Republicação mantém o slug; falha preserva o snapshot anterior.
6. O progresso avança somente após respostas reais. Falha isolada não cancela os demais. Resposta de rede incerta nunca vira sucesso nem é repetida automaticamente. Para tentar novamente, consultar e revisar as falhas.

O lote não é um job persistente. Recarregar ou fechar a página pode interromper a coordenação; publicações já confirmadas continuam gravadas. Despublicação permanece individual, com confirmação e versão atual. As ações invalidam `/p/[slug]`, `/prototipos` e `/publicacoes`; a leitura pública continua sem cache de dados.

## Compartilhamento

Copiar e exportar consultam novamente o servidor e incluem somente publicações ativas selecionadas. URLs usam `STUDIO_PUBLIC_URL`, validada pela função da Fase 5.1, que recusa localhost em produção. CSV tem BOM UTF-8, separador ponto e vírgula, aspas escapadas, proteção contra fórmulas e apenas empresa, nicho, template, status, URL e data. A exportação de resultados distingue bloqueados, falhas e pendentes, sem atribuir a eles sucesso ou URL da execução.

## Como testar

Após revisar e aplicar a migration em ambiente de teste, configurar `STUDIO_PUBLIC_URL` e autenticar um administrador. Abrir `/publicacoes`, filtrar por empresa/nicho/template/estado/alterações, alternar páginas e conferir seleção. Revisar itens válidos e bloqueados, confirmar os aptos e conferir cada resultado e `/p/[slug]`. Editar um rascunho entre revisão e confirmação deve recusar a publicação; revisar novamente deve permitir republicar preservando o slug. Conferir despublicação, cópia de links e CSV com acentos, aspas e nomes iniciados por `=`. Gerar protótipos e seguir “Revisar para publicação”.

Validar visualmente a sessão autenticada em 360, 390, 768, 1024 e 1440 px. Em mobile a tabela se torna uma lista compacta e a seleção da página também está disponível na barra de ações.

## Verificação e implantação

ESLint e TypeScript aprovados; suíte automatizada: 149 testes aprovados, incluindo SQL executado em PGlite com migrations reais, RLS, paginação, concorrência e snapshots. Build de produção aprovado. Integração com Supabase remoto e inspeção visual autenticada ainda precisam ser realizadas; o host de acesso ao navegador não estava disponível nesta sessão.

Antes de um futuro deploy na Vercel: revisar/aplicar a migration incremental, configurar a URL pública HTTPS e as variáveis Supabase existentes e validar com administrador em staging. A rota declara `maxDuration = 30`; o lote usa uma requisição por item para evitar uma execução única longa. Não há dependência nova, fila ou service role no cliente. Nenhum deploy, commit ou push foi executado.
