# Importação de leads — Fase 2.2

Este documento registra o escopo da Fase 2.2. A geração e o gerenciamento reais acrescentados depois estão descritos no [guia da Fase 3.1](geracao-fase-3.1.md); as limitações históricas sobre protótipos ao final deste guia se referem à entrega anterior.

## Arquivos da implementação

- Configuração/dependências: `package.json`, `package-lock.json`, `next.config.ts`.
- Núcleo novo: `src/lib/imports/model.ts`, `classify.ts`, `mapping.ts`, `read-file.ts`, `parse.worker.ts`, `service.ts`.
- Interface: `src/components/imports/import-workspace.tsx`, `import-history.tsx`, `src/app/(admin)/importacoes/page.tsx`, `src/app/(admin)/dashboard/page.tsx`, `src/app/globals.css`.
- Integração: `src/app/(admin)/importacoes/actions.ts`, `src/services/database.ts`, `src/types/database.ts`.
- Textos de fase/ambiente: `src/components/layout/admin-shell.tsx`, `src/config/catalog.ts`.
- Banco: `supabase/migrations/202610280001_lead_import.sql`.
- Verificação: `tests/imports.test.ts`, `tests/import-database.test.ts`, `tests/fixtures/leads-exemplo.csv`.
- Documentação: `README.md` e este guia.

## Preparação do banco

A implementação usa as tabelas e constraints das duas migrations existentes, sem modificá-las. Aplique, em homologação e depois no ambiente escolhido, a nova migration `supabase/migrations/202610280001_lead_import.sql`, após as migrations `202610270001` e `202610270002`. Use o fluxo de migrations Supabase do projeto ou o SQL Editor com uma conta administrativa. A aplicação continua usando somente URL e chave publicável, Auth, `admin_users` e RLS. Não há service role no navegador ou no servidor da aplicação.

A migration adiciona os metadados de importação, segmento e Google Maps ao lead, o motivo para manter possíveis duplicatas, as chaves de identidade e a tabela `import_lead_results`. Cria as funções `preview_lead_import` e `commit_lead_import`, ambas `SECURITY INVOKER`, acessíveis somente ao papel `authenticated` e com verificação explícita de `auth.uid()`/`private.is_admin()`. Os helpers permanecem no schema privado. A migration foi executada em PostgreSQL embarcado nos testes; isso não confirma que já está aplicada no Supabase remoto.

Depois de aplicar, regenere o contrato com a CLI Supabase quando disponível. O espelho em `src/types/database.ts` inclui as novas colunas e RPCs. Não publique sem validar a migration no projeto de destino.

## Uso com Loung Prospect

1. Entre com uma conta autorizada em `admin_users` e abra **Importações**.
2. Exporte CSV ou XLSX do Loung Prospect. No XLSX, coloque os dados na primeira aba, com cabeçalhos na primeira linha, e exporte somente valores. Preserve telefone/WhatsApp como texto na origem.
3. Selecione ou arraste o arquivo. A leitura acontece em um Web Worker no navegador, sem upload do arquivo a serviços externos.
4. Confira o mapeamento automático. Cabeçalhos com acentos, espaços e sublinhados são normalizados. Uma coluna `url` só é mapeada automaticamente quando os valores indicam um único tipo reconhecido: site, Instagram ou Maps. URLs mistas exigem decisão manual.
5. Revise os totais, distribuição, erros por campo/registro e classificações. Use busca, filtros e paginação de 20 registros. Expanda **Editar todos os campos** para corrigir os dados. Registros ambíguos exigem confirmação/correção ou exclusão.
6. Clique em **Conferir duplicatas**. Correspondências no banco são inicialmente marcadas para ignorar. Você pode ignorar, escolher um registro para atualizar ou manter separado com justificativa de pelo menos 10 caracteres. A atualização substitui os campos pelo conteúdo revisado, inclusive vazios; ela não é automática. Alterar dados invalida a conferência anterior.
7. Clique em **Salvar**. Somente linhas válidas, classificadas e incluídas são enviadas. A interface informa quantas não serão gravadas. Confira o resumo e o histórico; o dashboard será atualizado. Nenhum protótipo é criado.

Para um primeiro teste, use `tests/fixtures/leads-exemplo.csv`, exclusivamente em homologação. Contém quatro nichos, uma empresa sem classificação, uma duplicata e um registro sem nome. Depois teste uma exportação real pequena, revise todas as correspondências e confira os contadores no banco. Não use dados reais em testes automatizados.

## Parsers, limites e conteúdo ativo

- Papa Parse 5.7.0: detecção de vírgula, ponto e vírgula, tabulação e pipe; aspas e campos vazios; sem conversão automática de telefone para número.
- read-excel-file 9.3.13: leitura XLSX, com `parseNumber` textual. Não instala nem usa o pacote npm `xlsx`.
- fflate 0.8.3: inspeção incremental do ZIP antes da leitura XLSX.
- Zod 4.6.7: contrato compartilhado de validação, executado novamente no servidor. A auditoria apontou uma falha em uma versão anterior avaliada; foi substituída pela versão corrigida antes da entrega.
- PGlite 0.5.13: somente desenvolvimento, para executar PostgreSQL/PLpgSQL/RLS nas suítes locais.

