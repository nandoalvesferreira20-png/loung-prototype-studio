# Loung Prototype Studio — Fase 2.1

Ferramenta interna da Loung Tech. Next.js 16 App Router, React, TypeScript rigoroso, Tailwind CSS, Lucide e Supabase Auth/PostgreSQL. O design administrativo aprovado foi preservado.

## Estado desta entrega

Autenticação e autorização implementadas no código. **A integração Supabase só pode ser considerada validada após configurar um projeto, aplicar as migrations e executar os testes reais.** Sem configuração válida, o acesso privado permanece bloqueado e `/login` informa a pendência; não há bypass demonstrativo.

As telas administrativas continuam exibindo exemplos fictícios identificados. O catálogo persistido contém somente os oito templates oficiais. Nenhuma empresa, lead, importação ou protótipo fictício é inserido no banco. A camada de leitura persistida não faz fallback para exemplos. Importação, geração, edição, publicação e persistência de preferências continuam fora desta fase.

## Executar

Use Node.js **24 LTS** e npm (mínimo Node.js 22.15, necessário para `--use-system-ca`). Os comandos de integração utilizam `--env-file-if-exists`.

```sh
npm ci
# Copie .env.example para .env.local e preencha as variáveis.
npm run dev
```

Abra http://localhost:3000. `/` redireciona para `/dashboard`, que exige autorização. No PowerShell com bloqueio a scripts, utilize `npm.cmd`.

```dotenv
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
```

Obtenha Project URL e **publishable key** (`sb_publishable_...`) em Connect/API Keys do projeto. Não use `sb_secret_...`, `service_role` ou JWT legado no lugar dessa chave. O código rejeita configuração ausente/inválida. `.env.local` e `.env.test.local` são ignorados pelo Git. Nenhuma chave administrativa secreta é necessária na aplicação.

## Configurar o Supabase

### Diagnosticar falhas de login no desenvolvimento

O terminal do servidor registra eventos `[auth]` somente fora de produção, sem e-mail, senha, cookies, tokens ou chaves. Os erros incluem origem, etapa, nome, tipo, código, status e mensagem técnica controlada, além de até três causas aninhadas sanitizadas. Mensagens e nomes desconhecidos são omitidos; nenhum objeto bruto ou stack é impresso. `invalid_credentials` não comprova que a senha está errada: confira também a conta e o projeto configurado. `email_not_confirmed`, limite de tentativas, chave inválida e falhas de rede não devem ser interpretados como senha incorreta.

`server_client_creating`/`server_client_created` delimitam a criação do cliente. `sign_in_started` antecede a chamada ao SDK; `transport_request_failed` captura DNS/TLS/rede antes que o SDK descarte a causa original. `sign_in_failed` indica erro retornado pelo SDK; `sign_in_exception` indica uma exceção lançada durante a chamada, sem substituir o erro por uma exceção genérica da aplicação.

