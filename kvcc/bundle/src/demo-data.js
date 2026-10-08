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

  kvcc.dropdownMenu($("demo-menu"), {
    label: "Actions",
    items: [
      { id: "rename", label: "Rename project", icon: "M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" },
      { id: "duplicate", label: "Duplicate project", icon: ["M8 8h12v12H8z", "M4 16V4h12"] },
      { id: "archive", label: "Archive project", disabled: true, icon: ["M3 4h18v4H3z", "M5 8v12h14V8", "M10 12h4"] },
      { separator: true },
      { id: "delete", label: "Delete project", destructive: true, icon: ["M3 6h18", "M8 6V4h8v2", "M6 6l1 14h10l1-14"] },
    ],
    onSelect: id => kvcc.toast({ title: `Selected: ${id}`, description: "Sample action, nothing changed." }),
  });

  const values = [42, 58, 51, 73, 66, 38, 29, 61, 77, 69, 84, 72, 45, 33];
  kvcc.barChart($("demo-bars"), {
    label: "Active minutes",
    period: "Sep 1 to 14",
    unit: "min",
    data: values.map((value, i) => ({ value, label: `Sep ${i + 1}`, axisLabel: `Sep ${i + 1}` })),
  });
})();
