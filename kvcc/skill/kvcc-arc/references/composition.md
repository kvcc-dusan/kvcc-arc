# Composition and responsive

## Plan the page

Write three lines before choosing components:

1. Job: what the person came to do.
2. Primary action: exactly one.
3. Regions: each region and the item it uses.

One `h1`. Section headings describe content. One primary `button` per surface; secondary actions in `split-button` or `dropdown-menu`.

## Page container

One container per app, set in the layout.

```css
.page { width: 100%; max-width: 1200px; margin-inline: auto; padding: 32px clamp(16px, 4vw, 32px); display: grid; gap: 24px; }
```

- Children fill their column. Blocks and cards add no page gutter of their own. Remove demo padding from installed blocks.
- Narrow a reading column with `max-width` only (forms and settings 640 to 720px).
- Grid and flex children get `min-width: 0`. User content gets `overflow-wrap: anywhere`.
- Never `width: 100vw` inside the page; use `width: 100%`.
- Heading, first card, and table share one left edge.

## Product pages and dashboards

- KPI row: `metric-card`s, equal heights, `grid-template-columns: repeat(auto-fit, minmax(200px, 1fr))`.
- Wide tables scroll inside their card: card has 1px `var(--border)`, `var(--radius-surface)`, `overflow: hidden`; inner wrapper `overflow-x: auto; overscroll-behavior-x: contain`. The page never scrolls sideways.
- Settings: one bordered group per section; each row has label and description on the left, control on the right; rows separated by `--border-subtle`. No card per row, no eyebrow labels. Link sections and switches with `aria-labelledby`.

## Marketing pages

- Section padding 64 to 120px vertical. Same container and gutters as the rest.
- One idea per section. Do not repeat the same card grid or split layout in consecutive sections.
- Default order: `site-header`, `hero-section`, proof (`logo-marquee` with real brand colors, `stats-band` with true numbers), features, pricing, `faq-section`, `cta-section`, `site-footer`.
- One entrance animation per page at most (`in-view-title` on the first heading).

## States

Every data region defines: loading (`skeleton` in final layout, `aria-busy`), empty (`empty-state`, one next step), error (inline `alert` with retry), success (confirm in place), disabled (reason nearby, or hide), long content (wrap or truncate, full value reachable).

## Page recipes

- Sign in or up: `sign-in` or `login-centered`, `signup-form`, `otp-input`.
- Dashboard: `h1`, `segmented-control` date range, `metric-card` row, `line-chart` or `bar-chart`, `sortable-data-table`.
- Settings: sections of `input`, `select`, `switch` rows; save `button`; `confirm-morph` for deletion.
- Record list: `filter-toolbar` or `search-field`, `sortable-data-table`, `pagination`, `empty-state`.
- Pricing: `billing-toggle` with `BillingPrice`, plan cards or `radio-cards`, `comparison-table`, `faq-section`.
- Landing: `site-header`, `hero-section`, `logo-marquee`, `stats-band`, `comparison-table`, `faq-section`, `cta-section`, `site-footer`.
- App shell: `command-palette`, `user-menu`, `notification-center`.
- Not found, offline, no results: `empty-states` block, or `empty-state` in a region.

## Responsive

- Check 390, 768, 1024, 1440px; also 320px for long labels or tables. No sideways page scroll except code blocks, wide tables, and segmented rows inside their own containers. Nothing clipped, overlapped, or cut mid-word.
- Gutters `clamp(16px, 4vw, 32px)`. Collapse multi-column to one column below about 800px. Settings rows stack label over control below about 560px.
- Container queries for component-level changes, media queries for page layout.
- Tables: scroll in their card or become a stacked list on phones. `comparison-table` stacks below `stackBelow` (640px default); sticky header via `stickyTop`. Charts follow container width; set `height` on the prop.
- Touch: targets at least 44px (`--control-height-md`), 8px between targets. Hover is an enhancement: `hover-card`, `tooltip`, row actions must be reachable by tap or focus. Gestures always have a button alternative.
- Phones: `bottom-sheet` for tasks and long menus, `popover` for small choices. `user-menu` already opens as a sheet.
- Read a component's "Responsive behavior" section before placing it in a narrow column. Use its props instead of custom media queries.
