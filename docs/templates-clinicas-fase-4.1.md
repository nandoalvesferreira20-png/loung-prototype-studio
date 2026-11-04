# Templates de Clínicas — Fase 4.1

**Atualização:** o Template A foi redesenhado com fotografias reais locais e uma nova direção comercial. Consulte o [guia atual do Template A](clinicas-template-a-redesign.md). As descrições visuais do A abaixo documentam a primeira entrega da fase; o Template B e o fluxo privado permanecem como descritos.

## Entrega

Dois sites completos e privados para os slugs persistidos `clinicas-a` e `clinicas-b`. Nenhuma migration, tabela, publicação, deploy, commit ou push foi necessário.

|            | A — Institucional Premium                        | B — Serviços e Agendamentos                                    |
| ---------- | ------------------------------------------------ | -------------------------------------------------------------- |
| Tipografia | Georgia editorial, títulos itálicos              | Arial/Helvetica, títulos de maior peso                         |
| Paleta     | Off-white, bege, sálvia e grafite                | Branco, azul-petróleo e verde suave                            |
| Hero       | Assimétrico, imagem vertical, navegação discreta | Texto direto, imagem recortada e CTA destacado                 |
| Serviços   | Lista numerada com divisórias                    | Grade de cards com links para contato                          |
| Ritmo      | Espaços amplos, introdução e nota editorial      | Serviços, etapas de contato, apresentação e central de contato |
| Mobile     | Coluna editorial, imagem horizontal              | Cards empilhados e etapas legíveis                             |

Não há formulário de agendamento, promessa de atendimento, avaliações, profissionais, horários ou resultados inventados. Títulos editoriais e orientações de contato são identificados como demonstração. Toda página contém a identificação conceitual da Loung Tech.

## Arquivos

- `src/templates/registry.tsx`: renderizadores por slug do catálogo; confere nicho e variante.
- `src/templates/clinics/premium/index.tsx`: composição A.
- `src/templates/clinics/appointments/index.tsx`: composição B.
- `src/templates/clinics/clinics.css`: identidade dos sites isolada pelo escopo `.clinic`; reinicializa dimensões de `main` para não herdar o painel.
- `src/templates/clinics/shared/adapter.ts`: valida JSONB v1 e constrói modelo visual tipado, links e localização.
- `src/templates/clinics/shared/specialties.ts`: seis configurações de terminologia, direção de arte, texto neutro, categoria de imagem, ícone, cor e seções opcionais.
- `src/templates/clinics/shared/navigation.tsx`: menu mobile com estado expandido, fechamento por Escape e retorno de foco.
- `src/templates/clinics/shared/sections.tsx`: somente utilidades visuais compartilhadas, imagem, canais, localização e rodapé.
- `src/lib/prototype-preview.ts`: contrato de leitura com autorização obrigatória anterior às consultas.
- `src/services/preview.ts`: acesso Supabase no servidor com o usuário autenticado e RLS.
- `src/app/preview/prototipos/[id]/page.tsx`: documento integral privado, dinâmico e sem indexação.
- `src/app/(admin)/prototipos/[id]/preview/page.tsx`: inspeção no painel.
- `src/components/prototypes/preview-frame.tsx`: iframe da página real em 360, 390, 768, 1024 e 1440px e abertura integral.
- `public/templates/clinics/*.svg` e `ASSETS.md`: seis placeholders locais originais e documentação de origem/licença.
- `tests/clinic-templates.test.ts`, `tests/http/preview.test.ts`: contratos, renderização e bloqueio HTTP.
- Modificados: registro do motor, tabela de protótipos, Proxy, headers Next, CSS do painel, fase/ajuda, catálogo e biblioteca de templates, tipo de disponibilidade, metadados raiz, testes do registro e integração Supabase, README.

## Dados e especialidades

O serviço exige `requireAdminPage`, lê `prototypes` pelo UUID e resolve seu `template_id` em `templates`. O registro usa o slug persistido e verifica nicho/variante. O adaptador passa `customization_data` pelo contrato estrito existente, incluindo versão, campos ausentes e compatibilidade com Clínicas. Os componentes recebem apenas o modelo validado: não consultam leads, banco ou autenticação.

O snapshot salvo é a fonte da prévia. Alterações no lead não substituem silenciosamente a personalização revisada. O editor existente salva uma nova revisão, preservando slug; a prévia relê o banco sem cache a cada abertura/recarregamento. Dados de origem como `sourceLeadId`, datas e metadados administrativos não são enviados aos componentes client.

