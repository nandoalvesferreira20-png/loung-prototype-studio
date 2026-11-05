# Investigação de imagens — Clínicas A/B

## Evidências e limites

O relato afeta editor, prévia e publicação. As três etapas usam os renderizadores do registro de templates e o mesmo adaptador de clínicas. O snapshot mantém `clinicDesign`, incluindo as referências de imagem, e a reconstrução pública preserva esses valores.

Os quatro PNGs em `public/templates/clinics/shared/` existem, têm assinatura PNG válida, nomes em minúsculas e estão rastreados pelo Git. Não há regra de exclusão no `.gitignore`. Recepção e estrutura têm 1448 × 1086; consulta principal e detalhe têm 1122 × 1402. URLs começam por `/templates/`, sem `/public`. Os componentes usam dimensões intrínsecas, `sizes`, prioridade no hero e contêineres com dimensões e `object-fit`. Não foi necessário modificar configuração do otimizador ou usar `unoptimized`.

No build local de produção, os quatro arquivos e o otimizador `/_next/image` responderam 200 com conteúdo de imagem. O teste HTTP de snapshots renderizou ambos os templates pela rota pública e confirmou novamente cada asset e versão otimizada. Não foi fornecida URL afetada e `STUDIO_PUBLIC_URL` não está configurada neste checkout; o problema inicial do ambiente do usuário não foi reproduzido nem atribuído à Vercel.

Existe uma restrição anterior explícita: especialidades diferentes de clínica geral não recebem automaticamente as fotografias médicas padrão. Opções `null` significam remoção intencional. Essas regras e as escolhas legítimas foram preservadas. Não há evidência de caminhos legados incorretos nos dados reais; os caminhos antigos existentes em `premium/` permanecem válidos e cobertos por teste.

## Defeitos corrigidos

O componente de foto A guardava uma flag de falha sem associá-la à URL: uma falha mantinha a fotografia oculta mesmo após trocar a imagem no editor. Ambos os componentes abandonavam a fotografia imediatamente após um erro, sem tentar uma foto padrão compatível.

A recuperação agora é associada às URLs que falharam. Uma nova URL pode carregar, a imagem escolhida tem precedência e, se falhar, o componente tenta o padrão compatível uma vez. Se ambos falharem, mantém o aviso existente; não há ciclo de tentativas. A recuperação respeita remoção explícita e a especialidade. O fallback usa sua própria legenda ilustrativa, nunca se apresenta como fotografia real da clínica. O log contém apenas template e slot, sem URL, contatos ou dados pessoais.

Arquivos alterados: `premium/photo.tsx`, `premium/index.tsx`, `appointments/photo.tsx`, `appointments/index.tsx`, `tests/clinic-templates.test.ts` e `tests/http/publication.test.ts`. Arquivo novo: `shared/photo-recovery.ts`, sob `src/templates/clinics/`.

## Validação

- ESLint e TypeScript: aprovados.
- Suíte automatizada: 152 testes aprovados.
- Build de produção: aprovado.
- Teste HTTP de produção com transporte Supabase isolado: aprovado, cobrindo os oito snapshots, com verificação das imagens de clínicas.
- Caminhos personalizados, ausência explícita, recuperação sem ciclos, troca de URL e roundtrip do snapshot: cobertos.
- Prévia autenticada real, interação de erro no navegador e responsividade visual: pendentes. A tentativa de inspeção foi encerrada pelo Computer Use por não conseguir determinar com segurança a URL atual da janela.

Não houve alteração de JSONB, migration, autenticação, RLS, motor de geração ou outros nichos. Não houve deploy, commit, push ou republicação. Um futuro deploy é necessário para distribuir a correção de código. Não é necessária republicação por esta mudança; snapshots com referências próprias realmente inválidas devem ser identificados, corrigidos e revisados individualmente antes de eventual republicação.

Para concluir o diagnóstico do relato, é necessário inspecionar a URL afetada, a especialidade persistida e a requisição da imagem que falha (ou a ausência dela). Os testes locais não comprovam disponibilidade na implantação remota.
