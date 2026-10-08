"use client";

import { LayoutGroup, motion, useReducedMotion } from "motion/react";
import { Menu, PanelLeftClose, PanelLeftOpen, type LucideIcon } from "lucide-react";
import { useCallback, useEffect, useId, useRef, useState, useSyncExternalStore } from "react";
import type { KeyboardEvent, ReactNode } from "react";
import { motionTokens } from "../lib/motion-tokens";
import styles from "./app-shell.module.css";

export interface AppShellNavItem {
  id: string;
  label: string;
  icon: LucideIcon;
  /** Renders a link when set, a button otherwise. */
  href?: string;
  badge?: string | number;
}

export interface AppShellNavGroup {
  id: string;
  /** Group heading. Leave it out for an unlabeled top group. */
  label?: string;
  items: AppShellNavItem[];
}

export interface AppShellSlotState {
  /** True while the sidebar is the icon rail. Show a mark instead of a wordmark, an avatar instead of a name. */
  rail: boolean;
}

type Slot = ReactNode | ((state: AppShellSlotState) => ReactNode);

/** Use the shell for a signed-in product with three or more top-level destinations. A marketing site or a single-purpose tool does not need a sidebar. */
export interface AppShellProps {
  /** Logo and product name at the top of the sidebar. Collapses to whatever fits the rail, so lead with a mark. */
  brand: Slot;
  groups: AppShellNavGroup[];
  activeId: string;
  onNavigate?: (id: string) => void;
  /** Page title in the top bar. It is the page's h1, so the page content should not add another. */
  title: string;
  /** Right side of the top bar: search, a primary action, user menu. */
  actions?: ReactNode;
  /** Pinned to the bottom of the sidebar, such as the user or workspace switcher. */
  footer?: Slot;
  collapsed?: boolean;
  defaultCollapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
  navLabel?: string;
  children: ReactNode;
}

const renderSlot = (slot: Slot, state: AppShellSlotState): ReactNode => typeof slot === "function" ? slot(state) : slot;

const FULL_WIDTH = 248;
const RAIL_WIDTH = 68;
const MOBILE_QUERY = "(max-width: 767px)";
const FOCUSABLE = "a[href], button:not(:disabled), [tabindex]:not([tabindex='-1'])";

const subscribeMobile = (notify: () => void) => {
  const query = window.matchMedia(MOBILE_QUERY);
  query.addEventListener("change", notify);
  return () => query.removeEventListener("change", notify);
};
/** The server renders the desktop layout; the client corrects it after hydration, so the first paint never mismatches. */
const useIsMobile = () => useSyncExternalStore(subscribeMobile, () => window.matchMedia(MOBILE_QUERY).matches, () => false);

