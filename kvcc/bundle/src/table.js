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
