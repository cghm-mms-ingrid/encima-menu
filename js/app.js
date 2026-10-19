(async function () {
  "use strict";
  if (typeof loadEncimaData === "function") await loadEncimaData();
  const $ = (s, r = document) => r.querySelector(s);
  const state = { lang: "en", group: "food", block: "all", q: "", tags: new Set(), sort: "menu" };
  const src = (typeof photoUrl === "function") ? photoUrl : (p) => p ? `images/${p}.webp` : "images/logo.webp";

  /* ---------- helpers ---------- */
  const store = {
    get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  };
  const t = (k) => (UI[state.lang] && UI[state.lang][k]) || UI.en[k] || k;
  const tagLabel = (id) => (TAG_LABELS[state.lang] && TAG_LABELS[state.lang][id]) || TAGS[id].label;
  const secName = (s) => (SECTION_NAMES[state.lang] && SECTION_NAMES[state.lang][s.id]) || s.name;
  const tr = (item, f) => (item.i18n && item.i18n[state.lang] && item.i18n[state.lang][f]) || item[f] || "";
  const peso = (n) => "₱" + Number(n).toLocaleString("en-PH");
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const visible = (it) => it.status === "published" || it.status === "soldout";
  const sortPrice = (p) => (p == null ? null : typeof p === "number" ? p : (p.bottle != null ? p.bottle : p.shot != null ? p.shot : p.glass));

  /* Banner blocks: food sections each get their own banner; drinks sections share banners (see BLOCKS in data.js). */
  const blockId = (s) => BLOCKS[s.id] || s.id;
  const blockNameOf = (id, secs) => BLOCK_NAMES[id] || secs[0].name;
  function buildBlocks() {
    const map = new Map();
    MENU.sections.forEach((s, si) => {
      const id = blockId(s);
      if (!map.has(id)) map.set(id, { id, group: s.group, tone: s.tone, secs: [], note: s.note });
      map.get(id).secs.push({ s, si });
    });
    return [...map.values()].map((b) => ({ ...b, name: blockNameOf(b.id, b.secs.map((x) => x.s)) }));
  }
  const BLOCKS_LIST = buildBlocks();
  const blockName = (b) => (b.secs.length === 1 && SECTION_NAMES[state.lang] && SECTION_NAMES[state.lang][b.secs[0].s.id]) || b.name;

  function detectLang() {
    const saved = store.get("encima-lang");
    if (saved && LANGS.some((l) => l.code === saved)) return saved;
    const n = (navigator.language || "en").toLowerCase();
    if (n.startsWith("fil") || n.startsWith("tl")) return "fil";
    if (n.startsWith("zh")) return /tw|hk|mo|hant/.test(n) ? "zh-Hant" : "zh-Hans";
    if (n.startsWith("ko")) return "ko";
    if (n.startsWith("ja")) return "ja";
    return "en";
  }

  function priceHTML(p) {
    if (p == null) return `<span class="price"><small>${esc(t("tbd"))}</small></span>`;
    if (typeof p === "number") return `<span class="price">${peso(p)}</span>`;
    const parts = [];
    if (p.glass != null) parts.push(`${esc(t("glass"))} ${peso(p.glass)}`);
    if (p.glass200 != null) parts.push(`${esc(t("glass200"))} ${peso(p.glass200)}`);
    if (p.shot != null) parts.push(`${esc(t("shot"))} ${peso(p.shot)}`);
    if (p.bottle != null) parts.push(`${esc(t("bottle"))} ${peso(p.bottle)}${p.bottleNote ? ` (${esc(p.bottleNote)})` : ""}`);
    return `<span class="price">${parts.map((x) => `<small>${x}</small>`).join("")}</span>`;
  }
  const tagIcons = (tags) => tags.map((id) => `<span class="tag" title="${esc(tagLabel(id))}" aria-label="${esc(tagLabel(id))}">${TAGS[id].icon}</span>`).join("");

  /* ---------- filtering: an item must have EVERY ticked tag ---------- */
  function matches(it) {
    if (!visible(it)) return false;
    for (const tg of state.tags) if (!it.tags.includes(tg)) return false;
    if (state.q) {
      const hay = (tr(it, "name") + " " + it.name + " " + tr(it, "desc")).toLowerCase();
      if (!hay.includes(state.q.toLowerCase())) return false;
    }
    return true;
  }
  function sorted(entries) {
    if (state.sort === "menu") return entries;
    const dir = state.sort === "desc" ? -1 : 1;
    return entries.slice().sort((a, b) => {
      const pa = sortPrice(a[0].price), pb = sortPrice(b[0].price);
      if (pa == null && pb == null) return a[1] - b[1];
      if (pa == null) return 1;
      if (pb == null) return -1;
      return (pa - pb) * dir || a[1] - b[1];
    });
  }
  const inScope = (b) => {
    if (state.q) return true;                           /* search looks everywhere */
    if (state.block !== "all") return b.id === state.block;
    return b.group === state.group;
  };

  /* ---------- static chrome ---------- */
  function renderChrome() {
    document.documentElement.lang = state.lang;
    document.querySelectorAll("[data-i18n]").forEach((el) => (el.textContent = t(el.dataset.i18n)));
    $("#q").placeholder = t("search");
    $("#hours").textContent = SITE.hours; $("#hours2").textContent = SITE.hours;
    if (SITE.heroKick) { const el = $("#heroKick"); if (el) el.textContent = SITE.heroKick; }
    if (SITE.heroLead) { const el = $("#heroLead"); if (el) el.textContent = SITE.heroLead; }
    if (SITE.storyTitle) { const el = $("#storyTitle"); if (el) el.textContent = SITE.storyTitle; }
    if (SITE.storyP1) { const el = $("#storyP1"); if (el) el.textContent = SITE.storyP1; }
    if (SITE.storyP2) { const el = $("#storyP2"); if (el) el.textContent = SITE.storyP2; }
    if (SITE.storyP3) { const el = $("#storyP3"); if (el) el.textContent = SITE.storyP3; }
    $("#reserve").href = SITE.opentable; $("#reserveTop").href = SITE.opentable;
    $("#address").textContent = SITE.address;
    const ph = $("#phone"); ph.textContent = SITE.phone; ph.href = "tel:" + SITE.phone.replace(/[^+\d]/g, "");
    const em = $("#email"); em.textContent = SITE.email; em.href = "mailto:" + SITE.email;
    $("#fb").href = SITE.social.facebook; $("#ig").href = SITE.social.instagram; $("#tt").href = SITE.social.tiktok;
    $("#lang").innerHTML = LANGS.map((l) => `<option value="${l.code}" ${l.code === state.lang ? "selected" : ""}>${l.label}</option>`).join("");
    renderBest();
  }

  function renderBest() {
    const all = [];
    MENU.sections.forEach((s, si) => s.items.forEach((it, ii) => { if (visible(it) && it.tags.includes("best")) all.push([it, si, ii]); }));
    all.sort((a, b) => (b[0].photos.length ? 1 : 0) - (a[0].photos.length ? 1 : 0));
    $("#bestGrid").innerHTML = all.slice(0, 4).map(([it, si, ii]) => {
      const has = it.photos.length;
      return `<button class="bcard" data-s="${si}" data-i="${ii}">
        <div class="bimg ${has ? "" : "ph"}"><img loading="lazy" src="${esc(has ? src(it.photos[0]) : "images/logo.webp")}" alt="${has ? esc(tr(it, "name")) : ""}"></div>
        <h3 class="name">${esc(tr(it, "name"))}</h3>${tr(it, "desc") ? `<p class="desc">${esc(tr(it, "desc"))}</p>` : ""}${priceHTML(it.price)}</button>`;
    }).join("");
  }

  /* ---------- toolbar ---------- */
  function renderToolbar() {
    $("#groups").innerHTML = MENU.groups.map((g) =>
      `<button role="tab" data-g="${g.id}" aria-selected="${!state.q && g.id === state.group}">${esc(t(g.id))}</button>`).join("");

    /* section dropdown: grouped by Food / Drinks / Set Menu */
    const sel = $("#sectionSel");
    sel.innerHTML = `<option value="all">${esc(t("allSections"))}</option>` + MENU.groups.map((g) =>
      `<optgroup label="${esc(t(g.id))}">${BLOCKS_LIST.filter((b) => b.group === g.id).map((b) =>
        `<option value="${b.id}" ${b.id === state.block ? "selected" : ""}>${esc(blockName(b))}</option>`).join("")}</optgroup>`).join("");
    sel.value = state.block;

    $("#sortSel").innerHTML = [["menu", "sortMenu"], ["desc", "sortDesc"], ["asc", "sortAsc"]]
      .map(([v, k]) => `<option value="${v}" ${v === state.sort ? "selected" : ""}>${esc(t(k))}</option>`).join("");

    /* filter options = tags that exist in the current scope */
    const present = new Set();
    BLOCKS_LIST.filter(inScope).forEach((b) => b.secs.forEach(({ s }) => s.items.forEach((i) => visible(i) && i.tags.forEach((x) => present.add(x)))));
    state.tags.forEach((x) => present.add(x));
    const order = ["best", "veg", "spicy", "seafood", "pork", "peanut", "share", "organic", "vegan"].filter((x) => present.has(x));
    $("#filterList").innerHTML = order.map((id) =>
      `<label class="fopt"><input type="checkbox" data-tag="${id}" ${state.tags.has(id) ? "checked" : ""}><span>${TAGS[id].icon} ${esc(tagLabel(id))}</span></label>`).join("");
    $("#filterBtn").textContent = state.tags.size ? `${t("filtersN")} · ${state.tags.size}` : t("all");
    $("#active").innerHTML = state.tags.size ? `<span class="muted">${esc(t("activeFilters"))}:</span> ` +
      [...state.tags].map((id) => `<button class="chip on" data-rm="${id}">${TAGS[id].icon} ${esc(tagLabel(id))} ×</button>`).join("") : "";
    const setOnly = !state.q && (state.group === "setmenu" || state.block === "perfect-night");
    $(".tools").style.display = setOnly ? "none" : "";
    $("#active").style.display = setOnly ? "none" : "";
  }

  /* ---------- menu ---------- */
  function cardHTML(it, si, ii, compact) {
    const name = tr(it, "name"), desc = tr(it, "desc"), sold = it.status === "soldout", has = it.photos && it.photos.length;
    const thumb = compact ? "" : `<div class="thumb ${has ? "" : "ph"}"><img loading="lazy" src="${esc(has ? src(it.photos[0]) : "images/logo.webp")}" alt="${has ? esc(name) : ""}"></div>`;
    return `<button class="card ${compact ? "compact" : ""} ${sold ? "is-sold" : ""}" data-s="${si}" data-i="${ii}">${thumb}
      <div class="info"><div class="row1"><h4 class="name">${esc(name)}</h4>${priceHTML(it.price)}</div>
      ${desc ? `<p class="desc">${esc(desc)}</p>` : ""}
      <div class="tags">${tagIcons(it.tags)}${sold ? `<span class="badge sold">${esc(t("soldOut"))}</span>` : ""}</div></div></button>`;
  }
  function setMenuHTML(s) {
    const it = s.items[0];
    return `<section class="section dark" id="sec-${s.id}"><div class="setmenu">
      <p class="kick-g">A Perfect Night</p><h2>for</h2><p class="big">TWO</p><p class="tagline">${esc(s.note)}</p>
      <div class="courses">${it.courses.map((c) => `<div class="course"><h3>${esc(c.title)}</h3>${c.choice ? `<small>${esc(t("chooseOne"))}</small>` : ""}<ul>${c.options.map((o) => `<li>${esc(o)}</li>`).join("")}</ul></div>`).join("")}</div>
      <p class="setprice">${esc(t("tbd"))}</p></div></section>`;
  }
  function renderMenu() {
    let html = "", count = 0;
    BLOCKS_LIST.filter(inScope).forEach((b) => {
      if (b.secs[0].s.setmenu) {
        if (state.q || state.tags.size) return;
        html += setMenuHTML(b.secs[0].s); count++; return;
      }
      const parts = b.secs.map(({ s, si }) => ({ s, si, items: sorted(s.items.map((it, ii) => [it, ii]).filter(([it]) => matches(it))) })).filter((p) => p.items.length);
      if (!parts.length) return;
      count++;
      const n = parts.reduce((a, p) => a + p.items.length, 0);
      const multi = b.secs.length > 1;
      html += `<section class="section" id="sec-${b.id}">
        <div class="banner ${b.tone === "orange" ? "orange" : ""}"><div class="wrap-b"><h2>${esc(blockName(b))}</h2>
        <small>${b.note ? esc(b.note) + " · " : ""}${n} ${esc(t("items"))}</small></div></div>
        ${parts.map((p) => {
          const compact = p.s.group === "drinks" && !p.items.some(([it]) => it.photos.length);
          return `${multi ? `<h3 class="subhead">${esc(secName(p.s))}</h3>` : ""}<div class="grid">${p.items.map(([it, ii]) => cardHTML(it, p.si, ii, compact)).join("")}</div>`;
        }).join("")}</section>`;
    });
    const back = state.block !== "all" && !state.q ? `<button class="link back" data-back>${esc(t("backFull"))}</button>` : "";
    $("#menuList").innerHTML = back + (count ? html : `<p class="empty">${esc(t("noResults"))}</p>`);
  }
  function render() { renderChrome(); renderToolbar(); renderMenu(); }
  const refresh = () => { renderToolbar(); renderMenu(); };
  const scrollToMenu = (smooth = true) => { const y = $("#menu").getBoundingClientRect().top + window.scrollY - 4; window.scrollTo({ top: y, behavior: smooth ? "smooth" : "auto" }); };
  const scrollToTools = () => { const y = $(".nav").getBoundingClientRect().top + window.scrollY - 2; window.scrollTo({ top: y, behavior: "smooth" }); };

  /* ---------- filter panel ---------- */
  function toggleFilters(open) {
    const p = $("#filterPanel"); open = open === undefined ? p.hidden : open;
    p.hidden = !open; $("#filterBtn").setAttribute("aria-expanded", String(open));
    $("#scrim").hidden = !(open && matchMedia("(max-width:700px)").matches);
  }

  /* ---------- modal + carousel ---------- */
  let cur = 0, lastFocus = null;
  function openItem(si, ii) {
    const it = MENU.sections[si].items[ii], name = tr(it, "name"), desc = tr(it, "desc");
    const photos = it.photos && it.photos.length ? it.photos : [null];
    $("#carousel").innerHTML = `<div class="slides" id="slides">${photos.map((p) => p ?
      `<div class="slide"><img src="${esc(src(p))}" alt="${esc(name)}"></div>` :
      `<div class="slide ph"><div><img src="images/logo.webp" alt=""><div>${esc(t("photo"))}</div></div></div>`).join("")}</div>
      ${photos.length > 1 ? `<button class="car-btn prev" aria-label="Previous">‹</button><button class="car-btn next" aria-label="Next">›</button><div class="dots">${photos.map((_, i) => `<i class="${i ? "" : "on"}"></i>`).join("")}</div>` : ""}`;
    $("#mBody").innerHTML = `<h3 id="mTitle">${esc(name)}</h3>${priceHTML(it.price)}${desc ? `<p>${esc(desc)}</p>` : ""}
      ${it.tags.length ? `<div class="legend">${it.tags.map((id) => `<span class="badge">${TAGS[id].icon} ${esc(tagLabel(id))}</span>`).join("")}</div>` : ""}
      ${it.pairing ? `<p class="pair"><b>${esc(t("pairing"))}:</b> ${esc(it.pairing)}</p>` : ""}`;
    cur = 0;
    const m = $("#modal"); lastFocus = document.activeElement; m.hidden = false; document.body.style.overflow = "hidden"; $("#mClose").focus();
    const slides = $("#slides"), dots = [...document.querySelectorAll(".dots i")];
    slides.addEventListener("scroll", () => { cur = Math.round(slides.scrollLeft / slides.clientWidth); dots.forEach((d, i) => d.classList.toggle("on", i === cur)); }, { passive: true });
    const go = (d) => slides.scrollTo({ left: Math.max(0, Math.min(photos.length - 1, cur + d)) * slides.clientWidth, behavior: "smooth" });
    const p = $(".car-btn.prev"), n = $(".car-btn.next"); if (p) { p.onclick = () => go(-1); n.onclick = () => go(1); }
    m._go = go;
  }
  function closeItem() { const m = $("#modal"); m.hidden = true; document.body.style.overflow = ""; if (lastFocus) lastFocus.focus(); }

  /* ---------- events ---------- */
  document.addEventListener("click", (e) => {
    const card = e.target.closest(".card, .bcard"); if (card) return openItem(+card.dataset.s, +card.dataset.i);
    const nav = e.target.closest("[data-nav-menu]");
    if (nav) { e.preventDefault(); state.block = "all"; state.q = ""; $("#q").value = ""; state.tags.clear(); refresh(); scrollToMenu(); return; }
    const g = e.target.closest("[data-g]");
    if (g) { state.group = g.dataset.g; state.block = "all"; state.q = ""; $("#q").value = ""; state.tags.clear(); refresh(); scrollToTools(); return; }
    const rm = e.target.closest("[data-rm]"); if (rm) { state.tags.delete(rm.dataset.rm); refresh(); return; }
    if (e.target.closest("[data-back]")) { state.block = "all"; refresh(); scrollToTools(); return; }
    if (e.target.closest("#filterBtn")) return toggleFilters();
    if (e.target.closest("#fDone, #fClose") || e.target === $("#scrim")) return toggleFilters(false);
    if (e.target.closest("#fClear")) { state.tags.clear(); refresh(); toggleFilters(true); return; }
    if (!e.target.closest(".filter-wrap")) toggleFilters(false);
    if (e.target === $("#modal") || e.target.closest("#mClose")) closeItem();
  });
  document.addEventListener("change", (e) => {
    const cb = e.target.closest("[data-tag]");
    if (cb) { cb.checked ? state.tags.add(cb.dataset.tag) : state.tags.delete(cb.dataset.tag); renderMenu(); renderToolbar(); toggleFilters(true); return; }
  });
  $("#sectionSel").addEventListener("change", (e) => {
    state.block = e.target.value; state.q = ""; $("#q").value = "";
    if (state.block !== "all") state.group = BLOCKS_LIST.find((b) => b.id === state.block).group;
    state.tags.clear(); refresh(); scrollToTools();
  });
  $("#sortSel").addEventListener("change", (e) => { state.sort = e.target.value; renderMenu(); });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") toggleFilters(false);
    const m = $("#modal"); if (m.hidden) return;
    if (e.key === "Escape") closeItem();
    if (e.key === "ArrowRight" && m._go) m._go(1);
    if (e.key === "ArrowLeft" && m._go) m._go(-1);
  });
  $("#lang").addEventListener("change", (e) => { state.lang = e.target.value; store.set("encima-lang", state.lang); render(); });
  let timer;
  $("#q").addEventListener("input", (e) => { clearTimeout(timer); timer = setTimeout(() => { state.q = e.target.value.trim(); refresh(); }, 150); });

  state.lang = detectLang();
  render();
})();
