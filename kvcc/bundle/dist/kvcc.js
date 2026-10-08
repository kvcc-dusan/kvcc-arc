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

/* kvcc.select(host, { label, options, value, placeholder, hint, id, onChange }). Hand-written.
   Combobox pattern: focus stays on the trigger, arrows move the highlight, Enter or click picks, Escape closes, letters jump. */
(() => {
  const NS = "http://www.w3.org/2000/svg";
  const icon = d => { const s = document.createElementNS(NS, "svg"); s.setAttribute("class", "kv-icon"); s.setAttribute("viewBox", "0 0 24 24"); s.setAttribute("aria-hidden", "true"); const p = document.createElementNS(NS, "path"); p.setAttribute("d", d); s.append(p); return s; };
  const CHEVRON = "m6 9 6 6 6-6";
  const CHECK = "M20 6 9 17l-5-5";
  const GAP = 6;
  const MAX_HEIGHT = 320;
  const EXIT_MS = 120;
  const TYPEAHEAD_MS = 600;
  let uid = 0;

  const select = (host, { label, options, value = null, placeholder = "Select an option", hint = "", id, onChange }) => {
    const key = id ?? `kv-select-${++uid}`;
    const field = document.createElement("div");
    field.className = "kv-select__field";
    field.innerHTML = `<label id="${key}-label" for="${key}"></label><button type="button" id="${key}" class="kv-select__trigger" role="combobox" aria-haspopup="listbox" aria-expanded="false" aria-controls="${key}-list" aria-labelledby="${key}-label ${key}-value"><span class="kv-select__valueText"><span id="${key}-value"></span></span><span class="kv-select__chevron"></span></button>${hint ? `<span class="kv-select__hint"></span>` : ""}`;
    field.querySelector("label").textContent = label;
    field.querySelector(".kv-select__chevron").append(icon(CHEVRON));
    if (hint) field.querySelector(".kv-select__hint").textContent = hint;
    host.append(field);

    const trigger = field.querySelector("button");
    const valueText = field.querySelector(`#${key}-value`);
    let current = options.find(o => o.value === value) ?? null;
    let list = null;
    let items = [];
    let active = -1;
    let typed = "";
    let typedTimer = 0;

    const paint = () => {
      valueText.textContent = current ? current.label : placeholder;
      current ? valueText.removeAttribute("data-placeholder") : valueText.setAttribute("data-placeholder", "");
    };
    paint();

    const highlight = index => {
      active = Math.min(Math.max(index, 0), items.length - 1);
      items.forEach((el, i) => i === active ? el.setAttribute("data-highlighted", "") : el.removeAttribute("data-highlighted"));
      trigger.setAttribute("aria-activedescendant", items[active].id);
      items[active].scrollIntoView({ block: "nearest" });
    };
    const enabledFrom = (start, step) => {
      for (let i = start; i >= 0 && i < items.length; i += step) if (!options[i].disabled) return i;
      return active;
    };

    const place = () => {
      const rect = trigger.getBoundingClientRect();
      const below = innerHeight - rect.bottom - GAP - 8;
      const above = rect.top - GAP - 8;
      const flip = below < Math.min(MAX_HEIGHT, list.scrollHeight) && above > below;
      list.dataset.side = flip ? "top" : "bottom";
      list.style.setProperty("--radix-select-trigger-width", `${rect.width}px`);
      list.style.setProperty("--radix-select-content-available-height", `${Math.max(flip ? above : below, 120)}px`);
      list.style.position = "fixed";
      list.style.left = `${rect.left}px`;
      list.style.overflowY = "auto";
      const height = list.getBoundingClientRect().height;
      list.style.top = `${flip ? rect.top - GAP - height : rect.bottom + GAP}px`;
    };

    const close = ({ refocus = false } = {}) => {
      if (!list) return;
      const gone = list;
      list = null;
      trigger.setAttribute("aria-expanded", "false");
      trigger.removeAttribute("aria-activedescendant");
      trigger.removeAttribute("data-state");
      gone.dataset.state = "closed";
      setTimeout(() => gone.remove(), EXIT_MS);
      document.removeEventListener("pointerdown", outside, true);
      removeEventListener("resize", reposition);
      if (refocus) trigger.focus();
    };
    const outside = event => { if (!list?.contains(event.target) && !trigger.contains(event.target)) close(); };
    const reposition = () => list && place();

    const choose = index => {
      const option = options[index];
      if (!option || option.disabled) return;
      current = option;
      paint();
      close({ refocus: true });
      onChange?.(option.value);
      field.dispatchEvent(new CustomEvent("kvcc-change", { bubbles: true, detail: { value: option.value } }));
    };

    const open = () => {
      if (list) return;
      list = document.createElement("div");
      list.className = "kv-select__content";
      list.id = `${key}-list`;
      list.setAttribute("role", "listbox");
      list.setAttribute("aria-labelledby", `${key}-label`);
      list.dataset.state = "open";
      const viewport = document.createElement("div");
      viewport.className = "kv-select__viewport";
      items = options.map((option, i) => {
        const item = document.createElement("div");
        item.className = "kv-select__item";
        item.id = `${key}-opt-${i}`;
        item.setAttribute("role", "option");
        item.setAttribute("aria-selected", String(option === current));
        if (option.disabled) { item.setAttribute("aria-disabled", "true"); item.setAttribute("data-disabled", ""); }
        item.textContent = option.label;
        if (option === current) { const mark = document.createElement("span"); mark.className = "kv-select__indicator"; mark.append(icon(CHECK)); item.append(mark); }
        item.addEventListener("pointermove", () => { if (!option.disabled && active !== i) highlight(i); });
        item.addEventListener("click", () => choose(i));
        viewport.append(item);
        return item;
      });
      list.append(viewport);
      document.body.append(list);
      trigger.setAttribute("aria-expanded", "true");
      trigger.setAttribute("data-state", "open");
      place();
      const start = current ? options.indexOf(current) : enabledFrom(0, 1);
      highlight(Math.max(start, 0));
      document.addEventListener("pointerdown", outside, true);
      addEventListener("resize", reposition);
    };

    trigger.addEventListener("click", () => list ? close() : open());
    trigger.addEventListener("blur", () => { if (list && !list.matches(":hover")) close(); });
    trigger.addEventListener("keydown", event => {
      const { key: k } = event;
      if (!list) {
        if (["ArrowDown", "ArrowUp", "Enter", " "].includes(k)) { event.preventDefault(); open(); }
        return;
      }
      if (k === "Escape") { event.preventDefault(); return close({ refocus: true }); }
      if (k === "Tab") return close();
      if (k === "Enter" || k === " ") { event.preventDefault(); return choose(active); }
      const moves = { ArrowDown: () => enabledFrom(active + 1, 1), ArrowUp: () => enabledFrom(active - 1, -1), Home: () => enabledFrom(0, 1), End: () => enabledFrom(items.length - 1, -1) };
      if (moves[k]) { event.preventDefault(); return highlight(moves[k]()); }
      if (k.length === 1 && !event.metaKey && !event.ctrlKey) {
        typed += k.toLowerCase();
        clearTimeout(typedTimer);
        typedTimer = setTimeout(() => { typed = ""; }, TYPEAHEAD_MS);
        const hit = options.findIndex(o => !o.disabled && o.label.toLowerCase().startsWith(typed));
        if (hit >= 0) highlight(hit);
      }
    });

    return {
      get value() { return current?.value ?? null; },
      set value(next) { current = options.find(o => o.value === next) ?? null; paint(); },
      element: field,
    };
  };

  Object.assign(window.kvcc ??= {}, { select });
})();