Na investigação local, a consulta ao endpoint público `/auth/v1/settings` falhou com `TypeError: fetch failed`, causa `SELF_SIGNED_CERT_IN_CHAIN`. A mesma consulta, com a mesma configuração e `--use-system-ca`, respondeu HTTP 200. Por isso os scripts `dev`, `start`, `build` e integração usam os certificados confiáveis do sistema operacional, mantendo a validação TLS. Reinicie o servidor com `npm run dev` para aplicar. Em execuções externas aos scripts, configure a confiança do Node conforme a [documentação oficial](https://nodejs.org/learn/http/enterprise-network-configuration).

Execute `npm run auth:check` para verificar configuração/conectividade sem login e sem dados privados. HTTP 200 confirma a conexão e aceitação da chave pública; não comprova senha, associação em `admin_users` ou sessão de uma conta. Não desative a validação TLS.

`admin_forbidden` significa que o Auth validou a identidade, mas não encontrou a associação em `admin_users`; `admin_lookup_failed` significa erro na consulta, não ausência de permissão confirmada. `session_validation_failed` e `session_cookie_write_failed` identificam problemas posteriores à autenticação. As ações de login/logout exigem gravação dos cookies antes de indicar sucesso. Os destinos continuam fixos em `/dashboard` e `/login`.

Se houver `configuration_missing_or_invalid`, confira as duas variáveis descritas acima e reinicie o servidor (ou refaça o deploy). `.env.example` não é carregado automaticamente. A URL e a chave devem pertencer ao mesmo projeto. Não envie credenciais para diagnosticar: reproduza a tentativa no ambiente afetado e consulte apenas os eventos seguros. Sem o retorno dessa tentativa, não é possível determinar a causa operacional apenas pela mensagem genérica da interface.

1. Crie/selecione um projeto dedicado ao Studio. Para a validação inicial, use homologação sem dados reais.
2. Em **Authentication → Sign In / Providers → User Signups**, desative **Allow new users to sign up**. Dependendo da versão do painel, a opção aparece em Auth Settings. Mantenha e-mail/senha habilitado e **Anonymous Sign-Ins desabilitado**. Esconder a tela de registro não substitui desabilitar cadastro no serviço.
3. Em **Authentication → URL Configuration**, configure Site URL com a URL correta da aplicação (localhost no desenvolvimento, domínio HTTPS em produção). Esta fase não implementa callbacks OAuth, convites ou recuperação de senha.
4. No **SQL Editor**, como `postgres`, execute uma única vez cada arquivo completo, nesta ordem:
   - `supabase/migrations/202610270001_foundation.sql`
   - `supabase/migrations/202610270002_template_catalog.sql`
5. Cada migration usa transação, sem DROP/reset de tabelas existentes. Para projetos gerenciados pela CLI, use o fluxo `supabase link` / `supabase db push`; não misture aplicação manual e CLI sem reconciliar o histórico.
6. Em API/Data API Settings, mantenha o schema `private` **fora de Exposed Schemas e Extra Search Path**. As policies chamam a função qualificada diretamente; não é necessário expô-la por RPC.
7. Em **Authentication → Users → Add user → Create new user**, crie uma conta por integrante, com senha forte e exclusiva, confirmando a conta conforme o procedimento interno. Não compartilhe contas ou tokens. Nenhuma tela de registro foi criada.
8. Autorize os integrantes conforme o procedimento abaixo. Uma conta autenticada não recebe acesso automaticamente.
9. Preencha `.env.local`, reinicie o servidor e teste login/logout. Na Vercel, configure as mesmas duas variáveis no ambiente correto e refaça o deploy. Esta entrega não publica automaticamente.

### Autorizar integrantes

Somente o responsável com acesso administrativo ao **painel Supabase/SQL Editor** deve executar o SQL. Copie o UUID da conta em Authentication → Users e confira seu e-mail. Substitua o marcador antes de executar:

```sql
select id, email from auth.users where id = '<UUID_DO_INTEGRANTE>'::uuid;

insert into public.admin_users(user_id)
values ('<UUID_DO_INTEGRANTE>'::uuid)
on conflict (user_id) do nothing;
```

Para revogar acesso:

```sql
delete from public.admin_users
where user_id = '<UUID_DO_INTEGRANTE>'::uuid;
```

A próxima consulta protegida será negada, mesmo com sessão Auth válida. Revogação não remove informações já exibidas ou copiadas. Se necessário, encerre também sessões/remova a conta pelo painel Auth. Não crie endpoint, Server Action ou formulário de autoatribuição. Nem administradores podem alterar `admin_users` usando o cliente da aplicação/Data API.

## Segurança e sessão

- `src/lib/supabase/browser.ts`: cliente de navegador tipado, somente com chave publicável. Disponível para funcionalidades futuras; o login atual usa Server Action.
- `src/lib/supabase/server.ts`: cliente isolado por requisição com cookies SSR (SameSite Lax, path `/`, Secure em produção). HTTPS é necessário em produção. O SDK SSR também utiliza cookies no navegador; não se presume proteção HttpOnly. Evite scripts de terceiros não confiáveis.
- `src/proxy.ts` e `src/lib/supabase/proxy.ts`: renovação com `getClaims`, propagação dos cookies à requisição/resposta e `private, no-store`. O proxy não substitui autorização.
- `getAdminAccess` valida a identidade no servidor com `auth.getUser()` e consulta a associação da própria conta em `admin_users`. Não confia em `getSession`, cookies sem validação ou `user_metadata` para autorizar.
- O layout **e cada uma das cinco páginas** chamam `requireAdminPage`, inclusive em renderizações que reutilizam o layout.
- A camada de dados chama `requireAdmin()` antes das consultas. Futuras Server Actions/Route Handlers devem fazer o mesmo. Não usar cache global para identidade/autorização/dados administrativos.
- `GET /api/admin/session` retorna somente `{authorized:true}` para admin, 401 sem sessão, 403 sem associação e 503 em falha de configuração/validação. Nunca retorna leads.
- Login chama `signInWithPassword`, verifica associação administrativa e encerra a sessão recém-criada se não houver autorização. Erros não retornam detalhes internos, tokens ou senhas. Redirecionamento é fixo, sem URL arbitrária fornecida pelo cliente.
- Logout usa POST via Server Action e `signOut({scope:'local'})`. Encerra a sessão atual, sem afirmar encerrar outros dispositivos. Login é deliberadamente público; logout permanece disponível para encerrar uma sessão cuja autorização tenha sido revogada.
- Server Actions mantêm a validação de origem do Next.js. Não há logout por GET ou cadastro público. Os limites de tentativas são os do Supabase Auth; revise os rate limits no painel antes de produção.
- RLS também protege chamadas diretas à Data API. Não há service role na aplicação, política pública de leads, rota pública de protótipos, organizações ou permissões adicionais.

Padrão obrigatório para futuras operações no servidor:

```ts
await requireAdmin();
const supabase = await createServerSupabaseClient();
// Consultar/gravar com tipos, tratar error e preservar RLS/constraints.
```

## Banco e migrations

| Tabela        | Finalidade e garantias                                                                                                                                    |
| ------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `admin_users` | `user_id` PK/FK de `auth.users`, `created_at`. Cliente só lê a própria associação; sem grants de escrita.                                                 |
| `imports`     | UUID, arquivo, status, contagens e datas. Contagens não negativas/coerentes e término consistente com status.                                             |
| `leads`       | UUID, importação opcional, nome, nicho, especialidade separada, contatos, endereço, descrição, serviços `text[]`, origem/referência externa e timestamps. |
| `templates`   | UUID, slug único, nome, nicho, variante, descrição/status e timestamps. `UNIQUE(niche, variant)` limita A/B por nicho.                                    |
| `prototypes`  | UUID, lead único, template, slug único, status, personalização `jsonb` objeto, datas e chave interna de nicho.                                            |

Enums: `niche` (`clinicas`, `advocacia`, `imobiliarias`, `restaurantes`), `template_variant` (`A`, `B`), `import_status` (`pending`, `processing`, `completed`, `partial`, `failed`), `template_status` (`planned`, `active`, `archived`), `publication_status` (`draft`, `review`, `published`). Rótulos demonstrativos em português ficam separados dos estados persistidos.

Todos os IDs persistidos são UUIDs; identificadores conceituais da Fase 1 continuam somente na demonstração. O catálogo usa slugs como `clinicas-a` e IDs gerados pelo banco. Todos os oito templates recebem `planned`, sem sites completos.

`prototypes.lead_id` é único. A coluna adicional `prototypes.niche`, derivada do lead por trigger, permite duas FKs compostas para garantir compatibilidade com o template sob concorrência. Alterações incompatíveis no nicho de leads/templates associados são restringidas pelas FKs. Triggers atualizam `updated_at`. Remover um lead remove seu protótipo; remover um template em uso é impedido; remover uma importação preserva leads, limpando a referência. Índices cobrem relacionamentos, nichos, status/datas e origem/referência externa. Não há deduplicação automática de leads nesta fase.

### RLS

Ativa nas cinco tabelas. `anon` não tem grants sobre elas. `authenticated` tem SELECT/INSERT/UPDATE/DELETE nas quatro tabelas operacionais, sempre sujeitos a `USING` e `WITH CHECK` de `private.is_admin()`. Sem TRUNCATE, grants de DDL ou escrita em associações.

`private.is_admin()` é `SECURITY DEFINER`, dono `postgres`, `search_path = ''`, nomes qualificados e nenhum argumento de usuário. Retorna apenas se `auth.uid()` possui associação. EXECUTE é revogado de PUBLIC/anon e concedido a authenticated. A função não deve ser exposta na API. O proprietário ignora RLS apenas para essa consulta estreita; não usamos FORCE RLS em `admin_users`, evitando reentrada na policy. A leitura da própria associação usa diretamente `user_id = auth.uid()`, sem recursão. Funções de triggers são `SECURITY INVOKER`, sem EXECUTE público.

Nenhuma policy concede acesso público por status de publicação. A separação entre dados públicos de protótipos e informações internas será feita em outra fase.

## Arquivos principais

```text
src/app/login/                 Página e Server Actions de login/logout
src/app/(admin)/               Páginas aprovadas e guards no servidor
src/app/api/admin/session/     Verificação mínima de autorização
src/components/auth/          Formulário de login e botão de saída
src/config/supabase.ts        Validação da configuração pública
src/lib/auth/                 Identidade, autorização e fluxos testáveis
src/lib/supabase/             Clientes SSR/browser e renovação de cookies
src/proxy.ts                  Proxy do Next.js 16
src/services/database.ts      Leituras persistidas tipadas e protegidas
src/services/contracts.ts     Contratos de geração/importação futura
src/types/database.ts         Espelho tipado das migrations
supabase/migrations/          Schema/RLS e catálogo versionados
tests/*.test.ts               Testes unitários e estruturais
tests/integration/            Suíte que exige Supabase real
tests/http/                   Bloqueio HTTP sem configuração
```

Depois de aplicar as migrations, regenere os tipos usando a CLI Supabase:

```sh
supabase gen types typescript --project-id <PROJECT_ID> --schema public
```

O espelho atual foi escrito a partir do SQL, **não gerado de um banco já aplicado**. Salve a saída em UTF-8, compare antes de substituir `src/types/database.ts` e execute TypeScript novamente. Não imprima credenciais.

## Verificação

```sh
npm run lint
npm run typecheck
npm test
npm run test:integration
npm run build
npm start
```

`npm test` executa testes unitários do fluxo/guards (login válido/inválido, ausência de sessão, conta não autorizada, administrador, logout, indisponibilidade), catálogo, filtros e checagens estruturais do SQL. **Mocks e inspeção do SQL não comprovam Auth, RLS ou execução das migrations em PostgreSQL.**

### Integração real

Use um **projeto de homologação dedicado**, com migrations aplicadas, uma conta admin autorizada e outra conta Auth sem registro em `admin_users`. Não use contas/dados reais. Inicie a aplicação apontando para esse projeto. Configure `.env.test.local` (ignorado pelo Git):

```dotenv
RUN_SUPABASE_INTEGRATION=1
TEST_APP_URL=http://localhost:3000
TEST_ADMIN_EMAIL=
TEST_ADMIN_PASSWORD=
TEST_NON_ADMIN_EMAIL=
TEST_NON_ADMIN_PASSWORD=
```

As variáveis NEXT_PUBLIC devem estar em `.env.local`. Execute `npm run test:integration`. Sem a flag, o teste fica **SKIPPED**, nunca “integração aprovada”. Com a flag e configuração incompleta, falha explicitamente.

A suíte usa Auth real, cookies SSR, Data API e HTTP: login válido/inválido, autorização, bloqueio anônimo/não admin, prevenção de autoatribuição (inclusive por admin), gravação/leitura admin, constraints e bloqueio das cinco páginas/endpoint. Cria fixtures com UUIDs aleatórios e remove somente esses registros em `finally`, encerrando as sessões. Falhas de limpeza são reportadas; confira registros com `source = 'automated-security-test'` e arquivo/slug `security-test-<UUID>` da execução. Nenhum teste usa service role.

Logout não invalida retroativamente um JWT de acesso copiado até ele expirar; o teste verifica sessão/cookies locais após a saída. Revogar a associação administrativa impede novas operações protegidas por RLS, mesmo com JWT ainda válido.

### HTTP sem Supabase

Inicie a aplicação sem as variáveis Supabase, defina `TEST_APP_URL` para ela e execute `npm run test:http`. Verifica login informativo, redirecionamento das cinco rotas e resposta 503 sem dados no endpoint. Não substitui a suíte Supabase real.

## Pendências externas e Fase 2.2

Deploy nativo Next.js na Vercel, sem `vercel.json`, Docker ou serviços auxiliares. Configure as duas variáveis e HTTPS. **Pendências externas:** projeto Supabase, cadastro fechado, aplicação das migrations, criação/autorização das contas, regeneração dos tipos e execução da suíte real. Nenhum desses passos é presumido como realizado.

Fase 2.2: importação validada no servidor, mapeamento de cabeçalhos, prévia, deduplicação e persistência usando guards e RLS. Geração, editor, publicação, IA, integração direta com Prospect, organizações e pagamentos permanecem fora do escopo. Nenhum commit ou push é feito automaticamente.

Referências oficiais: [SSR no Next.js](https://supabase.com/docs/guides/auth/server-side/creating-a-client?framework=nextjs), [RLS](https://supabase.com/docs/guides/database/postgres/row-level-security), [funções e privilégios](https://supabase.com/docs/guides/database/functions).
