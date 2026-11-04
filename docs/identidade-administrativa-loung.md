# Identidade administrativa — Loung Prototype Studio

## Escopo

Repaginação do painel e do login conforme a paleta, a hierarquia tipográfica e a direção editorial descritas no briefing. A implementação mantém os fluxos de importação, geração, edição, consultas, autenticação e prévias existentes.

O repositório não contém uma pasta `data/` na raiz. Os materiais encontrados estão em `src/data/`: `logo.png` e `demo.ts`. Não foi localizado um Brand Board separado, uma marca por extenso, variantes adicionais ou fontes proprietárias. Foi solicitado um eventual caminho adicional; a implementação avançou pelas especificações textuais fornecidas. A comparação visual com o Brand Board integral permanece pendente.

## Logo

- Original: `src/data/logo.png`.
- Cópia utilizada: `public/assets/brand/loung-tech-lt.png`.
- Conteúdo: símbolo oficial LT, 830 × 830 px, 9.654 bytes.
- A cópia é binariamente idêntica ao original, verificada em teste.
- Não houve redesenho, geração por IA, recoloração, filtro, máscara, recorte ou alteração de proporção.

O mesmo arquivo é utilizado nas superfícies claras e escuras, pois é a única variante fornecida. Aparece na sidebar, no login e na identificação compacta do cabeçalho. Os metadados do login e do layout administrativo usam esse PNG como ícone de navegador e Apple icon. As rotas de preview dos clientes não recebem um tema administrativo próprio nem novos metadados de marca exclusivos.

O texto “Loung Tech / Prototype Studio” ao lado do símbolo identifica a interface; não tenta recriar uma versão inexistente da logomarca. A identificação anterior desenhada em texto/CSS foi removida dos componentes visíveis de login e sidebar.

## Tokens e tipografia

Fonte central de cores: `src/config/brand.ts`. Os tokens são aplicados somente às raízes `.studio-ui` do painel e do login.

| Token            | Valor     | Aplicação                          |
| ---------------- | --------- | ---------------------------------- |
| `--lt-black`     | `#000000` | Sidebar, títulos, contraste        |
| `--lt-off-white` | `#F1EEE6` | Fundo geral e áreas editoriais     |
| `--lt-gray`      | `#A8A59D` | Apoio, bordas e divisórias         |
| `--lt-lime`      | `#CDF03B` | Ações principais e navegação ativa |
| `--lt-blue`      | `#2A4BFF` | Links e foco de teclado            |

O mesmo módulo define superfícies derivadas, cinza de texto mais escuro, bordas, hover e cores semânticas de erro, aviso, sucesso e informação. Esses estados mantêm identificação textual e cores próprias, sem usar lima indiscriminadamente. Os pares principais de texto/fundo foram verificados por cálculo de contraste de pelo menos 4,5:1. Isso não substitui uma auditoria visual e de acessibilidade completa.

Raios, unidade base de espaçamento e largura da sidebar ficam no tema CSS, com bordas discretas, superfícies planas, controles de 42–48 px e transições curtas desativadas quando o usuário prefere movimento reduzido. Não foram adicionados gradientes decorativos. O gráfico circular mantém o gradiente cônico necessário à representação dos dados, apenas com as cores atualizadas; seus cálculos permanecem iguais.

Fontes locais em `src/styles/fonts/`, carregadas com `next/font/local` e `display: swap`:

- **Bricolage Grotesque:** títulos, cabeçalhos e números principais.
- **Inter:** alternativa a Canva Sans para descrições, menus, tabelas, campos e controles.
- **Instrument Serif:** somente destaques editoriais no login e no banner do dashboard.

