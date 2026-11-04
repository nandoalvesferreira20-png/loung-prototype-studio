# Fase 5.1 — Publicação e compartilhamento

Implementação local de publicação por snapshot. Nenhuma migration foi aplicada no Supabase remoto e nenhum protótipo real foi publicado. Sem commit, push ou deploy.

## Arquitetura e contratos

O rascunho continua em `prototypes`, com `customization_data` v1 e revisão otimista existentes. Seu status administrativo não é alterado ao publicar. A nova tabela `published_prototypes` mantém uma linha por protótipo: slug imutável, identificador do template, payload v1, snapshot público, versão monotônica da publicação, revisão de origem, datas de publicação/atualização/despublicação. O estado público é independente: nunca publicado, ativo ou despublicado. Republicar substitui atomicamente a linha; não há endpoint para versões anteriores.

`publicSnapshot` valida a personalização original e constrói um objeto novo usando allowlist explícita: `version`, `confirmed`, `illustrative`, `clinicDesign`, `lawDesign`, `lawModernDesign`, `realEstateDesign`, `restaurantDesign`. Os schemas Zod existentes validam também os campos internos dessas extensões. Não são copiados sourceLeadId, sourceUpdatedAt, confirmedOrigin, missingFields, histórico, notas, dados do usuário, importação ou credenciais. `confirmed` contém nome comercial, nicho, especialidade, localização, canais públicos, descrição e serviços que o administrador aprova expressamente.

O banco reconstrói independentemente a mesma allowlist a partir do rascunho persistido e compara com o payload revisado. Publicar exige a revisão exata do rascunho e a versão esperada da publicação. Locks e transação impedem publicação parcial, revisão obsoleta e duas republicações com a mesma versão. Despublicar também incrementa a versão. A listagem mantém paginação e filtra o estado público separadamente do status privado; o dashboard conta snapshots ativos.

`/p/[slug]` usa um cliente Supabase anônimo novo, sem cookies/sessão, sem service_role e sem consultas a leads, templates privados ou protótipos administrativos. Consulta somente colunas públicas do snapshot ativo. O identificador do template é resolvido no registro local dos oito renderizadores. O envelope legado necessário aos adaptadores é reconstruído no servidor com identificador sintético constante; nenhum identificador de lead real chega ao modelo público. Catálogo, filtros, carrinho e WhatsApp consomem o snapshot.

## Banco e segurança

Revisar e aplicar incrementalmente `supabase/migrations/202611040002_publication.sql`, depois das migrations anteriores. Nenhuma migration antiga foi modificada. O inventário de migrations foi inspecionado localmente; não foi presumido que todas estão aplicadas no ambiente remoto.

- RLS habilitada na nova tabela.
- `anon`: SELECT apenas das colunas públicas e apenas onde `unpublished_at IS NULL`; sem leitura de `prototype_id` ou `source_revision`.
- `authenticated`: SELECT sujeito à associação administrativa; sem INSERT/UPDATE/DELETE direto na tabela de publicação.
- Escritas somente pelas RPCs `publish_prototype` e `unpublish_prototype`, com verificação administrativa no servidor e no banco.
- Funções SECURITY DEFINER com search_path vazio e nomes qualificados. Execução revogada de PUBLIC/anon e concedida a authenticated, com `private.is_admin()` obrigatório dentro das funções.
- Tabelas privadas e suas policies/grants anteriores preservados. Visitantes não conseguem consultar leads/imports/prototypes/admin_users.
- Não há publicação automática na geração/importação nem disparo de mensagens.

Um link público pode ser acessado por qualquer pessoa que o receber. `noindex` não é controle de acesso. Os dados autorizados do snapshot ativo também são consultáveis pela API pública; não dependemos de sigilo do endpoint ou de impedir a enumeração para proteger conteúdo que foi aprovado como público.

## Uso

