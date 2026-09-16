# Research: Gerador de Selo Eu Voto

**Date**: 2026-09-15

## Decision 1: Canvas nativo para composição

- **Decision**: Usar Canvas 2D para recorte circular, transformação, moldura e
  exportação PNG.
- **Rationale**: atende a saída 1080 × 1080, não envia a foto para servidor e evita
  dependência de processamento de imagem externo.
- **Alternatives considered**: Cropper.js oferece uma API pronta, mas adiciona
  dependência e não é necessário para o gesto simples de arrastar + zoom deste MVP.

## Decision 2: Aplicação estática no navegador

- **Decision**: entregar uma página estática com JavaScript ES2022 e CSS próprio,
  sem dependência de bundler em runtime.
- **Rationale**: o fluxo não precisa de conta, banco, upload remoto ou backend; o
  processamento local é uma garantia de privacidade e reduz tempo de carregamento.
- **Alternatives considered**: Vite + TypeScript é uma boa evolução, mas exigiria
  instalar toolchain sem ganho funcional para esta primeira entrega; o código é
  organizado para migração futura.

## Decision 3: Linguagem visual da campanha

- **Decision**: usar a paleta oficial encontrada em `lp_humberto`: vermelho
  `#C62828`, vermelho escuro `#A32020`, laranja `#FFA539`, azul-marinho
  `#06213C` e branco. Usar as fontes locais Bebas Neue, Nexa Rust Sans e
  Hey-August, além da logomarca oficial `img/new/logohumberto.png` e do número
  `img/new/numero.png`.
- **Rationale**: o site oficial usa alto contraste, tipografia de cartaz e chamadas
  curtas; o gerador deve parecer parte da mesma campanha sem copiar a página inteira.
- **Alternatives considered**: interface neutra de ferramenta; rejeitada por perder
  reconhecimento de marca.

## Reference observations

- A referência Lynx organiza a experiência em uma prévia central, seleção horizontal
  de molduras, upload, zoom, redefinição e download.
- O site Humberto Matos usa chamadas em caixa alta, vermelho como base, laranja
  como acento, fundos brancos/editoriais e o número 65065.
- A implementação adota esses padrões, mas mantém a jornada em uma única tela.

## Decision 4: Máscaras dos frames

- **Decision**: manter os frames originais e gerar overlays PNG com apenas a área
  circular da foto transparente. A máscara é baseada no maior componente conectado
  e recebe uma pequena expansão/feather, preservando a faixa branca, o texto e a
  placa da campanha.
- **Rationale**: remover branco por limiar global criava pequenos vazamentos
  transparentes nas faixas do selo, percebidos como recortes/pixelização quando a
  foto era selecionada. A preparação fica em `scripts/build-overlays.py` e não
  altera a foto do usuário.
