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
