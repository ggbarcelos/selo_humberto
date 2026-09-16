<!--
Sync Impact Report
- Version change: template → 1.1.0
- Modified principles: replaced scaffold placeholders with accessibility, identity-preserving media, and delivery principles
- Added sections: Product constraints, Development workflow
- Modified product constraint: reduced the initial frame set from four variants to three approved variants
- Removed sections: none
- Follow-up TODOs: none
-->

# Selo Humberto Constitution

## Core Principles

### I. User value first

Every iteration MUST preserve the primary journey: choose a frame, add a photo,
adjust it, preview the circular crop, and download a square PNG. Features that do
not improve that journey require explicit justification.

### II. Identity-preserving media

The application MUST treat an uploaded photo as user-owned visual content. It may
crop, scale, position, and mask the image, but MUST NOT alter facial identity or
apply generative retouching. The exported composition MUST be reproducible from
the selected frame and the original pixels.

### III. Accessible, touch-first interaction

Every control MUST have a visible label or accessible name, keyboard focus MUST be
usable, and dragging/zooming MUST work with mouse, touch, and a non-pointer
alternative. The interface MUST remain usable on small screens without horizontal
scrolling.

### IV. Brand fidelity and legibility

The visual system MUST use Humberto Matos campaign assets and the established red,
orange, navy, and green palette. Candidate name, campaign number, and logo MUST
remain legible inside the circular social-media crop at 1080 × 1080 output.

### V. Simple, verifiable delivery

The first release MUST be a static, client-side application with no account or
server upload requirement. Each change MUST be verifiable with a local preview,
JavaScript syntax checks, and a documented end-to-end quickstart.

## Product Constraints

- Export format is PNG, exactly 1080 × 1080 pixels.
- Uploaded files remain in the browser and are never sent to a server.
- The initial release includes three approved frame variants and matching blank
  frame previews in `modelos/`.
- The default example uses the supplied Humberto portrait only as a local preview;
  the user can replace it at any time.

## Development Workflow

Work follows the Spec Kit artifacts in `specs/001-selo-avatar/`. Requirements are
defined before implementation, and every completed task records its validation.
The visual output is reviewed at desktop and mobile widths before handoff.

## Governance

This constitution governs the feature specification, plan, task list, and source
implementation. Amendments MUST state the reason, update the semantic version, and
record the date in the sync impact report. A review MUST confirm that identity
preservation, accessibility, output dimensions, and local-only handling remain true.

**Version**: 1.0.0 | **Ratified**: 2026-09-15 | **Last Amended**: 2026-09-15
