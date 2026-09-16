# UI Contract: Gerador de Selo Eu Voto

## Required controls

| Control | Accessible name | Behavior |
|---|---|---|
| Frame selector | `Moldura N — descrição` | selects one frame and redraws preview |
| File input | `Escolher uma foto` | accepts image files only |
| Canvas | `Prévia do selo` | draggable photo surface |
| Zoom slider | `Zoom da foto` | range 100–240, step 1 |
| Reset | `Redefinir posição` | restores default transform |
| Download | `Baixar selo` | emits 1080 × 1080 PNG |
| Share | `Compartilhar imagem` | native share or download fallback |

## State contract

- Empty: explain how to choose a photo; download/share disabled.
- Ready: show selected frame, photo, transform controls, and enabled actions.
- Error: announce invalid file or share failure without discarding the current image.
- Busy: show short status while a file is decoded or a PNG is prepared.
