/* Encima desk: screens and dialogs. */
(function () {
  "use strict";
  const D = window.Desk;
  if (!D || !D.configured) return;
  const { $, $$, esc, stLabel, stClass } = D;
  const S = D.state;
  const api = D.api;
  const ui = (D.ui = { view: "items", secFilter: "all", status: "all", q: "" });

  const isGroup = (id) => MENU.groups.some((g) => g.id === id);
  const single = () => (ui.secFilter !== "all" && !isGroup(ui.secFilter) ? ui.secFilter : null);
  const secName = (id) => (S.sections.find((s) => s.id === id) || {}).name || id;
  const findItem = (id) => S.items.find((x) => x.id === id);
  const fail = (err) => D.toast(D.friendly(err), { error: true });

  /* ============ scope, filters ============ */
  function scopeSections() {
    const act = D.activeSections();
    if (ui.secFilter === "all") return act;
    if (isGroup(ui.secFilter)) return act.filter((s) => s.group_id === ui.secFilter);
    return act.filter((s) => s.id === ui.secFilter);
  }
  const statusOk = (it, st) =>
    st === "all" ? it.visibility !== "archived"
      : st === "live" ? it.visibility === "published"
      : st === "soldout" ? it.visibility === "soldout"
      : st === "hidden" ? it.visibility === "hidden"
      : it.visibility === "archived";

  function scopeItems() {
    const ids = new Set(scopeSections().map((s) => s.id));
    return S.items.filter((i) => ids.has(i.section_id));
  }
  function listItems() {
    const order = new Map(S.sections.map((s, i) => [s.id, i]));
    const q = ui.q.trim().toLowerCase();
    return scopeItems()
      .filter((i) => statusOk(i, ui.status))
      .filter((i) => !q || (i.name + " " + (i.description || "")).toLowerCase().includes(q))
      .sort((a, b) => (order.get(a.section_id) - order.get(b.section_id)) || (a.sort_order - b.sort_order) || a.name.localeCompare(b.name));
  }
  const canDrag = () => D.editor() && !!single() && ui.status === "all" && !ui.q.trim();

  function pendingCount() {
    const act = new Set(D.activeSections().map((s) => s.id));
    let n = S.items.filter((i) => i.visibility !== "archived" && act.has(i.section_id) && i.review_status !== "approved").length;
    if (S.settings.review_status !== "approved") n++;
    return n;
  }

  /* ============ shell ============ */
  function renderShell() {
    $("#who").textContent = S.profile.email + " · " + (D.editor() ? "Editor" : "Approver");
    const n = pendingCount();
    const c = $("#revCount");
    c.hidden = !n; c.textContent = n;
    $$(".bar nav button").forEach((b) => b.classList.toggle("on", b.dataset.view === ui.view));
  }

  let paintToken = 0;
  async function paint() {
    const token = ++paintToken;
    renderShell();
    if (ui.view === "review") return renderReview();
    if (ui.view === "pages") { await renderPages(token); return; }
    renderItems();
  }
  /* After data changed: repaint what is on screen without jumping to the top. */
  function refresh() {
    renderShell();
    if (ui.view === "items" && $("#itemList")) paintList();
    else paint();
  }

  /* ============ item list ============ */
  function itemRow(it, o = {}) {
    const arch = it.visibility === "archived";
    const chips = [];
    if (!arch) chips.push(`<span class="st ${stClass[it.review_status] || ""}">${stLabel[it.review_status] || ""}</span>`);
    if (it.visibility === "soldout") chips.push(`<span class="st sold">Sold out</span>`);
    if (it.visibility === "hidden") chips.push(`<span class="st hide">Hidden</span>`);
    if (arch) chips.push(`<span class="st arch">Archived</span>`);
    const ed = D.editor() && !o.review;
    const acts = ed
      ? `<button type="button" class="btn small ghost" data-open>Edit</button>
         ${arch
           ? `<button type="button" class="btn small ghost" data-act="restore">Restore</button>`
           : `<button type="button" class="btn small ghost" data-act="archive">Archive</button>`}
         <button type="button" class="btn small ghost danger" data-act="delete">Delete</button>`
      : `<button type="button" class="btn small ghost" data-open>${D.editor() ? "Edit" : "View"}</button>`;
    return `<article class="item${arch ? " is-arch" : ""}" data-id="${it.id}">
      ${o.drag ? `<button type="button" class="grip" data-grip aria-label="Reorder ${esc(it.name)}. Drag, or use the up and down arrow keys." title="Drag to reorder">
        <svg width="14" height="18" viewBox="0 0 14 18" aria-hidden="true"><g fill="currentColor"><circle cx="4" cy="3" r="1.6"/><circle cx="10" cy="3" r="1.6"/><circle cx="4" cy="9" r="1.6"/><circle cx="10" cy="9" r="1.6"/><circle cx="4" cy="15" r="1.6"/><circle cx="10" cy="15" r="1.6"/></g></svg></button>` : ""}
      <button type="button" class="open" data-open>
        <img src="${esc(D.photoSrc((it.photos || [])[0]))}" alt="" loading="lazy">
        <span class="meta"><strong>${esc(it.name)}</strong>
          <small>${esc(D.priceText(it.price))}${o.showSection ? " · " + esc(secName(it.section_id)) : ""}</small>
          ${it.description ? `<small class="desc">${esc(it.description)}</small>` : ""}</span>
      </button>
      <div class="side-r"><div class="chips">${chips.join("")}</div><div class="acts">${acts}</div></div>
    </article>`;
  }

  function emptyHTML() {
    const filtered = ui.q.trim() || ui.status !== "all";
    if (filtered) {
      const what = ui.status === "archived" ? "No archived items here." : "No items match.";
      return `<div class="empty"><p>${what}</p><button type="button" class="link" id="clearFilters">Clear search and filters</button></div>`;
    }
    return `<div class="empty"><p>Nothing in this section yet.</p>${D.editor() ? `<button type="button" class="btn small" id="addItemEmpty">Add the first item</button>` : ""}</div>`;
  }

  function listHTML() {
    const rows = listItems();
    if (!rows.length) return emptyHTML();
    const one = single();
    if (one) return `<div class="list" data-section="${esc(one)}">${rows.map((r) => itemRow(r, { drag: canDrag() })).join("")}</div>`;
    const by = new Map();
    rows.forEach((r) => { if (!by.has(r.section_id)) by.set(r.section_id, []); by.get(r.section_id).push(r); });
    return [...by].map(([sid, arr]) =>
      `<h3 class="sec-h">${esc(secName(sid))}<span>${arr.length}</span></h3>
       <div class="list">${arr.map((r) => itemRow(r, { showSection: false })).join("")}</div>`).join("");
  }

  function paintList() {
    const scope = scopeItems().filter((i) => !ui.q.trim() || (i.name + " " + (i.description || "")).toLowerCase().includes(ui.q.trim().toLowerCase()));
    const count = (st) => scope.filter((i) => statusOk(i, st)).length;
    const chip = (id, label) =>
      `<button type="button" data-status="${id}" class="${ui.status === id ? "on" : ""}" aria-pressed="${ui.status === id}">${label} <span>${count(id)}</span></button>`;
    $("#statusChips").innerHTML = chip("all", "All") + chip("live", "Live") + chip("soldout", "Sold out") + chip("hidden", "Hidden") + chip("archived", "Archived");
    $("#hint").textContent = canDrag() ? "Drag the handle on the left to reorder. Changes save automatically." : "";
    $("#itemList").innerHTML = listHTML();
  }

  function renderItems() {
    if (ui.secFilter !== "all" && !isGroup(ui.secFilter) && !D.activeSections().some((s) => s.id === ui.secFilter)) ui.secFilter = "all";
    const act = D.activeSections();
    const btn = (id, label, cls = "") => `<button type="button" data-sec="${esc(id)}" class="${cls} ${ui.secFilter === id ? "on" : ""}">${esc(label)}</button>`;
    const used = new Set();
    const groups = MENU.groups.map((g) => {
      const secs = act.filter((s) => s.group_id === g.id);
      secs.forEach((s) => used.add(s.id));
      return btn(g.id, g.label, "grp") + secs.map((s) => btn(s.id, s.name, "sub")).join("");
    }).join("");
    const rest = act.filter((s) => !used.has(s.id)).map((s) => btn(s.id, s.name, "sub")).join("");
    const banner = !S.migrated && D.editor()
      ? `<div class="banner-note"><b>One-time database update needed.</b> Run <code>desk-migration.sql</code> in the Supabase SQL editor. Until then, archiving and adding sections won’t work.</div>` : "";
    $("#main").innerHTML = `<div class="split">
      <nav class="side" aria-label="Sections">${btn("all", "All sections")}${groups}${rest}</nav>
      <div class="pane">
        ${banner}
        <div class="row head">
          <h2>Menu items</h2>
          ${D.editor()
            ? `<div class="grow"></div><button type="button" class="btn small ghost" id="manageSecs">Sections</button><button type="button" class="btn small" id="addItem">Add item</button>`
            : `<p class="muted grow">View only. Use Review to approve or request changes.</p>`}
        </div>
        <div class="filters">
          <input type="search" id="q" placeholder="Search items" aria-label="Search items" value="${esc(ui.q)}" autocomplete="off">
          <div class="chips-row" id="statusChips" role="group" aria-label="Filter by status"></div>
        </div>
        <p class="hint" id="hint"></p>
        <div id="itemList"></div>
      </div>
    </div>`;
    paintList();
  }

  /* ============ item actions ============ */
  async function archiveItem(it) {
    const prev = it.visibility;
    try {
      await api.setVisibility(it.id, "archived");
      await api.loadAll();
      refresh();
      D.toast(`Archived “${it.name}”. It’s off the public menu.`, {
        action: { label: "Undo", run: async () => { try { await api.setVisibility(it.id, prev); await api.loadAll(); refresh(); D.toast("Archive undone."); } catch (e) { fail(e); } } }
      });
      return true;
    } catch (e) { fail(e); return false; }
  }
  async function restoreItem(it) {
    try {
      await api.setVisibility(it.id, "published");
      await api.loadAll();
      refresh();
      D.toast(`Restored “${it.name}”. It’s live on the menu.`);
      return true;
    } catch (e) { fail(e); return false; }
  }
  async function deleteItem(it) {
    const ok = await D.confirmBox({
      title: `Delete “${it.name}”?`,
      body: `This permanently removes the item and its uploaded photos from the menu. It can’t be undone.<br><br>If you might want it back, choose <b>Archive</b> instead.`,
      confirm: "Delete item", cancel: "Keep item", danger: true
    });
    if (!ok) return false;
    try {
      await api.deleteItem(it);
      await api.loadAll();
      refresh();
      D.toast(`Deleted “${it.name}”.`);
      return true;
    } catch (e) { fail(e); return false; }
  }

  /* ============ item dialog (add / edit / view) ============ */
  const threadHTML = (rows) =>
    rows.length
      ? rows.map((r) => `<div class="bubble"><small>${esc((r.profiles && r.profiles.email) || "Staff")} · ${esc(new Date(r.created_at).toLocaleString())}</small>${esc(r.body)}</div>`).join("")
      : `<p class="muted">No comments yet.</p>`;

  function reviewHTML(rows) {
    return `<div class="thread"><h3>Review comments</h3><div>${threadHTML(rows)}</div>
      ${S.profile.role === "approver" ? `
        <label>Comment<textarea name="cbody" placeholder="What should change, or why it is approved"></textarea></label>
        <div class="actions">
          <button type="button" class="btn" data-rv="approved">Approved</button>
          <button type="button" class="btn ghost" data-rv="for_revision">For revision</button>
        </div>` : ""}</div>`;
  }
  function bindReview(root, type, id, after) {
    root.addEventListener("click", async (e) => {
      const b = e.target.closest("[data-rv]");
      if (!b) return;
      const ta = root.querySelector("[name=cbody]");
      b.disabled = true;
      try {
        await api.setStatus(type, id, b.dataset.rv, ta ? ta.value : "");
        await api.loadAll();
        after(b.dataset.rv);
      } catch (err) { fail(err); b.disabled = false; }
    });
  }

  function priceFieldsHTML(p, isNew, dis) {
    const k = isNew ? "single" : D.priceKind(p);
    const o = typeof p === "object" && p ? p : {};
    const n = typeof p === "number" ? p : "";
    return `<fieldset class="price" ${dis}>
      <legend>Price</legend>
      <label>Price type
        <select name="kind">
          <option value="single" ${k === "single" ? "selected" : ""}>Single price</option>
          <option value="glass" ${k === "glass" ? "selected" : ""}>Glass + bottle</option>
          <option value="glass200" ${k === "glass200" ? "selected" : ""}>200 ml + bottle</option>
          <option value="shot" ${k === "shot" ? "selected" : ""}>Shot + bottle</option>
          <option value="tbd" ${k === "tbd" ? "selected" : ""}>Price on request</option>
        </select></label>
      <div class="price-grid" data-kind="${k}">
        <label class="f-single">Price (₱)<input name="single" type="number" inputmode="decimal" min="0" step="any" value="${n}"></label>
        <label class="f-glass">Glass (₱)<input name="glass" type="number" inputmode="decimal" min="0" step="any" value="${o.glass ?? ""}"></label>
        <label class="f-glass200">200 ml (₱)<input name="glass200" type="number" inputmode="decimal" min="0" step="any" value="${o.glass200 ?? ""}"></label>
        <label class="f-shot">Shot (₱)<input name="shot" type="number" inputmode="decimal" min="0" step="any" value="${o.shot ?? ""}"></label>
        <label class="f-bottle">Bottle (₱)<input name="bottle" type="number" inputmode="decimal" min="0" step="any" value="${o.bottle ?? ""}"></label>
        <label class="f-note">Bottle size<input name="bottleNote" value="${esc(o.bottleNote || "")}" placeholder="700 ml"></label>
      </div></fieldset>`;
  }

  const courseHTML = (c, i, ro) => `<div class="course-ed" data-ci="${i}">
      <label>Course title<input name="ctitle" value="${esc(c.title)}" ${ro ? "disabled" : ""}></label>
      <label class="inline"><input type="checkbox" name="cchoice" ${c.choice ? "checked" : ""} ${ro ? "disabled" : ""}> Guest chooses one</label>
      <label>Options, one per line<textarea name="copts" ${ro ? "disabled" : ""}>${esc((c.options || []).join("\n"))}</textarea></label>
    </div>`;
  const collectCourses = (root) => $$(".course-ed", root).map((el) => ({
    title: $("[name=ctitle]", el).value.trim(),
    choice: $("[name=cchoice]", el).checked,
    options: $("[name=copts]", el).value.split("\n").map((x) => x.trim()).filter(Boolean)
  }));

  async function openItemModal(id, defaults = {}) {
    const it = id ? findItem(id) : null;
    if (id && !it) return;
    const ro = !D.editor();
    const isNew = !it;
    const itemId = it ? it.id : crypto.randomUUID();
    const archived = !!it && it.visibility === "archived";
    const extra = (it && it.extra) || {};
    let rows = [];
    if (it) { try { rows = await api.comments("item", it.id); } catch (e) { rows = []; } }
    const last = rows[rows.length - 1];
    const photos = ((it && it.photos) || []).slice();
    const original = photos.slice();
    const added = [];
    let saved = false;
    const dis = ro ? "disabled" : "";

    let secs = D.activeSections();
    if (it && !secs.some((s) => s.id === it.section_id)) secs = secs.concat(S.sections.filter((s) => s.id === it.section_id));
    const defSec = it ? it.section_id : (defaults.section_id || (secs[0] && secs[0].id));

    const body = `
      ${it && it.review_status === "for_revision" && last ? `<div class="banner-note"><b>For revision:</b> ${esc(last.body)}</div>` : ""}
      ${archived ? `<div class="banner-note">This item is archived and hidden from the public menu. Restore it to put it back on the menu.</div>` : ""}
      <div class="grid2">
        <label>Section<select name="section_id" ${dis}>${secs.map((s) => `<option value="${esc(s.id)}" ${s.id === defSec ? "selected" : ""}>${esc(s.name)}</option>`).join("")}</select></label>
        ${archived || ro ? "" : `<label>On the menu<select name="status">
          <option value="published" ${!it || it.visibility === "published" ? "selected" : ""}>Live</option>
          <option value="soldout" ${it && it.visibility === "soldout" ? "selected" : ""}>Sold out (no review needed)</option>
          <option value="hidden" ${it && it.visibility === "hidden" ? "selected" : ""}>Hidden from the menu</option>
        </select></label>`}
      </div>
      <label>Name<input name="name" required maxlength="120" value="${esc(it ? it.name : "")}" ${dis} ${ro ? "" : "autofocus"}></label>
      <label>Description<textarea name="description" ${dis}>${esc(it ? it.description || "" : "")}</textarea></label>
      ${priceFieldsHTML(it ? it.price : null, isNew, dis)}
      <fieldset class="tags" ${dis}><legend>Tags</legend>
        <div class="checks">${Object.entries(TAGS).map(([k, t]) =>
          `<label class="inline"><input type="checkbox" name="tag" value="${k}" ${it && (it.tags || []).includes(k) ? "checked" : ""}> ${t.icon} ${esc(t.label)}</label>`).join("")}</div>
      </fieldset>
      <div class="photos"><span class="lbl">Photos</span>
        <div class="thumbs" id="thumbs"></div>
        ${ro ? "" : `<label class="file"><input type="file" id="photoFile" accept="image/*"><span class="btn small ghost">Add photo</span></label><small class="muted">JPG, PNG or WebP, up to 5 MB. The first photo is the main one.</small>`}
      </div>
      <label>Wine pairing note<input name="pairing" value="${esc((it && it.pairing) || "")}" ${dis}></label>
      ${extra.courses ? `<div id="courses">${extra.courses.map((c, i) => courseHTML(c, i, ro)).join("")}</div>` : ""}
      ${it
        ? `<p class="muted">Review status: <b>${stLabel[it.review_status]}</b>. Editing content sets it back to Not reviewed. Selling out, archiving and reordering don’t.</p>`
        : `<p class="muted">New items go live on the public menu as soon as you add them.</p>`}
      ${it ? reviewHTML(rows) : ""}`;

    const left = !isNew && !ro
      ? `<div class="foot-l">${archived
          ? `<button type="button" class="link" data-act="restore">Restore</button>`
          : `<button type="button" class="link" data-act="archive">Archive</button>`}
          <button type="button" class="link danger" data-act="delete">Delete</button></div>` : "";
    const footer = ro
      ? `<button type="button" class="btn" data-close>Close</button>`
      : `${left}<div class="foot-r"><button type="button" class="btn ghost" data-close>Cancel</button><button type="submit" class="btn" data-primary>${isNew ? "Add item" : "Save changes"}</button></div>`;

    const m = D.modal({
      title: isNew ? "Add item" : ro ? "View item" : "Edit item",
      form: true, wide: true, body, footer,
      onClose: () => { if (!saved && added.length) api.removePhotos(added); }
    });
    const form = m.el.querySelector("form");
    const el = form.elements;

    /* price type shows only the fields that apply */
    el.kind.addEventListener("change", () => (form.querySelector(".price-grid").dataset.kind = el.kind.value));

    /* photos */
    const thumbs = $("#thumbs", m.el);
    const paintThumbs = () => {
      thumbs.innerHTML = photos.length
        ? photos.map((p, i) => `<figure><img src="${esc(D.photoSrc(p))}" alt="Photo ${i + 1}">${i === 0 ? "<figcaption>Main</figcaption>" : ""}${ro ? "" : `<button type="button" data-rm="${i}" aria-label="Remove photo ${i + 1}">×</button>`}</figure>`).join("")
        : `<p class="muted">No photos yet.</p>`;
    };
    paintThumbs();
    thumbs.addEventListener("click", (e) => {
      const b = e.target.closest("[data-rm]");
      if (!b) return;
      photos.splice(+b.dataset.rm, 1);
      m.markDirty();
      paintThumbs();
    });
    const file = $("#photoFile", m.el);
    if (file) file.addEventListener("change", async () => {
      const f = file.files[0];
      file.value = "";
      if (!f) return;
      if (!/^image\//.test(f.type)) { m.error("Choose an image file (JPG, PNG or WebP)."); return; }
      if (f.size > 5 * 1024 * 1024) { m.error("That photo is over 5 MB. Choose a smaller one."); return; }
      m.error("");
      const lbl = file.parentElement.querySelector(".btn");
      lbl.textContent = "Uploading…";
      try {
        const url = await api.uploadPhoto(f, itemId);
        photos.push(url); added.push(url);
        m.markDirty();
        paintThumbs();
      } catch (e) { m.error(D.friendly(e)); }
      lbl.textContent = "Add photo";
    });

    /* archive / restore / delete from inside the dialog */
    m.el.addEventListener("click", async (e) => {
      const b = e.target.closest("[data-act]");
      if (!b || !it) return;
      const done = b.dataset.act === "delete" ? await deleteItem(it)
        : b.dataset.act === "archive" ? await archiveItem(it) : await restoreItem(it);
      if (done) m.close(true);
    });

    /* approvers: approve or send back */
    bindReview(m.el, "item", it && it.id, (st) => {
      saved = true; m.close(true); refresh();
      D.toast(st === "approved" ? "Marked as approved." : "Sent back for revision.");
    });

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      if (ro) return;
      m.error("");
      const name = el.name.value.trim();
      if (!name) { m.error("Enter a name for this item."); el.name.focus(); return; }
      if (!el.section_id.value) { m.error("Choose a section."); return; }
      let price;
      try { price = D.readPrice(el); } catch (err) { m.error(err.message); return; }
      const section_id = el.section_id.value;
      const visibility = archived ? "archived" : el.status.value;
      const ex = { ...extra };
      if (ex.courses) ex.courses = collectCourses(form);
      const patch = {
        section_id, name, description: el.description.value.trim(), price,
        tags: $$("[name=tag]:checked", form).map((x) => x.value),
        photos: photos.slice(), pairing: el.pairing.value.trim() || null, extra: ex, visibility
      };
      m.busy(true, isNew ? "Adding…" : "Saving…");
      try {
        if (isNew) await api.createItem({ id: itemId, ...patch, sort_order: api.nextSort(section_id) });
        else {
          if (section_id !== it.section_id) patch.sort_order = api.nextSort(section_id);
          await api.updateItem(it.id, patch);
        }
        saved = true;
        await api.removePhotos([...original, ...added].filter((u) => !photos.includes(u)));
        await api.loadAll();
        m.close(true);
        refresh();
        D.toast(isNew
          ? (visibility === "published" ? `Added “${name}”. It’s live on the menu.` : `Added “${name}”.`)
          : (visibility === "published" || visibility === "soldout" ? `Saved “${name}”. Live on the menu.` : `Saved “${name}”.`));
      } catch (err) {
        m.error(D.friendly(err));
        m.busy(false);
      }
    });
  }

  /* ============ sections ============ */
  function openSectionForm(sec, done) {
    const isNew = !sec;
    const setm = !!(sec && sec.is_setmenu);
    const m = D.modal({
      title: isNew ? "Add section" : "Edit section", form: true,
      body: `
        <label>Name<input name="name" required maxlength="80" autofocus value="${esc(sec ? sec.name : "")}"></label>
        ${isNew
          ? `<label>Menu<select name="group_id">${MENU.groups.filter((g) => g.id !== "setmenu").map((g) => `<option value="${g.id}">${esc(g.label)}</option>`).join("")}</select></label>`
          : `<p class="muted">Menu: ${esc(D.groupLabel(sec.group_id))} (can’t be changed)</p>`}
        ${setm ? "" : `<label>Banner colour<select name="tone">
          <option value="slate" ${!sec || sec.tone === "slate" ? "selected" : ""}>Slate (standard)</option>
          <option value="orange" ${sec && sec.tone === "orange" ? "selected" : ""}>Orange (highlight)</option></select></label>`}
        <label>Note <small>(optional)</small><input name="note" maxlength="160" placeholder="A short line shown under the section title" value="${esc((sec && sec.note) || "")}"></label>`,
      footer: `<button type="button" class="btn ghost" data-close>Cancel</button><button type="submit" class="btn" data-primary>${isNew ? "Add section" : "Save section"}</button>`
    });
    const form = m.el.querySelector("form"), el = form.elements;
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      m.error("");
      const name = el.name.value.trim();
      if (!name) { m.error("Enter a name for this section."); return; }
      m.busy(true);
      try {
        if (isNew) await api.createSection({ name, group_id: el.group_id.value, tone: el.tone.value, note: el.note.value.trim() });
        else await api.updateSection(sec.id, { name, note: el.note.value.trim() || null, ...(setm ? {} : { tone: el.tone.value }) });
        await api.loadAll();
        m.close(true);
        D.toast(isNew ? `Added section “${name}”.` : `Saved section “${name}”.`);
        done();
      } catch (err) { m.error(D.friendly(err)); m.busy(false); }
    });
  }

  function openSectionManager() {
    const m = D.modal({
      title: "Sections", wide: true, body: "",
      footer: `<div class="foot-l"><button type="button" class="btn small ghost" data-add-sec>Add section</button></div><div class="foot-r"><button type="button" class="btn" data-close>Done</button></div>`,
      onClose: () => paint()
    });
    const count = (id) => S.items.filter((i) => i.section_id === id && i.visibility !== "archived").length;
    const render = () => {
      const act = D.activeSections();
      const groups = MENU.groups.map((g) => {
        const list = act.filter((s) => s.group_id === g.id).sort((a, b) => a.sort_order - b.sort_order);
        if (!list.length) return "";
        return `<h3 class="sec-h">${esc(g.label)}</h3>` + list.map((s, i) => `<div class="sec-row" data-sid="${esc(s.id)}">
          <div class="sr-main"><strong>${esc(s.name)}</strong><small>${count(s.id)} item${count(s.id) === 1 ? "" : "s"}${s.note ? " · " + esc(s.note) : ""}</small></div>
          <div class="sr-acts">
            <button type="button" class="icon" data-sa="up" aria-label="Move ${esc(s.name)} up" ${i === 0 ? "disabled" : ""}>↑</button>
            <button type="button" class="icon" data-sa="down" aria-label="Move ${esc(s.name)} down" ${i === list.length - 1 ? "disabled" : ""}>↓</button>
            <button type="button" class="btn small ghost" data-sa="edit">Edit</button>
            <button type="button" class="btn small ghost" data-sa="archive">Archive</button>
          </div></div>`).join("");
      }).join("");
      const arch = S.sections.filter((s) => s.archived);
      m.body.innerHTML = (S.migrated ? "" : `<div class="banner-note"><b>One-time database update needed.</b> Run <code>desk-migration.sql</code> in the Supabase SQL editor to manage sections.</div>`)
        + (groups || `<p class="muted">No sections yet.</p>`)
        + (arch.length ? `<h3 class="sec-h">Archived<span>${arch.length}</span></h3>` + arch.map((s) => `<div class="sec-row is-arch" data-sid="${esc(s.id)}">
          <div class="sr-main"><strong>${esc(s.name)}</strong><small>${D.groupLabel(s.group_id)} · ${count(s.id)} item${count(s.id) === 1 ? "" : "s"} kept</small></div>
          <div class="sr-acts"><button type="button" class="btn small ghost" data-sa="restore">Restore</button></div></div>`).join("") : "");
    };
    render();
    const reload = async () => { await api.loadAll(); render(); };
    m.el.addEventListener("click", async (e) => {
      if (e.target.closest("[data-add-sec]")) { openSectionForm(null, render); return; }
      const b = e.target.closest("[data-sa]");
      if (!b) return;
      const row = b.closest("[data-sid]");
      const sec = S.sections.find((s) => s.id === row.dataset.sid);
      try {
        if (b.dataset.sa === "up" || b.dataset.sa === "down") { await api.moveSection(sec.id, b.dataset.sa === "up" ? -1 : 1); await reload(); }
        else if (b.dataset.sa === "edit") openSectionForm(sec, render);
        else if (b.dataset.sa === "archive") {
          const n = count(sec.id);
          const ok = await D.confirmBox({
            title: `Archive “${sec.name}”?`,
            body: `The section${n ? ` and its ${n} item${n === 1 ? "" : "s"}` : ""} will disappear from the public menu. Nothing is deleted, and you can restore it any time.`,
            confirm: "Archive section", cancel: "Keep section", danger: true
          });
          if (!ok) return;
          await api.updateSection(sec.id, { archived: true });
          await reload();
          D.toast(`Archived section “${sec.name}”.`);
        } else if (b.dataset.sa === "restore") {
          await api.updateSection(sec.id, { archived: false });
          await reload();
          D.toast(`Restored section “${sec.name}”. It’s live on the menu.`);
        }
      } catch (err) { fail(err); }
    });
  }

  /* ============ review tab ============ */
  function renderReview() {
    const act = new Set(D.activeSections().map((s) => s.id));
    const pending = S.items.filter((i) => i.visibility !== "archived" && act.has(i.section_id) && i.review_status !== "approved");
    const setPending = S.settings.review_status !== "approved";
    $("#main").innerHTML = `<div class="pane narrow"><div class="row head"><h2>Review list</h2></div>
      <p class="muted">The live website already shows the published version. Mark Approved if no changes are needed, or For revision with a comment.</p>
      ${setPending ? `<article class="item"><button type="button" class="open" data-pages><img src="../images/logo.webp" alt=""><span class="meta"><strong>Hours, contact &amp; Our Story</strong><small>Site pages</small></span></button><div class="side-r"><div class="chips"><span class="st ${stClass[S.settings.review_status]}">${stLabel[S.settings.review_status]}</span></div></div></article>` : ""}
      <div class="list" style="margin-top:12px">${pending.map((i) => itemRow(i, { review: true, showSection: true })).join("") || (setPending ? "" : "<div class='empty'><p>Nothing waiting for review.</p></div>")}</div></div>`;
  }

  /* ============ pages tab ============ */
  async function renderPages(token) {
    const p = S.settings.payload || {};
    const rows = await api.comments("settings", "main");
    if (token !== paintToken) return;
    const last = rows[rows.length - 1];
    const ro = !D.editor();
    const dis = ro ? "disabled" : "";
    const f = (name, label, val, tag = "input") =>
      `<label>${label}${tag === "input" ? `<input name="${name}" value="${esc(val || "")}" ${dis}>` : `<textarea name="${name}" ${dis}>${esc(val || "")}</textarea>`}</label>`;
    $("#main").innerHTML = `<div class="pane narrow">
      ${S.settings.review_status === "for_revision" && last ? `<div class="banner-note"><b>For revision:</b> ${esc(last.body)}</div>` : ""}
      <form class="form" id="pageForm" novalidate>
        <h2>Hours, contact &amp; Our Story</h2>
        <p class="muted">Saving goes live immediately. Status: <b>${stLabel[S.settings.review_status]}</b></p>
        <fieldset><legend>Contact</legend><div class="grid2">
          ${f("hours", "Hours", p.hours)}${f("phone", "Phone", p.phone)}${f("email", "Email", p.email)}${f("opentable", "OpenTable / Reserve link", p.opentable)}
        </div>${f("address", "Address", p.address, "textarea")}</fieldset>
        <fieldset><legend>Social links</legend><div class="grid3">
          ${f("facebook", "Facebook", p.social && p.social.facebook)}${f("instagram", "Instagram", p.social && p.social.instagram)}${f("tiktok", "TikTok", p.social && p.social.tiktok)}
        </div></fieldset>
        <fieldset><legend>Home page</legend>
          ${f("heroKick", "Hero line", p.heroKick)}${f("heroLead", "Hero description", p.heroLead, "textarea")}</fieldset>
        <fieldset><legend>Our Story</legend>
          ${f("storyTitle", "Title", p.storyTitle)}${f("storyP1", "Paragraph 1", p.storyP1, "textarea")}${f("storyP2", "Paragraph 2", p.storyP2, "textarea")}${f("storyP3", "Paragraph 3", p.storyP3, "textarea")}</fieldset>
        ${ro ? "" : `<div class="actions"><button class="btn" type="submit" data-primary>Save &amp; publish</button></div>`}
        <p class="err" id="saveErr" role="alert" hidden></p>
      </form>
      <div id="pageReview" style="margin-top:16px">${reviewHTML(rows)}</div></div>`;
    bindReview($("#pageReview"), "settings", "main", (st) => {
      paint(); D.toast(st === "approved" ? "Marked as approved." : "Sent back for revision.");
    });
  }

  async function savePages(form) {
    const e = form.elements, v = (n) => e[n].value.trim();
    await api.saveSettings({
      hours: v("hours"), phone: v("phone"), email: v("email"), address: v("address"), opentable: v("opentable"),
      social: { facebook: v("facebook"), instagram: v("instagram"), tiktok: v("tiktok") },
      heroKick: v("heroKick"), heroLead: v("heroLead"),
      storyTitle: v("storyTitle"), storyP1: v("storyP1"), storyP2: v("storyP2"), storyP3: v("storyP3")
    });
  }

  /* ============ drag to reorder ============ */
  function initDrag() {
    let st = null, timer = 0;
    const idsOf = (list) => [...list.children].filter((c) => c.classList.contains("item")).map((c) => c.dataset.id);

    async function commit(list) {
      const rows = idsOf(list).map(findItem).filter(Boolean);
      const sorted = rows.map((r) => r.sort_order).sort((a, b) => a - b);
      const target = new Set(sorted).size !== sorted.length ? rows.map((_, i) => i) : sorted;
      const updates = [];
      rows.forEach((r, i) => { if (r.sort_order !== target[i]) updates.push({ id: r.id, sort_order: target[i] }); });
      if (!updates.length) return;
      try {
        await api.reorderItems(updates);
        updates.forEach((u) => { findItem(u.id).sort_order = u.sort_order; });
        D.toast("Order saved.");
      } catch (err) {
        fail(err);
        try { await api.loadAll(); } catch (e) { /* keep local state */ }
        paintList();
      }
    }
    function place() {
      const { row, list, y } = st;
      const sibs = [...list.children].filter((c) => c !== row && c.classList.contains("item"));
      let ref = null;
      for (const s of sibs) {
        const r = s.getBoundingClientRect();
        if (y < r.top + r.height / 2) { ref = s; break; }
      }
      if (row.nextElementSibling !== ref) list.insertBefore(row, ref);
    }
    function tick() {
      if (!st) return;
      if (st.y < 70) window.scrollBy(0, -14);
      else if (st.y > window.innerHeight - 70) window.scrollBy(0, 14);
      place();
      st.raf = requestAnimationFrame(tick);
    }
    const move = (e) => { if (st) st.y = e.clientY; };
    function end() {
      if (!st) return;
      cancelAnimationFrame(st.raf);
      document.removeEventListener("pointermove", move);
      document.removeEventListener("pointerup", end);
      document.removeEventListener("pointercancel", end);
      st.row.classList.remove("dragging");
      st.list.classList.remove("sorting");
      const list = st.list;
      st = null;
      commit(list);
    }
    document.addEventListener("pointerdown", (e) => {
      const grip = e.target.closest("[data-grip]");
      if (!grip || e.button > 0) return;
      const row = grip.closest(".item");
      e.preventDefault();
      st = { row, list: row.parentElement, y: e.clientY, raf: 0 };
      row.classList.add("dragging");
      st.list.classList.add("sorting");
      document.addEventListener("pointermove", move);
      document.addEventListener("pointerup", end);
      document.addEventListener("pointercancel", end);
      st.raf = requestAnimationFrame(tick);
    });
    document.addEventListener("keydown", (e) => {
      const grip = e.target.closest && e.target.closest("[data-grip]");
      if (!grip || (e.key !== "ArrowUp" && e.key !== "ArrowDown")) return;
      e.preventDefault();
      const row = grip.closest(".item"), list = row.parentElement;
      const sib = e.key === "ArrowUp" ? row.previousElementSibling : row.nextElementSibling;
      if (!sib || !sib.classList.contains("item")) return;
      list.insertBefore(row, e.key === "ArrowUp" ? sib : sib.nextElementSibling);
      grip.focus();
      clearTimeout(timer);
      timer = setTimeout(() => commit(list), 500);
    });
  }

  /* ============ events ============ */
  function init() {
    const desk = $("#desk");
    desk.addEventListener("click", async (e) => {
      const t = e.target;
      const nav = t.closest("[data-view]");
      if (nav) { ui.view = nav.dataset.view; await paint(); return; }
      if (t.closest("[data-pages]")) { ui.view = "pages"; await paint(); return; }
      const sec = t.closest("[data-sec]");
      if (sec) { ui.secFilter = sec.dataset.sec; renderItems(); return; }
      const st = t.closest("[data-status]");
      if (st) { ui.status = st.dataset.status; paintList(); return; }
      if (t.closest("#clearFilters")) { ui.q = ""; ui.status = "all"; renderItems(); return; }
      if (t.closest("#manageSecs")) { openSectionManager(); return; }
      if (t.closest("#addItem") || t.closest("#addItemEmpty")) {
        openItemModal(null, { section_id: single() || (scopeSections()[0] || {}).id });
        return;
      }
      const row = t.closest(".item[data-id]");
      if (!row) return;
      const it = findItem(row.dataset.id);
      const act = t.closest("[data-act]");
      if (act && it) {
        if (act.dataset.act === "archive") await archiveItem(it);
        else if (act.dataset.act === "restore") await restoreItem(it);
        else if (act.dataset.act === "delete") await deleteItem(it);
        return;
      }
      if (t.closest("[data-open]")) openItemModal(row.dataset.id);
    });

    let debounce = 0;
    desk.addEventListener("input", (e) => {
      if (e.target.id !== "q") return;
      ui.q = e.target.value;
      clearTimeout(debounce);
      debounce = setTimeout(paintList, 120);
    });

    desk.addEventListener("submit", async (e) => {
      if (e.target.id !== "pageForm") return;
      e.preventDefault();
      const err = $("#saveErr"); err.hidden = true;
      const btn = $("[data-primary]", e.target);
      btn.disabled = true; btn.textContent = "Saving…";
      try {
        await savePages(e.target);
        await api.loadAll();
        D.toast("Pages published. Live on the site.");
        await paint();
      } catch (ex) {
        err.hidden = false; err.textContent = D.friendly(ex);
        btn.disabled = false; btn.innerHTML = "Save &amp; publish";
      }
    });
    initDrag();
  }

  D.views = { init, paint, refresh };
})();
