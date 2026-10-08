# ai-chat

Conversation UI for a model: streamed replies, stop, regenerate, copy, safe markdown with code blocks, starter prompts. Original kvcc component, built to `kvcc/skill/kvcc-arc/references/rules.md`. It renders state and never calls a model: bring your own transport (fetch, SSE, an SDK) and drive `messages` and `status`.

## When to use

- A conversation between a person and a model.
- Not for people talking to people (receipts, reactions, typing): use `chat-thread`.
- Give its parent a height. The thread scrolls inside it and the composer docks at the bottom (`height: 100%`).

## Props

| Prop | Notes |
|---|---|
| `messages` | `{ id, role: "user" \| "assistant", content }[]`, oldest first. The last assistant message grows while streaming. |
| `status` | `idle`, `submitted` (sent, no tokens yet: shows "Thinking"), `streaming` (caret on the last paragraph, Send becomes Stop), `error` (alert with Try again). |
| `onSend(text)` | Trimmed text. Return the promise; if it rejects, the text returns to the box with an error under it. |
| `onStop` | Enables the Stop button during `submitted` and `streaming`. |
| `onRegenerate(id)` | Shows Regenerate on the last assistant message and Try again on error. Receives the last assistant message id, or the last user message id when no reply arrived. |
| `suggestions` | Starter prompts on the empty state. Write as verb plus object ("Summarize this file"). |
| `assistantName`, `composerLabel`, `placeholder`, `emptyTitle`, `emptyDescription`, `errorMessage`, `disclaimer` | Copy. English defaults. |

## Behavior

- Enter sends, Shift+Enter breaks the line, Enter during IME composition does neither. The box grows to 10rem, then scrolls.
- The thread follows the reply while the reader is at the bottom. Scroll up and it stops following; a "Jump to latest" button appears (also the keyboard route back).
- Screen readers hear status changes ("Assistant is thinking." then "Assistant replied."), not every token. The log has `aria-live="off"` and `aria-busy` while busy.
- New messages rise in with the `smooth` spring (no overshoot); messages present on first render do not animate. Reduced motion: no travel, no caret blink, no shimmer sweep.
- Assistant text is untrusted: markdown renders to React nodes only (no HTML strings). Links must be `http`, `https` or `mailto`; anything else (`javascript:`, `data:`, relative) shows as plain text. External links open with `noopener noreferrer`.

## Markdown subset

Paragraphs, headings (shown as emphasized lines, so the page heading order stays yours), bullet and numbered lists, quotes, fenced code (Arc `code-block`, including an unclosed fence while it streams), `**bold**`, `` `inline code` ``, links. No tables, images or nested lists. Extend `markdown.tsx` if you need more, keeping the no-HTML rule.

## Usage

```tsx
<div style={{ height: "100dvh" }}>
  <AiChat
    messages={messages}
    status={status}
    onSend={async text => { append({ role: "user", content: text }); await startReply(); }}
    onStop={abort}
    onRegenerate={id => retryFrom(id)}
    suggestions={["Summarize this file", "Explain this error"]}
    disclaimer="Responses may contain mistakes."
  />
</div>
```

## Deliberate exception

The text box's label is visually hidden (`composerLabel`, announced to screen readers) rather than shown, as in every chat product: the placeholder and the send button carry the visible cue. Everything else follows the accessibility rules.

## Installs as

`@components/arc/ai-chat/{ai-chat.tsx, markdown.tsx, ai-chat.module.css}`. Depends on `lucide-react`, `motion`, and the registry items `arc-motion-tokens`, `code-block`, `copy-button`, `text-shimmer`. Verified: installs into a Vite + React 19 + TypeScript project, typechecks, and a fake streaming transport exercised empty state, send, streaming with a code fence, finish, copy and regenerate actions, error with Try again, link sanitizing and Jump to latest.

## Not covered

No vanilla port in the single-file bundle. No message editing, branching, attachments, tool-call or reasoning panels, or message feedback buttons.
