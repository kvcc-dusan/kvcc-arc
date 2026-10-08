# Extensions

Components that are not in the Arc free set. They live in `kvcc/extensions/<id>/` and install from the kvcc registry (`npx shadcn@latest add @kvcc/<id>`). Prefer an Arc item when one fits; reach for an extension when the job is listed here. Each follows `rules.md`.

| Id | Job | Notes |
|---|---|---|
| `app-shell` | Sidebar nav, top bar and content region for a signed-in product | Collapses to an icon rail, drawer under 768px. `title` is the page h1. `brand` and `footer` take a node or `({ rail }) => node`. Not for marketing pages. |
| `settings-page` | Sectioned preferences page: sticky section nav, grouped rows, save bar with dirty tracking and async save | Use inside `app-shell`. `SettingsField` for fields that carry their own label, `SettingsRow` for switches and selects. `useSettingsDraft` holds the draft; `onSave` returns a promise. Not for a single one-submit form. |
| `ai-chat` | Conversation with a model: streamed replies, stop, regenerate, copy, safe markdown and code blocks | Give the parent a height. You drive `messages` and `status` (`idle`, `submitted`, `streaming`, `error`); it never calls a model. `onSend` returns a promise. People-to-people chat is `chat-thread`, not this. |

Full docs per extension: `kvcc/extensions/<id>/README.md`.
