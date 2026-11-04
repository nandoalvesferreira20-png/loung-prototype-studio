# Redesenho comercial — Template A de Clínicas

## Conceito

Direção de clínica boutique: verde profundo, marfim quente, detalhes naturais e tipografia serifada com corpo de leitura sem serifa. A imagem real ocupa o hero com recorte orgânico; o texto e o CTA têm prioridade. A apresentação da clínica intercala fotografia, copy e contato. Serviços confirmados aparecem em cards; o encerramento usa alto contraste com um cartão claro de canais de contato.

As áreas vazias foram reduzidas e substituídas por navegação útil, informações confirmadas e convites de contato. Não há estatísticas, avaliações, profissionais, procedimentos sugeridos, horários ou resultados inventados. Rótulos demonstrativos ficam junto à copy de exemplo; as fotografias são identificadas como referências de ambiente. A assinatura da Loung Tech permanece no rodapé e no aviso superior.

## Dados e compatibilidade

- Somente a variante `clinicas-a` foi redesenhada. Template B, cadastro, Auth, autorização, RLS, motor, contrato JSONB e rotas de acesso não foram alterados.
- O adaptador validado existente fornece nome, especialidade, serviços, descrição, cidade/UF, endereço e canais reais.
- O texto padrão antigo da geração recebe uma apresentação mais humana **somente no renderizador A**. Nenhum dado é sobrescrito no banco. Headline e introdução personalizados salvos são preservados.
- Descrição confirmada continua tendo precedência sobre texto de apresentação demonstrativo. Serviços e localização não aparecem se não estiverem informados.
- Hero prioriza WhatsApp válido; na ausência, telefone válido; sem ambos, encaminha para a seção de contatos. Não há formulário ou envio automático.
- A navegação mobile, foco de teclado, Escape, âncoras e preferência de movimento reduzido permanecem atendidos pelo menu e estilos existentes.

## Fotografias

Duas fotografias reais locais, sem pessoas, alimentam três slots independentes: hero, institucional e detalhe. O detalhe reutiliza a foto de espera com outro enquadramento, sem duplicar o arquivo. Não há SVG geométrico no Template A. O B mantém os assets anteriores.

Créditos, URLs originais, licenças e substituições necessárias estão em [ASSETS.md](../public/templates/clinics/premium/ASSETS.md). As referências não representam instalações reais da empresa; trocar os três slots por fotos autorizadas antes de apresentá-los como tal. Se não houver foto configurada ou se o arquivo falhar, uma nota discreta substitui a imagem e o layout se reorganiza.

## Arquivos criados ou alterados

- `src/templates/clinics/premium/index.tsx`: composição completa, novo hero, sobre, cards, convite e contato.
- `src/templates/clinics/premium/premium.css`: direção visual e responsividade exclusiva do A.
- `src/templates/clinics/premium/content.ts`: apresentação demonstrativa, sem modificar snapshots nem a variante B.
- `src/templates/clinics/premium/photography.ts`: três slots locais tipados para substituição independente.
- `src/templates/clinics/premium/photo.tsx`: Next Image, legenda, dimensões e fallback de carregamento.
- `src/templates/clinics/clinics.css`: removidos os estilos antigos exclusivos do A; estilos do B preservados.
- `src/app/preview/prototipos/[id]/page.tsx`: importação da nova folha de estilo do A.
- `tests/clinic-templates.test.ts`: atualizadas expectativas do A e acrescentadas verificações de fotografia, copy, personalização e fallback.
- `public/templates/clinics/premium/{waiting-area.jpg,warm-interior.jpg,ASSETS.md}`: fotografias e documentação.
- Este guia, guia original da fase e índice de assets: referências ao redesenho.

## Como visualizar

Inicie com `npm run dev`, entre com um administrador e abra **Protótipos → Ver site** em um registro de Clínicas com a variante **A — Institucional Premium**. Para mudar um rascunho B existente, use o editor administrativo e salve a variante A. Reabra a prévia ou use **Recarregar dados salvos**. Nenhuma regeneração é necessária.

Confira 360, 390, 768, 1024 e 1440px no seletor do painel. Para ver sem a moldura, use **Abrir página completa**. A rota continua autenticada; `/p/[slug]` continua inexistente, sem publicação.

## Validação

Executar `npm run lint`, `npm run typecheck`, `npm test` e `npm run build`. Os testes cobrem A/B, dados confirmados, especialidades, links, compatibilidade, autorização, atualização de dados salvos, copy personalizada, assets locais e ausência de fotos configuradas. O HTTP de prévia também verifica redirecionamento anônimo e 404 público.

Resultado desta execução: lint, TypeScript e build aprovados; **77 testes aprovados**. O cenário HTTP de proteção da prévia passou; o cenário independente sem configuração Supabase ficou skipped. As duas fotografias responderam HTTP 200 como arquivos locais e pelo otimizador Next Image (WebP a 1080px: aproximadamente 81 KB e 59 KB). Esses testes não autenticaram uma conta real no Supabase nem substituem revisão visual.

Os breakpoints foram revisados no CSS com colunas `minmax(0, ...)`, conteúdo que pode quebrar linha, menu mobile, botões com altura mínima, imagens com dimensão intrínseca e recortes próprios. **A revisão visual no navegador permanece pendente:** nesta sessão, a ferramenta retornou `The browser access host is unavailable`. Inspeção dos arquivos de fotografia foi realizada; isso não equivale a validar visualmente o site renderizado. Conferir overflow, menu, contraste, enquadramento e leitura nos cinco tamanhos antes de uso comercial.

Não houve deploy, commit, push, nova migration ou alteração de segurança.
