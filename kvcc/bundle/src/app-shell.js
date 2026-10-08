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
