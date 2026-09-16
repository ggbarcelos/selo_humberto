# Tasks: Gerador de Selo Eu Voto

**Input**: Design documents from `/specs/001-selo-avatar/`

## Phase 1: Setup

- [x] T001 Preserve campaign assets and establish the static project structure in `index.html`, `src/`, `modelos/`.
- [x] T002 Record the product constraints, local-only image handling, and three-frame scope in the constitution and spec artifacts.

## Phase 2: Foundational

- [x] T003 Define the frame registry and safe circular crop contract in `src/app.js`.
- [x] T004 Implement accessible status, file validation, and local image decoding in `src/app.js`.
- [x] T005 Implement responsive tokens, typography, and campaign palette in `src/styles.css`.

## Phase 3: User Story 1 — Criar meu selo (P1)

- [x] T006 [US1] Build the one-page generator layout and three-frame selector in `index.html`.
- [x] T007 [US1] Render photo behind the selected frame using Canvas 2D in `src/app.js`.
- [x] T008 [US1] Add mouse/touch drag, zoom slider, +/- controls, and reset behavior in `src/app.js`.
- [x] T009 [US1] Add file picker and drag-and-drop handling with clear error states in `src/app.js`.

## Phase 4: User Story 2 — Conferir e baixar (P1)

- [x] T010 [US2] Add 1080 × 1080 PNG export and download naming in `src/app.js`.
- [x] T011 [US2] Add native share with download fallback in `src/app.js`.
- [x] T012 [US2] Show the safe circular preview and campaign logo/number in the builder UI.

## Phase 5: User Story 3 — Celular e substituição (P2)

- [x] T013 [US3] Add touch-action handling and compact mobile layout in `src/styles.css`.
- [x] T014 [US3] Add example gallery with every frame rendered with photo and without photo in `index.html` and `src/app.js`.

## Phase 6: Polish & Validation

- [x] T015 Run JavaScript syntax validation and static HTTP smoke test.
- [x] T016 Update `quickstart.md` with the offline privacy check and end-to-end validation.

## Phase 7: UX recovery

- [x] T017 Make the editor the first screen and clarify the three actions in `index.html` and `src/styles.css`.
- [x] T018 Remove the ES module dependency and prebuild frame overlays so the controls also work when the page is opened directly from a local file.
- [x] T019 Improve file validation and add a click-to-upload fallback on the canvas in `src/app.js`.

## Phase 8: Identity and mask polish

- [x] T020 Inspect `lp_humberto` and align the header/footer with the official wordmark, number asset, local fonts, and palette.
- [x] T021 Rebuild frame overlays with connected-component masks and a feathered edge so white bands remain intact while the photo opening stays clean.
- [x] T022 Tune the photo aperture per frame and regenerate the 1080 × 1080 sample composites.
