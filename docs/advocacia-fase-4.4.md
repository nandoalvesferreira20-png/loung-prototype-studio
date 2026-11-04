# Advocacia A — Clássico e Sofisticado, fase 4.4

## Implementação e referência

O template jurídico foi integrado ao projeto existente, sem criar aplicação, deploy ou sistema de edição separado. A composição segue a imagem fornecida: header carvão, monograma tipográfico, hero arquitetônico com texto editorial à esquerda, faixa institucional clara com três ícones, seção institucional em duas colunas, cards de atuação, bloco editorial escuro com separador dourado, equipe opcional, contato em duas colunas e rodapé institucional.

Paleta inicial: carvão `#17191B`, grafite `#292C30`, marfim `#F7F4EF`, dourado `#B59A65` e cinza `#777A7D`. O dourado aparece em ícones, linhas e detalhes. Os botões dourados usam texto escuro para contraste. A tipografia combina títulos em Georgia local com corpo Arial/Helvetica; há uma opção clássica com Palatino e fallbacks serifados. O CSS usa `local()` e fontes instaladas no dispositivo: não baixa fontes, não redistribui arquivos de fontes e não cria dependência de rede para o build.

A diferença em relação a Clínicas é deliberada: composição editorial, títulos serifados, botões discretos e retangulares, cores sóbrias, apresentação de áreas jurídicas e equipe apenas autorizada. Os dois templates de Clínicas mantêm seus arquivos, estilos e comportamento.

