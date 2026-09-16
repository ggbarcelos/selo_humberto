# Feature Specification: Gerador de Selo Eu Voto

**Feature Branch**: `001-selo-avatar`

**Created**: 2026-09-15

**Status**: Ready for implementation

**Input**: User description: criar um site inspirado nas referências fornecidas,
com três selos da campanha Humberto Matos, foto ajustável e download PNG.

## User Scenarios & Testing

### User Story 1 - Criar meu selo de apoio (Priority: P1)

Como apoiador, quero escolher uma moldura e colocar minha foto atrás dela para
gerar um selo “Eu voto” personalizado.

**Why this priority**: É o valor principal da página e precisa funcionar sem
cadastro, conta ou conhecimento técnico.

**Independent Test**: Abrir a página, escolher qualquer moldura, carregar uma
imagem e confirmar que a prévia mostra a foto atrás da moldura.

**Acceptance Scenarios**:

1. **Given** a página aberta, **When** o usuário escolhe um dos três modelos,
   **Then** a moldura ativa muda na prévia e no seletor.
2. **Given** um modelo ativo, **When** o usuário carrega uma imagem válida,
   **Then** a imagem aparece recortada na área circular e os controles são ativados.
3. **Given** uma imagem carregada, **When** o usuário arrasta ou altera o zoom,
   **Then** a posição visual acompanha a interação sem distorcer a proporção.

### User Story 2 - Conferir e baixar (Priority: P1)

Como apoiador, quero conferir o recorte circular e baixar um arquivo pronto para
compartilhar nas redes sociais.

**Why this priority**: O download é o resultado final que transforma a interação
em material de campanha compartilhável.

**Independent Test**: Com uma foto carregada, baixar o arquivo e verificar que ele
é um PNG quadrado de 1080 × 1080 com o número e logo dentro do círculo.

**Acceptance Scenarios**:

1. **Given** uma prévia pronta, **When** o usuário seleciona “Baixar selo”,
   **Then** o navegador baixa um PNG 1080 × 1080.
2. **Given** uma prévia pronta, **When** o usuário seleciona “Compartilhar”,
   **Then** o navegador usa o compartilhamento nativo quando disponível ou oferece
   o download como alternativa.

### User Story 3 - Usar no celular e substituir a foto (Priority: P2)

Como apoiador em um celular, quero tocar, arrastar e substituir minha foto sem
perder o estado do modelo escolhido.

**Why this priority**: A distribuição tende a acontecer por redes sociais e
mensageiros, onde o celular é o principal dispositivo.

**Independent Test**: Em uma viewport estreita, carregar outra foto, arrastar com
toque e usar o controle de zoom sem rolagem horizontal.

**Acceptance Scenarios**:

1. **Given** uma tela estreita, **When** o usuário toca e arrasta a prévia,
   **Then** a foto se move e a página não navega acidentalmente.
2. **Given** uma foto existente, **When** o usuário carrega outra,
   **Then** a nova foto substitui a anterior e o modelo permanece selecionado.

## Edge Cases

- Arquivo que não seja imagem: rejeitar com mensagem clara e manter a prévia atual.
- Arquivo muito grande: carregar localmente, reduzir apenas no Canvas e informar que
  a qualidade final depende da resolução original.
- Usuário tenta baixar sem foto: manter o botão desativado e explicar o próximo passo.
- Navegador sem `navigator.share`: usar download normal sem bloquear a criação do selo.
- Foto com transparência: preservar transparência durante o recorte e composição.

## Requirements

### Functional Requirements

- **FR-001**: O sistema MUST apresentar três molduras de selo com
  identidade visual da campanha.
- **FR-002**: O sistema MUST permitir selecionar uma imagem local por arquivo ou
  arrastar e soltar.
- **FR-003**: O sistema MUST renderizar a foto atrás da moldura em um Canvas 1080 ×
  1080, preservando proporção.
- **FR-004**: O sistema MUST permitir mover a foto por arraste e ajustar zoom por
  controle deslizante e botões de incremento/decremento.
- **FR-005**: O sistema MUST oferecer uma prévia circular e manter logo, nome e
  número dentro da área segura da moldura.
- **FR-006**: O sistema MUST baixar o resultado como PNG quadrado de 1080 × 1080.
- **FR-007**: O sistema MUST processar a foto somente no dispositivo do usuário;
  nenhuma imagem deve ser enviada a um servidor.
- **FR-008**: O sistema MUST informar estados de vazio, erro, carregamento e pronto
  com mensagens compreensíveis.
- **FR-009**: O sistema MUST suportar teclado, mouse e toque nos controles essenciais.
- **FR-010**: A galeria MUST mostrar cada moldura com foto de exemplo e sem foto.

### Key Entities

- **Frame**: moldura selecionável, com id, nome, imagem de overlay e descrição.
- **PhotoTransform**: posição e zoom aplicados à foto no Canvas.
- **ExportImage**: composição final PNG com dimensão fixa e nome de arquivo.

## Success Criteria

### Measurable Outcomes

- **SC-001**: Um usuário consegue gerar e baixar um selo em até 60 segundos sem
  cadastro.
- **SC-002**: 100% dos três modelos exibem logo, nome e número dentro do círculo
  de recorte.
- **SC-003**: O arquivo baixado é sempre PNG 1080 × 1080 e abre em navegadores
  modernos sem conversão adicional.
- **SC-004**: A jornada principal funciona em viewport de 360 px de largura sem
  rolagem horizontal.
- **SC-005**: Nenhum arquivo escolhido pelo usuário é transmitido pela aplicação.

## Assumptions

- O número da campanha usado no protótipo é 65065, conforme o site oficial enviado.
- `img/image22.png` é a foto de demonstração fornecida pelo usuário e pode ser
  substituída no navegador.
- Os assets existentes em `modelos/` são referências visuais aprovadas para os
  três primeiros modelos.
- Não haverá autenticação, banco de dados, analytics ou publicação automática na
  primeira versão.
