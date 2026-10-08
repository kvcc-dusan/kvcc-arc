/* Sample data for the demo and design-system pages. All values are made up. */
(() => {
  const $ = id => document.getElementById(id);
  if (!$("demo-select")) return;

  kvcc.select($("demo-select"), {
    label: "Project status",
    hint: "Sample options.",
    placeholder: "Choose a status",
    options: [{ value: "draft", label: "Draft" }, { value: "review", label: "In review" }, { value: "live", label: "Published" }, { value: "archived", label: "Archived", disabled: true }],
    value: "review",
  });

  kvcc.sparkline($("demo-spark"), {
    label: "Weekly signups",
    headline: "412",
    tone: "accent",
    values: [18, 24, 22, 31, 29, 38, 35, 44, 41, 52, 49, 61],
    labels: ["Wk 1", "Wk 2", "Wk 3", "Wk 4", "Wk 5", "Wk 6", "Wk 7", "Wk 8", "Wk 9", "Wk 10", "Wk 11", "Wk 12"],
  });

  const money = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
  kvcc.table($("demo-table"), {
    caption: "Sample projects",
    selectable: true,
    itemName: { one: "project", other: "projects" },
    sort: { key: "tasks", direction: "desc" },
    columns: [
      { key: "name", label: "Project" },
      { key: "status", label: "Status" },
      { key: "tasks", label: "Open tasks", numeric: true },
      { key: "budget", label: "Budget", numeric: true, format: v => money.format(v) },
    ],
    rows: [
      { id: "a", name: "Sample project A", status: "In review", tasks: 14, budget: 12000 },
      { id: "b", name: "Sample project B", status: "Published", tasks: 3, budget: 48500 },
      { id: "c", name: "Sample project C", status: "Draft", tasks: 22, budget: 7200 },
      { id: "d", name: "Sample project D", status: "Published", tasks: 9, budget: 31000 },
    ],
  });

  const values = [42, 58, 51, 73, 66, 38, 29, 61, 77, 69, 84, 72, 45, 33];
  kvcc.barChart($("demo-bars"), {
    label: "Active minutes",
    period: "Sep 1 to 14",
    unit: "min",
    data: values.map((value, i) => ({ value, label: `Sep ${i + 1}`, axisLabel: `Sep ${i + 1}` })),
  });
})();
