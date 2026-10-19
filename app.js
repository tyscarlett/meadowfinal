(function () {
  "use strict";
  var KEY = "meadowHouseRepairs.v1", HOME = "Meadow House";
  var STATUSES = ["New", "In Progress", "Completed"];
  var state = { nextNumber: 1, jobs: [], selectedId: null }, storageOk = true, lastCreatedId = null;
  var $ = function (id) { return document.getElementById(id); };

  function persist(data) {
    try { localStorage.setItem(KEY, JSON.stringify(data)); return true; }
    catch (e) { storageOk = false; $("storage-warning").hidden = false; return false; }
  }
  function commit(fn) {
    var next = JSON.parse(JSON.stringify(state));
    fn(next);
    if (!persist(next)) return false;
    state = next;
    return true;
  }
  function el(tag, attrs, text) {
    var n = document.createElement(tag);
    if (attrs) Object.keys(attrs).forEach(function (k) {
      if (k === "className") n.className = attrs[k];
      else if (k === "hidden") n.hidden = true;
      else n.setAttribute(k, attrs[k]);
    });
    if (text != null) n.textContent = String(text);
    return n;
  }
  function add(parent) {
    for (var i = 1; i < arguments.length; i++) parent.appendChild(arguments[i]);
    return parent;
  }
  function when(iso) {
    var d = new Date(iso);
    return isNaN(d) ? String(iso) : d.toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", second: "2-digit" });
  }
  function badge(kind, label) { return el("span", { className: "badge " + kind }, label); }
  function stClass(s) { return "st-" + String(s).replace(/\s+/g, ""); }
  function findJob(st, id) { return st.jobs.filter(function (j) { return j.id === id; })[0] || null; }
  function latestNote(job) {
    for (var i = job.history.length - 1; i >= 0; i--) if (job.history[i].note) return job.history[i];
    return null;
  }
  function setError(input, box, msg) {
    box.textContent = msg || "";
    box.hidden = !msg;
    if (msg) input.setAttribute("aria-invalid", "true"); else input.removeAttribute("aria-invalid");
  }
  function banner(node, kind, msg) { node.className = "banner " + kind; node.textContent = msg; node.hidden = false; }
  function chips(job) {
    return [el("span", { className: "job-id" }, job.id), badge(stClass(job.status), job.status), badge("pr-" + job.priority, job.priority + " priority")];
  }

  $("report-form").addEventListener("submit", function (e) {
    e.preventDefault();
    var desc = $("description").value.trim(), reporter = $("reporter").value.trim();
    var checked = this.querySelector("input[name=priority]:checked");
    var priority = checked && (checked.value === "Urgent" || checked.value === "Normal") ? checked.value : "Normal";
    var dMsg = desc ? "" : "Enter a fault description. It cannot be empty or only spaces.";
    var rMsg = reporter ? "" : "Enter the reporter's name. It cannot be empty or only spaces.";
    setError($("description"), $("description-error"), dMsg);
    setError($("reporter"), $("reporter-error"), rMsg);
    if (dMsg || rMsg) {
      banner($("report-status"), "error", "The report was not saved. Fix the highlighted fields and submit again.");
      (dMsg ? $("description") : $("reporter")).focus();
      return;
    }
    var now = new Date().toISOString(), newId;
    if (!commit(function (st) {
      newId = "MH-" + String(st.nextNumber).padStart(4, "0");
      st.nextNumber += 1;
      st.jobs.push({
        id: newId, home: HOME, description: desc, reporter: reporter, priority: priority,
        status: "New", createdAt: now, completionNote: null,
        history: [{ at: now, status: "New", note: "", event: "Fault reported by " + reporter }]
      });
      st.selectedId = newId;
    })) { banner($("report-status"), "error", "The report could not be saved because browser storage is unavailable."); return; }
    lastCreatedId = newId;
    this.reset();
    $("priority-normal").checked = true;
    banner($("report-status"), "ok", "Report saved as job " + newId + " with status New.");
    render();
  });

  function renderList() {
    var list = $("job-list");
    list.replaceChildren();
    $("jobs-empty").hidden = state.jobs.length > 0;
    $("job-count").textContent = state.jobs.length ? "(" + state.jobs.length + ")" : "";
    state.jobs.slice().reverse().forEach(function (job) {
      var btn = el("button", { type: "button", className: "job-btn" + (job.id === lastCreatedId ? " just-added" : ""), "data-id": job.id, "data-status": job.status });
      if (job.id === state.selectedId) btn.setAttribute("aria-current", "true");
      var ln = latestNote(job);
      add(btn, add.apply(null, [el("span", { className: "job-top" })].concat(chips(job))),
        el("span", { className: "job-desc" }, job.description),
        el("span", { className: "job-meta" }, "Reported " + when(job.createdAt) + " by " + job.reporter + (ln ? " · Latest note: " + ln.note : "")));
      add(list, add(el("li"), btn));
    });
  }

  function renderDetail() {
    var detail = $("detail"), emptyBox = $("detail-empty");
    var job = state.selectedId ? findJob(state, state.selectedId) : null;
    detail.replaceChildren();
    if (!job) {
      detail.hidden = true; emptyBox.hidden = false; emptyBox.removeAttribute("aria-hidden");
      emptyBox.querySelector("h2").id = "detail-heading";
      return;
    }
    emptyBox.hidden = true; emptyBox.setAttribute("aria-hidden", "true");
    emptyBox.querySelector("h2").removeAttribute("id");
    detail.hidden = false;

    var head = el("div", { className: "detail-head" });
    add.apply(null, [head, el("h2", { id: "detail-heading", tabindex: "-1" }, job.id)].concat(chips(job).slice(1)));
    var path = el("ol", { className: "path", "aria-label": "Repair stage" });
    var idx = Math.max(0, STATUSES.indexOf(job.status));
    STATUSES.forEach(function (s, i) {
      var item = el("li", { className: (i < idx ? "is-done" : "") + (i === idx ? " is-current" : "") }, s);
      if (i === idx) item.setAttribute("aria-current", "step");
      path.appendChild(item);
    });
    var dl = el("dl", { className: "facts" });
    [["Home", job.home], ["Description", job.description], ["Reporter", job.reporter], ["Priority", job.priority],
      ["Reported", when(job.createdAt)], ["Status", job.status]].forEach(function (row) {
      add(dl, el("dt", null, row[0]), el("dd", null, row[1]));
    });
    if (job.status === "Completed" && job.completionNote) add(dl, el("dt", null, "Completion note"), el("dd", null, job.completionNote));
    var ln = latestNote(job);
    add(dl, el("dt", null, "Latest note"), el("dd", null, ln ? ln.note + "  (" + ln.status + ", " + when(ln.at) + ")" : "No notes recorded yet."));
    add(detail, head, path, dl);

    var form = el("form", { id: "update-form", novalidate: "" });
    var pills = el("div", { className: "status-pills", role: "group", "aria-label": "Choose status" });
    var select = el("select", { id: "update-status", name: "status" });
    STATUSES.forEach(function (s) {
      var opt = el("option", { value: s }, s);
      if (s === job.status) opt.selected = true;
      add(select, opt);
      add(pills, el("button", { type: "button", className: "status-pill", "data-status": s, "aria-pressed": s === job.status ? "true" : "false" }, s));
    });
    var noteLabel = el("label", { "for": "update-note" }, "Progress note");
    var noteHint = el("p", { id: "update-note-hint", className: "hint" });
    var note = el("textarea", { id: "update-note", name: "note", maxlength: "1000", "aria-describedby": "update-note-hint update-note-error" });
    var noteError = el("p", { id: "update-note-error", className: "error-msg", hidden: "" });
    function sync() {
      var done = select.value === "Completed";
      noteLabel.textContent = done ? "Completion note (required)" : "Progress note";
      noteHint.textContent = done
        ? "Explain what was done to complete the repair. Empty or spaces-only notes are rejected."
        : "Describe the progress made. Required if the status is not changing.";
      [].forEach.call(pills.children, function (p) { p.setAttribute("aria-pressed", p.getAttribute("data-status") === select.value ? "true" : "false"); });
    }
    sync();
    select.addEventListener("change", sync);
    pills.addEventListener("click", function (ev) {
      var p = ev.target.closest && ev.target.closest(".status-pill");
      if (!p) return;
      select.value = p.getAttribute("data-status");
      sync();
      note.focus();
    });
    var updStatus = el("p", { id: "update-status-msg", className: "banner", role: "status", "aria-live": "polite", hidden: "" });
    add(form,
      add(el("div", { className: "field" }), el("label", { "for": "update-status" }, "Status"), pills, select),
      add(el("div", { className: "field" }), noteLabel, noteHint, note, noteError),
      el("button", { type: "submit", id: "update-submit" }, "Save update"), updStatus);

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var newStatus = select.value, noteText = note.value.trim(), current = findJob(state, job.id), msg = "";
      if (STATUSES.indexOf(newStatus) === -1) msg = "Choose a status: New, In Progress or Completed.";
      else if (newStatus === "Completed" && !noteText) msg = "Add a completion note before marking this job Completed. It cannot be empty or only spaces. Nothing has been changed.";
      else if (newStatus === current.status && !noteText) msg = "Enter a progress note or choose a different status. Nothing has been changed.";
      if (msg) { setError(note, noteError, msg); banner(updStatus, "error", "Update not saved. The job is still " + current.status + "."); note.focus(); return; }
      var now = new Date().toISOString();
      if (!commit(function (st) {
        var j = findJob(st, job.id), changed = j.status !== newStatus;
        j.history.push({ at: now, status: newStatus, note: noteText, event: changed ? "Status changed from " + j.status + " to " + newStatus : "Progress note added" });
        j.status = newStatus;
        if (newStatus === "Completed") { j.completionNote = noteText; j.completedAt = now; }
      })) { banner(updStatus, "error", "Update not saved because browser storage is unavailable."); return; }
      render();
      var msgEl = $("update-status-msg");
      if (msgEl) banner(msgEl, "ok", "Saved. " + job.id + " is now " + newStatus + " (" + when(now) + ").");
    });

    var table = el("table");
    var hr = el("tr");
    ["Date and time", "Status", "Update", "Note"].forEach(function (h) { add(hr, el("th", { scope: "col" }, h)); });
    var tbody = el("tbody");
    job.history.forEach(function (h) {
      var tdS = add(el("td"), badge(stClass(h.status), h.status));
      add(tbody, add(el("tr"), el("td", { className: "when" }, when(h.at)), tdS, el("td", null, h.event || ""), el("td", { className: "note" }, h.note || "—")));
    });
    add(detail,
      add(el("div", { className: "section" }), el("h3", null, "Record progress"), form),
      add(el("div", { className: "section" }), el("h3", null, "Status history"),
        add(el("div", { className: "table-scroll" }), add(table, el("caption", { className: "hint" }, "Oldest first. Earlier updates are never changed."), add(el("thead"), hr), tbody))));
  }

  function render() { renderList(); renderDetail(); }

  $("job-list").addEventListener("click", function (e) {
    var btn = e.target.closest && e.target.closest(".job-btn");
    if (!btn) return;
    var id = btn.getAttribute("data-id");
    if (!findJob(state, id)) return;
    state.selectedId = id;
    persist(state);
    render();
    var h = $("detail-heading");
    if (h) h.focus();
  });

  try {
    var raw = localStorage.getItem(KEY);
    if (raw) {
      var parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.jobs)) {
        state.jobs = parsed.jobs;
        state.nextNumber = Math.max(Number(parsed.nextNumber) || 1, parsed.jobs.length + 1);
        state.selectedId = parsed.selectedId || null;
      }
    }
    localStorage.setItem(KEY + ".probe", "1");
    localStorage.removeItem(KEY + ".probe");
  } catch (e) { storageOk = false; }
  if (!storageOk) $("storage-warning").hidden = false;
  if (state.selectedId && !findJob(state, state.selectedId)) state.selectedId = null;
  render();
})();
