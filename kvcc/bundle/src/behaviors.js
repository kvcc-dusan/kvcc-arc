/* kvcc behaviors. Vanilla, no dependencies, safe to inline in a single-file artifact. Hand-written.
   Exposes window.kvcc: setTheme, setAccent, toast, openDialog, closeDialog, setProgress. Everything else is wired by data attributes. */
(() => {
  const reduceMotion = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
  const root = document.documentElement;
  const $$ = (sel, scope = document) => [...scope.querySelectorAll(sel)];
  const ACCENTS = ["neutral", "violet", "blue", "green", "amber", "orange", "coral", "rose"];

  // Theme and accent live on <html>. Set before first paint to avoid a flash.
  const setTheme = theme => { root.dataset.theme = theme === "dark" ? "dark" : "light"; };
  const setAccent = accent => { root.dataset.accent = ACCENTS.includes(accent) ? accent : "neutral"; };

  // Switch and checkbox: [data-kv-toggle] on a button with data-state. Fires a bubbling "kvcc-change" event with detail.checked.
  const toggle = el => {
    if (el.disabled) return;
    const next = el.dataset.state !== "checked";
    el.dataset.state = next ? "checked" : "unchecked";
    el.setAttribute("aria-checked", String(next));
    el.dispatchEvent(new CustomEvent("kvcc-change", { bubbles: true, detail: { checked: next } }));
  };
  document.addEventListener("click", event => {
    const el = event.target.closest("[data-kv-toggle]");
    if (el) toggle(el);
  });

  // Tabs: [data-kv-tabs] > [role=tablist] > [role=tab][aria-controls], panels are [role=tabpanel]. One Tab stop, arrows move.
  const initTabs = tabs => {
    const list = tabs.querySelector('[role="tablist"]');
    const triggers = $$('[role="tab"]', list);
    const selection = list.querySelector(".kv-tabs__selection");
    const select = (trigger, { focus = false } = {}) => {
      triggers.forEach(t => {
        const on = t === trigger;
        t.dataset.state = on ? "active" : "inactive";
        t.setAttribute("aria-selected", String(on));
        t.tabIndex = on ? 0 : -1;
        const panel = document.getElementById(t.getAttribute("aria-controls"));
        if (panel) { panel.hidden = !on; panel.dataset.state = on ? "active" : "inactive"; }
      });
      selection.style.setProperty("--x", `${trigger.offsetLeft}px`);
      selection.style.setProperty("--w", `${trigger.offsetWidth}px`);
      if (focus) trigger.focus();
    };
    triggers.forEach(t => t.addEventListener("click", () => select(t)));
    list.addEventListener("keydown", event => {
      const i = triggers.indexOf(document.activeElement);
      if (i < 0) return;
      const keys = { ArrowRight: i + 1, ArrowLeft: i - 1, Home: 0, End: triggers.length - 1 };
      if (!(event.key in keys)) return;
      event.preventDefault();
      select(triggers[(keys[event.key] + triggers.length) % triggers.length], { focus: true });
    });
    const initial = triggers.find(t => t.dataset.state === "active") ?? triggers[0];
    selection.dataset.ready = "false";
    select(initial);
    requestAnimationFrame(() => requestAnimationFrame(() => { selection.dataset.ready = "true"; }));
    addEventListener("resize", () => select(triggers.find(t => t.dataset.state === "active") ?? triggers[0]));
  };

  // Dialog: <div data-kv-dialog id hidden> with .kv-dialog__overlay and .kv-dialog__content[role=dialog][tabindex=-1].
  // Openers: [data-kv-open="id"]. Closers: [data-kv-close], overlay click, Escape. Focus is trapped and returned.
  const FOCUSABLE = 'a[href], button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])';
  const openers = new WeakMap();
  const setDialogState = (dialog, state) => $$(".kv-dialog__overlay, .kv-dialog__content", dialog).forEach(el => { el.dataset.state = state; });
  const openDialog = id => {
    const dialog = document.getElementById(id);
    if (!dialog || !dialog.hidden) return;
    openers.set(dialog, document.activeElement);
    dialog.hidden = false;
    setDialogState(dialog, "open");
    const content = dialog.querySelector(".kv-dialog__content");
    (content.querySelector("[data-kv-autofocus]") ?? content).focus();
  };
  const closeDialog = id => {
    const dialog = document.getElementById(id);
    if (!dialog || dialog.hidden) return;
    setDialogState(dialog, "closed");
    const finish = () => { dialog.hidden = true; openers.get(dialog)?.focus?.(); };
    if (reduceMotion()) return finish();
    setTimeout(finish, 180);
  };
  document.addEventListener("click", event => {
    const opener = event.target.closest("[data-kv-open]");
    if (opener) return openDialog(opener.dataset.kvOpen);
    const dialog = event.target.closest("[data-kv-dialog]");
    if (!dialog) return;
    if (event.target.closest("[data-kv-close]") || event.target.classList.contains("kv-dialog__overlay")) closeDialog(dialog.id);
  });
  document.addEventListener("keydown", event => {
    const dialog = $$("[data-kv-dialog]").find(d => !d.hidden);
    if (!dialog) return;
    if (event.key === "Escape") return closeDialog(dialog.id);
    if (event.key !== "Tab") return;
    const items = $$(FOCUSABLE, dialog.querySelector(".kv-dialog__content"));
    if (!items.length) return event.preventDefault();
    const [first, last] = [items[0], items[items.length - 1]];
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  });

  // Toast: kvcc.toast({ title, description, duration }). Polite live region, dismissible, auto-hides.
  const CLOSE_ICON = '<svg class="kv-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12"/></svg>';
  const CHECK_ICON = '<svg class="kv-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg>';
  const toaster = () => {
    let el = document.querySelector(".kv-toaster");
    if (el) return el;
    el = document.createElement("div");
    el.className = "kv-toaster";
    el.setAttribute("role", "status");
    el.setAttribute("aria-live", "polite");
    document.body.append(el);
    return el;
  };
  const toast = ({ title, description = "", duration = 4000 }) => {
    const el = document.createElement("div");
    el.className = "kv-toast__toast";
    el.innerHTML = `<span class="kv-toast__icon">${CHECK_ICON}</span><span class="kv-toast__frame"><span class="kv-toast__copy"><span class="kv-toast__title"></span><span class="kv-toast__description"></span></span></span><button type="button" class="kv-toast__close" aria-label="Dismiss notification">${CLOSE_ICON}</button>`;
    el.querySelector(".kv-toast__title").textContent = title;
    const desc = el.querySelector(".kv-toast__description");
    description ? (desc.textContent = description) : desc.remove();
    const dismiss = () => {
      if (el.dataset.state === "closed") return;
      el.dataset.state = "closed";
      setTimeout(() => el.remove(), reduceMotion() ? 0 : 160);
    };
    el.querySelector("button").addEventListener("click", dismiss);
    toaster().append(el);
    if (duration > 0) setTimeout(dismiss, duration);
    return dismiss;
  };

  // Tooltip: [data-kv-tooltip="text"] on any focusable or hoverable element. Shows on hover (after 300ms) and keyboard focus, closes on Escape.
  const TOOLTIP_DELAY = 300;
  let tip = null;
  let tipTimer = 0;
  const hideTip = () => {
    clearTimeout(tipTimer);
    if (!tip) return;
    const gone = tip;
    tip = null;
    gone.dataset.state = "closed";
    setTimeout(() => gone.remove(), 120);
  };
  const showTip = target => {
    hideTip();
    const el = document.createElement("div");
    el.className = "kv-tooltip__tooltip";
    el.id = "kv-tip";
    el.setAttribute("role", "tooltip");
    el.dataset.state = "delayed-open";
    el.textContent = target.dataset.kvTooltip;
    document.body.append(el);
    const rect = target.getBoundingClientRect();
    const box = el.getBoundingClientRect();
    const below = rect.top - box.height - 8 < 4;
    el.dataset.side = below ? "bottom" : "top";
    el.style.top = `${below ? rect.bottom + 8 : rect.top - box.height - 8}px`;
    el.style.left = `${Math.min(Math.max(rect.left + rect.width / 2 - box.width / 2, 8), innerWidth - box.width - 8)}px`;
    target.setAttribute("aria-describedby", "kv-tip");
    tip = el;
  };
  document.addEventListener("pointerover", event => {
    const target = event.target.closest?.("[data-kv-tooltip]");
    if (!target || event.pointerType === "touch") return;
    clearTimeout(tipTimer);
    tipTimer = setTimeout(() => showTip(target), TOOLTIP_DELAY);
  });
  document.addEventListener("pointerout", event => { if (event.target.closest?.("[data-kv-tooltip]")) hideTip(); });
  document.addEventListener("focusin", event => { const t = event.target.closest?.("[data-kv-tooltip]"); if (t && t.matches(":focus-visible")) showTip(t); });
  document.addEventListener("focusout", hideTip);
  document.addEventListener("keydown", event => { if (event.key === "Escape") hideTip(); });

  // Progress: [role=progressbar][data-value][data-max]. kvcc.setProgress(el, value) updates fill, aria and the complete state.
  const setProgress = (el, value) => {
    const max = Number(el.getAttribute("aria-valuemax")) || 100;
    const safe = Math.min(Math.max(Number(value) || 0, 0), max);
    const pct = Math.round((safe / max) * 100);
    el.style.setProperty("--value", pct);
    el.setAttribute("aria-valuenow", String(safe));
    el.setAttribute("aria-valuetext", `${pct}%`);
    pct >= 100 ? el.setAttribute("data-complete", "") : el.removeAttribute("data-complete");
    const count = el.querySelector("[data-kv-count]");
    if (count) count.textContent = `${pct}%`;
  };

  const init = () => {
    $$("[data-kv-tabs]").forEach(initTabs);
    $$('[role="progressbar"][data-value]').forEach(el => setProgress(el, el.dataset.value));
  };
  document.readyState === "loading" ? document.addEventListener("DOMContentLoaded", init) : init();

  window.kvcc = { setTheme, setAccent, toast, openDialog, closeDialog, setProgress, accents: ACCENTS };
})();