/* kvcc.table(host, { caption, columns: [{ key, label, numeric, sortable, format }], rows, selectable, itemName, sort, emptyMessage, onSelectionChange }).
   Sortable (click a header), optional row selection with shift-click ranges, live count footer. Cells are set with textContent. Hand-written. */
(() => {
  const NS = "http://www.w3.org/2000/svg";
  const P = "kv-sortable-data-table__";
  const svg = (cls, paths) => {
    const s = document.createElementNS(NS, "svg");
    s.setAttribute("class", cls);
    s.setAttribute("viewBox", cls === `${P}selectMark` ? "0 0 18 18" : "0 0 24 24");
    s.setAttribute("aria-hidden", "true");
    s.setAttribute("focusable", "false");
    paths.forEach(attrs => { const p = document.createElementNS(NS, "path"); Object.entries(attrs).forEach(([k, v]) => p.setAttribute(k, v)); s.append(p); });
    return s;
  };
  const el = (tag, cls, props = {}) => Object.assign(Object.assign(document.createElement(tag), cls ? { className: cls } : {}), props);
  const ARROW = [{ d: "M12 19V5M5 12l7-7 7 7" }];

  const table = (host, config) => {
    const { caption, columns, rows, selectable = false, itemName = { one: "row", other: "rows" }, emptyMessage = "No rows to show.", onSelectionChange } = config;
    const keyOf = (row, i) => String(row.id ?? i);
    let sort = config.sort ?? null;
    let selected = new Set();
    let anchor = null;
    let announcement = "";

    const compare = ({ key, direction }) => {
      const col = columns.find(c => c.key === key);
      const sign = direction === "asc" ? 1 : -1;
      return (a, b) => {
        const [x, y] = [a.row[key], b.row[key]];
        const out = col?.numeric ? Number(x) - Number(y) : String(x).localeCompare(String(y), "en", { numeric: true });
        return (out || a.index - b.index) * sign;
      };
    };
    const ordered = () => {
      const indexed = rows.map((row, index) => ({ row, index, id: keyOf(row, index) }));
      return sort ? indexed.sort(compare(sort)) : indexed;
    };

    const checkbox = ({ checked, mixed = false, label, onToggle }) => {
      const hit = el("label", `${P}selectHit`);
      const input = el("input", `${P}selectInput`, { type: "checkbox", checked });
      input.setAttribute("aria-label", label);
      input.indeterminate = mixed;
      const box = el("span", `${P}selectBox`);
      box.setAttribute("aria-hidden", "true");
      if (checked || mixed) box.setAttribute("data-on", "");
      const mark = svg(`${P}selectMark`, [{ "data-glyph": "check", d: "M4.25 9.25 L7.25 12.25 L13.75 5.75", pathLength: 1 }, { "data-glyph": "dash", d: "M4.75 9 L13.25 9", pathLength: 1 }]);
      mark.setAttribute("fill", "none");
      if (mixed) box.setAttribute("data-mixed", "");
      box.append(el("span", `${P}selectFill`), mark);
      input.addEventListener("click", event => onToggle(event.shiftKey));
      hit.append(input, box);
      return hit;
    };

    const wrapper = el("div", `${P}wrapper`);
    host.replaceChildren(wrapper);

    const toggle = (id, extend, list) => {
      const ids = list.map(r => r.id);
      const next = new Set(selected);
      const checked = !selected.has(id);
      const from = extend && anchor ? ids.indexOf(anchor) : -1;
      const to = ids.indexOf(id);
      (from < 0 ? [id] : ids.slice(Math.min(from, to), Math.max(from, to) + 1)).forEach(i => checked ? next.add(i) : next.delete(i));
      anchor = id;
      commit(next, list);
    };
    const commit = (next, list) => {
      selected = next;
      announcement = selected.size ? `${selected.size} of ${list.length} selected` : "Selection cleared";
      onSelectionChange?.(list.filter(r => selected.has(r.id)).map(r => r.row));
      render();
    };

    const render = (focusKey = null) => {
      // Re-rendering replaces the DOM, so remember which checkbox held focus and give it back.
      const held = wrapper.contains(document.activeElement) ? document.activeElement.getAttribute("aria-label") : null;
      const list = ordered();
      const allSelected = selectable && list.length > 0 && list.every(r => selected.has(r.id));
      const some = selected.size > 0;

      const tbl = el("table", `${P}table`);
      tbl.setAttribute("role", "table");
      if (selectable) tbl.setAttribute("data-selectable", "");
      tbl.append(el("caption", "", { textContent: caption }));

      const headRow = el("tr");
      if (selectable) {
        const th = el("th", `${P}selectCell`); th.scope = "col";
        th.append(checkbox({ checked: allSelected, mixed: some && !allSelected, label: "Select all rows", onToggle: () => commit(allSelected ? new Set() : new Set(list.map(r => r.id)), list) }));
        headRow.append(th);
      }
      columns.forEach((col, i) => {
        const th = el("th"); th.scope = "col"; th.dataset.key = col.key;
        const sortable = col.sortable !== false;
        const active = sort?.key === col.key;
        if (i === 0) th.setAttribute("data-primary", "");
        if (col.numeric) th.setAttribute("data-numeric", "");
        if (active) th.setAttribute("data-sorted", "");
        if (!sortable) { th.textContent = col.label; headRow.append(th); return; }
        th.setAttribute("data-sortable", "");
        th.setAttribute("aria-sort", active ? (sort.direction === "asc" ? "ascending" : "descending") : "none");
        const button = el("button", `${P}sortButton`, { type: "button" });
        button.dataset.key = col.key;
        button.setAttribute("aria-label", `Sort by ${col.label}${active ? `, currently ${sort.direction === "asc" ? "ascending" : "descending"}` : ""}`);
        const icon = el("span", `${P}sortIcon`);
        const arrow = el("span", active ? `${P}sortArrow` : `${P}sortHint`);
        arrow.append(svg("kv-icon", ARROW));
        if (active && sort.direction === "desc") arrow.style.transform = "rotate(180deg)";
        icon.append(arrow);
        button.append(el("span", `${P}sortInner`));
        button.firstChild.append(el("span", "", { textContent: col.label }), icon);
        button.addEventListener("click", () => {
          sort = { key: col.key, direction: active && sort.direction === "asc" ? "desc" : "asc" };
          announcement = `Sorted by ${col.label}, ${sort.direction === "asc" ? "ascending" : "descending"}`;
          render(col.key);
        });
        th.append(button);
        headRow.append(th);
      });
      const thead = el("thead"); thead.append(headRow);

      const tbody = el("tbody");
      if (!list.length) {
        const td = el("td", `${P}empty`, { textContent: emptyMessage, colSpan: columns.length + (selectable ? 1 : 0) });
        const tr = el("tr"); tr.append(td); tbody.append(tr);
      }
      list.forEach(({ row, id }) => {
        const tr = el("tr");
        const on = selected.has(id);
        if (on) tr.setAttribute("data-selected", "");
        if (selectable) {
          const td = el("td", `${P}selectCell`);
          td.append(checkbox({ checked: on, label: `Select ${row[columns[0].key]}`, onToggle: extend => toggle(id, extend, list) }));
          tr.append(td);
          tr.addEventListener("click", event => {
            if (event.target.closest("a, button, input, label")) return;
            toggle(id, event.shiftKey, list);
          });
        }
        columns.forEach((col, i) => {
          const td = el("td", "", { textContent: col.format ? col.format(row[col.key], row) : String(row[col.key] ?? "") });
          td.dataset.label = col.label;
          if (i === 0) td.setAttribute("data-primary", "");
          if (col.numeric) td.setAttribute("data-numeric", "");
          if (sort?.key === col.key) td.setAttribute("data-sorted", "");
          tr.append(td);
        });
        tbody.append(tr);
      });
      tbl.append(thead, tbody);

      const scroller = el("div", `${P}scroller`); scroller.append(tbl);
      wrapper.replaceChildren(scroller);

      if (selectable) {
        const count = some ? selected.size : list.length;
        const noun = some ? "selected" : list.length === 1 ? itemName.one : itemName.other;
        const footer = el("div", `${P}footer`);
        const label = el("span", `${P}count`);
        if (some) label.setAttribute("data-active", "");
        label.append(el("span", `${P}number`, { textContent: String(count) }), el("span", "", { textContent: noun }));
        footer.append(label);
        if (some) footer.append(el("button", `${P}clear`, { type: "button", textContent: "Clear selection", onclick: () => commit(new Set(), list) }));
        wrapper.append(footer);
      }
      wrapper.append(el("p", `${P}srOnly`, { textContent: announcement }));
      wrapper.lastChild.setAttribute("role", "status");
      if (focusKey) wrapper.querySelector(`button[data-key="${focusKey}"]`)?.focus();
      else if (held) wrapper.querySelector(`[aria-label="${CSS.escape(held)}"]`)?.focus();
    };
    render();

    return { get selection() { return rows.filter((r, i) => selected.has(keyOf(r, i))); } };
  };

  Object.assign(window.kvcc ??= {}, { table });
})();

