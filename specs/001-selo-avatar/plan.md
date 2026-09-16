# Implementation Plan: Gerador de Selo Eu Voto

**Branch**: `001-selo-avatar` | **Date**: 2026-09-15 | **Spec**: [spec.md](spec.md)

## Summary

Uma página estática, responsiva e local-first para escolher uma das três
molduras, posicionar uma foto no recorte circular e baixar um PNG 1080 × 1080. A
composição será feita com Canvas 2D, usando os assets existentes da campanha.

## Technical Context

**Language/Version**: JavaScript ES2022, HTML5, CSS3

**Primary Dependencies**: Web APIs nativas (Canvas 2D, File API, Pointer Events,
Web Share quando disponível); nenhuma dependência de runtime

**Storage**: N/A; estado em memória da página

**Testing**: validação manual no quickstart, `node --check src/app.js` e smoke do
  servidor estático

**Target Platform**: navegadores modernos em desktop e mobile

**Project Type**: aplicação web estática de uma página

**Performance Goals**: primeira interação em menos de 2 s após carregar assets;
  redraw do Canvas sem travar o gesto em imagens de até 12 MP

**Constraints**: processamento da foto local, saída PNG 1080 × 1080, sem scroll
  horizontal a partir de 360 px

**Scale/Scope**: uma rota, três frames, uma foto por sessão, zero backend

## Constitution Check

- User value first: PASS — a tela abre diretamente no gerador.
- Identity-preserving media: PASS — apenas crop, scale, position e mask.
- Accessible, touch-first: PASS — labels, buttons, slider e Pointer Events.
- Brand fidelity: PASS — assets oficiais e paleta Humberto.
- Simple delivery: PASS — página estática e quickstart local.

## Project Structure

```text
index.html
src/
├── app.js
└── styles.css
modelos/
├── modelo1.png
├── modelo2.png
├── modelo3.png
└── modeloN-overlay.png  # overlays transparentes para composição local
img/
├── image22.png
├── logohumberto.png      # wordmark oficial usado no cabeçalho/rodapé
└── numero.png            # número oficial 65065
scripts/
└── build-overlays.py     # prepara máscaras sem vazamento branco
specs/001-selo-avatar/
├── spec.md
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/ui.md
└── tasks.md
```

**Structure Decision**: single static project; source JavaScript and CSS stay in
`src/`, campaign assets stay in their existing directories, and the Speckit
artifacts document the feature independently.

## Complexity Tracking

No constitution violations.
