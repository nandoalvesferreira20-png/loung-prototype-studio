# Fotografias de clínicas — diagnóstico em produção

## Causa comprovada

Inspeção da URL pública em 05/11/2026: resposta 200, cinco avisos “Fotografia do ambiente em preparação” e nenhum elemento img. Os quatro PNGs respondem 200. O JavaScript publicado contém o log [clinic-image] da correção anterior. Isso confirma sua presença, mas não permite atribuir um SHA exato ao deploy.

A leitura anônima autorizada de published_prototypes confirmou template clinicas-a, especialidade Estética, payload versão 1, publicação versão 1 e ausência de clinicDesign. Não há opções de imagem ou remoção explícita no snapshot.

clinicModel resolve a especialidade para aesthetics. Antes da correção, PremiumClinic atribuía padrões nulos para toda especialidade diferente de general; room também era nulo. Sem override, os cinco componentes recebiam photo = null; nenhum src chegava ao Next Image. O aviso era produzido no servidor, antes de carregamento ou CSS. O Template B tinha a mesma condição nos padrões.

Não há perda comprovada de caminhos na publicação: campos opcionais ausentes são válidos e devem resolver os padrões do template. A causa é a resolução desses padrões, não um snapshot incompleto.

## Rascunho, prévia e publicação

O editor usa renderPersistedTemplate com dados validados; a prévia privada usa loadPrivatePreview e o mesmo registro; a página pública reconstrói a entrada pelo publicRendererInput e usa o mesmo registro/adaptador. A condição incorreta está no renderizador compartilhado.

A leitura do rascunho privado retornou 401 sem sessão administrativa. Apenas URL e chave publicável estão disponíveis localmente. Não foram extraídos cookies ou credenciais nem alteradas políticas. Revisão atual, template_id e diferenças reais entre customization_data e snapshot permanecem não confirmados. A compatibilidade dos três caminhos foi verificada em código e testes, sem declarar inspeção da sessão administrativa real.

## Correção

Novo arquivo src/templates/clinics/shared/default-photography.ts: clínica geral mantém os PNGs; demais especialidades recebem os JPGs existentes, versionados e licenciados premium/waiting-area.jpg e premium/warm-interior.jpg. Ambos foram inspecionados como referências neutras de ambiente sem retratos/procedimentos e respondem 200 em produção. Nenhuma imagem foi criada ou baixada.

premium/photography.ts e premium/index.tsx usam esses padrões nos cinco componentes. appointments/content.ts e components/prototypes/clinic-appointments-controls.tsx compartilham os padrões, inclusive ao editar legenda ou enquadramento no editor B.

Personalizações têm precedência. null continua significando “Sem imagem”; galeria vazia continua vazia. Nenhum JSONB foi regravado. A recuperação após erro permanece sem ciclos e com legenda ilustrativa adequada. Layout, cores, fontes e CSS foram preservados.

## Validação

- ESLint, TypeScript e build de produção aprovados.
- 153 testes aprovados, incluindo demais nichos e RLS.
- Estética sem clinicDesign: cinco imagens em ambos os templates, no rascunho e na entrada reconstruída do snapshot, sem mutação dos dados aprovados.
- Imagens personalizadas, remoção explícita e recuperação após falhas cobertas por testes.
- Teste HTTP de produção aprovado para os oito templates e Estética A/B, com leitura direta e otimizada dos JPGs, republicação e despublicação simuladas sem gravação remota.
- Snapshot público real, copiado sem alteração para transporte local isolado: resposta 200, cinco imagens, zero avisos e ambos os JPGs no HTML.
- Inspeção visual em navegador e comparação da sessão administrativa real permanecem pendentes. Não declarar produção corrigida sem inspeção após distribuição do código.

Arquivos desta correção: shared/default-photography.ts (novo), premium/photography.ts, premium/index.tsx, appointments/content.ts, components/prototypes/clinic-appointments-controls.tsx, tests/clinic-templates.test.ts, tests/http/publication.test.ts e este relatório.

## Distribuição

É necessário novo deploy. O protótipo informado não precisa de republicação: o snapshot já contém a especialidade e passará a resolver os padrões. Não há migration ou atualização de publicações. Publicações com null explícito continuam sem imagem e só devem mudar por decisão humana no editor e republicação aprovada.

Nenhum commit, push, deploy, alteração de banco ou republicação foi realizado.

Tentativa visual nesta sessão: o inventário do Computer Use retornou 'The browser access host is unavailable', sem abas controláveis. A validação visual do protótipo afetado não foi concluída. O servidor local de inspeção foi encerrado após a checagem HTTP.
