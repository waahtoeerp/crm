const page = document.body.dataset.page;

function text(key) {
  return key.split(".").reduce((node, part) => node?.[part], config.texts) ?? key;
}

function valueOf(field, row) {
  const value = row[field];
  if (value === null || value === undefined || value === "") return "–";
  if (field === "status") return text(`status.${value}`);
  return String(value);
}

function label(field) {
  return text(`fields.${field}`);
}

function applyTheme(theme) {
  const root = document.documentElement.style;
  for (const [name, value] of Object.entries(theme.colors)) root.setProperty(`--${name}`, value);
  root.setProperty("--font", theme.font.family);
  root.setProperty("--font-size", theme.font.size);
  root.setProperty("--radius", theme.layout.radius);
  root.setProperty("--gap", theme.layout.gap);
  root.setProperty("--max-width", theme.layout.maxWidth);
}

function applyTexts() {
  document.querySelectorAll("[data-text]").forEach((el) => {
    el.textContent = text(el.dataset.text);
  });
}

function buildNav() {
  const nav = document.querySelector("nav");
  for (const [name, spec] of Object.entries(config.pages)) {
    if (spec.nav === false) continue;
    const link = document.createElement("a");
    link.href = spec.path;
    link.textContent = text(`nav.${name}`);
    if (name === page) link.classList.add("active");
    nav.append(link);
  }
}

function element(tag, className, content) {
  const el = document.createElement(tag);
  if (className) el.className = className;
  if (content !== undefined) el.textContent = content;
  return el;
}

function fieldWrap(labelText, control) {
  const wrap = element("label", "field");
  wrap.append(element("span", "label", labelText), control);
  return wrap;
}

function renderCustomers(customers) {
  const spec = config.pages.customers.card;
  const list = document.getElementById("list");
  if (customers.length === 0) {
    list.append(element("p", "empty", text("customers.empty")));
    return;
  }
  for (const row of customers) {
    const card = element("article", "card");
    card.append(element("h2", null, valueOf(spec.title, row)));
    for (const field of spec.fields) {
      const line = element("p");
      line.append(element("span", "label", `${label(field)}: `), valueOf(field, row));
      card.append(line);
    }
    const count = element("p", "count");
    count.append(element("span", "label", `${text("customers.projectCount")}: `), String(row[spec.count]));
    card.append(count);
    list.append(card);
  }
}

function cardHeading(row, spec) {
  const heading = element("h2", null, valueOf(spec.title, row));
  if (spec.subtitle) {
    heading.append(" ", element("span", "id", `${label(spec.subtitle)} ${row[spec.subtitle]}`));
  }
  return heading;
}

function inputFor(field, type, value) {
  if (type === "select") {
    const select = element("select");
    for (const status of Object.keys(config.texts.status)) {
      const option = element("option", null, text(`status.${status}`));
      option.value = status;
      option.selected = status === value;
      select.append(option);
    }
    return select;
  }
  const input = element("input");
  input.type = type === "url" ? "url" : type === "date" ? "date" : "text";
  input.value = value ?? "";
  if (type === "text") input.maxLength = 200;
  return input;
}