Limites centralizados em `src/lib/imports/model.ts`: 5 MB de arquivo, 500 registros, 50 colunas, 200 entradas ZIP, 20 MB descompactados e 20 segundos de leitura. O servidor aceita até 500 registros e 3 MB de JSON, e o limite de transporte das Server Actions é 4 MB. O teto SQL também é 500; se aumentar o limite operacional, ajuste e teste ambas as fronteiras.

CSV aceita UTF-8/BOM e tenta Windows-1252 quando o conteúdo não é UTF-8 válido. XLSX lê apenas a primeira aba. Fórmulas, macros, objetos incorporados, vínculos externos, entidades XML e dimensões além do limite são rejeitados no XLSX. Fórmulas em CSV são texto; não são avaliadas. Nenhum link de planilha é visitado e nenhum conteúdo ativo é executado. React apresenta textos escapados, sem `dangerouslySetInnerHTML`. O servidor não registra conteúdo de leads, telefone, endereço ou payload; erros de banco geram somente operação e código controlado.

Números que já perderam zeros na planilha não podem ser reconstruídos. XLSX com linhas/colunas vazias formatadas fora dos limites também pode ser recusado. Remova essa formatação ou exporte um CSV enxuto.

## Classificação

As regras ficam em `src/lib/imports/classify.ts`, considerando nome, categoria Google e segmento. Clínicas reconhecem termos de clínica, odontologia/dentista, estética, psicologia, fisioterapia e veterinária. Advocacia reconhece advogado, advocacia, jurídico e advocatício. Imobiliárias reconhecem imobiliária, corretor de imóveis e agência de imóveis. Restaurantes reconhecem restaurante, pizzaria, hamburgueria, sushi, gastronomia, lanchonete, churrascaria e bistrô.

Sem evidência ou com mais de um nicho compatível, o estado é `REVIEW_REQUIRED`. Mais de uma especialidade clínica também exige revisão. A especialidade só é sugerida quando há uma única evidência compatível, sem inventar dados. Um nicho explícito válido ou a correção manual tem precedência. Só os quatro nichos do enum PostgreSQL são aceitos.

## Duplicatas e consistência

No arquivo, comparam-se identidades fortes e linhas integralmente idênticas. No banco, as chaves são origem + identificador externo, Google Maps normalizado, nome normalizado + telefone e nome normalizado + endereço/cidade/UF. Maps remove fragmentos e parâmetros de tracking conhecidos, preserva os parâmetros que identificam o local e os ordena. Links curtos não são expandidos na rede. Nome semelhante ou nome sozinho não prova duplicidade; empresas sem identificadores suficientes exigem análise humana.

A prévia não é a proteção final. A RPC verifica tudo novamente sob um advisory lock transacional compartilhado com o trigger de leads, que também protege escritas fora da interface. Uma nova duplicata exige decisão explícita. Manter separado grava a justificativa. Atualizar exige ID correspondente e `updated_at` igual à versão revisada; uma mudança concorrente falha e pede nova revisão. Constraints incluem nichos, campos obrigatórios, consistência dos contadores, chave única da solicitação e unicidade de resultado por importação/linha.

Cada tentativa de confirmação tem um `requestId`. Reenviar a mesma solicitação, inclusive após resposta de rede incerta, retorna o resultado original sem repetir as gravações. Reutilizar o ID com outro payload é rejeitado. Alterações na revisão ou uma nova tentativa explícita recebem outro ID. Reabrir o mesmo arquivo cria outra revisão e passa novamente pelas chaves de deduplicação; sem identidade suficiente não se presume que empresas com o mesmo nome são a mesma.

A transação grava histórico, leads e resultados por linha. Uma falha em qualquer lead reverte todos os leads/resultados daquele lote e registra histórico `failed`, com zero inseridos/atualizados e código seguro. Contadores de sucesso nunca são mantidos em uma falha parcial. Reenviar uma tentativa já falhada retorna a mesma falha; **Revisar e iniciar nova tentativa** permite uma revisão e um novo ID. Pedidos não autorizados ou inválidos são rejeitados antes da criação do histórico.

O histórico mostra as últimas 100 operações, com arquivo, data, status, linhas, inseridos, atualizados, não gravados, duplicatas e erro seguro. `valid_rows` significa efetivamente inseridos + atualizados; `invalid_rows`/`skipped_rows` representam tudo que não foi gravado, inclusive exclusões deliberadas. Os motivos de exclusão de linhas inválidas ficam na prévia local; o servidor não armazena seu conteúdo bruto.

## Verificação e limites da entrega

Execute `npm test`, `npm run lint`, `npm run typecheck` e `npm run build` (no PowerShell, `npm.cmd`). Os testes usam dados fictícios e executam as três migrations em PostgreSQL embarcado, cobrindo RLS, replay, atualização, duplicatas e rollback. Eles não substituem a suíte `npm run test:integration`, que exige projeto de homologação, migrations aplicadas, contas de teste e as variáveis descritas no README.

Dashboard consulta contagens exatas no Supabase, distribuição de leads por nicho e última importação concluída. Indicadores de protótipos vêm da tabela real; um banco vazio mostra zero. A página de protótipos existente continua identificada como demonstração e não gera nem publica projetos. Não foram implementados geração, distribuição A/B, editor, publicação, novos nichos, integração API com Prospect ou alterações no fluxo de autenticação.

A revisão visual foi limitada à tela inicial de importações na sessão existente. A ferramenta de UI interrompeu a interação por não conseguir confirmar a URL com segurança; upload e revisão completos no navegador não foram confirmados nessa sessão.
