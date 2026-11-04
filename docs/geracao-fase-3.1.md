# Motor de geração — Fase 3.1

## Entrega e arquivos

O motor cria registros privados em rascunho a partir de leads persistidos. Importação não gera protótipos automaticamente. Nenhum site comercial, renderer final, publicação, WhatsApp ou integração de IA é criado nesta fase.

Arquivos criados:

- `src/lib/generation/contracts.ts`: contratos Zod/TypeScript, filtros, limites e interface futura dos templates.
- `src/lib/generation/personalize.ts`: snapshot dos dados do lead e textos neutros centralizados por nicho.
- `src/lib/generation/registry.ts`: registro tipado das oito combinações nicho/variante, com renderizadores ainda ausentes.
- `src/lib/generation/service.ts`: orquestração independente da interface, autorização antes das operações, validação e replay.
- `src/lib/generation/batch-runner.ts`: execução sequencial em etapas de 25, conferência das atribuições revisadas, progresso e retomada do lote pendente.
- `src/app/(admin)/prototipos/actions.ts`: Server Actions protegidas, RPCs com cliente por requisição e invalidação do dashboard.
- `src/components/prototypes/generation-panel.tsx`: seleção e prévia de até 500 leads, com confirmação e progresso em lotes de 25.
- `supabase/migrations/202610280002_prototype_generation.sql`: integridade, planejamento A/B, criação atômica, edição e consultas paginadas.
- `tests/generation.test.ts`, `tests/generation-batches.test.ts`, `tests/generation-database.test.ts`, `tests/integration/generation.test.ts`: testes unitários, execução retomável, PostgreSQL local e concorrência remota opcional.

Arquivos atualizados: `src/types/database.ts`, `src/components/prototypes/prototype-list.tsx`, `prototype-table.tsx`, `src/app/(admin)/prototipos/page.tsx`, `src/app/globals.css`, `src/components/layout/admin-shell.tsx`, `src/config/catalog.ts`, `tests/integration/supabase.test.ts`, `README.md`, a nota histórica em `docs/importacao-fase-2.2.md` e este guia. Nenhuma nova dependência é necessária. Os indicadores do dashboard já utilizam contagens exatas do banco desde a Fase 2.2; as novas mutações invalidam seu cache.

## Migration para revisão

Não foi aplicada no Supabase remoto. Revise `202610280002_prototype_generation.sql` e aplique em homologação após as três migrations anteriores, usando o fluxo de migrations do projeto ou SQL Editor administrativo. Não edite migrations já aplicadas. Regenere os tipos pela CLI Supabase quando disponível; o espelho tipado do repositório inclui os novos contratos.

A migration:

1. Ativa os registros oficiais cujo slug corresponde a nicho/variante e cujo status ainda é `planned`. `active` significa disponível para gerar registros privados; não significa site pronto. Modelos `archived` não são reativados.
2. Adiciona `revision` em protótipos e a tabela privada por RLS `prototype_generation_requests`, com chave única do pedido e recibo persistido para replay.
3. Mantém `UNIQUE(lead_id)`, unicidade do slug e as FKs de compatibilidade existentes.
4. Instala validação e locks também em escritas diretas em protótipos/templates, para não depender do navegador.
5. Disponibiliza RPCs `SECURITY INVOKER`, com grants somente a `authenticated`, verificação explícita de `auth.uid()` e `private.is_admin()`, além das políticas RLS existentes.

Registros antigos não são redistribuídos, renomeados ou convertidos silenciosamente. Protótipos antigos com `customization_data` fora do contrato v1 permanecem legíveis na listagem, mas a interface bloqueia sua edição até uma revisão/migração específica. Os registros novos obedecem ao contrato.

## Distribuição A/B

O planejamento ordena os UUIDs dos leads, independentemente da ordem de seleção. Para cada nicho, conta todas as variantes já atribuídas e acrescenta as atribuições anteriores da mesma prévia. Escolhe a variante ativa menos utilizada; empate favorece A. Com ambas ativas e partindo de equilíbrio, a diferença fica em no máximo um. Um desequilíbrio manual anterior é reduzido pelas novas atribuições sem alterar os registros antigos.

