# Clínicas — Template B, fase 4.3

## Resultado e comparação com a referência

O B foi reconstruído com composição própria: branco, azul-petróleo `#004D50`, tom profundo `#00383B`, verde-água `#B8DDD6`, fundo `#F5F8F7`, texto `#102D35` e tipografia sem serifa com títulos fortes. O layout segue a ordem e a distribuição da imagem fornecida:

1. Header branco com marca dinâmica, navegação e CTA.
2. Hero dividido: texto à esquerda, fotografia de consulta à direita e atalhos flutuantes neutros.
3. Barra de informações com quatro links funcionais.
4. Especialidades com título central e cards horizontais em três colunas no desktop.
5. Sobre em duas colunas: recepção à esquerda e conteúdo à direita.
6. Como funciona em verde-água, com três etapas numeradas e editáveis.
7. Galeria com três fotografias de altura uniforme no desktop.
8. Faixa azul-petróleo com CTA claro.
9. Contato com título central e cards somente para dados disponíveis.
10. Rodapé azul-petróleo com identidade, navegação, canais válidos e identificação demonstrativa.

Diferenças intencionais de conteúdo: não há NovaCare fixa, especialidades sugeridas como fatos, equipe inventada, estacionamento presumido ou promessa de agendamento online. Os elementos flutuantes são atalhos, os horários e o e-mail começam vazios e a galeria identifica fotografias conceituais. Sem serviços, a prévia mostra um aviso demonstrativo neutro. Os seis primeiros serviços ficam visíveis; os restantes ficam em um bloco expansível acessível por teclado.

**A proximidade visual foi trabalhada na implementação, mas não foi aprovada por inspeção do resultado renderizado.** A revisão visual no navegador ficou bloqueada; ver pendências abaixo.

## Fotografias verificadas

Todos os arquivos existem em `public/templates/clinics/shared/`. Nenhuma imagem externa foi acrescentada.

| Arquivo | Uso no B | Dimensões |
| --- | --- | --- |
| `doctor-consultation-main.png` | Hero | 1122 × 1402 |
| `clinic-reception-hero.png` | Sobre e primeira fotografia da galeria | 1448 × 1086 |
| `clinic-room-structure.png` | Segunda fotografia da galeria | 1448 × 1086 |
| `consultation-detail.png` | Terceira fotografia da galeria | 1122 × 1402 |

`next/image` usa dimensões intrínsecas dos assets conhecidos, `sizes`, prioridade no hero e carregamento tardio nas demais imagens. O hero prioriza a região superior do retrato para preservar o rosto; o editor permite centro, esquerda, direita, topo e base. As imagens mantêm `object-fit: cover`, sem deformação, e têm fallback para erro de carregamento.

O pacote médico é padrão somente para clínicas generalistas. Odontologia, estética, psicologia, fisioterapia e veterinária recebem fallback neutro até a seleção explícita de imagens compatíveis. Títulos-base e ícone principal se adaptam à especialidade, sem inserir serviços. A imagem de atendimento foi inspecionada como arquivo local; isso não substitui a revisão do layout no navegador.

Novos arquivos autorizados podem ser adicionados a `/templates/clinics/` e escolhidos pelo caminho local PNG, JPG, JPEG ou WebP. Não há upload para Storage nesta fase. Cada foto admite legenda e indicação ilustrativa. A indicação só deve ser desmarcada pelo administrador para fotografia real autorizada.

## Personalização e editor existente

O sistema continua usando o mesmo editor, contrato de validação, prévia isolada, ação de gravação e controle `expectedRevision`. Não foi criado outro fluxo de edição ou persistência.

O nome, a especialidade, o telefone, o WhatsApp, o Instagram, o endereço e a cidade/UF continuam em `confirmed`. A lista de serviços também continua em `confirmed.services`: os novos controles permitem adicionar, editar, remover e reordenar essa mesma lista. A edição do nome de um serviço é aplicada ao sair do campo, preservando sua descrição.

As opções específicas do B ficam em `customization_data.clinicDesign.appointments`, com `version: 1`. O contrato principal continua em `schemaVersion: 1` e a extensão `clinicDesign` mantém sua versão anterior. O B aceita registros sem a nova extensão; não há migração de conteúdo nem sobrescrita dos dados existentes.

Campos exclusivos do B:

- Identidade: logo local, subtítulo, cores controladas de identidade, botões e fundo das etapas, descrição do rodapé.
- Hero: título, descrição, CTA principal e secundário, foto, legenda e enquadramento.
- Serviços: título, introdução, CTA e descrições por serviço; ordem e nomes vêm da lista confirmada.
- Sobre: título, descrição, CTA e fotografia.
- Como funciona: título, introdução, três títulos e orientações, canal preferido.
- Galeria: título, descrição, três slots independentes, ordem, legendas, indicação ilustrativa e enquadramentos.
- Conversão: título, descrição e texto do botão.
- Contato: título, descrição, e-mail confirmado, horários confirmados e campos ocultos individualmente.
- Estrutura: ordem e visibilidade de serviços, Sobre, etapas, galeria, faixa e Contato.

Se o canal preferido estiver ausente ou oculto, o CTA usa outro canal confirmado. Sem canais válidos, leva ao bloco de informações do rodapé. O bloco existe mesmo com a seção Contato oculta, evitando âncoras quebradas. Campos ocultos também são retirados do rodapé e da seleção de canal preferido.

O editor mostra os controles do B quando a variante B está selecionada. A prévia sem salvar usa o mesmo iframe e seletor de 360, 390, 768, 1024 e 1440px. Restaurar os padrões do B pede confirmação e remove apenas a extensão específica do B, preservando dados confirmados e as opções do A. Campos comuns já salvos continuam disponíveis como fallback quando aplicável. Erros de validação bloqueiam o salvamento.

