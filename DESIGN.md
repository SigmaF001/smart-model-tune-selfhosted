---
version: alpha
name: TuneLab Self-hosted Frontend
description: An operational workspace for users preparing, training, evaluating, and serving small language models.
colors:
  background: "hsl(0 0% 100%)"
  foreground: "hsl(228 12% 12%)"
  primary: "hsl(243 75% 59%)"
  accent: "hsl(243 75% 97%)"
  danger: "hsl(0 84% 60%)"
  success: "hsl(142 71% 45%)"
  warning: "hsl(38 92% 50%)"
typography:
  sans:
    fontFamily: "Inter, system-ui, sans-serif"
  mono:
    fontFamily: "JetBrains Mono, monospace"
rounded:
  DEFAULT: "0.625rem"
  md: "0.5rem"
  sm: "0.375rem"
spacing:
  page-max: "72rem"
  section-gap: "1.5rem"
components:
  button: { radius: "0.375rem" }
  card: { radius: "0.625rem" }
  dialog: { radius: "0.625rem" }
---

# TuneLab Self-hosted Frontend Design System

## Overview

### Creative North Star

A compact ML operations console: technical enough for model artifacts and job states, but calm enough that a long-running task feels observable rather than alarming.

### Product context and register

- **Audience and primary job:** authenticated practitioners run a fine-tuning pipeline and inspect its output.
- **Locales:** English and Thai, with key names and measurements kept terse for dense operational pages.
- **Register:** product. The distinctive signature is restrained violet on quiet neutral surfaces; status, not decoration, carries attention.
- **Token ownership/runtime mapping:** `src/index.css` owns runtime HSL variables and `tailwind.config.ts` maps them to component utilities. This file records those values; it does not generate CSS.

## Colors

Violet is reserved for navigation, primary actions, and active progress. Success, warning, and danger remain semantic. Light and dark theme values live together in `src/index.css`; charts and badges must not use colour as the only status signal.

## Typography

Inter is used for UI and prose; JetBrains Mono is reserved for IDs, API keys, and technical values. Use sentence case and stable tabular numerals where timing or cost is compared.

## Layout

Pages use a readable `max-w-6xl` content column, compact card spacing, responsive grids, and horizontally scrollable tables rather than clipped data. Loading and error states preserve the page's primary content region.

## Elevation & Depth

Cards use a light border and subtle shadow. Dialogs and toasts may layer above content; routine controls should not gain ornamental shadows.

## Shapes

Controls use the shared `--radius` family. Badges are pill-shaped only for compact status or categorisation.

## Components

Buttons, inputs, dialogs, cards, badges, Select, and toast primitives under `src/components/ui/` are the canonical UI owners. Busy buttons remain disabled and retain their geometry; destructive actions use `ConfirmDialog`.

## Do's and Don'ts

- **Do:** use the Engine's own state, error, and timing values as the display source of truth.
- **Do:** preserve same-origin API access so browser credentials never target internal service hostnames.
- **Don't:** present a Backend capability as a prototype once it is wired.
- **Don't:** show a secret value after its one-time creation response has been dismissed.