Na escolha manual, A ou B precisa estar ativo e pertencer ao nicho do lead. No automático, se apenas uma variante estiver ativa, somente ela será utilizada; o equilíbrio não pode ser garantido nesse caso. Se nenhuma estiver ativa, o lead fica impedido. Leads com protótipo são identificados e ignorados; leads removidos ou com dados inválidos impedem a confirmação até serem corrigidos ou retirados.

A prévia inclui selecionados, elegíveis, ignorados, impedidos, motivos por lead e distribuição A/B por nicho. Sua impressão digital inclui atribuições e versões dos leads. Se o planejamento mudar antes de confirmar, a operação retorna conflito e pede nova prévia.

## Personalização e contrato futuro

`customization_data` usa `Personalization` e `personalizationSchema`:

```ts
{
  schemaVersion: 1,
  sourceLeadId: "UUID do lead",
  sourceUpdatedAt: "timestamp com precisão original do banco",
  confirmedOrigin: "lead_snapshot", // ou admin_review após edição
  confirmed: {
    name, niche, specialty, city, state, address,
    phone, whatsapp, website, instagram, description, services
  },
  illustrative: {
    label: "Conteúdo de demonstração",
    headline, introduction, plannedSections
  },
  missingFields: [/* campos opcionais sem informação */]
}
```

Ausências são `null` ou listas vazias. Telefones permanecem strings. A geração usa dados reais disponíveis e textos neutros, sem inventar profissionais, depoimentos, avaliações, tratamentos, certificações, imóveis, pratos, preços, horários ou resultados. O bloco ilustrativo tem identificação obrigatória e separada, inclusive na prévia técnica. Um conteúdo informado pelo administrador é identificado como revisão administrativa; editar o protótipo não altera o lead original.

Na criação, o SQL compara os dados confirmados e a versão com o lead corrente; não aceita um snapshot inventado pelo cliente. A geração monta a personalização no servidor. Na edição, Zod e SQL validam novamente tipos, URLs, comprimentos, chaves permitidas, lista de ausências e vínculo com o lead/nicho. A edição requer `revision` atual, um modelo ativo compatível e status `draft`. A versão de origem e a identidade do registro são preservadas.

`TemplateInput` padroniza o futuro consumo pelos templates. `rendererRegistry` é indexado por nicho/variante do catálogo e possui oito entradas sem implementações visuais. O motor não importa componentes de sites. A futura rota `/p/[slug]` não foi criada; os slugs mostrados na interface são identificadores reservados, não links públicos.

## Slugs, concorrência e falhas

Slugs normalizam o nome e acrescentam um UUID aleatório de 128 bits sem hífens. Não usam sequência interna. A constraint única permanece no banco; colisões de slug fazem até cinco tentativas, sem capturar silenciosamente outros erros de integridade. Após criação, o trigger impede alterar slug, lead, ID ou data de criação.

Um advisory lock transacional compartilhado serializa planejamento/gravação e escritas em protótipos/templates. Locks de leitura e conferência de snapshot protegem dados de origem. A unicidade por lead permanece como última proteção. O pedido tem UUID e hash dos argumentos semânticos; repetir o mesmo pedido devolve o recibo original. Reutilizar o ID com outro modo, seleção ou prévia é rejeitado. Dados derivados não precisam ser reconstruídos em um replay já confirmado.

Todos os protótipos de um lote e seu recibo são gravados em uma única transação. Uma falha desfaz o lote inteiro e o recibo, sem manter contadores de sucesso. Uma resposta de rede incerta mantém o identificador da tentativa na interface para retomada segura. O usuário também pode conferir o banco e iniciar uma nova revisão; `UNIQUE(lead_id)` continua impedindo duplicação. O recibo é append-only para o cliente administrativo.

Uma seleção maior é dividida em lotes sucessivos de até 25. Cada etapa confere se suas atribuições ainda correspondem à prévia completa, antes da confirmação protegida no banco. O progresso soma somente recibos confirmados. Uma falha posterior preserva os lotes anteriores e interrompe a execução, sem apresentar a seleção inteira como concluída. A retomada usa o mesmo pedido no lote de resposta incerta. Mantenha a aba aberta durante a operação; ao fechar/recarregar, confira o banco e selecione novamente os leads sem protótipo. Não existe fila persistente em segundo plano.

