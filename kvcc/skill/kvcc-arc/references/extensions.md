# Extensions

Components that are not in the Arc free set. They live in `kvcc/extensions/<id>/` and install from the kvcc registry (`npx shadcn@latest add @kvcc/<id>`). Prefer an Arc item when one fits; reach for an extension when the job is listed here. Each follows `rules.md`.

| Id | Job | Notes |
|---|---|---|
| `app-shell` | Sidebar nav, top bar and content region for a signed-in product | Collapses to an icon rail, drawer under 768px. `title` is the page h1. `brand` and `footer` take a node or `({ rail }) => node`. Not for marketing pages. |

Full docs per extension: `kvcc/extensions/<id>/README.md`.