A especialidade confirmada é normalizada sem acentos para escolher odontologia, estética, psicologia, fisioterapia ou veterinária; desconhecidas usam clínica geral. A terminologia confirmada continua visível. A escolha modifica símbolo, arte local e copy neutra; nunca cria serviços. Serviços só aparecem a partir de `confirmed.services`. Descrição confirmada tem precedência sobre introdução demonstrativa. Endereço/cidade/UF habilitam localização apenas quando presentes.

URLs são validadas pelo contrato existente, sem esquemas executáveis ou credenciais. O mapa é um link de pesquisa codificado, sem embed externo. Telefone preserva prefixo e aceita 8–15 dígitos para link. WhatsApp precisa de formato internacional: `+` explícito ou 12–15 dígitos já informados. Não se acrescenta `55`, DDD ou outro código. Números nacionais ambíguos permanecem texto com pedido de confirmação. Instagram e site são exibidos somente se validados. Links externos usam `noopener noreferrer`; a página não envia mensagens automaticamente.

## Como conferir a prévia

1. Tenha as migrations das fases anteriores aplicadas e uma conta em `admin_users`. A fase atual não altera o banco.
2. Execute `npm run dev` e entre no Studio.
3. Em **Protótipos**, gere ou localize um rascunho de Clínicas. Clique em **Ver site**.
4. Selecione 360, 390, 768, 1024 ou 1440px. A largura do iframe é real: em telas menores que o viewport escolhido, role a área de inspeção horizontalmente. O site interno deve permanecer sem overflow próprio.
5. Use **Abrir página completa** para conferir o site sem a moldura administrativa.
6. Volte à listagem, abra o editor técnico, salve os dados/variante, e reabra a prévia ou clique em **Recarregar dados salvos**. Em outra aba, recarregue também o painel para atualizar o número da revisão exibida.
7. Confira menu mobile, Escape, teclado, foco, âncoras, contatos e links, sem enviar mensagens.
8. Sem sessão, ambas as rotas privadas redirecionam ao login. Usuário sem associação é negado. `/p/[slug]` permanece inexistente (404).

As páginas são `force-dynamic`. O Proxy renova sessão e marca `private, no-store`. O documento tem `noindex`, `nofollow`, `noarchive`, `SAMEORIGIN`, `frame-ancestors 'self'` e `no-referrer`. Esses headers complementam os guards e a RLS; não substituem autorização.

## Assets e preparação comercial

Os seis SVGs são arte original local CC0-1.0, sem conteúdo de terceiros. Consulte [origens e substituições](../public/templates/clinics/ASSETS.md). Todos devem ser substituídos por fotografias licenciadas/autorizadas compatíveis com a clínica antes de uma apresentação comercial baseada em instalações reais. Não há retratos de equipe fictícia. Fontes de sistema evitam downloads externos.

## Validação e limites

- `npm test`: renderiza A/B, seis especialidades, campos ausentes, serviços confirmados, links, incompatibilidades, leitura autorizada e dados novos após revisão. Inclui regressão das fases anteriores.
- `npm run lint`, `npm run typecheck`, `npm run build`: verificações de código e produção.
- `TEST_PREVIEW_APP_URL=http://localhost:3101 npm run test:http`: redirecionamento anônimo das duas rotas, ausência de payload de personalização, headers de proteção e 404 público. O cenário separado sem configuração pode ficar skipped.
- `npm run test:integration`: contém teste real opcional de renderização autenticada A/B, edição persistida e bloqueio de não administrador. Requer projeto de homologação dedicado, flags e contas descritos no README. Sem essas contas, fica skipped; não equivale a aprovação da integração real.

CSS prevê os cinco viewports, imagens com dimensões intrínsecas, tipografia fluida, alvos de toque, foco e movimento reduzido. **Não houve revisão visual em navegador nesta entrega:** a ferramenta retornou `The browser access host is unavailable`. Portanto, overflow real, contraste final, enquadramento, interação mobile e CLS precisam de conferência nos cinco tamanhos. Renderização estática e build não demonstram essas propriedades. O teste Supabase com sessão administrativa também depende das contas de homologação.

Antes do próximo nicho: concluir essa revisão visual, validar ambos os templates com uma clínica fictícia no ambiente de homologação, testar revisões em abas separadas e substituir/revisar os assets comerciais. Manter o registro e os contratos; criar direção de arte própria para o próximo nicho. Publicação e políticas públicas continuam em uma fase futura.
