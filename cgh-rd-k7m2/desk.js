(async function () {
  "use strict";
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const peso = (n) => n == null ? "" : "₱" + Number(n).toLocaleString("en-PH");
  const photoSrc = (p) => {
    if (!p) return "../images/logo.webp";
    if (/^https?:\/\//i.test(p) || p.includes("/")) return p;
    return "../images/" + p + ".webp";
  };
  const stLabel = { not_reviewed: "Not reviewed", approved: "Approved", for_revision: "For revision" };
  const stClass = { not_reviewed: "nr", approved: "ok", for_revision: "rev" };

  const cfg = window.ENCIMA_CONFIG || {};
  if (!cfg.supabaseUrl || !cfg.supabaseAnonKey) {
    $("#setup").hidden = false;
    $("#gateNote").textContent = "Supabase is not connected yet.";
    return;
  }

  const sb = supabase.createClient(cfg.supabaseUrl, cfg.supabaseAnonKey);
  let profile = null, sections = [], items = [], settings = { payload: {}, review_status: "not_reviewed" };
  let view = "items", secFilter = "all", currentId = null, flash = "";

  const editor = () => profile && profile.role === "editor";
  const staffName = (p) => (p && p.email ? p.email.split("@")[0] : "Staff");

  function priceKind(p) {
    if (p == null) return "tbd";
    if (typeof p === "number") return "single";
    if (p.shot != null) return "shot";
    if (p.glass200 != null) return "glass200";
    return "glass";
  }
  function readPrice(f) {
    const k = f.kind.value;
    const n = (name) => { const v = f[name].value.trim(); return v === "" ? null : Number(v); };
    if (k === "tbd") return null;
    if (k === "single") return n("single");
    if (k === "shot") return { shot: n("shot"), bottle: n("bottle"), bottleNote: f.bottleNote.value.trim() || undefined };
    if (k === "glass200") return { glass200: n("glass200"), bottle: n("bottle"), bottleNote: f.bottleNote.value.trim() || undefined };
    return { glass: n("glass"), bottle: n("bottle"), bottleNote: f.bottleNote.value.trim() || undefined };
  }
  function priceText(p) {
    if (p == null) return "Price on request";
    if (typeof p === "number") return peso(p);
    const bits = [];
    if (p.glass != null) bits.push("G " + peso(p.glass));
    if (p.glass200 != null) bits.push("200ml " + peso(p.glass200));
    if (p.shot != null) bits.push("Shot " + peso(p.shot));
    if (p.bottle != null) bits.push("Btl " + peso(p.bottle));
    return bits.join(" · ") || "—";
  }

  async function loadAll() {
    const [{ data: secs }, { data: its }, { data: set }] = await Promise.all([
      sb.from("sections").select("*").order("sort_order"),
      sb.from("items").select("*").order("sort_order"),
      sb.from("site_settings").select("*").eq("id", "main").maybeSingle()
    ]);
    sections = secs || [];
    items = its || [];
    if (set) settings = set;
  }

  function pendingCount() {
    let n = items.filter((i) => i.review_status !== "approved").length;
    if (settings.review_status !== "approved") n++;
    return n;
  }

  function renderShell() {
    $("#who").textContent = profile.email + " · " + (editor() ? "Editor" : "Approver");
    const n = pendingCount();
    const c = $("#revCount");
    c.hidden = !n; c.textContent = n;
    $$(".bar nav button").forEach((b) => b.classList.toggle("on", b.dataset.view === view && !currentId));
  }

  async function comments(type, id) {
    const q = await sb.from("review_comments")
      .select("id, body, created_at, author_id, profiles!author_id(email)")
      .eq("target_type", type).eq("target_id", id).order("created_at");
    if (q.error) {
      const { data } = await sb.from("review_comments")
        .select("id, body, created_at, author_id").eq("target_type", type).eq("target_id", id).order("created_at");
      return data || [];
    }
    return q.data || [];
  }

  function threadHTML(rows) {
    if (!rows.length) return `<p class="muted">No comments yet.</p>`;
    return rows.map((r) => `<div class="bubble"><small>${esc((r.profiles && r.profiles.email) || "Staff")} · ${new Date(r.created_at).toLocaleString()}</small>${esc(r.body)}</div>`).join("");
  }

  function itemCard(it) {
    const vis = it.visibility === "hidden" ? "Hidden" : it.visibility === "soldout" ? "Sold out" : "";
    return `<button class="item" data-id="${it.id}">
      <img src="${esc(photoSrc((it.photos || [])[0]))}" alt="">
      <div><h3>${esc(it.name)}</h3><p>${esc(priceText(it.price))}${it.description ? " · " + esc(it.description.slice(0, 80)) : ""}</p></div>
      <div><span class="st ${stClass[it.review_status] || ""}">${stLabel[it.review_status]}</span>${vis ? `<div class="st hide">${vis}</div>` : ""}</div>
    </button>`;
  }

  function renderItems() {
    const secs = sections.filter((s) => secFilter === "all" || s.id === secFilter || s.group_id === secFilter);
    const ids = new Set(secs.map((s) => s.id));
    const list = items.filter((i) => ids.has(i.section_id));
    $("#main").innerHTML = `<div class="split">
      <div class="side">
        <button data-sec="all" class="${secFilter === "all" ? "on" : ""}">All sections</button>
        ${MENU.groups.map((g) => `<button data-sec="${g.id}" class="${secFilter === g.id ? "on" : ""}">${esc(g.label)}</button>`).join("")}
        ${sections.map((s) => `<button data-sec="${s.id}" class="${secFilter === s.id ? "on" : ""}">${esc(s.name)}</button>`).join("")}
      </div>
      <div>
        <div class="row">
          <h2 style="margin:0;font-family:var(--serif);color:var(--slate)">Menu items</h2>
          ${editor() ? `<button class="btn small" id="addItem" ${secFilter === "all" || MENU.groups.some((g) => g.id === secFilter) ? "disabled" : ""}>Add item</button>` : `<p class="muted">View only — use Review to approve or request changes.</p>`}
        </div>
        ${flash ? `<p class="okmsg">${esc(flash)}</p>` : ""}
        <div class="list">${list.map(itemCard).join("") || "<p class='muted'>No items in this section.</p>"}</div>
      </div>
    </div>`;
    flash = "";
  }

  function priceFields(p) {
    const k = priceKind(p);
    const obj = typeof p === "object" && p ? p : {};
    const n = typeof p === "number" ? p : "";
    return `<label>Price type
      <select name="kind">
        <option value="single" ${k === "single" ? "selected" : ""}>Single price</option>
        <option value="glass" ${k === "glass" ? "selected" : ""}>Glass + bottle</option>
        <option value="glass200" ${k === "glass200" ? "selected" : ""}>200 ml + bottle</option>
        <option value="shot" ${k === "shot" ? "selected" : ""}>Shot + bottle</option>
        <option value="tbd" ${k === "tbd" ? "selected" : ""}>Price on request</option>
      </select></label>
      <div class="price-grid">
        <label>Price<input name="single" type="number" min="0" step="1" value="${n}"></label>
        <label>Glass<input name="glass" type="number" min="0" step="1" value="${obj.glass ?? ""}"></label>
        <label>200 ml<input name="glass200" type="number" min="0" step="1" value="${obj.glass200 ?? ""}"></label>
        <label>Shot<input name="shot" type="number" min="0" step="1" value="${obj.shot ?? ""}"></label>
        <label>Bottle<input name="bottle" type="number" min="0" step="1" value="${obj.bottle ?? ""}"></label>
        <label>Bottle note<input name="bottleNote" value="${esc(obj.bottleNote || "")}" placeholder="700 ml"></label>
      </div>`;
  }

  async function renderEditor(id) {
    const it = items.find((x) => x.id === id);
    if (!it) { currentId = null; view = "items"; return renderItems(); }
    const rows = await comments("item", id);
    const ro = !editor();
    const dis = ro ? "disabled" : "";
    const photos = it.photos || [];
    const extra = it.extra || {};
    const last = rows[rows.length - 1];
    $("#main").innerHTML = `
      <p><button class="link" data-back>← Back</button></p>
      ${it.review_status === "for_revision" && last ? `<div class="banner-note"><b>For revision:</b> ${esc(last.body)}</div>` : ""}
      <form class="form" id="itemForm">
        <h2>${ro ? "View item" : "Edit item"}</h2>
        <label>Section
          <select name="section_id" ${dis}>${sections.map((s) => `<option value="${s.id}" ${s.id === it.section_id ? "selected" : ""}>${esc(s.name)}</option>`).join("")}</select>
        </label>
        <label>Name<input name="name" required value="${esc(it.name)}" ${dis}></label>
        <label>Description<textarea name="description" ${dis}>${esc(it.description || "")}</textarea></label>
        ${priceFields(it.price)}
        <div>
          <span class="muted" style="font-size:.78rem;letter-spacing:.06em;text-transform:uppercase;font-weight:600">Tags</span>
          <div class="checks">${Object.entries(TAGS).map(([id, t]) =>
            `<label><input type="checkbox" name="tag" value="${id}" ${ (it.tags || []).includes(id) ? "checked" : "" } ${dis}> ${t.icon} ${esc(t.label)}</label>`).join("")}</div>
        </div>
        <label><input type="checkbox" name="onSite" ${it.visibility !== "hidden" ? "checked" : ""} ${dis}> Show on the public menu</label>
        <label><input type="checkbox" name="sold" ${it.visibility === "soldout" ? "checked" : ""} ${dis}> Sold out (instant, no review)</label>
        <div>
          <span class="muted" style="font-size:.78rem;letter-spacing:.06em;text-transform:uppercase;font-weight:600">Photos</span>
          <div class="thumbs">${photos.map((p, i) => `<figure><img src="${esc(photoSrc(p))}" alt=""><button type="button" data-rm-photo="${i}" ${dis}>×</button></figure>`).join("")}</div>
          ${editor() ? `<input type="file" id="photoFile" accept="image/*">` : ""}
        </div>
        <label>Wine pairing note<input name="pairing" value="${esc(it.pairing || "")}" ${dis}></label>
        ${extra.courses ? `<div id="courses">${extra.courses.map((c, i) => courseHTML(c, i, ro)).join("")}</div>` : ""}
        <p class="muted">Review status: <b>${stLabel[it.review_status]}</b>. Publishing updates the live site immediately and sets status to Not reviewed (except sold out).</p>
        ${editor() ? `<div class="actions"><button class="btn" type="submit">Save &amp; publish</button></div>` : ""}
        <p class="err" id="saveErr" hidden></p>
        <p class="okmsg" id="saveOk" hidden></p>
      </form>
      <div class="thread" style="margin-top:16px">
        <h3 style="margin:0">Review comments</h3>
        <div id="thread">${threadHTML(rows)}</div>
        ${profile.role === "approver" ? `
          <label>Comment<textarea id="cBody" placeholder="What should change, or why it is approved"></textarea></label>
          <div class="actions">
            <button class="btn" id="markOk">Approved</button>
            <button class="btn ghost" id="markRev">For revision</button>
          </div>` : ""}
      </div>`;
    const form = $("#itemForm");
    if (form) form._photos = photos.slice();
  }

  function courseHTML(c, i, ro) {
    return `<div class="course-ed" data-ci="${i}">
      <label>Course title<input name="ctitle" value="${esc(c.title)}" ${ro ? "disabled" : ""}></label>
      <label><input type="checkbox" name="cchoice" ${c.choice ? "checked" : ""} ${ro ? "disabled" : ""}> Guest chooses one</label>
      <label>Options (one per line)<textarea name="copts" ${ro ? "disabled" : ""}>${esc((c.options || []).join("\n"))}</textarea></label>
    </div>`;
  }

  function collectCourses() {
    return $$(".course-ed").map((el) => ({
      title: $("[name=ctitle]", el).value.trim(),
      choice: $("[name=cchoice]", el).checked,
      options: $("[name=copts]", el).value.split("\n").map((x) => x.trim()).filter(Boolean)
    }));
  }

  async function saveItem(form) {
    const it = items.find((x) => x.id === currentId);
    const onSite = form.onSite.checked;
    const sold = form.sold.checked;
    const visibility = !onSite ? "hidden" : sold ? "soldout" : "published";
    const tags = $$("[name=tag]:checked", form).map((x) => x.value);
    const extra = { ...(it.extra || {}) };
    if (extra.courses) extra.courses = collectCourses();
    const patch = {
      section_id: form.section_id.value,
      name: form.name.value.trim(),
      description: form.description.value.trim(),
      price: readPrice(form),
      tags,
      photos: form._photos || it.photos || [],
      pairing: form.pairing.value.trim() || null,
      extra,
      visibility
    };
    const { error } = await sb.from("items").update(patch).eq("id", it.id);
    if (error) throw error;
  }

  async function addItem() {
    const section_id = secFilter;
    const max = Math.max(0, ...items.filter((i) => i.section_id === section_id).map((i) => i.sort_order));
    const { data, error } = await sb.from("items").insert({
      section_id, name: "New item", description: "", price: 0, tags: [], photos: [],
      extra: {}, visibility: "published", review_status: "not_reviewed", sort_order: max + 1
    }).select("id").single();
    if (error) throw error;
    await loadAll();
    currentId = data.id;
    await renderEditor(currentId);
  }

  async function uploadPhoto(file) {
    const it = items.find((x) => x.id === currentId);
    const path = `${it.id}/${Date.now()}-${file.name.replace(/[^\w.\-]+/g, "_")}`;
    const { error } = await sb.storage.from("menu-photos").upload(path, file, { upsert: true });
    if (error) throw error;
    const { data } = sb.storage.from("menu-photos").getPublicUrl(path);
    const form = $("#itemForm");
    form._photos = (form._photos || []).concat(data.publicUrl);
    it.photos = form._photos;
    await renderEditor(currentId);
  }

  function renderReview() {
    const pending = items.filter((i) => i.review_status !== "approved");
    const setPending = settings.review_status !== "approved";
    $("#main").innerHTML = `<h2 style="font-family:var(--serif);color:var(--slate)">Review list</h2>
      <p class="muted">The live website already shows the published version. Mark Approved if no changes are needed, or For revision with a comment.</p>
      ${setPending ? `<button class="item" data-pages="1"><img src="../images/logo.webp" alt=""><div><h3>Hours, contact &amp; Our Story</h3><p>Site pages</p></div><span class="st ${stClass[settings.review_status]}">${stLabel[settings.review_status]}</span></button>` : ""}
      <div class="list" style="margin-top:12px">${pending.map(itemCard).join("") || (setPending ? "" : "<p class='muted'>Nothing waiting for review.</p>")}</div>`;
  }

  async function renderPages() {
    const p = settings.payload || {};
    const rows = await comments("settings", "main");
    const last = rows[rows.length - 1];
    const ro = !editor();
    const dis = ro ? "disabled" : "";
    $("#main").innerHTML = `
      ${settings.review_status === "for_revision" && last ? `<div class="banner-note"><b>For revision:</b> ${esc(last.body)}</div>` : ""}
      <form class="form" id="pageForm">
        <h2>Hours, contact &amp; Our Story</h2>
        <p class="muted">Saves go live immediately. Status: <b>${stLabel[settings.review_status]}</b></p>
        <label>Hours<input name="hours" value="${esc(p.hours || "")}" ${dis}></label>
        <label>Phone<input name="phone" value="${esc(p.phone || "")}" ${dis}></label>
        <label>Email<input name="email" value="${esc(p.email || "")}" ${dis}></label>
        <label>Address<textarea name="address" ${dis}>${esc(p.address || "")}</textarea></label>
        <label>OpenTable / Reserve link<input name="opentable" value="${esc(p.opentable || "")}" ${dis}></label>
        <label>Facebook<input name="facebook" value="${esc((p.social && p.social.facebook) || "")}" ${dis}></label>
        <label>Instagram<input name="instagram" value="${esc((p.social && p.social.instagram) || "")}" ${dis}></label>
        <label>TikTok<input name="tiktok" value="${esc((p.social && p.social.tiktok) || "")}" ${dis}></label>
        <label>Hero line<input name="heroKick" value="${esc(p.heroKick || "")}" ${dis}></label>
        <label>Hero description<textarea name="heroLead" ${dis}>${esc(p.heroLead || "")}</textarea></label>
        <label>Our Story title<input name="storyTitle" value="${esc(p.storyTitle || "")}" ${dis}></label>
        <label>Story paragraph 1<textarea name="storyP1" ${dis}>${esc(p.storyP1 || "")}</textarea></label>
        <label>Story paragraph 2<textarea name="storyP2" ${dis}>${esc(p.storyP2 || "")}</textarea></label>
        <label>Story paragraph 3<textarea name="storyP3" ${dis}>${esc(p.storyP3 || "")}</textarea></label>
        ${editor() ? `<div class="actions"><button class="btn" type="submit">Save &amp; publish</button></div>` : ""}
        <p class="err" id="saveErr" hidden></p>
      </form>
      <div class="thread" style="margin-top:16px">
        <h3 style="margin:0">Review comments</h3>
        <div id="thread">${threadHTML(rows)}</div>
        ${profile.role === "approver" ? `
          <label>Comment<textarea id="cBody"></textarea></label>
          <div class="actions">
            <button class="btn" id="markOkSet">Approved</button>
            <button class="btn ghost" id="markRevSet">For revision</button>
          </div>` : ""}
      </div>`;
  }

  async function savePages(form) {
    const payload = {
      hours: form.hours.value.trim(),
      phone: form.phone.value.trim(),
      email: form.email.value.trim(),
      address: form.address.value.trim(),
      opentable: form.opentable.value.trim(),
      social: { facebook: form.facebook.value.trim(), instagram: form.instagram.value.trim(), tiktok: form.tiktok.value.trim() },
      heroKick: form.heroKick.value.trim(),
      heroLead: form.heroLead.value.trim(),
      storyTitle: form.storyTitle.value.trim(),
      storyP1: form.storyP1.value.trim(),
      storyP2: form.storyP2.value.trim(),
      storyP3: form.storyP3.value.trim()
    };
    const { error } = await sb.from("site_settings").update({ payload }).eq("id", "main");
    if (error) throw error;
  }

  async function setStatus(type, id, status) {
    const body = ($("#cBody") && $("#cBody").value.trim()) || "";
    if (status === "for_revision" && !body) throw new Error("Add a comment explaining the revision.");
    if (body) {
      const { error: cErr } = await sb.from("review_comments").insert({
        target_type: type, target_id: id, body, author_id: profile.id
      });
      if (cErr) throw cErr;
    } else if (status === "approved") {
      const { error: cErr } = await sb.from("review_comments").insert({
        target_type: type, target_id: id, body: "Approved", author_id: profile.id
      });
      if (cErr) throw cErr;
    }
    if (type === "item") {
      const { error } = await sb.from("items").update({ review_status: status }).eq("id", id);
      if (error) throw error;
    } else {
      const { error } = await sb.from("site_settings").update({ review_status: status }).eq("id", "main");
      if (error) throw error;
    }
  }

  async function paint() {
    renderShell();
    if (currentId) return renderEditor(currentId);
    if (view === "review") return renderReview();
    if (view === "pages") return renderPages();
    renderItems();
  }

  $("#desk").addEventListener("click", async (e) => {
    const nav = e.target.closest("[data-view]");
    if (nav) { view = nav.dataset.view; currentId = null; secFilter = "all"; await paint(); return; }
    if (e.target.closest("[data-back]")) { currentId = null; await paint(); return; }
    if (e.target.closest("[data-pages]")) { view = "pages"; currentId = null; await paint(); return; }
    const sec = e.target.closest("[data-sec]");
    if (sec) { secFilter = sec.dataset.sec; currentId = null; renderShell(); renderItems(); return; }
    const card = e.target.closest(".item[data-id]");
    if (card) { currentId = card.dataset.id; await paint(); return; }
    if (e.target.id === "addItem") { try { await addItem(); } catch (err) { alert(err.message); } return; }
    const rm = e.target.closest("[data-rm-photo]");
    if (rm) {
      const form = $("#itemForm");
      form._photos.splice(+rm.dataset.rmPhoto, 1);
      items.find((x) => x.id === currentId).photos = form._photos;
      await renderEditor(currentId);
      return;
    }
    try {
      if (e.target.id === "markOk") { await setStatus("item", currentId, "approved"); await loadAll(); await paint(); }
      if (e.target.id === "markRev") { await setStatus("item", currentId, "for_revision"); await loadAll(); await paint(); }
      if (e.target.id === "markOkSet") { await setStatus("settings", "main", "approved"); await loadAll(); await paint(); }
      if (e.target.id === "markRevSet") { await setStatus("settings", "main", "for_revision"); await loadAll(); await paint(); }
    } catch (err) { alert(err.message); }
  });

  $("#desk").addEventListener("change", async (e) => {
    if (e.target.id === "photoFile" && e.target.files[0]) {
      try { await uploadPhoto(e.target.files[0]); } catch (err) { alert(err.message); }
      e.target.value = "";
    }
  });

  $("#desk").addEventListener("submit", async (e) => {
    e.preventDefault();
    const err = $("#saveErr"); if (err) err.hidden = true;
    try {
      if (e.target.id === "itemForm") {
        await saveItem(e.target); await loadAll();
        const ok = $("#saveOk"); if (ok) { ok.hidden = false; ok.textContent = "Published on the live menu."; }
      }
      if (e.target.id === "pageForm") {
        await savePages(e.target); await loadAll(); flash = "Pages published."; view = "pages"; await paint();
      }
    } catch (ex) {
      if (err) { err.hidden = false; err.textContent = ex.message; } else alert(ex.message);
    }
  });

  $("#out").addEventListener("click", async () => { await sb.auth.signOut(); location.reload(); });

  async function enter() {
    const { data: { session } } = await sb.auth.getSession();
    if (!session) { $("#loginForm").hidden = false; return; }
    const { data: prof, error } = await sb.from("profiles").select("*").eq("id", session.user.id).maybeSingle();
    if (error || !prof) {
      await sb.auth.signOut();
      $("#loginForm").hidden = false;
      $("#loginErr").hidden = false;
      $("#loginErr").textContent = "This email is not on the staff list.";
      return;
    }
    profile = prof;
    await loadAll();
    $("#gate").hidden = true;
    $("#desk").hidden = false;
    await paint();
  }

  $("#loginForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    $("#loginErr").hidden = true;
    const fd = new FormData(e.target);
    const { error } = await sb.auth.signInWithPassword({ email: fd.get("email"), password: fd.get("password") });
    if (error) { $("#loginErr").hidden = false; $("#loginErr").textContent = error.message; return; }
    await enter();
  });

  $("#loginForm").hidden = false;
  await enter();
})();
