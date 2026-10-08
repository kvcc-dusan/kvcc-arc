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