Publicação não está disponível: novos registros exigem `draft`, sem `published_at`. Mutações de publicação são rejeitadas pelo trigger, mesmo fora da interface. Não há endpoint público de prospecção, service role ou alteração da autenticação existente. Os logs registram somente código de falha controlado, sem dados dos leads ou payloads.

## Limites e hospedagem

Cada geração aceita até 25 leads e usa uma transação curta, sem trabalhos de renderização, IA ou rede externa. A página exporta `maxDuration = 30`; as RPCs de planejamento, geração e edição usam timeout de transporte de 20 segundos e espera de lock de 3 segundos no SQL. Um timeout do transporte não prova rollback: a retomada usa o mesmo pedido e consulta o recibo. Os limites efetivos dependem da configuração/plano da hospedagem; consulte a [documentação de duração da Vercel](https://vercel.com/docs/functions/configuring-functions/duration).

A seleção de todos os elegíveis respeita o filtro completo, não apenas a página. Se houver mais de 500, ela pede refinamento; nunca trunca silenciosamente. A seleção manual pode atravessar páginas até esse limite. A prévia calcula os saldos existentes uma vez por nicho e simula a seleção inteira; a criação acontece em requisições sucessivas de até 25, sem concentrar a seleção em uma função longa. Não há garantia de latência de produção nesta fase.

## Como testar com os leads já importados

1. Revise e aplique a nova migration em homologação. Confira os oito registros do catálogo e os status ativos desejados.
2. Inicie com `npm.cmd run dev` e entre com uma conta autorizada em `admin_users`.
3. Abra **Protótipos**. Busque por nome ou nicho, selecione um lead individualmente ou até 500 por operação. Leads com protótipo estarão identificados; a gravação ocorre em etapas de até 25.
4. Escolha distribuição automática, A ou B e clique em **Conferir**. Revise quantidades, variantes por nicho e impedimentos.
5. Confirme **Gerar rascunhos**. Confira a listagem real e os indicadores do dashboard. Repita a seleção dos mesmos leads: nenhum protótipo adicional deve ser criado.
6. Abra o ícone de visualização. Confira dados confirmados, campos ausentes, conteúdo demonstrativo e seções planejadas. Ajuste um campo ou troque para outro modelo ativo do mesmo nicho e salve.
7. Em outra sessão administrativa, altere o mesmo registro e tente salvar a versão antiga: deve pedir nova leitura. Não há publicação nesta fase.

## Testes e limites da validação

Execute `npm.cmd test`, `npm.cmd run lint`, `npm.cmd run typecheck` e `npm.cmd run build`. Os testes usam dados fictícios. A suíte PostgreSQL local aplica as quatro migrations e verifica distribuição por nicho, números ímpares, contagens existentes, escolhas manuais, modelos inativos/incompatíveis, replay, slugs e colisões, origem do snapshot, edição, consultas, RLS e rollback na segunda inserção.

O teste local com `Promise.all` verifica pedidos sobrepostos no PostgreSQL embarcado, cujo backend é único; não certifica isolamento entre conexões remotas. Para validar isso no Supabase, use um projeto **dedicado de homologação**, com a migration revisada e aplicada, e configure:

```dotenv
RUN_SUPABASE_GENERATION=1
TEST_ADMIN_EMAIL=conta-de-teste-autorizada
TEST_ADMIN_PASSWORD=senha-da-conta-de-teste
```

URL e chave pública continuam em `.env.local`. Rode `npm.cmd run test:integration`. O teste opcional inicia dois clientes independentes, cria uma fixture, dispara confirmações simultâneas e exige um único protótipo, conflito na outra chamada e replay estável. Remove somente o lead/protótipo da fixture; o recibo append-only permanece como auditoria de teste. Não execute em produção. Sem flag/contas, a suíte fica explicitamente ignorada, sem presumir aprovação remota.

Nenhuma migration foi aplicada remotamente, e nenhuma validação visual completa do novo fluxo em navegador foi presumida como realizada. Os oito sites, renderizadores e publicação continuam fora do escopo.