Canva Sans não foi fornecida com licença de incorporação web e não foi incluída. As três famílias utilizadas possuem licença SIL Open Font License 1.1, distribuída junto aos arquivos. As origens e condições podem ser consultadas nos fontes oficiais: [Bricolage Grotesque](https://github.com/google/fonts/tree/main/ofl/bricolagegrotesque), [Instrument Serif](https://github.com/google/fonts/tree/main/ofl/instrumentserif) e [Inter](https://github.com/google/fonts/tree/main/ofl/inter). Não há requisição ao Google Fonts durante a navegação. Não foram instaladas fontes no sistema operacional.

## Isolamento dos clientes

`src/styles/studio.css` utiliza exclusivamente seletores iniciados por `.studio-ui`. O teste de isolamento percorre a árvore CSS para garantir esse escopo.

O stylesheet global anterior foi mantido nesta rodada, evitando modificar as regras nas quais os templates existentes já se apoiam. As novas variáveis de fontes na raiz são apenas variáveis; as famílias administrativas são aplicadas dentro de `.studio-ui`, sem trocar a fonte padrão dos sites dos clientes. O carregamento de fontes não usa preload global.

As prévias do editor continuam em iframe e as prévias persistidas continuam em rota própria, fora do layout administrativo. Elas não possuem um ancestral `.studio-ui`. Nenhum componente ou stylesheet de `src/templates/` foi modificado nesta repaginação. As miniaturas conceituais da biblioteca possuem suas próprias paletas, sem receber a identidade lima do painel.

## Mudanças por área

| Área          | Alteração visual                                                                                                                                                                                              |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Sidebar       | Fundo preto, símbolo oficial, produto em segundo plano, ícones discretos, seleção lima, divisórias e área institucional organizada                                                                            |
| Header        | Off-white, breadcrumb compacto, identificação de ambiente privado e símbolo LT compacto                                                                                                                       |
| Login         | Fundo off-white, marca original, título principal do formulário em Bricolage, apresentação editorial pontual em Instrument Serif e ação lima                                                                  |
| Dashboard     | Indicadores com números expressivos e divisórias, banner compacto, cores de gráficos centralizadas e melhor leitura dos resumos; consultas, métricas e fórmulas preservadas                                   |
| Importações   | Dropzone, campos, mapeamento, tabelas, estados de validação e confirmação alinhados ao design system; processamento e deduplicação preservados                                                                |
| Protótipos    | Filtros, seleção, progresso, tabelas, status e ações consistentes; “Ver site” preservado                                                                                                                      |
| Editor        | Cabeçalho de personalização, indicador de alterações não salvas/revisão, grupos expansíveis, campos legíveis e barra de salvar; persistência e validação existentes preservadas                               |
| Biblioteca    | Oito templates apresentados com fotos locais ilustrativas, paletas próprias, identificação de nicho/variante e links atualizados                                                                              |
| Configurações | Identidade oficial e tokens exibidos a partir da fonte central; textos atualizados sobre funcionalidades existentes; controles locais continuam explicitamente identificados como simulações sem persistência |

As áreas de tabela receberam foco de teclado, nome acessível e rolagem horizontal. Sidebar e modal mantêm seus controles existentes de foco, Escape e fechamento. O login agora tem o título principal dentro do formulário, inclusive no mobile.

## Arquivos desta rodada

Criados:

- `src/config/brand.ts`
- `src/styles/studio.css`
- `src/styles/fonts.ts`
- `src/styles/fonts/bricolage-grotesque.ttf`
- `src/styles/fonts/instrument-serif.ttf`
- `src/styles/fonts/inter.ttf`
- `src/styles/fonts/bricolage-OFL.txt`
- `src/styles/fonts/instrument-serif-OFL.txt`
- `src/styles/fonts/inter-OFL.txt`
- `src/styles/fonts/README.md`
- `src/components/layout/studio-brand.tsx`
- `public/assets/brand/loung-tech-lt.png`
- `public/assets/brand/README.md`
- `tests/studio-brand.test.ts`
- `tests/http/studio-brand.test.ts`
- Este documento.

Modificados:

- `src/app/layout.tsx`: carregamento do tema, variáveis locais de fontes e descrição institucional.
- `src/app/(admin)/layout.tsx`: ícones administrativos.
- `src/app/login/page.tsx`: apresentação e logo; autenticação preservada.
- `src/app/(admin)/dashboard/page.tsx`: destaque editorial e cores do gráfico, sem mudar fórmulas ou consultas.
- `src/app/(admin)/templates/page.tsx`: apresentação atualizada dos oito templates.
- `src/components/layout/admin-shell.tsx`: logo, identificação, sidebar e breadcrumb.
- `src/components/templates/template-library.tsx`: fotografias ilustrativas, variantes e textos atualizados.
- `src/components/settings/settings-panel.tsx`: paleta central e textos institucionais.
- `src/components/prototypes/prototype-list.tsx`: indicador visual de alterações e barra de salvar.
- `src/components/prototypes/prototype-table.tsx`: semântica acessível da rolagem.
- `src/components/prototypes/generation-panel.tsx`: semântica acessível da rolagem.
- `src/components/imports/import-workspace.tsx`: semântica acessível da rolagem.
- `src/components/imports/import-history.tsx`: semântica acessível da rolagem.

O repositório já continha alterações de fases anteriores. Elas foram preservadas; a lista acima registra somente o trabalho desta rodada. Não houve alteração em Auth, `admin_users`, RLS, serviços de banco, migrations, classificação, deduplicação, motor A/B, lotes, slugs, contratos JSONB, catálogos, carrinho ou WhatsApp.

## Validação

- ESLint: passou, sem avisos.
- TypeScript: passou.
- Suíte automatizada: **138 testes passaram**, sem falhas.
- Build de produção: passou com as fontes locais.
- HTTP local: **2 testes passaram**, cobrindo login com marca/ícone, entrega do PNG original, redirecionamento das cinco rotas administrativas, prévias privadas e bloqueio de `/p`.
- Testes novos: logo copiada sem alteração, binários/fontes com licenças, isolamento do tema, contraste dos pares operacionais e oito miniaturas com assets existentes.
- Os testes funcionais existentes de importação, geração, persistência, autorização, catálogos e carrinho continuaram passando.

O navegador não estava disponível: a ferramenta retornou `The browser access host is unavailable`. Não foi possível produzir screenshots ou inspecionar telas autenticadas e interações reais no browser. Não se declara aprovação visual, equivalência ao Brand Board integral ou validação completa das cinco larguras apenas porque o build passou.

## Como conferir

1. Iniciar o ambiente pelo comando habitual; no PowerShell deste projeto, pode-se usar `npm.cmd run dev`.
2. Abrir `/login`, conferir logo, tipografia, formulário e ícone do navegador.
3. Entrar com a conta administrativa existente e revisar Visão geral, Importações, Protótipos, Templates e Configurações.
4. Abrir um protótipo existente no editor, alterar um campo, conferir o indicador de alteração pendente e a barra de salvar. Testar a prévia sem salvar antes de qualquer gravação real.
5. Abrir “Ver site” e comparar a identidade do cliente com sua versão anterior; o tema administrativo deve permanecer fora do iframe/rota do site.
6. Revisar manualmente 360, 390, 768, 1024 e 1440 px, incluindo sidebar, foco, tabelas, inputs, modais e editor.

Não é necessária migration ou reimportação. Permanecem pendentes a revisão visual nas cinco larguras, screenshots, interações autenticadas em navegador e comparação com o Brand Board completo, caso seja disponibilizado. Não houve deploy, commit ou push.
