# Fotografias do Template A de Clínicas

Obtidas em 28/10/2026. Arquivos locais, servidos pelo Next Image; nenhuma chamada ao banco de imagens acontece no navegador. Não são imagens geradas nem fotografias da empresa prospectada. Todas têm legenda visível de referência e texto alternativo que esclarece essa distinção.

| Arquivo / slot                      | Autor e origem                                                                                                                                                         | Licença                                           | Dimensões locais                             |
| ----------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------- | -------------------------------------------- |
| `waiting-area.jpg` — hero           | Ivanna Lebediuk, [Modern Waiting Room with Earthy Tones and Plant Decor](https://www.pexels.com/photo/modern-waiting-room-with-earthy-tones-and-plant-decor-35056949/) | [Pexels License](https://www.pexels.com/license/) | 1600 × 2133                                  |
| `warm-interior.jpg` — institucional | Peter Muniz, [A living room with a chair and a mirror](https://unsplash.com/photos/a-living-room-with-a-chair-and-a-mirror-UwV3gLQNvKY)                                | [Unsplash License](https://unsplash.com/license)  | 1800 × 2700                                  |
| Detalhe / apoio                     | Mesmo arquivo `waiting-area.jpg`, com enquadramento por `object-position`                                                                                              | Mesma licença Pexels                              | Usa o arquivo existente, sem cópia duplicada |

As páginas originais identificam os autores e a licença gratuita de cada foto. A licença Pexels permite uso em sites e templates; a licença Unsplash permite uso comercial dentro de suas condições. As fotos não são CC0: as condições de cada fonte continuam aplicáveis. Nenhuma foto representa ou endossa esta clínica.

Download de origem, com redução de resolução oferecida pela fonte:

- `https://images.pexels.com/photos/35056949/pexels-photo-35056949.jpeg?auto=compress&w=1600&q=85`
- `https://images.unsplash.com/photo-1719786624883-e6969368e449?auto=format&fit=crop&fm=jpg&q=85&w=1800`

## Substituição antes de uso comercial específico

Substituir **hero**, **institucional** e **detalhe** por fotos reais autorizadas da clínica antes de representar suas instalações. É possível apresentar a composição como proposta visual com estas referências, mantendo as legendas e o caráter conceitual. Não afirmar que são ambientes da clínica.

Configuração: `src/templates/clinics/premium/photography.ts`. Os três slots são independentes, possuem dimensões intrínsecas, texto alternativo e enquadramento. Cada slot pode receber `null`; falha de carregamento também mostra uma nota pequena, sem blocos geométricos ou área vazia dominante. A composição se reorganiza quando a imagem falta.

Para novas fotos, registrar autor, origem, licença, autorização de uso, data de obtenção e dimensões. Fotos de funcionários/pacientes exigem confirmação de identidade e autorização apropriada antes de serem usadas como retratos reais. As fotos atuais não incluem pessoas. Não colocar arquivos privados neste diretório público; apenas assets aprovados para distribuição. O JSONB, os contatos e os dados do protótipo continuam nas rotas autenticadas.