function editorFor(row) {
  const spec = config.pages.projects.row;
  const form = element("form", "card");
  form.append(cardHeading(row, spec));
  for (const { field, type } of spec.editable) {
    const input = inputFor(field, type, row[field]);
    input.name = field;
    form.append(fieldWrap(label(field), input));
  }
  const message = element("p", "message");
  const actions = element("div", "actions");
  const save = element("button", null, text("buttons.save"));
  save.type = "submit";
  const cancel = element("button", "secondary", text("buttons.cancel"));
  cancel.type = "button";
  cancel.addEventListener("click", loadProjects);
  actions.append(save, cancel);
  form.append(actions, message);

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const body = Object.fromEntries(new FormData(form));
    const response = await fetch(`/api/projects/${row.projectId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (response.ok) {
      loadProjects();
      return;
    }
    const problem = await response.json().catch(() => ({}));
    message.textContent = `${text("messages.error")} ${problem.error ?? ""}`.trim();
  });
  return form;
}

function renderProjects(rows) {
  const spec = config.pages.projects.row;
  const list = document.getElementById("list");
  for (const row of rows) {
    const card = element("article", "card");
    card.append(cardHeading(row, spec));
    for (const field of spec.fields) {
      const line = element("p");
      line.append(element("span", "label", `${label(field)}: `), valueOf(field, row));
      card.append(line);
    }
    if (row[spec.link]) {
      const link = element("a", "folder", text("projects.folderLink"));
      link.href = row[spec.link];
      link.target = "_blank";
      link.rel = "noopener";
      card.append(link);
    }
    const edit = element("button", "secondary", text("buttons.edit"));
    edit.addEventListener("click", () => card.replaceWith(editorFor(row)));
    card.append(edit);
    list.append(card);
  }
}

let config;
let projects = [];
let filters = { status: "current", customer: "" };

const FILTER_TESTS = {
  all: () => true,
  current: (row) => row.status !== "end",
  quotesOpen: (row) => row.quoteSent && !row.quoteAccepted && row.status !== "end",
  acceptedNotStarted: (row) => row.quoteAccepted && !row.startDate && row.status !== "end",
  invoicesOpen: (row) => row.invoiceSent && !row.invoicePaid,
};

function matchesFilters(row) {
  const test = FILTER_TESTS[filters.status] ?? ((r) => r.status === filters.status);
  const customerOk = !filters.customer || row.customerName === filters.customer;
  return Boolean(test(row)) && customerOk;
}

function renderFiltered() {
  const list = document.getElementById("list");
  list.replaceChildren();
  const rows = projects.filter(matchesFilters);
  if (rows.length === 0) list.append(element("p", "empty", text("projects.empty")));
  else renderProjects(rows);
}

async function loadProjects() {
  projects = await (await fetch("/api/projects")).json();
  renderFiltered();
}

function buildFilters() {
  const spec = config.pages.projects.row;
  const bar = document.getElementById("filters");

  const statusSelect = element("select");
  for (const key of spec.filters) {
    const option = element("option", null, text(`filters.${key}`));
    option.value = key;
    option.selected = key === filters.status;
    statusSelect.append(option);
  }
  statusSelect.addEventListener("change", () => {
    filters.status = statusSelect.value;
    renderFiltered();
  });

  const customerSelect = element("select");
  const allOption = element("option", null, text("filters.allCustomers"));
  allOption.value = "";
  customerSelect.append(allOption);
  const names = [...new Set(projects.map((row) => row.customerName))].sort();
  for (const name of names) {
    const option = element("option", null, name);
    option.value = name;
    customerSelect.append(option);
  }
  customerSelect.addEventListener("change", () => {
    filters.customer = customerSelect.value;
    renderFiltered();
  });

  bar.append(fieldWrap(text("filters.show"), statusSelect), fieldWrap(label("customer"), customerSelect));
}

function renderDashboard(data) {
  const root = document.getElementById("dashboard");

  const tiles = element("div", "tiles");
  for (const { key, filter } of config.pages.dashboard.tiles) {
    const tile = element("a", "tile");
    tile.href = `${config.pages.projects.path}?filter=${encodeURIComponent(filter)}`;
    tile.append(element("p", "tile-value", String(data.counts[key])), element("p", "tile-label", text(`dashboard.tiles.${key}`)));
    tiles.append(tile);
  }
  root.append(tiles);

  const pipeline = element("section", "panel");
  pipeline.append(element("h3", null, text("dashboard.pipeline")));
  const max = Math.max(1, ...Object.values(data.stages));
  for (const status of Object.keys(config.texts.status)) {
    const count = data.stages[status] ?? 0;
    const row = element("div", "bar-row");
    row.append(element("span", "bar-label", text(`status.${status}`)));
    const track = element("div", "bar-track");
    const fill = element("div", "bar-fill");
    fill.style.width = `${(count / max) * 100}%`;
    track.append(fill);
    row.append(track, element("span", "bar-count", String(count)));
    pipeline.append(row);
  }
  root.append(pipeline);

  for (const { key, detail } of config.pages.dashboard.lists) {
    const panel = element("section", "panel");
    panel.append(element("h3", null, text(`dashboard.lists.${key}`)));
    const rows = data.lists[key];
    if (rows.length === 0) {
      panel.append(element("p", "empty", text("dashboard.empty")));
    } else {
      const items = element("ul", "action-list");
      for (const row of rows) {
        const item = element("li");
        item.append(
          element("strong", null, row.customerName),
          ` ${label("projectId")} ${row.projectId} · ${label(detail)} ${valueOf(detail, row)}`,
        );
        items.append(item);
      }
      panel.append(items);
    }
    root.append(panel);
  }
}

function codeCard(title, code, qrPath, details = []) {
  const card = element("article", "card code-card");
  const image = element("img");
  image.src = qrPath;
  image.alt = code;
  image.width = 140;
  image.height = 140;
  card.append(image, element("h3", null, title), element("p", "id", code));
  for (const line of details) card.append(element("p", "label", line));
  return card;
}

function codeSection(title, cards) {
  const section = element("section", "panel");
  section.append(element("h3", null, title));
  const grid = element("div", "codes");
  grid.append(...cards);
  section.append(grid);
  return section;
}

async function renderProjectSheet() {
  const root = document.getElementById("sheet");
  const id = location.pathname.split("/").pop();
  const response = await fetch(`/api/project-sheet/${encodeURIComponent(id)}`);
  if (!response.ok) {
    root.append(element("p", "empty", text("sheet.notFound")));
    return;
  }
  const sheet = await response.json();
  const { project } = sheet;

  root.append(
    codeSection(text("sheet.project"), [
      codeCard(project.customerName, project.code, project.qrPath, [
        `${label("status")}: ${text(`status.${project.status}`)}`,
        ...sheet.files.map((file) => `${text("sheet.files")}: ${file.fileId}${file.description ? ` (${file.description})` : ""}`),
      ]),
    ]),
    codeSection(
      text("sheet.machines"),
      sheet.machines.map((machine) =>
        codeCard(machine.name, machine.code, machine.qrPath, [config.methods[machine.type] ?? machine.type]),
      ),
    ),
    codeSection(
      text("sheet.materials"),
      sheet.materials.map((material) =>
        codeCard(material.name, material.code, material.qrPath, [`${text("sheet.unit")}: ${material.unit}`]),
      ),
    ),
  );
}

async function start() {
  config = await (await fetch("/api/config")).json();
  applyTheme(config.theme);
  applyTexts();
  buildNav();
  if (page === "project") {
    await renderProjectSheet();
  } else if (page === "dashboard") {
    renderDashboard(await (await fetch("/api/dashboard")).json());
  } else if (page === "customers") {
    const rows = await (await fetch("/api/customers")).json();
    renderCustomers(rows);
  } else {
    const spec = config.pages.projects.row;
    const requested = new URLSearchParams(location.search).get("filter");
    filters.status = spec.filters.includes(requested) ? requested : spec.defaultFilter;
    await loadProjects();
    buildFilters();
  }
}

start();
