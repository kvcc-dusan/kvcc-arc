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