/* kvcc.barChart(host, { data, label, period, unit, averageLabel, valueLabel, categoryLabel, showAverage, height, format })
   kvcc.sparkline(host, { values, label, headline, aside, tone, labels, format })
   Vanilla SVG renderers that emit the same markup as the React charts, so the registry CSS styles them. Hover, drag or arrow keys scrub. Hand-written. */
(() => {
  const NS = "http://www.w3.org/2000/svg";
  const grouped = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });
  const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
  const svg = (tag, attrs = {}) => { const n = document.createElementNS(NS, tag); Object.entries(attrs).forEach(([k, v]) => n.setAttribute(k, v)); return n; };
  const el = (tag, cls = "", text) => { const n = document.createElement(tag); if (cls) n.className = cls; if (text !== undefined) n.textContent = text; return n; };
  const reduceMotion = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
  let uid = 0;

  // Bar chart geometry: room above the top gridline, share of a slot a bar fills, widest bar, data-end radius.
  const TOP = 12, FILL = .58, MAX_BAR = 28, RADIUS = 4, GUTTER = 52, AXIS = 26;
  const B = "kv-bar-chart__";

  // Smallest step of 1, 2, 3 or 5 (times a power of ten) that covers the data in four rows or fewer.
  const scaleFor = max => {
    const safe = Math.max(max, 1);
    const magnitude = 10 ** Math.floor(Math.log10(safe / 4));
    for (const factor of [1, 2, 3, 5, 10]) {
      const step = factor * magnitude, rows = Math.ceil(safe / step);
      if (rows <= 4) return { top: rows * step, ticks: Array.from({ length: rows + 1 }, (_, i) => i * step) };
    }
    return { top: safe, ticks: [0, safe] };
  };
  const barPath = (x, w, h, base) => {
    const f = v => v.toFixed(2);
    if (h <= .01) return `M${f(x)} ${base}H${f(x + w)}Z`;
    const r = Math.min(RADIUS, w / 2, h), top = base - h;
    return `M${f(x)} ${base}V${f(top + r)}A${f(r)} ${f(r)} 0 0 1 ${f(x + r)} ${f(top)}H${f(x + w - r)}A${f(r)} ${f(r)} 0 0 1 ${f(x + w)} ${f(top + r)}V${base}Z`;
  };

  const barChart = (host, { data, label, period, unit = "", averageLabel = "Daily average", valueLabel = "Total", categoryLabel = "Day", showAverage = true, height = 176, format = v => grouped.format(v) }) => {
    const id = `kvcc-bar-${++uid}`;
    const suffix = unit ? ` ${unit}` : "";
    const count = Math.max(data.length, 1), last = data.length - 1;
    const average = data.length ? data.reduce((s, d) => s + d.value, 0) / data.length : 0;
    const { top, ticks } = scaleFor(data.reduce((m, d) => Math.max(m, d.value), 0));
    const highest = data.reduce((b, d) => !b || d.value > b.value ? d : b, null);
    const lowest = data.reduce((b, d) => !b || d.value < b.value ? d : b, null);
    let active = null;

    const figure = el("figure", `${B}figure`);
    figure.setAttribute("aria-labelledby", `${id}-title`);
    figure.append(el("figcaption", `${B}srOnly`, `${label}, ${period}`));
    figure.firstChild.id = `${id}-title`;

    const header = el("div", `${B}header`);
    header.setAttribute("aria-hidden", "true");
    const kind = el("span", `${B}kind`);
    const value = el("span", `${B}value`);
    const valueNum = el("span");
    const when = el("span", `${B}when`);
    value.append(valueNum, ...(unit ? [el("span", `${B}unit`, unit)] : []));
    header.append(kind, value, when);

    const chart = el("div", `${B}chart`);
    const plot = el("div", `${B}plot`);
    plot.style.height = `${height}px`;
    const canvas = svg("svg", { class: `${B}svg`, width: "100%", height, role: "img", "aria-label": `${label}, ${period}. ${averageLabel} ${format(Math.round(average))}${suffix}.${highest ? ` Highest ${highest.label}, ${format(highest.value)}${suffix}.` : ""}${lowest && lowest !== highest ? ` Lowest ${lowest.label}, ${format(lowest.value)}${suffix}.` : ""}` });
    plot.append(canvas);
    const gutter = el("div", `${B}gutter`); gutter.setAttribute("aria-hidden", "true");
    const axis = el("div", `${B}axis`); axis.setAttribute("aria-hidden", "true");
    const scrubber = el("div", `${B}scrubber`);
    Object.entries({ role: "slider", tabindex: "0", "aria-label": `${label}, explore by ${categoryLabel.toLowerCase()}`, "aria-orientation": "horizontal", "aria-valuemin": 1, "aria-valuemax": Math.max(1, data.length) }).forEach(([k, v]) => scrubber.setAttribute(k, v));
    chart.append(plot, gutter, axis, scrubber);

    const srTable = el("table", `${B}srOnly`);
    srTable.innerHTML = `<caption></caption><thead><tr><th scope="col"></th><th scope="col"></th></tr></thead><tbody></tbody>`;
    srTable.querySelector("caption").textContent = `${label}, ${period}`;
    const heads = srTable.querySelectorAll("th");
    heads[0].textContent = categoryLabel; heads[1].textContent = label;
    data.forEach(d => { const tr = el("tr"); const th = el("th", "", d.label); th.scope = "row"; tr.append(th, el("td", "", `${format(d.value)}${suffix}`)); srTable.querySelector("tbody").append(tr); });

    figure.append(header, chart, srTable);
    host.replaceChildren(figure);

    const setReading = () => {
      const scrubbing = active !== null;
      kind.textContent = scrubbing ? valueLabel : averageLabel;
      valueNum.textContent = format(scrubbing ? data[active].value : Math.round(average));
      when.textContent = scrubbing ? data[active].label : period;
      chart.toggleAttribute("data-scrubbing", scrubbing);
      scrubber.setAttribute("aria-valuenow", String((active ?? last) + 1));
      scrubber.setAttribute("aria-valuetext", data.length ? `${data[active ?? last].label}: ${format(data[active ?? last].value)}${suffix}` : "No data");
    };

    const draw = () => {
      const width = plot.clientWidth;
      if (!width) return;
      const slot = width / count, size = Math.min(slot * FILL, MAX_BAR);
      const y = v => Math.round(height - (v / top) * (height - TOP)) + .5;
      const centerOf = i => (i + .5) * slot;
      canvas.replaceChildren();
      ticks.filter(t => t > 0).forEach(t => canvas.append(svg("line", { class: `${B}grid`, x1: 0, x2: "100%", y1: y(t), y2: y(t) })));
      if (active !== null) { const x = Math.round(centerOf(active)) + .5; canvas.append(svg("line", { class: `${B}cursor`, x1: x, x2: x, y1: TOP, y2: height })); }
      data.forEach((d, i) => {
        const bar = svg("path", { class: `${B}bar`, d: barPath(centerOf(i) - size / 2, size, (d.value / top) * (height - TOP), height) });
        bar.style.setProperty("--i", i);
        if (i === active) bar.setAttribute("data-active", "");
        canvas.append(bar);
      });
      canvas.append(svg("line", { class: `${B}baseline`, x1: 0, x2: "100%", y1: height - .5, y2: height - .5 }));
      if (showAverage) canvas.append(svg("line", { class: `${B}mean`, x1: 0, x2: "100%", y1: y(average), y2: y(average) }));

      gutter.replaceChildren();
      const meanY = y(average);
      ticks.forEach(t => {
        if (showAverage && Math.abs(y(t) - meanY) < 16) return; // The average label takes this spot.
        const tick = el("span", `${B}tick`); tick.style.transform = `translateY(${y(t)}px)`;
        tick.append(el("span", `${B}tickText`, format(t))); gutter.append(tick);
      });
      if (showAverage) { const m = el("span", `${B}meanLabel`); m.style.transform = `translateY(${meanY}px)`; m.append(el("span", `${B}tickText`, `Avg ${format(Math.round(average))}`)); gutter.append(m); }

      // Axis labels: every one if they fit, else every second, third and so on counted back from the newest.
      axis.replaceChildren();
      const labelled = data.map((d, i) => ({ d, i })).filter(({ d }) => d.axisLabel).reverse();
      const probe = labelled.map(({ d }) => { const s = el("span", `${B}axisLabel`, d.axisLabel); s.style.visibility = "hidden"; axis.append(s); return s.offsetWidth; });
      axis.replaceChildren();
      for (let stride = 1; stride <= Math.max(labelled.length, 1); stride++) {
        const picked = labelled.map((item, rank) => ({ ...item, w: probe[rank], rank })).filter(item => item.rank % stride === 0);
        const placed = picked.map(p => ({ ...p, left: clamp(centerOf(p.i) - p.w / 2, 0, Math.max(0, width - p.w)) }));
        if (stride === labelled.length || placed.every((p, k) => k === 0 || p.left + p.w + 10 <= placed[k - 1].left)) {
          placed.forEach(p => { const s = el("span", `${B}axisLabel`, p.d.axisLabel); s.style.transform = `translateX(${p.left}px)`; axis.append(s); });
          break;
        }
      }
    };
    const pointAt = clientX => {
      const rect = plot.getBoundingClientRect();
      return rect.width ? clamp(Math.floor(((clientX - rect.left) / rect.width) * count), 0, last) : last;
    };
    const set = next => { active = next; setReading(); draw(); };

    scrubber.addEventListener("pointerdown", e => { if (e.pointerType !== "mouse") scrubber.setPointerCapture?.(e.pointerId); set(pointAt(e.clientX)); });
    scrubber.addEventListener("pointermove", e => { if (e.pointerType === "mouse" || e.buttons) set(pointAt(e.clientX)); });
    scrubber.addEventListener("pointerup", e => { if (e.pointerType !== "mouse") set(null); });
    scrubber.addEventListener("pointercancel", () => set(null));
    scrubber.addEventListener("pointerleave", e => { if (e.pointerType === "mouse") set(null); });
    scrubber.addEventListener("blur", () => set(null));
    scrubber.addEventListener("focus", () => { if (scrubber.matches(":focus-visible") && last >= 0) set(active ?? last); });
    scrubber.addEventListener("keydown", e => {
      if (e.key === "Escape" && active !== null) { e.preventDefault(); return set(null); }
      const from = active ?? last + 1, page = Math.min(7, count);
      const next = { ArrowLeft: from - 1, ArrowDown: from - 1, ArrowRight: active === null ? last : from + 1, ArrowUp: active === null ? last : from + 1, PageDown: from - page, PageUp: from + page, Home: 0, End: last }[e.key];
      if (next === undefined || last < 0) return;
      e.preventDefault();
      set(clamp(next, 0, last));
    });

    setReading();
    if (!reduceMotion()) { figure.setAttribute("data-intro", ""); setTimeout(() => figure.removeAttribute("data-intro"), 1100); }
    new ResizeObserver(draw).observe(plot);
    draw();
    return { setActive: set };
  };

  // Sparkline: one measure over time at caption size. Drag or arrow keys read individual points.
  const S = "kv-sparkline__";
  const W = 240, H = 56, PAD = 5;
  const sparkline = (host, { values, label, headline, aside, tone = "accent", labels, format = v => grouped.format(v) }) => {
    const id = `kvcc-spark-${++uid}`;
    const min = Math.min(...values), max = Math.max(...values), span = max - min || 1;
    const x = i => values.length < 2 ? W / 2 : PAD + (i / (values.length - 1)) * (W - 2 * PAD);
    const y = v => H - PAD - ((v - min) / span) * (H - 2 * PAD - 1);
    const pts = values.map((v, i) => `${x(i).toFixed(1)},${y(v).toFixed(1)}`);
    const delta = values[values.length - 1] - values[0];
    const rest = aside ?? `${delta >= 0 ? "+" : "−"}${format(Math.abs(delta))}`;
    let active = null;

    const figure = el("figure", `${S}figure`);
    figure.setAttribute("aria-label", `${label}. ${labels ? `${labels[0]}: ` : "Start "}${format(values[0])}, ${labels ? `${labels[labels.length - 1]}: ` : "latest "}${format(values[values.length - 1])}.`);
    const caption = el("figcaption", `${S}caption`);
    const name = el("span", `${S}label`, label);
    const strong = headline === undefined ? null : el("strong", "", headline);
    const small = el("small", `${S}${tone}`, rest);
    caption.append(name, ...(strong ? [strong] : []), small);

    const plot = el("div", `${S}plot`);
    const chart = svg("svg", { class: `${S}chart`, viewBox: `0 0 ${W} ${H}`, "aria-hidden": "true", focusable: "false" });
    const area = svg("path", { class: `${S}area ${S}${tone}`, d: `M${pts[0]} L${pts.join(" L")} L${x(values.length - 1).toFixed(1)},${H} L${x(0).toFixed(1)},${H}Z` });
    const base = svg("line", { class: `${S}baseline`, x1: 0, y1: H - .5, x2: W, y2: H - .5 });
    const line = svg("polyline", { class: `${S}line ${S}${tone}`, points: pts.join(" ") });
    const cursor = svg("line", { class: `${S}cursor`, x1: 0, x2: 0, y1: 0, y2: H, opacity: 0 });
    const end = svg("polyline", { class: `${S}end ${S}${tone}`, fill: "none", "stroke-linecap": "round", "stroke-width": 7 });
    chart.append(area, base, line, cursor, end);
    plot.append(chart);
    Object.entries({ tabindex: "0", role: "slider", "aria-label": `${label}, explore points`, "aria-valuemin": 1, "aria-valuemax": values.length }).forEach(([k, v]) => plot.setAttribute(k, v));
    plot.setAttribute("data-interactive", "");
    figure.append(caption, plot);
    host.replaceChildren(figure);

    const show = next => {
      active = next;
      const i = next ?? values.length - 1;
      end.setAttribute("points", `${x(i).toFixed(1)},${y(values[i]).toFixed(1)} ${x(i).toFixed(1)},${y(values[i]).toFixed(1)}`);
      end.setAttribute("stroke-width", next === null ? 7 : 10);
      cursor.setAttribute("x1", x(i)); cursor.setAttribute("x2", x(i));
      cursor.setAttribute("opacity", next === null ? 0 : 1);
      small.textContent = next === null ? rest : `${labels ? `${labels[i]} · ` : ""}${format(values[i])}`;
      plot.setAttribute("aria-valuenow", String(i + 1));
      plot.setAttribute("aria-valuetext", `${labels ? `${labels[i]}: ` : ""}${format(values[i])}`);
    };
    const pointAt = clientX => { const r = plot.getBoundingClientRect(); return clamp(Math.round(((clientX - r.left) / r.width) * (values.length - 1)), 0, values.length - 1); };
    plot.addEventListener("pointerdown", e => { if (e.pointerType !== "mouse") plot.setPointerCapture?.(e.pointerId); show(pointAt(e.clientX)); });
    plot.addEventListener("pointermove", e => { if (e.pointerType === "mouse" || e.buttons) show(pointAt(e.clientX)); });
    plot.addEventListener("pointerup", e => { if (e.pointerType !== "mouse") show(null); });
    plot.addEventListener("pointerleave", e => { if (e.pointerType === "mouse") show(null); });
    plot.addEventListener("pointercancel", () => show(null));
    plot.addEventListener("blur", () => show(null));
    plot.addEventListener("keydown", e => {
      if (e.key === "Escape") return show(null);
      const from = active ?? values.length;
      const next = { ArrowLeft: from - 1, ArrowRight: active === null ? values.length - 1 : from + 1, Home: 0, End: values.length - 1 }[e.key];
      if (next === undefined) return;
      e.preventDefault();
      show(clamp(next, 0, values.length - 1));
    });
    show(null);
    return { id };
  };

  Object.assign(window.kvcc ??= {}, { barChart, sparkline });
})();

