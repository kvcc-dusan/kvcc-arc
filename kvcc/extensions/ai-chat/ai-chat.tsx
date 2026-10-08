"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ArrowDown, ArrowUp, RefreshCw, Square } from "lucide-react";
import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import type { KeyboardEvent } from "react";
import { CopyButton } from "../copy-button/copy-button";
import { TextShimmer } from "../text-shimmer/text-shimmer";
import { motionTokens } from "../lib/motion-tokens";
import { AiMarkdown } from "./markdown";
import styles from "./ai-chat.module.css";

export type AiChatStatus = "idle" | "submitted" | "streaming" | "error";

export interface AiMessage {
  id: string;
  role: "user" | "assistant";
  /** Markdown subset for assistant messages; plain text for user messages. Grows while streaming. */
  content: string;
}

/** Use for a conversation with a model: streamed replies, stop, regenerate, copy, code blocks. For people talking to people (receipts, reactions, typing) use `chat-thread`. The component renders state; it never calls a model. Bring your own transport and drive `messages` and `status`. */
export interface AiChatProps {
  messages: AiMessage[];
  /** `submitted`: sent, no tokens yet. `streaming`: tokens arriving. `error`: the last request failed. */
  status: AiChatStatus;
  /** Called with the trimmed text. Reject to restore the text and show an error under the composer. */
  onSend: (text: string) => Promise<void> | void;
  /** Shown as a Stop button while `submitted` or `streaming`. Without it the button stays disabled during a reply. */
  onStop?: () => void;
  /** Called with the id of the last assistant message, or the last user message when no reply arrived. */
  onRegenerate?: (messageId: string) => void;
  /** Starter prompts on the empty state. Write them as verb plus object. */
  suggestions?: string[];
  assistantName?: string;
  /** Visually hidden label of the text box. */
  composerLabel?: string;
  placeholder?: string;
  emptyTitle?: string;
  emptyDescription?: string;
  /** Shown when `status` is `error`. */
  errorMessage?: string;
  /** Small note under the composer, such as "Responses may contain mistakes." */
  disclaimer?: string;
}

const STICK_THRESHOLD = 64;