export function AppShell({ brand, groups, activeId, onNavigate, title, actions, footer, collapsed, defaultCollapsed = false, onCollapsedChange, navLabel = "Main", children }: AppShellProps) {
  const reduceMotion = useReducedMotion();
  const isMobile = useIsMobile();
  const [internalCollapsed, setInternalCollapsed] = useState(defaultCollapsed);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const rail = !isMobile && (collapsed ?? internalCollapsed);
  const sidebar = useRef<HTMLElement>(null);
  const menuButton = useRef<HTMLButtonElement>(null);
  const uid = useId();
  const mainId = `${uid}-main`;
  const drawerHidden = isMobile && !drawerOpen;

  // A closed drawer is out of the tab order and the accessibility tree, not just off screen.
  useEffect(() => {
    if (sidebar.current) sidebar.current.inert = drawerHidden;
  }, [drawerHidden]);

  const closeDrawer = useCallback(() => {
    setDrawerOpen(false);
    menuButton.current?.focus();
  }, []);

  useEffect(() => {
    if (!isMobile) setDrawerOpen(false);
  }, [isMobile]);

  useEffect(() => {
    if (drawerOpen) sidebar.current?.querySelector<HTMLElement>("[aria-current='page'], a[href], button")?.focus();
  }, [drawerOpen]);

  const toggleCollapsed = () => {
    const next = !rail;
    if (collapsed === undefined) setInternalCollapsed(next);
    onCollapsedChange?.(next);
  };

  const onSidebarKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (!drawerOpen) return;
    if (event.key === "Escape") {
      event.stopPropagation();
      closeDrawer();
      return;
    }
    if (event.key !== "Tab") return;
    const items = [...event.currentTarget.querySelectorAll<HTMLElement>(FOCUSABLE)];
    const first = items[0];
    const last = items[items.length - 1];
    if (!first || !last) return;
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  };

  const navigate = (id: string) => {
    onNavigate?.(id);
    if (isMobile) closeDrawer();
  };

  const width = isMobile ? FULL_WIDTH : rail ? RAIL_WIDTH : FULL_WIDTH;

  return <div className={styles.shell} data-rail={rail || undefined}>
    <a className={styles.skip} href={`#${mainId}`}>Skip to content</a>
    {isMobile && drawerOpen ? <div className={styles.backdrop} onClick={closeDrawer} aria-hidden="true" /> : null}
    <motion.aside
      ref={sidebar}
      className={styles.sidebar}
      data-drawer={isMobile || undefined}
      data-open={drawerOpen || undefined}
      initial={false}
      animate={{ width }}
      transition={reduceMotion ? { duration: 0 } : motionTokens.spring.smooth}
      onKeyDown={onSidebarKeyDown}
    >
      <div className={styles.brand}>{renderSlot(brand, { rail })}</div>
      <nav className={styles.nav} aria-label={navLabel}>
        <LayoutGroup id={`${uid}-nav`}>
          {groups.map(group => <div key={group.id} className={styles.group}>
            {group.label ? <p className={styles.groupLabel} data-hidden={rail || undefined}>{group.label}</p> : null}
            <ul className={styles.list}>
              {group.items.map(item => {
                const Icon = item.icon;
                const active = item.id === activeId;
                const content = <>
                  {active ? <motion.span layoutId="app-shell-active" className={styles.indicator} transition={reduceMotion ? { duration: 0 } : motionTokens.spring.morph} /> : null}
                  <Icon className={styles.icon} size={20} strokeWidth={1.75} aria-hidden="true" />
                  <span className={styles.label}>{item.label}</span>
                  {item.badge !== undefined ? <span className={styles.badge}>{item.badge}</span> : null}
                </>;
                const shared = { className: styles.item, "data-active": active || undefined, "data-tip": rail ? item.label : undefined, "aria-current": active ? ("page" as const) : undefined, "aria-label": rail ? item.label : undefined };
                return <li key={item.id}>
                  {item.href
                    ? <a {...shared} href={item.href} onClick={() => navigate(item.id)}>{content}</a>
                    : <button {...shared} type="button" onClick={() => navigate(item.id)}>{content}</button>}
                </li>;
              })}
            </ul>
          </div>)}
        </LayoutGroup>
      </nav>
      {footer ? <div className={styles.footer}>{renderSlot(footer, { rail })}</div> : null}
    </motion.aside>
    <div className={styles.column}>
      <header className={styles.topbar}>
        {isMobile
          ? <button ref={menuButton} type="button" className={styles.iconButton} onClick={() => setDrawerOpen(true)} aria-label="Open navigation" aria-expanded={drawerOpen}><Menu size={20} strokeWidth={1.75} aria-hidden="true" /></button>
          : <button type="button" className={styles.iconButton} onClick={toggleCollapsed} aria-label={rail ? "Expand sidebar" : "Collapse sidebar"} aria-expanded={!rail}>{rail ? <PanelLeftOpen size={20} strokeWidth={1.75} aria-hidden="true" /> : <PanelLeftClose size={20} strokeWidth={1.75} aria-hidden="true" />}</button>}
        <h1 className={styles.title}>{title}</h1>
        <div className={styles.actions}>{actions}</div>
      </header>
      <main id={mainId} className={styles.main} tabIndex={-1}>{children}</main>
    </div>
  </div>;
}

export default AppShell;
