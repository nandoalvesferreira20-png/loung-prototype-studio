# Clínicas A/B — restauração das fotografias oficiais

## Causa e correção

O problema original era uma condição por especialidade: apenas general recebia as fotografias padrão; Estética e demais especialidades recebiam null. A correção intermediária substituiu esses nulls por waiting-area.jpg e warm-interior.jpg. Esses arquivos existem no repositório, mas são imagens históricas de outras fontes e não são os quatro assets oficiais preparados para os layouts. A substituição intermediária foi removida.

A origem das referências incorretas era shared/default-photography.ts e sua seleção por especialidade, consumida por premium/photography.ts, appointments/content.ts e o editor B. Agora há um catálogo central fechado com somente os quatro PNGs oficiais. Os dois templates e os dois editores utilizam esse catálogo, independentemente da especialidade.

## Inventário real

Todos os arquivos abaixo estão rastreados no Git. Os originais não foram modificados. Nomes, extensões, formato e dimensões foram confirmados lendo os arquivos.

| Arquivo em public/templates/clinics/ | Bytes | Dimensões | Uso final |
|---|---:|---|---|
| shared/clinic-reception-hero.png | 2021754 | 1448 × 1086 | Padrão oficial |
| shared/doctor-consultation-main.png | 1741842 | 1122 × 1402 | Padrão oficial |
| shared/clinic-room-structure.png | 2083496 | 1448 × 1086 | Padrão oficial |
| shared/consultation-detail.png | 1658401 | 1122 × 1402 | Padrão oficial |
| premium/waiting-area.jpg | 348957 | 1600 × 2133 | Histórico; somente se escolhido explicitamente |
| premium/warm-interior.jpg | 656435 | 1800 × 2700 | Histórico; somente se escolhido explicitamente |

Também existem os seis SVGs históricos aesthetics, dentistry, general, physiotherapy, psychology e veterinary, além de ASSETS.md e premium/ASSETS.md. Nenhum SVG é utilizado como fotografia padrão pelos renderizadores atuais A/B. Não foram criados, baixados ou apagados assets.

## Mapeamento final

Todas as URLs padrão começam por /templates/clinics/shared/.

| Seção | Template A | Template B |
|---|---|---|
| Hero | clinic-reception-hero.png | doctor-consultation-main.png |
| Apresentação/atendimento | doctor-consultation-main.png | clinic-reception-hero.png |
| Estrutura/galeria | clinic-room-structure.png | clinic-reception-hero.png, clinic-room-structure.png, consultation-detail.png |
| Detalhe/apoio na galeria | consultation-detail.png e clinic-reception-hero.png | consultation-detail.png |

A distribuição mantém a composição existente de cada layout. Não houve mudança de CSS, cores, fontes ou layout.

## Prioridade e compatibilidade

1. null explícito continua removendo a fotografia. Galeria vazia continua vazia.
2. Foto personalizada válida tem precedência, inclusive um caminho histórico escolhido explicitamente.
3. Campo ausente ou undefined usa o PNG oficial da seção. Personalização antiga parcial e protótipos novos usam os mesmos padrões, sem regravar registros.
4. Se a foto escolhida falha ao carregar, a recuperação existente tenta o PNG padrão local. Se ambos falham, mantém o aviso neutro e registra somente template/slot, sem dados sensíveis ou ciclos.
5. Limpar o campo de caminho no editor restaura ausência/default. Somente a opção Sem imagem grava null. Strings vazias, URLs externas e caminhos inseguros continuam rejeitados pelo schema; não se tornaram opções implícitas de remoção.

Não há como distinguir retrospectivamente um null legítimo de um null gravado por uma configuração anterior sem histórico suficiente. Por isso, nulls persistidos não são convertidos automaticamente. Nenhum UPDATE, migration ou alteração de publicação foi executado.

O gerador atual constrói a personalização sem inserir URLs de fotografias ou clinicDesign padrão. O adaptador preserva clinicDesign quando existente; a resolução ocorre no renderizador comum ao editor, à prévia e à publicação. Não foi necessário modificar o motor A/B.

## Snapshot público afetado

Consulta de leitura em 05/11/2026 ao slug informado: template clinicas-a, especialidade Estética, publicação versão 1, sem clinicDesign. O HTML remoto respondeu 200, com cinco imagens e referências aos JPGs históricos: a correção intermediária está visível, mas os PNGs oficiais ainda não estão distribuídos como padrões nesse deploy.

Os quatro PNGs oficiais responderam 200 em produção. O snapshot real foi copiado sem alteração para transporte de teste local isolado. No build final, a mesma rota respondeu 200, com cinco imagens, zero avisos, os quatro PNGs oficiais presentes e nenhum dos JPGs históricos.

O snapshot não está incompleto: a ausência de personalização é válida e deve resolver os padrões oficiais. Esse protótipo não precisa ser republicado após o novo deploy. Publicações com foto personalizada explícita permanecem usando essa foto; se o administrador desejar alterá-la, deve editar e revisar a republicação. Não houve republicação automática.

A leitura de rascunhos privados continua dependente de sessão administrativa. Não há sessão administrativa disponível neste ambiente, e a RLS foi preservada. Não foi possível comparar a revisão atual do rascunho com o snapshot nem auditar configurações privadas de toda a base.

## Arquivos corrigidos

- src/templates/clinics/shared/default-photography.ts: catálogo oficial, dimensões e resolução sem condicionamento por especialidade.
- src/templates/clinics/premium/photography.ts e premium/index.tsx: padrões A provenientes do catálogo oficial.
- src/templates/clinics/appointments/content.ts: padrões B oficiais em todas as especialidades.
- src/components/prototypes/clinic-design-editor.tsx e clinic-appointments-controls.tsx: catálogo compartilhado e distinção entre limpar o campo e escolher Sem imagem.
- tests/clinic-templates.test.ts e tests/http/publication.test.ts: regressões dos padrões oficiais, Estética, demais especialidades, personalização, ausência explícita e snapshot.
- Este relatório substitui as conclusões da correção intermediária.

## Verificação

- ESLint: aprovado.
- TypeScript: aprovado.
- Suíte automatizada: 154 testes aprovados, incluindo demais nichos, preview privado, autorização, RLS e snapshots.
- Build de produção: aprovado.
- Teste HTTP de produção dos oito templates e Estética A/B: aprovado; os quatro PNGs são servidos diretamente e pelo otimizador Next Image.
- Snapshot público real no build local: aprovado conforme comparação acima.
- Sem diferenças nos arquivos de public; nenhum asset original alterado.

A inspeção visual do ambiente publicado não foi concluída: o acesso automatizado ao navegador estava indisponível nesta sessão. HTML, respostas HTTP e testes locais não equivalem à validação visual remota. Um novo deploy é necessário, seguido da conferência visual do hero, apresentação e galeria no protótipo afetado, além do editor e prévia autenticados.

Nenhum commit, push, deploy, alteração de banco ou republicação foi executado.
