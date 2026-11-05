# Acesso rápido aos protótipos

## Comportamento

Nas listagens `/prototipos` e `/publicacoes`, cada empresa aponta para a prévia administrativa existente em `/prototipos/[id]/preview`. Não existe clique na linha inteira, portanto a seleção múltipla permanece independente.

Publicações ativas mostram “Abrir site” em nova aba e um botão Copy adjacente. A URL absoluta usa `STUDIO_PUBLIC_URL`, validada por `publicBaseUrl`, e o slug existente. Na página de protótipos, a consulta administrativa passou a incluir o slug da publicação. Rascunhos e despublicados mostram “Visualizar prévia”, com cópia pública desabilitada. Origem ausente, slug inválido ou publicação indisponível não produzem URL pública; a prévia continua disponível quando o registro possui renderizador compatível.

Copiar utiliza Clipboard API e anuncia sucesso ou falha por `role=status`. Localhost em produção é recusado pela validação existente. As ações não publicam, geram slugs nem alteram snapshots. O estado de cada linha corresponde à última consulta; após alteração em outra aba, atualizar a listagem.

“Abrir selecionados”, na Central, consulta novamente `sharingPublications`, com autenticação administrativa e filtro de publicação ativa existentes. O diálogo confirma a quantidade de links, identifica os nomes sem link disponível e mostra até cinco links por página. A abertura é individual por clique, sem `window.open` ou dependência de pop-ups após requisições assíncronas. Copiar todos e exportar CSV continuam disponíveis e reconsultam o servidor. O limite de seleção permanece em 25 itens.

Após geração, “Visualizar protótipos gerados” aponta para a Central filtrada pelos IDs retornados pela geração. Para resultados maiores, há grupos identificados de até 25 itens, incluindo todos os IDs; nenhum item é truncado silenciosamente. A ação anterior “Revisar para publicação” permanece disponível. Nenhuma publicação automática foi introduzida.

## Interface e acesso

Ícones Lucide ExternalLink, Eye, Copy e Link2; estilos administrativos existentes, sem modificar o Brand Board ou templates. As ações operacionais de publicação da página de protótipos ficam em um menu nativo details. Em telas de até 600 px, a tabela de protótipos usa cards compactos; a Central mantém sua adaptação existente. Ações de abertura/cópia têm alvos de 44 px, nomes acessíveis e indicação de nova aba. O diálogo nativo mantém navegação por teclado e fechamento com Escape.

Nenhuma alteração de banco, migration, Supabase Auth, admin_users, RLS, regras de publicação ou oito templates. As prévias continuam autenticadas; compartilhar links públicos não concede acesso ao rascunho. Links podem deixar de funcionar se forem despublicados após a consulta; a página pública continua aplicando sua política de acesso.

## Arquivos

Novos:

- `src/lib/prototype-links.ts`: validação de URLs, cópia, composição da seleção confirmada e grupos de geração.
- `src/components/prototypes/quick-prototype-links.tsx`: ações compartilhadas de linha.
- `src/components/prototypes/selected-prototype-links.tsx`: diálogo de links confirmados, cinco por página.
- `tests/prototype-links.test.ts`: regressões de acesso rápido.
- Este documento.

Modificados:

- `src/app/(admin)/prototipos/actions.ts` e `page.tsx`: slug da publicação e origem pública validada no servidor.
- `src/app/(admin)/publicacoes/actions.ts`: IDs e URLs das publicações ativas na resposta de compartilhamento já existente.
- `src/components/prototypes/prototype-list.tsx`, `prototype-table.tsx`, `publication-center.tsx` e `generation-panel.tsx`: integração das ações e acesso pós-geração.
- `src/lib/generation/contracts.ts`: metadado opcional do slug da publicação; sem alteração do schema JSONB ou motor.
- `src/styles/studio.css`: ações compactas, diálogo e cards mobile.
- `tests/real-estate-personal.test.ts`, `restaurant-digital.test.ts` e `restaurant-templates.test.ts`: atualização das expectativas do rótulo anterior Ver site para Visualizar prévia; os renderizadores comerciais não foram alterados.

## Validação

- ESLint e TypeScript aprovados.
- 159 testes automatizados aprovados, incluindo cópia com falha da Clipboard API, URL absoluta válida, ausência de origem, slug inválido, publicação inativa, recusa de localhost em produção, seleção confirmada e grupos pós-geração.
- Build de produção aprovado.
- Dois testes HTTP contra o build local aprovados: páginas administrativas e prévias permanecem privadas, com redirecionamento ao login e sem vazamento de personalização.
- Sem commit, push ou deploy.

## Como testar manualmente

1. Configurar `STUDIO_PUBLIC_URL` com a origem HTTPS correta e entrar como administrador.
2. Em `/prototipos`, clicar no nome de uma empresa e conferir a prévia autenticada. Em um publicado, usar Abrir site e Copy; comparar a URL com o site público existente.
3. Conferir rascunho e despublicado: Visualizar prévia disponível e cópia pública desabilitada. Conferir também origem pública ausente.
4. Na Central, selecionar publicados e não publicados, inclusive em páginas diferentes, e usar Abrir selecionados. Conferir quantidade, nomes omitidos, paginação de cinco links, abertura individual, cópia e CSV.
5. Gerar protótipos e seguir Visualizar protótipos gerados; conferir os grupos com a geração atual e ausência de publicação automática.
6. Validar teclado, leitor de tela e larguras 360, 390, 768, 1024 e 1440 px. Conferir feedback de cópia e falha de permissão da área de transferência.

A inspeção visual autenticada e a interação real no navegador precisam ser confirmadas; testes de renderização e HTTP não equivalem à validação visual.

A tentativa de acesso visual retornou 'The browser access host is unavailable', sem abas controláveis. A conferência visual autenticada em desktop/mobile permanece pendente.