1. Entrar como administrador em `/prototipos` e abrir **Ver site**.
2. Revisar a prévia autenticada; corrigir e salvar o rascunho se necessário.
3. Abrir **Revisar publicação** na listagem ou na prévia.
4. Conferir empresa, template, slug, dados exatos, campos ausentes e avisos. A confirmação abrange direitos de imagens, contatos, serviços, equipe e catálogos. O sistema valida estrutura e caminhos, mas não certifica a veracidade comercial dos textos nem a titularidade de uma imagem.
5. Marcar a autorização explícita e clicar **Confirmar publicação**. Erros de autorização, schema, template, imagem ou revisão impedem a publicação sem modificar o rascunho.
6. Abrir novamente a revisão para **Abrir site público**, **Copiar link** ou **Copiar mensagem para WhatsApp**. Cópia é uma ação local; nenhuma mensagem é enviada automaticamente.
7. Depois de editar o rascunho, a listagem avisa **Alterações não publicadas**. Revisar e confirmar a republicação mantém o mesmo slug e incrementa a versão pública.
8. **Despublicar** retira o snapshot da leitura anônima. O botão direto da listagem não depende da validação do rascunho atual. Para restaurar o link, revisar e publicar novamente.

O estado público e suas datas aparecem separadamente do badge do rascunho privado. Os filtros Publicado/Despublicado consultam o estado real da publicação. Uma falha ao carregar a tabela nova aparece como publicação indisponível, sem simular sucesso.

## Imagens

O editor atual aceita referências locais em `/templates/...`; não há upload nem bucket privado nesse contrato. A allowlist de fotografias existentes está em `src/config/publication-assets.json`, importada no bundle para não depender de leitura do diretório `public` dentro de funções Vercel. Os testes verificam a existência dos arquivos. Ao adicionar fotografia autorizada, atualizar o manifesto e incluir o asset no próximo build. Caminhos fora dos templates, traversal, URLs remotas/assinadas e assets inexistentes são recusados na revisão.

Fotos compartilhadas seguem as regras ilustrativas dos schemas/modelos existentes. Profissionais, depoimentos, propriedades e pratos não são gerados nesta fase. Itens demonstrativos continuam identificados; o carrinho mantém suas regras de disponibilidade, preço e confirmação de pedido. O número do WhatsApp é o aprovado no snapshot, sem fallback para o lead posteriormente editado.

Ao despublicar, o site e o payload deixam de ser servidos. Assets locais compartilhados já são arquivos públicos do template e continuam acessíveis: despublicação não é revogação de uma imagem anteriormente baixada. Não colocar documentos privados nesses caminhos. Uma futura integração de Storage privado exigirá publicação seletiva de assets autorizados; não foi aberto nenhum bucket.

## URL e Vercel

Configurar no ambiente do servidor:

```dotenv
STUDIO_PUBLIC_URL=https://SEU-DOMINIO-REAL
NEXT_PUBLIC_SUPABASE_URL=https://SEU-PROJETO.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_SUA_CHAVE_PUBLICAVEL
```

Usar o domínio real, sem caminho, query ou credenciais. Não configurar service_role no navegador. A origem é validada; localhost/HTTP só são aceitos em desenvolvimento local. Sem STUDIO_PUBLIC_URL a revisão mostra aviso e não inventa um link, embora o snapshot possa ser publicado e acessado pelo domínio da aplicação. Para desenvolvimento usar `http://localhost:3000` com `npm run dev`; em produção a origem deve ser HTTPS não local.

Checklist antes de deploy (não executado): revisar/aplicar a migration incremental no projeto correto; confirmar migrations predecessoras e admin_users; regenerar tipos pelo Supabase se desejado; cadastrar variáveis no ambiente correto; manter assets/fontes locais e o manifesto; testar Auth/redirects no domínio real; rodar lint/typecheck/test/build; testar os oito links sem sessão, republicar e despublicar; confirmar que acesso anônimo a leads continua negado; testar clipboard e navegação/carrinho no navegador. As ações fazem leituras limitadas ao protótipo e uma RPC transacional; não há processamento em lote nem dependência de armazenamento em disco durante publicação.

