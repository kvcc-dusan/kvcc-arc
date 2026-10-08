# settings-page

Layout and state helpers for a page of preferences: sticky section nav, grouped rows, and a save bar with dirty tracking and async save. Original kvcc component, built to `kvcc/skill/kvcc-arc/references/rules.md`. It composes Arc controls (Input, Switch, Select) and does not restyle them.

## When to use

- Account, workspace or app preferences with two or more sections.
- Not for a single form with one submit (use the form components directly), and not for onboarding flows.
- Put it inside `app-shell`. The shell's `title` is the page h1, so this page starts at h2.

## Parts

| Export | Job |
|---|---|
| `SettingsPage` | Two columns: section nav (sticky, follows scroll, jumps on click) and content. The nav becomes a scrolling row under 768px. Takes `sections: { id, label }[]`; each id must match a `SettingsSection`. |
| `SettingsSection` | `id`, `title`, optional `description`. One bordered panel of rows. |
| `SettingsRow` | Label and help text left, control right. A labelled group, so a switch without its own label still has a name. `stacked` puts the control under the text. |
| `SettingsField` | Full-width row for a field that brings its own visible label (Input, Textarea, Select). Use this instead of `SettingsRow` so the label is not doubled. |
| `useSettingsDraft(saved, onSave)` | Draft state against the last saved values. Returns `draft`, `update(patch)`, `dirty`, `saving`, `error`, `save`, `discard`. Immutable updates. `onSave` returns a promise; reject to show the error. A refetch replaces the draft only if there are no unsaved edits. |
| `SettingsSaveBar` | Sticky bar shown while `dirty`. Discard and Save changes. The Save button is the only spinner. Error text uses `role="alert"`, the unsaved notice `role="status"`. Place it as the last child of `SettingsPage`. |

## Usage

```tsx
const form = useSettingsDraft(saved, async next => { await api.save(next); setSaved(next); });

<SettingsPage sections={[{ id: "profile", label: "Profile" }, { id: "notifications", label: "Notifications" }]}>
  <SettingsSection id="profile" title="Profile" description="How you appear to your team.">
    <SettingsField><Input label="Full name" value={form.draft.name} onChange={e => form.update({ name: e.target.value })} /></SettingsField>
  </SettingsSection>
  <SettingsSection id="notifications" title="Notifications">
    <SettingsRow label="Weekly digest" description="A summary every Monday.">
      <Switch checked={form.draft.digest} onCheckedChange={digest => form.update({ digest })} />
    </SettingsRow>
  </SettingsSection>
  <SettingsSaveBar dirty={form.dirty} saving={form.saving} error={form.error} onSave={form.save} onDiscard={form.discard} />
</SettingsPage>
```

Memoize the `sections` array, since the scroll spy re-subscribes when it changes.

## Installs as

`@components/arc/settings-page/{settings-page.tsx, settings-page.module.css}`. Depends on `motion`, `arc-motion-tokens` and `button`. Verified: installs into a Vite + React 19 + TypeScript project, typechecks, and the edit, failed-save, retry, saved flow works in the browser.

## Not covered

No vanilla port in the single-file bundle yet. Section-level save (a save bar per section) is not built.