/* kvcc.appShell(host, { brand, groups, activeId, title, onNavigate, actions, footer, navLabel }) -> { main, setActive, setTitle }.
   Vanilla port of the kvcc app-shell extension: same markup and classes, so kvcc/extensions/app-shell/app-shell.module.css styles it.
   brand and footer are Nodes or (state: { rail }) => Node. Icons are lucide 24px path data (string or array of strings). Hand-written. */
(() => {
  const NS = "http://www.w3.org/2000/svg";
  const A = "kv-app-shell__";
  const MOBILE_QUERY = "(max-width: 767px)";
  const FOCUSABLE = "a[href], button:not(:disabled), [tabindex]:not([tabindex='-1'])";
  const ICONS = {
    menu: ["M4 6h16M4 12h16M4 18h16"],
    close: ["M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z", "M9 3v18", "m16 15-3-3 3-3"],
    open: ["M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z", "M9 3v18", "m14 9 3 3-3 3"],
  };
  const el = (tag, cls = "", props = {}) => Object.assign(Object.assign(document.createElement(tag), cls ? { className: cls } : {}), props);
  const icon = (paths, cls) => {
    const s = document.createElementNS(NS, "svg");
    s.setAttribute("class", cls); s.setAttribute("viewBox", "0 0 24 24"); s.setAttribute("aria-hidden", "true");
    s.setAttribute("width", 20); s.setAttribute("height", 20);
    [].concat(paths).forEach(d => { const p = document.createElementNS(NS, "path"); p.setAttribute("d", d); s.append(p); });
    return s;
  };
  const slot = (value, state) => typeof value === "function" ? value(state) : value;
  let uid = 0;

  const appShell = (host, { brand, groups, activeId, title, onNavigate, actions, footer, navLabel = "Main" }) => {
    const mainId = `kvcc-shell-main-${++uid}`;
    const media = matchMedia(MOBILE_QUERY);
    let rail = false, drawerOpen = false, active = activeId;

    const shell = el("div", `${A}shell`);
    const skip = el("a", `${A}skip`, { href: `#${mainId}`, textContent: "Skip to content" });
    const sidebar = el("aside", `${A}sidebar`);
    const brandEl = el("div", `${A}brand`);
    const nav = el("nav", `${A}nav`); nav.setAttribute("aria-label", navLabel);
    const indicator = el("span", `${A}indicator`);
    nav.append(indicator);
    const items = new Map();
    groups.forEach(group => {
      const g = el("div", `${A}group`);
      if (group.label) g.append(el("p", `${A}groupLabel`, { textContent: group.label }));
      const list = el("ul", `${A}list`);
      group.items.forEach(item => {
        const node = el(item.href ? "a" : "button", `${A}item`);
        if (item.href) node.href = item.href; else node.type = "button";
        node.dataset.id = item.id;
        node.dataset.label = item.label;
        node.append(icon(item.icon, `${A}icon`), el("span", `${A}label`, { textContent: item.label }));
        if (item.badge !== undefined) node.append(el("span", `${A}badge`, { textContent: String(item.badge) }));
        node.addEventListener("click", () => { setActive(item.id); onNavigate?.(item.id); if (media.matches) closeDrawer(); });
        const li = el("li"); li.append(node); list.append(li);
        items.set(item.id, node);
      });
      g.append(list); nav.append(g);
    });
    const footerEl = footer ? el("div", `${A}footer`) : null;
    sidebar.append(brandEl, nav, ...(footerEl ? [footerEl] : []));

    const column = el("div", `${A}column`);
    const topbar = el("header", `${A}topbar`);
    const toggle = el("button", `${A}iconButton`, { type: "button" });
    const heading = el("h1", `${A}title`, { textContent: title });
    const actionsEl = el("div", `${A}actions`);
    if (actions) actionsEl.append(actions);
    topbar.append(toggle, heading, actionsEl);
    const main = el("main", `${A}main`, { id: mainId, tabIndex: -1 });
    column.append(topbar, main);
    shell.append(skip, sidebar, column);
    host.replaceChildren(shell);

    const place = () => {
      const node = items.get(active);
      if (!node) return;
      indicator.style.setProperty("--y", `${node.offsetTop}px`);
      indicator.style.setProperty("--h", `${node.offsetHeight}px`);
    };
    function setActive(id) {
      active = id;
      items.forEach((node, key) => {
        if (key === id) { node.setAttribute("aria-current", "page"); node.setAttribute("data-active", ""); }
        else { node.removeAttribute("aria-current"); node.removeAttribute("data-active"); }
      });
      place();
    }
    const paintSlots = () => {
      brandEl.replaceChildren(...[].concat(slot(brand, { rail }) ?? []));
      if (footerEl) footerEl.replaceChildren(...[].concat(slot(footer, { rail }) ?? []));
    };
    const paint = () => {
      const mobile = media.matches;
      const showRail = !mobile && rail;
      shell.toggleAttribute("data-rail", showRail);
      sidebar.toggleAttribute("data-drawer", mobile);
      sidebar.toggleAttribute("data-open", mobile && drawerOpen);
      sidebar.inert = mobile && !drawerOpen;
      items.forEach(node => {
        showRail ? (node.setAttribute("data-tip", node.dataset.label), node.setAttribute("aria-label", node.dataset.label)) : (node.removeAttribute("data-tip"), node.removeAttribute("aria-label"));
      });
      sidebar.querySelectorAll(`.${A}groupLabel`).forEach(n => n.toggleAttribute("data-hidden", showRail));
      toggle.replaceChildren(icon(mobile ? ICONS.menu : showRail ? ICONS.open : ICONS.close, ""));
      toggle.setAttribute("aria-label", mobile ? "Open navigation" : showRail ? "Expand sidebar" : "Collapse sidebar");
      toggle.setAttribute("aria-expanded", String(mobile ? drawerOpen : !showRail));
      shell.querySelector(`.${A}backdrop`)?.remove();
      if (mobile && drawerOpen) { const b = el("div", `${A}backdrop`); b.setAttribute("aria-hidden", "true"); b.addEventListener("click", closeDrawer); shell.prepend(b); }
      paintSlots();
      place();
    };
    function closeDrawer() { drawerOpen = false; paint(); toggle.focus(); }

    toggle.addEventListener("click", () => {
      if (media.matches) { drawerOpen = true; paint(); (items.get(active) ?? sidebar.querySelector(FOCUSABLE))?.focus(); }
      else { rail = !rail; paint(); }
    });
    sidebar.addEventListener("keydown", event => {
      if (!drawerOpen) return;
      if (event.key === "Escape") { event.stopPropagation(); return closeDrawer(); }
      if (event.key !== "Tab") return;
      const focusable = [...sidebar.querySelectorAll(FOCUSABLE)];
      const [first, last] = [focusable[0], focusable[focusable.length - 1]];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    });
    media.addEventListener("change", () => { drawerOpen = false; paint(); });
    addEventListener("resize", place);

    setActive(active);
    paint();
    return { main, setActive, setTitle: text => { heading.textContent = text; } };
  };

  Object.assign(window.kvcc ??= {}, { appShell });
})();

