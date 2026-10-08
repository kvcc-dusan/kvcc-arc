# app-shell

Sidebar navigation, top bar and content region for a signed-in product. Original kvcc component, built to `kvcc/skill/kvcc-arc/references/rules.md`.

## When to use

- A product with three or more top-level destinations that people move between all day (dashboard, admin, internal tool).
- Not for a marketing site (use `site-header`), a single-purpose tool, or a flow with no persistent navigation (use a plain page with `page-header`).

## Behavior

- Desktop: 248px sidebar. The top bar toggle collapses it to a 68px icon rail (width moves on the `smooth` spring, no overshoot). Rail items show a name tip on hover and keyboard focus.
- Under 768px: the sidebar becomes a drawer over the page with a backdrop. Focus moves into it on open, is trapped, Escape closes it, and focus returns to the menu button. The closed drawer is `inert`.
- The active item gets one shared highlight that morphs between items (`morph` spring).
- `title` renders the page `h1`. Do not add another in the content.
- A skip link ("Skip to content") is the first tab stop.
- Reduced motion: widths jump, the highlight does not travel, the drawer appears without sliding.

## Usage

```tsx
import { AppShell, type AppShellNavGroup } from "@/components/arc/app-shell/app-shell";

const groups: AppShellNavGroup[] = [
  { id: "main", items: [
    { id: "overview", label: "Overview", icon: LayoutDashboard },
    { id: "projects", label: "Projects", icon: FolderKanban, badge: 12 },
  ] },
];

<AppShell
  brand={({ rail }) => rail ? <Logo /> : <><Logo /><span>Northline</span></>}
  groups={groups}
  activeId={active}
  onNavigate={setActive}
  title="Projects"
  actions={<Button>New project</Button>}
  footer={({ rail }) => <UserMenu compact={rail} />}
>
  {children}
</AppShell>
```

`brand` and `footer` accept a node or a function of `{ rail }`. Items render a link when `href` is set, a button otherwise. Nav state (`activeId`) is yours: derive it from the router.

## Installs as

`@components/arc/app-shell/{app-shell.tsx, app-shell.module.css}`. Depends on `lucide-react`, `motion` and `arc-motion-tokens`. Import path for motion tokens is `../lib/motion-tokens`, the layout the registry installs.