## SEO e cache

Títulos dinâmicos, descrição aprovada (ou fallback demonstrativo), Open Graph básico, ícone Loung e identificação discreta no rodapé. Robots metadata e X-Robots-Tag: noindex, nofollow, noarchive. Não há sitemap no projeto e nenhuma rota demonstrativa foi incluída em sitemap.

Rota dinâmica, `revalidate=0`, fetch Supabase com `cache: no-store`, Cache-Control de não armazenamento e `revalidatePath` explícito após escrever. Sem versões públicas antigas acessíveis pelo Studio. Estratégia compatível com o App Router instalado, sem Cache Components: [documentação Next.js](https://github.com/vercel/next.js/blob/canary/docs/01-app/02-guides/caching-without-cache-components.mdx).

Não é possível apagar cópias, screenshots ou conteúdo salvo por terceiros. Uma aba já aberta pode continuar exibindo o DOM carregado; na próxima requisição recebe o estado atual/404. Integrações externas de CDN/proxy devem respeitar no-store; não habilitar cache adicional dessas rotas. Snapshots despublicados ficam no banco para controle administrativo, sem leitura anônima.

## Arquivos desta fase

Novos: `src/lib/publication.ts`, `src/services/publication.ts`, `src/config/publication-assets.json`, `src/app/p/[slug]/{page,not-found}.tsx`, `src/app/(admin)/prototipos/publication-actions.ts`, `src/components/prototypes/publication-panel.tsx`, migration incremental, `tests/publication.test.ts`, `tests/publication-database.test.ts`, `tests/http/publication.test.ts`, `tests/fixtures/publication-fetch.mjs` e este guia.

Atualizados: `next.config.ts`, `src/types/database.ts`, `src/lib/generation/contracts.ts` (somente tipos/filtro de publicação), ações/listagem/preview administrativas, `prototype-table.tsx`, `prototype-list.tsx`, `admin-shell.tsx` (ajuda), `src/services/database.ts` (indicador público), `src/styles/studio.css` (modal escopado), testes de contrato de clínicas/advocacia e README. Estilos e componentes dos oito templates não foram alterados nesta fase. Alterações anteriores já existentes no workspace foram preservadas.

## Validação e limites

Validação final: ESLint, TypeScript e build de produção aprovados; 144 testes locais aprovados; suíte HTTP com 3 aprovados e 1 ignorado (cenário que exige iniciar outra aplicação sem configuração Supabase). Nenhum teste remoto foi declarado como realizado.

Testes locais: PostgreSQL embarcado PGlite aplicando as migrations, administradores/não administradores/anônimos, publicação, revisões obsoletas, payload divergente, concorrência, edição isolada, filtros, republicação, despublicação, grants e RLS. Testes de snapshots/allowlist, URLs, assets e renderização dos oito templates. O teste HTTP executa o build real e simula somente o transporte Supabase com dados fictícios: oito páginas sem login, metadata, no-store, atualização e 404 após despublicar. O preload de teste nunca é importado pela aplicação.

Comandos: `npm.cmd run lint`, `npm.cmd run typecheck`, `npm.cmd test`, `npm.cmd run build`. Para o teste HTTP isolado, depois do build: definir `TEST_PUBLICATION_BUILD=1` e executar `npm.cmd exec -- tsx --test tests/http/publication.test.ts`. Ele usa a porta local 3023 e encerra seu servidor ao terminar. Os demais testes HTTP usam `TEST_PREVIEW_APP_URL` com uma aplicação iniciada separadamente.

Resultado final dos comandos registrado na entrega. Não houve homologação Supabase/Vercel remota nem publicação de dados reais. A tentativa de inventário de navegador retornou “The browser access host is unavailable”; revisão visual e cliques reais de clipboard/menu/filtros/carrinho continuam pendentes em navegador disponível. A funcionalidade do carrinho é coberta pela suíte de funções/modelos existente e pelo snapshot público; o teste HTTP verifica HTML e isolamento, não interação DOM.