A referência apresenta fatos fictícios que não são inseridos automaticamente: tradição, áreas de atuação, qualificação de profissionais e contatos. Os defaults jurídicos são neutros. Não são gerados depoimentos, vitórias, rankings, promoções ou garantias de resultado. Os CTAs são institucionais. A direção de conteúdo considera a sobriedade e o caráter informativo descritos pela [OAB no Provimento 205/2021](https://www.oab.org.br/leisnormas/legislacao/provimentos/205-2021). Isso não equivale a certificar a conformidade de textos futuros inseridos pelo administrador.

**Aceite visual pendente:** a página renderizada não pôde ser inspecionada no navegador nesta execução. A proximidade com a referência foi implementada na composição e no CSS; não há declaração de aprovação visual.

## Imagens verificadas e marca fictícia

Os quatro PNGs existem em `public/templates/law/shared/`, todos com 763 × 507px:

| Arquivo | Uso inicial |
| --- | --- |
| `law-office-reception.png` | Hero, com recorte seguro |
| `law-meeting-room.png` | Sobre o escritório |
| `law-legal-details.png` | Faixa editorial escura |
| `law-client-consultation.png` | Atendimento e contato |

Os arquivos foram inspecionados visualmente como imagens locais. Não foram substituídos nem alterados. O retrato da cena de atendimento é ilustrativo e não é usado como membro de equipe.

A recepção tem um nome fictício incorporado na região esquerda. O componente aplica recorte obrigatório sempre que esse arquivo é selecionado, inclusive em outro slot, com variações de maiúsculas/minúsculas no nome. A imagem é posicionada à direita em uma caixa com 250% da largura, dentro de um frame com overflow oculto: somente até os 40% à direita da fonte ficam visíveis, excluindo a marca localizada à esquerda. Em enquadramentos mais altos, o recorte pode ficar ainda mais restrito; não volta a revelar a área esquerda. O editor impede alterar esse enquadramento específico. Caminhos com barras duplicadas, traversal ou URLs externas são recusados.

Esse recorte reduz a área arquitetônica disponível e sua qualidade/composição final precisa ser conferida nas cinco larguras. Uma futura imagem equivalente sem marca pode ser selecionada pelo editor. A imagem original continua sendo um asset público fornecido pelo projeto; o recorte protege a apresentação no template, não modifica o arquivo de origem.

`next/image` usa as dimensões dos assets conhecidos, prioridade no hero, `sizes` responsivos e carregamento tardio nas imagens restantes. Há legendas ilustrativas e fallback para erro/ausência de arquivo. O pacote compartilhado não pode ser marcado como fotografia real. Fotos de equipe usam exclusivamente caminhos em `/templates/law/team/` e exigem confirmação de fotografia real e autorizada. O sistema não verifica documentalmente a identidade ou a autorização: essa conferência é responsabilidade do administrador; nenhum profissional real foi adicionado por esta tarefa.

## Dados e personalização

O contrato principal continua em `schemaVersion: 1`. A nova extensão opcional `lawDesign`, com `version: 1`, é independente de `clinicDesign`. Registros anteriores continuam válidos e recebem defaults sem reescrita de snapshots. A extensão jurídica é validada somente para o nicho `advocacia`.

Os campos confirmados existentes continuam responsáveis por nome, especialidade, descrição, telefone, WhatsApp, Instagram, endereço, cidade/UF e lista de serviços. Em Advocacia, `confirmed.services` representa as áreas confirmadas. As descrições e ícones de uma área não criam áreas novas por conta própria.

Opções no editor:

- Identidade: escritório/sociedade ou profissional autônomo, monograma, logo local autorizado, identificação profissional, seis cores e duas opções tipográficas.
- Hero: título, descrição, textos dos dois botões, imagem, legenda e enquadramento.
- Institucional: título, descrição, CTA, imagem e três itens editáveis da faixa, incluindo ícone e destino.
- Áreas de atuação: adicionar, editar, remover, ordenar, descrever, escolher ícone, ocultar individualmente ou ocultar a seção inteira. Os seis primeiros cards aparecem inicialmente; os demais ficam em bloco expansível.
- Editorial: título, texto complementar e fotografia.
- Equipe: nome, cargo, área, registro fornecido, descrição opcional, retrato real autorizado e ordem dos integrantes. Nenhum dado é pré-preenchido com profissionais fictícios.
- Contato: título, descrição, CTA, e-mail e LinkedIn confirmados, além dos contatos existentes nos dados confirmados. A fotografia é substituível.
- Estrutura: ordem e visibilidade das cinco seções de conteúdo, visibilidade da faixa institucional e restauração dos defaults com confirmação.

Nome e descrição confirmados têm precedência nos seus respectivos slots; o título-base e a introdução existentes são preservados quando personalizados. Apenas os textos-base técnicos da geração antiga recebem alternativas neutras no renderizador jurídico. Os textos antigos no banco não são reescritos.

Sem áreas, não há cards nem botão secundário do hero para áreas inexistentes. Sem equipe autorizada, a seção e o item de navegação ficam ocultos. Sem canais válidos, o CTA leva ao bloco informativo persistente do rodapé. Não há formulário ou agendamento simulado.

O modo autônomo adapta a apresentação e a navegação sem exigir equipe. As fotografias conceituais não são apresentadas como instalações reais de um escritório pequeno ou autônomo.

## Editor, gravação e prévia

O editor existente recebeu um grupo jurídico, usando o mesmo estado de rascunho, schema, ação de gravação, erros de validação e controle `expectedRevision`. As áreas editadas nesse grupo atualizam a mesma lista confirmada do formulário principal. A edição de um título de área é aplicada ao sair do campo, preservando os detalhes correspondentes.

O monograma automático é apenas uma apresentação tipográfica derivada do nome, não uma marca oficial. O logo pode substituir essa apresentação. A recepção com identidade fictícia é recusada como logotipo.

A restauração pede confirmação e informa que a equipe e as imagens jurídicas voltam aos defaults. Dados comerciais e áreas confirmadas são preservados. As opções dos templates de Clínicas não são alteradas.

A prévia sem salvar utiliza o iframe existente e os seletores de 360, 390, 768, 1024 e 1440px. O botão de prévia fica indisponível para variantes sem renderizador, evitando falha de interface ao selecionar templates ainda planejados.

## Motor, catálogo e segurança

`advocacia-a` foi adicionado ao registro central de renderizadores e à ponte de renderização do motor. O catálogo de interface marca apenas Advocacia A como disponível; Advocacia B continua sem renderizador. A distribuição A/B, os slugs e os IDs de templates existentes não foram alterados. O catálogo persistido já é ativado para geração privada pela migration anterior do motor; não é necessário inserir outro template.

A listagem oferece **Ver site** para Advocacia A com dados válidos. As rotas privadas existentes continuam usando `requireAdminPage`, Supabase Auth e `admin_users`. Não foram criadas rotas públicas, relaxadas políticas RLS ou alterados controles de concorrência. `/p/[slug]` permanece inexistente.

Os 14 arquivos sob `src/templates/clinics/` permaneceram com hashes SHA-256 idênticos aos do início desta tarefa. A folha jurídica é totalmente delimitada por `.lawTemplate`; não altera seletores de Clínicas ou do painel. A infraestrutura de preview passou a usar um título acessível genérico, adequado aos dois nichos.

## Migration incremental necessária

Revisar `supabase/migrations/202611030003_law_classic.sql` e aplicar em homologação após as migrations das fases anteriores antes de salvar campos jurídicos novos.

A migration cria uma função privada de validação de `lawDesign` e estende o validador existente para aceitar a chave opcional. Valida versão, nicho, cores, caminhos locais, fotos ilustrativas, equipe autorizada, contatos, ícones e listas ordenadas sem duplicações. Preserva os validadores de Clínicas e o formato anterior do JSONB. As verificações de chaves JSONB em objetos aninhados usam parênteses explícitos para evitar erro de precedência de operadores. Não muda tabelas, não reescreve dados e não modifica migrations anteriores.

A migration foi testada no PostgreSQL local via PGlite. Não foi aplicada no Supabase remoto nesta execução. Renderizar registros antigos sem `lawDesign` não depende de gravar a extensão nova.

## Arquivos desta fase

| Arquivo | Mudança |
| --- | --- |
| `src/templates/law/classic/index.tsx` | Página jurídica completa |
| `src/templates/law/classic/classic.css` | Direção visual, fontes locais e responsividade |
| `src/templates/law/classic/model.ts` | Adaptação dos dados persistidos e monograma |
| `src/templates/law/classic/photography.ts` | Slots fotográficos e identificação da recepção com marca |
| `src/templates/law/classic/photo.tsx` | Next Image, legendas, recorte e fallback |
| `src/lib/generation/law-design.ts` | Contrato opcional versionado jurídico |
| `src/lib/generation/contracts.ts` | Extensão jurídica no contrato principal |
| `src/templates/registry.tsx` | Registro do renderizador Advocacia A |
| `src/lib/generation/registry.ts` | Integração com a ponte existente do motor |
| `src/config/catalog.ts` | Disponibilidade de Advocacia A na interface |
| `src/components/prototypes/law-design-editor.tsx` | Controles jurídicos no editor existente |
| `src/components/prototypes/prototype-list.tsx` | Estado jurídico, controles, CSS e proteção da prévia sem renderer |
| `src/components/prototypes/prototype-table.tsx` | Ver site para Advocacia A |
| `src/components/prototypes/preview-frame.tsx` | Título acessível da prévia sem fixar o nicho Clínicas |
| `src/app/preview/prototipos/[id]/page.tsx` | CSS jurídico na prévia autenticada |
| `supabase/migrations/202611030003_law_classic.sql` | Validação incremental |
| `tests/law-templates.test.ts` | Renderização, dados, imagens, equipe, links e autenticação |
| `tests/generation.test.ts` | Disponibilidade do novo renderizador |
| `tests/generation-database.test.ts` | Persistência, revisão e validação SQL jurídica |
| `docs/advocacia-fase-4.4.md` | Este relatório |

O workspace continha alterações de fases anteriores. Elas foram preservadas. Não houve nova dependência, commit, push ou deploy.

## Verificação e pendências

- ESLint: aprovado, sem avisos.
- TypeScript: aprovado no comando dedicado e no build final.
- Suíte automatizada: **91 testes aprovados**, zero falhas e zero skips.
- Banco local via PGlite: migration, gravação/releitura de `lawDesign`, concorrência e rejeição de dados inválidos aprovados; testes anteriores de Clínicas e RLS preservados.
- Build de produção: aprovado.
- HTTP do build local: teste adicional aprovado, com redirecionamento 307 de visitantes para login e 404 em `/p/[slug]`.
- Assets: os quatro PNGs responderam HTTP 200; o Next Image entregou a recepção em WebP a 1080px, com 46.618 bytes. A imagem servida é a origem; o recorte seguro é aplicado na composição do template.
- Os 14 arquivos dos templates de Clínicas mantiveram seus hashes SHA-256 originais desta tarefa.

**Revisão visual pendente nas cinco larguras.** O host de acesso ao navegador retornou indisponibilidade. Ao tentar inspecionar a janela do Studio, o computer-use encerrou o acesso porque não conseguiu determinar a URL atual do navegador no Windows com confiança suficiente. Não foram capturadas screenshots do layout nem declarado aceite visual. A inspeção dos quatro arquivos de imagem e a revisão do CSS não substituem essa etapa.

O mobile tem composição própria: foto do hero seguida de texto sobre fundo carvão, menu expansível, faixa institucional vertical, cards adaptados, contato em sequência e rodapé reorganizado. Faltam verificar esses comportamentos, foco, contraste, overflow e recorte real da recepção no navegador em 360, 390, 768, 1024 e 1440px.

Também falta aplicar a migration e testar edição, gravação e reabertura em uma conta de homologação no Supabase. O teste local de persistência não equivale a essa validação remota.

## Como visualizar

1. Executar `npm.cmd run dev` e entrar com um administrador.
2. Em **Protótipos**, escolher um registro de Advocacia atribuído à variante A e abrir **Ver site**.
3. Se o rascunho estiver na variante B, selecionar **Clássico e Sofisticado · A** no editor compatível. A distribuição automática existente também pode atribuir A a novos leads.
4. Usar o grupo de personalização jurídica e **Pré-visualizar alterações sem salvar**. Conferir as cinco larguras.
5. Após aplicar a migration em homologação, salvar, reabrir e confirmar a persistência. Na visualização, usar **Recarregar dados salvos**.
6. A página completa segue em `/preview/prototipos/[id]`, com acesso autenticado. Não há publicação pública nesta fase.