## Preservação do A e integração

Os cinco arquivos de `src/templates/clinics/premium/` permaneceram com hashes SHA-256 idênticos aos do início da tarefa. A folha compartilhada `clinics.css` não foi alterada. Todos os estilos novos começam com `.appointmentsV2` e são carregados depois dos estilos anteriores, tanto na prévia privada quanto no editor.

Um teste compara a saída HTML do A antes e depois de acrescentar opções exclusivas do B, exigindo igualdade. O registro central continua atribuindo `clinicas-b` ao renderizador existente, sem modificar o motor, slugs ou distribuição A/B. Auth, `admin_users`, RLS e proteções de publicação permanecem no fluxo existente. Não foi criada rota pública de demonstração; `/p/[slug]` permanece inexistente.

## Migration incremental

Revisar `supabase/migrations/202611030002_clinic_appointments.sql` e aplicar em homologação após a migration da fase 4.2, antes de salvar os novos campos.

Ela acrescenta uma função privada que valida versão, chaves, tipos, limites, cores, imagens locais, enquadramentos, e-mail, etapas e listas sem duplicações. Atualiza a função existente de validação para aceitar a extensão opcional do B e manter a validação anterior intacta para os demais campos. Não muda tabelas, políticas RLS, regras de administradores ou controle de concorrência. Nenhuma migration anterior foi editada.

A migration foi exercitada no PostgreSQL local de testes (PGlite), incluindo gravação, releitura e rejeição de dados inválidos. **Não foi aplicada no Supabase remoto nesta tarefa.**

## Arquivos criados ou modificados nesta fase

| Arquivo | Mudança |
| --- | --- |
| `src/templates/clinics/appointments/index.tsx` | Composição completa do novo B |
| `src/templates/clinics/appointments/appointments.css` | Direção visual e responsividade exclusivas do B |
| `src/templates/clinics/appointments/content.ts` | Copy por especialidade e seleção compatível de fotos |
| `src/templates/clinics/appointments/photo.tsx` | Next Image, legenda e fallback de erro |
| `src/lib/generation/appointments-design.ts` | Contrato versionado das opções do B |
| `src/lib/generation/contracts.ts` | Aceita extensão opcional do B |
| `src/components/prototypes/clinic-appointments-controls.tsx` | Grupos de controles específicos do B |
| `src/components/prototypes/clinic-design-editor.tsx` | Seleção dos controles pela variante |
| `src/components/prototypes/prototype-list.tsx` | Variante, lista de serviços e CSS do B no editor |
| `src/app/preview/prototipos/[id]/page.tsx` | Carrega CSS do B na prévia privada |
| `supabase/migrations/202611030002_clinic_appointments.sql` | Validação SQL incremental |
| `tests/clinic-templates.test.ts` | B fotográfico, opções, serviços, ausência de dados, isolamento do A e prévia privada |
| `tests/generation-database.test.ts` | Migration, persistência/releitura do B e rejeição SQL de dados inválidos |
| `docs/clinicas-fase-4.3.md` | Este relatório |

As alterações de fases anteriores presentes no workspace foram preservadas. Não houve commit, push, deploy ou instalação de dependências.

## Verificações e pendências

- ESLint: aprovado, sem avisos.
- TypeScript: aprovado, incluindo a verificação do build final.
- Suíte automatizada: **83 testes aprovados**, zero falhas e zero skips.
- PostgreSQL local de testes: migration nova, gravação/releitura da extensão B e rejeição de versões, cores, e-mails, listas e caminhos inválidos; cenários existentes de RLS e concorrência aprovados.
- Build de produção: aprovado.
- HTTP local do build: teste de prévia privada aprovado; visitantes anônimos recebem redirecionamento 307 para login e a rota pública `/p/[slug]` continua 404.
- Assets: as quatro imagens responderam HTTP 200; o otimizador Next Image entregou o hero em WebP a 1080px, com 45.828 bytes.
- Template A: hashes SHA-256 dos cinco arquivos preservados e teste de igualdade do HTML aprovado após adicionar opções do B.

A revisão visual nas cinco larguras permanece pendente. O host de acesso ao navegador estava indisponível. A alternativa de computer-use também encerrou o acesso por não conseguir determinar a URL atual do navegador no Windows com confiança suficiente. Não foram obtidas screenshots do layout. Não houve tentativa de contornar esse bloqueio.

A composição mobile tem ajustes próprios: hero e foto em sequência, apenas um atalho flutuante, barra em grade 2 × 2, cards adaptáveis, etapas verticais com alinhamento próprio, primeira foto da galeria em destaque e contato/rodapé reorganizados. Essa revisão de CSS não equivale a comprovar ausência de overflow ou aprovar contraste no navegador.

Faltam conferir menu interativo, expansão dos serviços, imagens, enquadramentos, foco, contraste e overflow nas cinco larguras. Também falta salvar/reabrir um rascunho real em homologação após revisar e aplicar a migration. Não houve acesso autenticado a uma conta de homologação para essa validação.

## Como visualizar no Studio

1. Executar `npm.cmd run dev` e entrar com um administrador.
2. Em **Protótipos**, abrir um registro de Clínicas atribuído à variante B e usar **Ver site**.
3. Para trocar um rascunho existente, selecionar o template B compatível no editor. Os controles específicos acompanham a variante selecionada.
4. Usar **Pré-visualizar alterações sem salvar** e o seletor de larguras.
5. Após aplicar a migration em homologação, salvar, reabrir o registro e conferir a persistência. Na prévia, usar **Recarregar dados salvos**.
6. A página completa permanece em `/preview/prototipos/[id]`, autenticada. Não há publicação pública nesta fase.
