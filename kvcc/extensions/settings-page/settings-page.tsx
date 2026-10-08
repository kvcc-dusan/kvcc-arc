"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import type { ReactNode } from "react";
import { Button } from "../button/button";
import { motionTokens } from "../lib/motion-tokens";
import styles from "./settings-page.module.css";

export interface SettingsNavItem {
  /** Matches the `id` of a `SettingsSection`. */
  id: string;
  label: string;
}

/** Use for a page of account, workspace or app preferences with several grouped sections. A single form with one submit does not need this; use the form components directly. */
export interface SettingsPageProps {
  sections: SettingsNavItem[];
  children: ReactNode;
  navLabel?: string;
}

const SPY_MARGIN = "-15% 0px -70% 0px";

export function SettingsPage({ sections, children, navLabel = "Settings sections" }: SettingsPageProps) {
  const reduceMotion = useReducedMotion();
  const [active, setActive] = useState(sections[0]?.id ?? "");
  const lock = useRef(false);

  // The nav follows the section nearest the top. A click jump pins the choice until the scroll settles, so the highlight does not flicker through sections it passes.
  useEffect(() => {
    const nodes = sections.map(item => document.getElementById(item.id)).filter((node): node is HTMLElement => node !== null);
    const observer = new IntersectionObserver(entries => {
      if (lock.current) return;
      const hit = entries.find(entry => entry.isIntersecting);
      if (hit) setActive(hit.target.id);
    }, { rootMargin: SPY_MARGIN });
    nodes.forEach(node => observer.observe(node));
    return () => observer.disconnect();
  }, [sections]);

  const jump = (id: string) => {
    const target = document.getElementById(id);
    if (!target) return;
    setActive(id);
    lock.current = true;
    target.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
    target.focus({ preventScroll: true });
    window.setTimeout(() => { lock.current = false; }, 700);
  };

  return <div className={styles.page}>
    <nav className={styles.nav} aria-label={navLabel}>
      <ul className={styles.navList}>
        {sections.map(item => <li key={item.id}>
          <a className={styles.navLink} href={`#${item.id}`} aria-current={active === item.id ? "location" : undefined} onClick={event => { event.preventDefault(); jump(item.id); }}>{item.label}</a>
        </li>)}
      </ul>
    </nav>
    <div className={styles.content}>{children}</div>
  </div>;
}

export interface SettingsSectionProps {
  id: string;
  title: string;
  description?: string;
  children: ReactNode;
}

/** One group of related rows under a heading. The rows share a single bordered panel. */
export function SettingsSection({ id, title, description, children }: SettingsSectionProps) {
  const titleId = `${id}-title`;
  return <section id={id} className={styles.section} aria-labelledby={titleId} tabIndex={-1}>
    <header className={styles.sectionHeader}>
      <h2 id={titleId} className={styles.sectionTitle}>{title}</h2>
      {description ? <p className={styles.sectionDescription}>{description}</p> : null}
    </header>
    <div className={styles.rows}>{children}</div>
  </section>;
}

export interface SettingsRowProps {
  label: string;
  description?: string;
  /** Puts the control under the text at full width. Use for custom controls wider than a switch or a select. Fields with their own label go in `SettingsField` instead. */
  stacked?: boolean;
  /** The control: a switch, select, button, or field. */
  children: ReactNode;
}

/** A label with help text on the left and its control on the right. The row is a labelled group, so a control without its own label (a switch) still has an accessible name. */
export function SettingsRow({ label, description, stacked = false, children }: SettingsRowProps) {
  const uid = useId();
  const labelId = `${uid}-label`;
  const descriptionId = `${uid}-description`;
  return <div className={styles.row} data-stacked={stacked || undefined} role="group" aria-labelledby={labelId} aria-describedby={description ? descriptionId : undefined}>
    <div className={styles.rowText}>
      <p id={labelId} className={styles.rowLabel}>{label}</p>
      {description ? <p id={descriptionId} className={styles.rowDescription}>{description}</p> : null}
    </div>
    <div className={styles.rowControl}>{children}</div>
  </div>;
}

export interface SettingsFieldProps {
  children: ReactNode;
}

/** A full-width row for a field that brings its own visible label, such as the Input, Textarea or Select components. Avoids a second label above it. */
export function SettingsField({ children }: SettingsFieldProps) {
  return <div className={styles.row} data-stacked>{children}</div>;
}

export interface SettingsDraft<T> {
  /** The working copy the controls edit. */
  draft: T;
  /** Merges a change into the draft without mutating it. */
  update: (patch: Partial<T>) => void;
  dirty: boolean;
  saving: boolean;
  /** Message from the last failed save, or null. */
  error: string | null;
  save: () => Promise<void>;
  discard: () => void;
}

const sameValue = <T,>(a: T, b: T): boolean => JSON.stringify(a) === JSON.stringify(b);

/** Tracks edits against the last saved values. `onSave` returns the promise of the save; reject to show the error state. Resets the baseline when it resolves. */
export function useSettingsDraft<T extends object>(saved: T, onSave: (draft: T) => Promise<void>): SettingsDraft<T> {
  const [draft, setDraft] = useState<T>(saved);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [baseline, setBaseline] = useState<T>(saved);

  // New saved values from outside (a refetch) replace the draft only when the user has no edits in flight.
  useEffect(() => {
    if (sameValue(draft, baseline)) setDraft(saved);
    setBaseline(saved);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reacts to the incoming saved values only
  }, [saved]);

  const update = useCallback((patch: Partial<T>) => setDraft(current => ({ ...current, ...patch })), []);
  const discard = useCallback(() => { setDraft(baseline); setError(null); }, [baseline]);
  const save = useCallback(async () => {
    setSaving(true);
    setError(null);
    try {
      await onSave(draft);
      setBaseline(draft);
    } catch (reason: unknown) {
      setError(reason instanceof Error && reason.message ? reason.message : "Your changes were not saved. Check your connection and try again.");
    } finally {
      setSaving(false);
    }
  }, [draft, onSave]);

  return { draft, update, dirty: !sameValue(draft, baseline), saving, error, save, discard };
}

export interface SettingsSaveBarProps {
  dirty: boolean;
  saving: boolean;
  error?: string | null;
  onSave: () => Promise<void> | void;
  onDiscard: () => void;
  saveLabel?: string;
}

/** Sticks to the bottom of the viewport while there are unsaved edits and leaves when there are none. The Save button is the only spinner. */
export function SettingsSaveBar({ dirty, saving, error, onSave, onDiscard, saveLabel = "Save changes" }: SettingsSaveBarProps) {
  const reduceMotion = useReducedMotion();
  return <AnimatePresence>
    {dirty ? <motion.div
      className={styles.saveBar}
      initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 8, transition: { duration: motionTokens.duration.fast, ease: [...motionTokens.ease.exit] } }}
      transition={reduceMotion ? { duration: 0 } : motionTokens.spring.smooth}
    >
      <p className={styles.saveMessage} role={error ? "alert" : "status"} data-error={error ? "" : undefined}>{error ?? "You have unsaved changes."}</p>
      <div className={styles.saveActions}>
        <Button variant="ghost" size="sm" type="button" onClick={onDiscard} disabled={saving}>Discard</Button>
        <Button variant="primary" size="sm" type="button" loading={saving} onClick={() => { void onSave(); }}>{saveLabel}</Button>
      </div>
    </motion.div> : null}
  </AnimatePresence>;
}