/* kvcc.dropdownMenu(host, { label, items, icon, onSelect }) and kvcc.popover(trigger, content, { side }). Hand-written.
   Menu: roving focus on items, arrows, Home and End, letters jump, Enter or Space picks, Escape closes and returns focus. One highlight glides between items.
   Popover: any content panel anchored to a trigger. [data-kv-popover="panel-id"] on a button wires it by attribute. */
(() => {
  const NS = "http://www.w3.org/2000/svg";
  const M = "kv-dropdown-menu__";
  const P = "kv-popover__";
  const GAP = 6;
  const EXIT_MS = 140;
  const TYPEAHEAD_MS = 600;
  const el = (tag, cls = "", props = {}) => Object.assign(Object.assign(document.createElement(tag), cls ? { className: cls } : {}), props);
  const icon = (paths, size = 16) => {
    const s = document.createElementNS(NS, "svg");
    s.setAttribute("class", "kv-icon"); s.setAttribute("viewBox", "0 0 24 24"); s.setAttribute("aria-hidden", "true");
    s.setAttribute("width", size); s.setAttribute("height", size);
    [].concat(paths).forEach(d => { const p = document.createElementNS(NS, "path"); p.setAttribute("d", d); s.append(p); });
    return s;
  };
  const CHEVRON = "m6 9 6 6 6-6";
  let uid = 0;

  // Places a fixed panel under (or over, when short of room) its trigger, clamped to the viewport.
  const place = (trigger, panel, { minWidth = 0 } = {}) => {
    const rect = trigger.getBoundingClientRect();
    panel.style.position = "fixed";
    if (minWidth) panel.style.minWidth = `${Math.max(rect.width, minWidth)}px`;
    const box = panel.getBoundingClientRect();
    const below = innerHeight - rect.bottom - GAP - 8;
    const flip = below < box.height && rect.top > below;
    panel.dataset.side = flip ? "top" : "bottom";
    panel.style.top = `${flip ? rect.top - GAP - box.height : rect.bottom + GAP}px`;
    panel.style.left = `${Math.min(Math.max(rect.left, 8), innerWidth - box.width - 8)}px`;
  };

  const dropdownMenu = (host, { label, items, icon: triggerIcon, onSelect }) => {
    const key = `kvcc-menu-${++uid}`;
    const trigger = el("button", `${M}trigger`, { type: "button", id: key });
    trigger.setAttribute("aria-haspopup", "menu");
    trigger.setAttribute("aria-expanded", "false");
    if (triggerIcon) { const i = el("span", `${M}triggerIcon`); i.append(icon(triggerIcon)); trigger.append(i); }
    const name = el("span", `${M}label`); name.append(el("span", `${M}labelText`, { textContent: label }));
    const chevron = el("span", `${M}chevron`); chevron.append(icon(CHEVRON));
    trigger.append(name, chevron);
    host.append(trigger);

    let menu = null;
    let nodes = [];
    // Focus and paint the highlight in one step, so it never depends on focus events (which a background tab does not deliver).
    const focusItem = node => {
      if (!node || !menu) return;
      node.focus();
      const highlight = menu.querySelector(`.${M}highlight`);
      highlight.style.transform = `translateY(${node.offsetTop}px)`;
      highlight.style.height = `${node.offsetHeight}px`;
      highlight.style.opacity = 1;
      highlight.dataset.tone = node.classList.contains(`${M}destructive`) ? "danger" : "";
    };
    const actionable = () => nodes.filter(n => n.getAttribute("role") === "menuitem" && !n.hasAttribute("data-disabled"));

    const close = ({ refocus = false } = {}) => {
      if (!menu) return;
      const gone = menu;
      menu = null;
      trigger.setAttribute("aria-expanded", "false");
      trigger.removeAttribute("data-state");
      gone.dataset.state = "closed";
      setTimeout(() => gone.remove(), EXIT_MS);
      document.removeEventListener("pointerdown", outside, true);
      if (refocus) trigger.focus();
    };
    const outside = event => { if (!menu?.contains(event.target) && !trigger.contains(event.target)) close(); };

    const open = (focusLast = false) => {
      if (menu) return;
      menu = el("div", `${M}menu`, { id: `${key}-menu` });
      menu.setAttribute("role", "menu");
      menu.setAttribute("aria-labelledby", key);
      menu.dataset.state = "open";
      const highlight = el("span", `${M}highlight`);
      highlight.setAttribute("aria-hidden", "true");
      menu.append(highlight);
      nodes = [];
      let order = 0;
      items.forEach(item => {
        if (item.separator) { const s = el("div", `${M}separator`); s.setAttribute("role", "separator"); menu.append(s); return; }
        const node = el("div", `${M}item${item.destructive ? ` ${M}destructive` : ""}`, { tabIndex: -1 });
        node.setAttribute("role", "menuitem");
        node.dataset.id = item.id;
        node.style.setProperty("--i", order++);
        if (item.disabled) { node.setAttribute("data-disabled", ""); node.setAttribute("aria-disabled", "true"); }
        if (item.icon) { const i = el("span", `${M}icon`); i.append(icon(item.icon)); node.append(i); }
        node.append(el("span", "", { textContent: item.label }));
        node.addEventListener("pointermove", () => { if (!item.disabled && document.activeElement !== node) focusItem(node); });
        node.addEventListener("click", () => { if (item.disabled) return; close({ refocus: true }); onSelect?.(item.id); });
        menu.append(node);
        nodes.push(node);
      });
      document.body.append(menu);
      trigger.setAttribute("aria-expanded", "true");
      trigger.setAttribute("data-state", "open");
      place(trigger, menu, { minWidth: 192 });
      const list = actionable();
      focusItem(focusLast ? list[list.length - 1] : list[0]);
      document.addEventListener("pointerdown", outside, true);
    };

    let typed = "";
    let typedTimer = 0;
    trigger.addEventListener("click", () => menu ? close() : open());
    trigger.addEventListener("keydown", event => {
      if (["ArrowDown", "ArrowUp"].includes(event.key)) { event.preventDefault(); open(event.key === "ArrowUp"); }
    });
    host.addEventListener("keydown", event => {
      // Keys on the trigger itself open the menu (handled above); only keys inside the open menu navigate it.
      if (!menu || event.target === trigger || !menu.contains(document.activeElement)) return;
      const list = actionable();
      const at = list.indexOf(document.activeElement);
      const go = index => { event.preventDefault(); focusItem(list[(index + list.length) % list.length]); };
      switch (event.key) {
        case "ArrowDown": return go(at + 1);
        case "ArrowUp": return go(at - 1);
        case "Home": return go(0);
        case "End": return go(list.length - 1);
        case "Escape": event.preventDefault(); return close({ refocus: true });
        case "Tab": return close();
        case "Enter": case " ": event.preventDefault(); return document.activeElement.click();
        default:
          if (event.key.length === 1 && !event.metaKey && !event.ctrlKey) {
            typed += event.key.toLowerCase();
            clearTimeout(typedTimer);
            typedTimer = setTimeout(() => { typed = ""; }, TYPEAHEAD_MS);
            focusItem(list.find(n => n.textContent.toLowerCase().startsWith(typed)));
          }
      }
    });
    // The menu is portaled to <body>, so key events from it bubble to document, not host.
    document.addEventListener("keydown", event => { if (menu?.contains(event.target)) host.dispatchEvent(new KeyboardEvent("keydown", { key: event.key, metaKey: event.metaKey, ctrlKey: event.ctrlKey, bubbles: false })); });
    return { trigger, close };
  };

  // Popover: content is an existing element (hidden) or a Node; shown anchored to the trigger.
  const popover = (trigger, content, { side } = {}) => {
    const panel = typeof content === "string" ? document.getElementById(content) : content;
    panel.classList.add(`${P}content`);
    panel.hidden = true;
    panel.tabIndex = -1;
    trigger.setAttribute("aria-haspopup", "dialog");
    trigger.setAttribute("aria-expanded", "false");
    let isOpen = false;

    const close = ({ refocus = false } = {}) => {
      if (!isOpen) return;
      isOpen = false;
      trigger.setAttribute("aria-expanded", "false");
      panel.dataset.state = "closed";
      setTimeout(() => { if (!isOpen) panel.hidden = true; }, EXIT_MS);
      document.removeEventListener("pointerdown", outside, true);
      document.removeEventListener("keydown", onKey, true);
      if (refocus) trigger.focus();
    };
    const outside = event => { if (!panel.contains(event.target) && !trigger.contains(event.target)) close(); };
    const onKey = event => { if (event.key === "Escape") { event.stopPropagation(); close({ refocus: true }); } };
    const open = () => {
      if (isOpen) return;
      isOpen = true;
      panel.hidden = false;
      panel.dataset.state = "open";
      place(trigger, panel);
      if (side) panel.dataset.side = side;
      trigger.setAttribute("aria-expanded", "true");
      (panel.querySelector("[autofocus], input, button, [href]") ?? panel).focus();
      document.addEventListener("pointerdown", outside, true);
      document.addEventListener("keydown", onKey, true);
    };
    trigger.addEventListener("click", () => isOpen ? close() : open());
    return { open, close };
  };

  const init = () => document.querySelectorAll("[data-kv-popover]").forEach(t => popover(t, t.dataset.kvPopover));
  document.readyState === "loading" ? document.addEventListener("DOMContentLoaded", init) : init();

  Object.assign(window.kvcc ??= {}, { dropdownMenu, popover });
})();
