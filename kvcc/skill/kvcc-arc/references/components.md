# Component selection

Free items only. Ids are exact (see `component-index.md` for the full index). Name the job in one line, pick the item, read its markdown (`https://uiarc.dev/components/<id>/markdown`), follow its "when not to use". Use a block for a whole region, a component for one control. Use the same item for the same job across an app. Replace all block sample data.

## Actions and menus

- Main action: `button` (default primary), one per surface. Others set `variant` explicitly; a bare `<Button>` is primary.
- Dense toolbar action: `action-button`.
- Main action plus alternatives: `split-button`. Not a row of equal buttons.
- Navigation: a link, or a block action with `href`. Not a button that pushes a route.
- Actions on a trigger: `dropdown-menu`. Right-click or long-press: `context-menu`.
- Copy a value: `copy-button`. Not button plus toast.
- Label changing with state: `button` (children crossfade) or `text-morph` outside a button.
- Global search and commands: `command-palette`.
- Account, theme, sign out: `user-menu`. Light/dark: `theme-switch`.
- Hierarchy: `breadcrumb`. Paging: `pagination`.

## Inputs and forms

- Text: `input`, `textarea`. Mentions: `mention-input`.
- In-page search: `search-field`; tight header: `expanding-search`.
- Password: `password-field`, plus `password-strength` on sign-up.
- Numbers: `number-field`. Phone: `phone-input`. Money: `money-input`. Not `input type="number"`.
- 2 to 5 visible options, one choice: `radio-group`. With price or long description: `radio-cards`.
- One of many: `select`; type to filter: `combobox`; several: `multi-select`, `tag-input`; facets: `chip-group`.
- Immediate on/off: `switch`. Submitted agree or checklist: `checkbox`.
- View mode of the same content (2 to 5): `segmented-control`. Not `tabs`.
- Range or level: `slider`.
- Date: `date-picker`; range: `date-range-picker`; time: `time-picker`; inline grid only: `calendar`. Color: `color-picker`.
- Files: `file-dropzone` (target), `file-upload` (full flow).
- Verification code: `otp-input`. Rich text: `rich-text-editor`. Signature: `signature-pad`. Shortcut: `shortcut-recorder`.
- Rename in place: `inline-edit`. Multi-step flow: `stepper` plus your fields.
- Billing period: `billing-toggle` with `BillingPrice`.

## Overlays and disclosure

- Interrupting decision or short form: `dialog`. Long form, filters, record detail: `drawer`. Phone secondary task: `bottom-sheet`.
- Small anchored controls: `popover`. One-line hint: `tooltip` (never essential info). Person or link preview: `hover-card`.
- Peer panels of one object: `tabs`. Stacked sections, FAQ: `accordion`. Card that grows on request: `expandable-card`.
- Two panes trading space: `resizable-panels`. Long content in a fixed box: `scroll-area`.

## Feedback and status

- Confirm a foreground action: `button` `loading`, then its label. Not a toast.
- Destructive: `confirm-morph` by default; `hold-to-confirm` when accidental taps must be nearly impossible; `dialog` when consequences need explaining.
- Background result: `toast`, several: `toast-stack`. Persistent message: `alert` with `tone`.
- Status label: `badge` with `tone`. Known progress: `progress`; steps: `stepper`. Loading: `skeleton` in final layout. Nothing to show: `empty-state` with one action.
- Quota: `usage-meter`. Site notice: `announcement-bar`. People: `avatar`, `avatar-group`.

## Data display and charts

- KPI: `metric-card`. Changing number: `animated-counter`.
- Sort and compare records: `sortable-data-table`. Filters above a collection: `filter-toolbar`.
- Trend: `line-chart`; beside a value: `sparkline`. Categories or days: `bar-chart`.
- Share of whole (about 5 parts or fewer): `donut-chart`; percentages: `waffle-chart`; hierarchy: `treemap`.
- Dense time series with zoom: `brush-chart`. Before and after: `slope-chart`. Distributions: `ridgeline`. Layered totals: `streamgraph`. Value against range: `gauge`. Year of daily activity: `activity-heatmap`.
- Events newest first: `timeline`. Nested structure: `tree-view`. Code or JSON: `code-block`, `json-viewer`.
- Comments and chat: `comment-thread`, `chat-thread`.
- Plan or product comparison: `comparison-table` (block). Slides: `carousel`. Image before and after: `image-compare`. Touch row actions: `swipe-actions` (always with a menu path).

## Text effects (one per page, only where it explains something)

- `in-view-title` (once on scroll), `text-reveal` (on load), `text-morph` (next state), `text-shimmer` (ongoing work), `slot-text` (spinning values).

## Blocks

- App: `command-palette`, `notification-center`, `file-upload`, `otp-input`, `page-header`, `empty-states`, `sign-in`, `login-centered`, `signup-form`.
- Marketing: `site-header`, `hero-section`, `logo-marquee`, `stats-band`, `plan-comparison`, `comparison-table`, `faq-section`, `cta-section`, `newsletter-signup`, `contact-section`, `blog-grid`, `changelog-feed`, `site-footer`.
- `plan-comparison` is a finished two-plan demo with sample data. For real plans compose `billing-toggle`, plan cards or `radio-cards`, and `comparison-table`.
- Blocks with props (`hero-section`, `cta-section`, `faq-section`, `stats-band`, `comparison-table`, `site-header`) take content directly. Blocks without props (`page-header`, `plan-comparison`) are starting points: edit data in the installed file.

## Not in the free set (build natively to the rules, do not imitate Pro source)

- Data grid, sidebars and app shells, settings and billing pages, AI chat and composer blocks, advanced charts (funnel, radar, sankey, sunburst), week calendar, dock, glass and wallet components, command-heavy dashboards.
- Compose these from the free items above and the rules. Extensions live in `kvcc/extensions/` (see `kvcc/README.md`).
