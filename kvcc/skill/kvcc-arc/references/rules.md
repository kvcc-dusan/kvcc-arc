# Rules

Condensed from the Arc agent skill files (uiarc.dev, MIT). Wording is rewritten; values are exact.

## Color

- Use semantic roles only: `--background`, `--surface`, `--surface-raised`, `--surface-muted`, `--foreground`, `--text-secondary`, `--text-muted`, `--border`, `--border-subtle`, `--border-strong`, `--accent`, `--accent-strong`, `--accent-subtle`, `--success`, `--warning`, `--danger`.
- Never use the `--neutral-*` ramp, raw hex, `rgb()`, `hsl()`, or Tailwind color classes in product code.
- Most of a screen is neutral. Accent marks: active nav item, selected rows, key data series, progress, small interaction cues.
- Status colors mean real status and always ship with a text label.
- Custom selection controls use the `--control-*` tokens.
- Third-party logos keep their real brand colors.
- Gradient (`--arc-gradient-soft`): one subtle backdrop behind a marketing section. Never inside components or product UI. No glows, no colored shadows.
- One metallic or premium surface per view at most, with separate light and dark values.

## Type

- Geist (`--font-display`) for headings at 30px and above. Inter (`--font-body`) for everything else.
- Weights 400 and 500 only. Never 600 and above.
- Sizes from `--text-xs` to `--text-5xl`. No arbitrary sizes, nothing below `--text-xs`.
- `font-variant-numeric: tabular-nums` for changing or column-aligned numbers.
- No `text-transform: uppercase`, no wide letter-spacing on small labels, no eyebrow or overline above headings.
- Hero and section headings: `clamp(var(--text-3xl), 5vw, var(--text-5xl))` style scaling between two steps.
- Long text: `max-width: 65ch`.

## Surfaces, borders, shadows

- Prefer proximity and 1px hairline borders over cards. Cards only for a real boundary. No nested decorative cards.
- Cards rest on a border, not a shadow. Shadows (`--shadow-floating`) only for floating layers: menus, popovers, dialogs, sheets.
- No icons inside rounded tiles or circles unless the shape is the control or carries status.
- Sibling cards: same top edge and height, with a real 16 to 24px gap or a joined bordered group. Never a 1 to 4px gap.

## Radii

- Controls 18px (`--radius-control`), panels 26px (`--radius-panel`), surfaces 34px (`--radius-surface`), pills `--radius-pill`.
- Nested radius = outer radius minus padding, clamped to a small positive minimum.

## Spacing and size

- 4px grid, `--space-N` tokens.
- Control heights: `--control-height-sm` 36px, `--control-height-md` 44px (touch default), `--control-height-lg` 50px.
- Product pages: 16px inside a group, 24px between regions, 32 to 48px between sections of long forms, 24 to 32px page padding (16px phones).
- Marketing sections: 64 to 120px vertical padding (64px phones).

## Icons

- `lucide-react`, size 16, 20 or 24, `strokeWidth={1.75}`. Decorative icons get `aria-hidden="true"`.
- Destructive or unfamiliar actions get a text label, not icon only.

## Themes

- Dark: `data-theme="dark"` on `<html>`, set before first paint. Accent: `data-accent` on `<html>` (neutral, violet, blue, green, amber, orange, coral, rose).
- Check every screen in both themes and at least two accents: neutral and one saturated hue.
- Brand overrides go in `kvcc/theme.css`, never in `foundation.css`.

## Copy

- Sentence case everywhere: headings, buttons, tabs, table headers.
- No em dashes. Use periods, commas, colons, parentheses. Ranges: "9 to 17".
- No trailing period or decorative punctuation in headings.
- Buttons are verb plus object: "Save changes", "Delete project". No bare "Submit" or "Learn more".
- Subtitles only when they add information the heading lacks.
- True claims only. No invented numbers, testimonials, logos, awards. Label sample data and simulated actions.
- One term per concept across the product.
- Errors say what happened and how to fix it. Empty states say why and offer one next step. Destructive confirmations name the object and consequence.
- Dates human-readable: "Sep 24", "2 hours ago".

## Motion

- Presets from `components/arc/lib/motion-tokens`: `snappy` (presses, toggles, small indicators), `smooth` (panels, heights, layout; bounce 0), `morph` (shared highlights, shape and width morphs). CSS equivalents: `--ease-*`, `--duration-*`, `--ease-spring`.
- State-reporting UI (switches, drawers, panel heights, progress) never overshoots (`bounce: 0`). Visible bounce only for playful moments.
- Animate `transform` and `opacity`. Animate size only when the size change is the information, and only on a spring.
- One continuous movement per interaction. Springs so reversal does not jump. Exits faster than entrances.
- Press scale about 0.97, except on elements that anchor a popover or menu (respond with color).
- Counters count to the new value with tabular numerals and stable width.
- At most one orchestrated entrance per page. No scroll-reveal on every section. No loops unless they show live status.
- Keep animated elements mounted with stable keys. Changing key or swapping component type restarts the animation.
- Every animation has a reduced-motion branch: remove travel, loops, parallax, autoplay; keep final state, focus, feedback. Counters jump, panels appear at full height.

## Accessibility

- No hand-written focus rings, outlines, or box-shadow rings. Keyboard focus uses the one shared `:focus-visible` outline from `foundation.css` (tune via `--focus-outline`, `--focus-outline-width`, `--focus-outline-offset`).
- Highlighted items in composite widgets use the hover fill (`data-highlighted`).
- Buttons for actions, links for navigation. Every field has a visible label. Icon-only controls have specific names.
- One `h1` per page, headings in order, landmarks present.
- Everything clickable is reachable by Tab and works with Enter or Space. Composite widgets: one Tab stop, arrow keys inside. Overlays trap focus, return it, close on Escape. Gestures have a button or menu alternative. Shortcuts never capture keys from text fields.
- Errors tied to fields. Background status via `role="status"` or `aria-live="polite"`; blocking errors `role="alert"`. State never by color alone. `aria-busy="true"` on loading regions.
- Contrast: text 4.5:1 (3:1 large), icons and control borders 3:1. Check both themes, muted and disabled text included.

## React

- Use an existing Arc component or block before writing new UI. Follow its "when not to use".
- Documented props only. Wrap, never fork or restyle internals. `className` only for layout (margin, grid placement).
- Controlled (`value` plus handler) or uncontrolled (`defaultValue`), never both.
- Async callbacks (`onConfirm`, `onSubmit`, `onSave`) return the promise; reject to show the error state. No second spinner.
- First render is server-safe: read `window`, `matchMedia`, `localStorage`, `Date.now()`, `Math.random()`, locale or time zone only in an effect or `useSyncExternalStore` with a server snapshot. Format dates with explicit locale and `timeZone`.
- Never define a component inside another component's render. Keep `key` stable on animated nodes.
- Reserve space for changing values (tabular numerals, min widths).
- `"use client"` only in files with state, effects, or handlers.
- Every data region has loading, empty, error, success states.
