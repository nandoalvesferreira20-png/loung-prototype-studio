# Fase 4.5 — Advocacia B

Implementado no repositório: Template B moderno e minimalista, com identidade dinâmica do lead, branco/azul-marinho, tipografia sans-serif, hero assimétrico com recorte diagonal, manifesto dividido, áreas numeradas com divisórias, apresentação editorial, perfis horizontais autorizados, faixa de contato, contato e rodapé. Não há marca NEXO fixa, áreas presumidas, avaliações ou profissionais fictícios.

## Implementação e edição

- `src/templates/law/modern/`: renderizador, modelo, CSS isolado, fotografias e fallback de imagem.
- `src/lib/generation/law-modern-design.ts`: extensão opcional `lawModernDesign.version=1`, sem mudar a versão raiz ou remover `lawDesign`.
- `src/components/prototypes/law-modern-controls.tsx`: controles específicos na mesma edição, salvamento com revisão esperada e prévia do Studio.
- Registro visual e de geração, catálogo e botão Ver site habilitados para Advocacia B.
- Campos: marca/monograma/logo/tipo de atuação, sete cores, duas famílias sans-serif, textos e CTAs, manifesto, áreas confirmadas com descrição/URL/visibilidade, apresentação, equipe autorizada com URL opcional de perfil, conversão, contato, rodapé, fotos/alt/legenda/enquadramento e ordem/visibilidade das seis seções.
- Restaurar B remove somente sua extensão; A e dados confirmados permanecem. Equipe exige autorização explícita; retrato exige autorização e diretório `/templates/law/team/`. Sem equipe, bloco e navegação são omitidos.
- Slot professionals é demonstrativo apenas no editor, nunca gera equipe. `professionals.png` não foi criado e não é referenciado como asset padrão existente.

## Banco e acesso

Nova migração incremental: `supabase/migrations/202611030004_law_modern.sql`. Valida a extensão B e mantém as anteriores. Foi executada em PostgreSQL local PGlite pelos testes; **não foi aplicada ao Supabase remoto**. Aplicar pelo fluxo habitual de migrations antes de salvar `lawModernDesign` em produção.

A prévia permanece autenticada em `/preview/prototipos/[id]`; `/p/[slug]` continua inexistente. Nenhum deploy, commit, push ou publicação foi realizado. Nenhuma dependência foi instalada nesta fase.

Para revisar: no Studio, abra um protótipo de Advocacia, selecione B e use a edição/prévia privada. Salve após aplicar a migração. Imagens conceituais têm identificação ilustrativa e podem ser substituídas por fotos reais autorizadas em outro diretório.

## Verificações

- Lint, TypeScript e build de produção: aprovados.
- Suíte completa: 96 testes aprovados, incluindo persistência/releitura JSONB, revisão concorrente, URLs, imagens, autorização e preservação de A.
- HTTP: 1 teste aprovado; visitante não recebe personalização e rota pública permanece ausente.
- Três PNGs: HTTP 200, 1536×1024; hero 2.761.144 bytes, reunião 3.036.991 bytes, contato 3.026.920 bytes.
- Otimizador Next Image: HTTP 200, image/webp, 92.082 bytes para hero com largura 1080.
- Hashes dos 19 arquivos de `src/templates/clinics` e `src/templates/law/classic`: idênticos ao início da fase.
- Breakpoints e prévias de 360, 390, 768, 1024 e 1440 estão preparados. **Inspeção visual interativa e aceite visual pendentes**: o inventário da ferramenta retornou `browsers: []` e `The browser access host is unavailable`. Testes de código não comprovam ausência de overflow nem equivalência visual em cada largura.

## Assets

Três fotografias conceituais sem marca foram geradas com a ferramenta integrada ImageGen e inspecionadas como imagens; não representam instalações reais. Arquivos e prompts completos: `public/templates/law/modern/ASSETS.md`. Não são fotos de profissionais. O template não está declarado visualmente aprovado enquanto faltar a inspeção no navegador.