export function AiChat({
  messages, status, onSend, onStop, onRegenerate, suggestions = [], assistantName = "Assistant",
  composerLabel = "Message", placeholder = "Ask anything", emptyTitle = "How can I help?", emptyDescription,
  errorMessage = "Something went wrong. Try again.", disclaimer,
}: AiChatProps) {
  const reduceMotion = useReducedMotion();
  const uid = useId();
  const scroller = useRef<HTMLDivElement>(null);
  const field = useRef<HTMLTextAreaElement>(null);
  const stuck = useRef(true);
  const [away, setAway] = useState(false);
  const [value, setValue] = useState("");
  const [sendError, setSendError] = useState<string | null>(null);
  const [announcement, setAnnouncement] = useState("");
  // Messages present on first render do not animate in; later ones do.
  const initialIds = useRef(new Set(messages.map(message => message.id)));
  const previousStatus = useRef(status);

  const busy = status === "submitted" || status === "streaming";
  const last = messages[messages.length - 1];
  const lastAssistant = [...messages].reverse().find(message => message.role === "assistant");
  const retryTarget = lastAssistant?.id ?? messages[messages.length - 1]?.id;

  const scrollToBottom = useCallback((smooth: boolean) => {
    const node = scroller.current;
    if (node) node.scrollTo({ top: node.scrollHeight, behavior: smooth && !reduceMotion ? "smooth" : "auto" });
  }, [reduceMotion]);

  // Follow the reply while the reader is at the bottom; leave them alone once they scroll up.
  useLayoutEffect(() => { if (stuck.current) scrollToBottom(false); }, [messages, status, scrollToBottom]);

  const onScroll = () => {
    const node = scroller.current;
    if (!node) return;
    const atBottom = node.scrollHeight - node.scrollTop - node.clientHeight < STICK_THRESHOLD;
    stuck.current = atBottom;
    setAway(!atBottom);
  };

  // Screen readers get status changes, not every streamed token.
  useEffect(() => {
    if (status === "submitted") setAnnouncement(`${assistantName} is thinking.`);
    else if (previousStatus.current === "streaming" && status === "idle") setAnnouncement(`${assistantName} replied.`);
    previousStatus.current = status;
  }, [status, assistantName]);

  const resize = () => {
    const node = field.current;
    if (!node) return;
    node.style.height = "auto";
    node.style.height = `${node.scrollHeight}px`;
  };
  useLayoutEffect(resize, [value]);

  const send = async (raw: string) => {
    const text = raw.trim();
    if (!text || busy) return;
    stuck.current = true;
    setSendError(null);
    setValue("");
    try {
      await onSend(text);
    } catch {
      setValue(text);
      setSendError("Your message was not sent. Check your connection and try again.");
    }
    field.current?.focus();
  };

  const onKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    // Enter sends, Shift+Enter breaks the line. Enter that confirms an IME composition does neither.
    if (event.key !== "Enter" || event.shiftKey || event.nativeEvent.isComposing) return;
    event.preventDefault();
    void send(value);
  };

  const canSend = value.trim().length > 0 && !busy;
  const showThinking = status === "submitted";

  return <div className={styles.chat}>
    <div ref={scroller} className={styles.scroll} onScroll={onScroll}>
      {messages.length === 0 && !busy ? <div className={styles.empty}>
        <h2 className={styles.emptyTitle}>{emptyTitle}</h2>
        {emptyDescription ? <p className={styles.emptyDescription}>{emptyDescription}</p> : null}
        {suggestions.length ? <ul className={styles.suggestions}>
          {suggestions.map(suggestion => <li key={suggestion}><button type="button" className={styles.suggestion} onClick={() => void send(suggestion)}>{suggestion}</button></li>)}
        </ul> : null}
      </div> : <div className={styles.thread} role="log" aria-label="Conversation" aria-live="off" aria-busy={busy}>
        {messages.map(message => {
          const streaming = status === "streaming" && message.id === last?.id && message.role === "assistant";
          const animate = !initialIds.current.has(message.id) && !reduceMotion;
          return <motion.article key={message.id} className={styles.message} data-role={message.role}
            initial={animate ? { opacity: 0, y: 8 } : false} animate={{ opacity: 1, y: 0 }} transition={motionTokens.spring.smooth}>
            <h3 className={styles.srOnly}>{message.role === "user" ? "You" : assistantName}</h3>
            {message.role === "user"
              ? <p className={styles.userText}>{message.content}</p>
              : <div className={styles.assistantBody} data-streaming={streaming || undefined}><AiMarkdown text={message.content} /></div>}
            {message.role === "assistant" && !streaming && message.content ? <div className={styles.actions}>
              <CopyButton value={message.content} iconOnly variant="plain" label="Copy response" />
              {onRegenerate && message.id === lastAssistant?.id && !busy ? <button type="button" className={styles.iconAction} aria-label="Regenerate response" onClick={() => onRegenerate(message.id)}><RefreshCw size={16} strokeWidth={1.75} aria-hidden="true" /></button> : null}
            </div> : null}
          </motion.article>;
        })}
        {showThinking ? <div className={styles.thinking}><TextShimmer>Thinking</TextShimmer></div> : null}
        {status === "error" ? <div className={styles.error} role="alert">
          <p>{errorMessage}</p>
          {onRegenerate && retryTarget ? <button type="button" className={styles.retry} onClick={() => onRegenerate(retryTarget)}>Try again</button> : null}
        </div> : null}
      </div>}
    </div>

    <div className={styles.dock}>
      <AnimatePresence>
        {away ? <motion.button type="button" className={styles.jump} onClick={() => { stuck.current = true; setAway(false); scrollToBottom(true); }}
          initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, transition: { duration: motionTokens.duration.fast } }} transition={reduceMotion ? { duration: 0 } : motionTokens.spring.smooth}>
          <ArrowDown size={16} strokeWidth={1.75} aria-hidden="true" />Jump to latest
        </motion.button> : null}
      </AnimatePresence>
      <form className={styles.composer} onSubmit={event => { event.preventDefault(); void send(value); }}>
        <label htmlFor={`${uid}-field`} className={styles.srOnly}>{composerLabel}</label>
        <textarea id={`${uid}-field`} ref={field} className={styles.field} rows={1} value={value} placeholder={placeholder}
          onChange={event => { setValue(event.target.value); if (sendError) setSendError(null); }} onKeyDown={onKeyDown} aria-describedby={sendError ? `${uid}-error` : undefined} aria-invalid={sendError ? true : undefined} />
        {busy
          ? <button type="button" className={styles.send} onClick={onStop} disabled={!onStop} aria-label="Stop generating"><Square size={16} strokeWidth={1.75} aria-hidden="true" /></button>
          : <button type="submit" className={styles.send} disabled={!canSend} aria-label="Send message"><ArrowUp size={16} strokeWidth={1.75} aria-hidden="true" /></button>}
      </form>
      {sendError ? <p id={`${uid}-error`} className={styles.sendError} role="alert">{sendError}</p> : null}
      {disclaimer && !sendError ? <p className={styles.disclaimer}>{disclaimer}</p> : null}
    </div>
    <p className={styles.srOnly} role="status">{announcement}</p>
  </div>;
}

export default AiChat;
