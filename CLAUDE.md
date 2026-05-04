# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Commands

```bash
npm run dev      # start dev server (Turbopack)
npm run build    # production build
npm run lint     # ESLint
```

No test suite is configured.

## Architecture

Single-page drag-and-drop game built with **Next.js 16.2.4** (App Router), **React 19.2.4**, and **Tailwind CSS v4**.

### Stack notes

- Tailwind v4 uses `@import "tailwindcss"` in CSS — no `tailwind.config.js`. Custom utilities go directly in `globals.css`.
- Fonts are loaded via `next/font/google` in `layout.tsx` and applied as class names on `<html>`.
- All components are `'use client'` — there are no Server Components beyond the root layout and page.

### Data layer (`src/lib/`)

- `data.ts` — all game content: `CARDS_DATA` (20 connector cards), `CATEGORIES` (4 categories with slot counts), types `CardData` / `CategoryData`, and `CAT_LABELS`. This is the single source of truth for game content.
- `colors.ts` — `COLOR_MAP` maps the string color keys stored on each `CardData` (e.g. `"c-blue"`) to Tailwind gradient classes. Add new colors here when adding cards.

### Component tree

```
page.tsx
└── ConnectorsGame          # root game component; owns all state
    ├── DraggableCard       # card in the left panel; draggable when not placed
    ├── CategoryPanel       # one panel per category (4 total)
    │   └── CategorySlot    # individual drop target inside a panel
    ├── CardModal           # info overlay shown on card click (Escape to close)
    └── ResultOverlay       # shown after Submit Answers
```

### State management

All game state lives in `ConnectorsGame.tsx`:

- `slots: SlotState` — `Record<categoryId, (CardData | null)[]>` mapping every slot in every category to its placed card or null.
- `draggedCardRef` — a `useRef` (not state) holding the card being dragged, to avoid re-renders during drag.
- Drag-and-drop uses the native HTML5 drag API. `handleDrop` moves a card between slots atomically, clearing its previous position first.
- Timer runs via `setInterval` in a `useRef`; stops on submit, resets on Play Again.

### Scoring

`submitAnswers` counts only filled slots. Correctness is determined by `card.category === categoryId`. The score denominator in `ResultOverlay` is always `CARDS_DATA.length` (20), not `total` placed.
