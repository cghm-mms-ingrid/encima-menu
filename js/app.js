(async function () {
  "use strict";
  if (typeof loadEncimaData === "function") await loadEncimaData();
  const $ = (s, r = document) => r.querySelector(s);
  const GT = { fil: "tl", "zh-Hans": "zh-CN", "zh-Hant": "zh-TW" };

  function setGoogtrans(value) {
    const host = location.hostname;
    const parts = host.split(".");
    const domains = ["", host, "." + host];
    if (parts.length > 2) domains.push("." + parts.slice(-2).join("."));
    domains.forEach((d) => {
      const dom = d ? `; domain=${d}` : "";
      document.cookie = value
        ? `googtrans=${value}; path=/${dom}`
        : `googtrans=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/${dom}`;
    });
  }

  function gTranslate(code) {
    const wasTranslated = /googtrans=/.test(document.cookie) ||
      document.documentElement.classList.contains("translated-ltr") ||
      document.documentElement.classList.contains("translated-rtl");

    if (code === "en") {
      if (wasTranslated) {            // go back to the original page
        setGoogtrans("");
        location.reload();
      }
      return;
    }

    const target = GT[code] || code;
    setGoogtrans(`/en/${target}`);    // remembered across reloads
    const combo = document.querySelector(".goog-te-combo");
    if (combo) {
      combo.value = target;
      combo.dispatchEvent(new Event("change"));
    } else {
      location.reload();              // widget not ready yet; cookie will apply on reload
    }
  }
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

  const keep = (s) => `<span class="notranslate" translate="no">${esc(s)}</span>`;

  function priceHTML(p) {
    if (p == null) return `<span class="price"><small>${esc(t("tbd"))}</small></span>`;
    if (typeof p === "number") return `<span class="price">${peso(p)}</span>`;
    const parts = [];
    if (p.glass    != null) parts.push(`${keep("Glass")} ${peso(p.glass)}`);
    if (p.glass200 != null) parts.push(`${keep("Glass 200ml")} ${peso(p.glass200)}`);
    if (p.shot     != null) parts.push(`${keep("Shot")} ${peso(p.shot)}`);
    if (p.bottle   != null) parts.push(`${keep("Bottle")} ${peso(p.bottle)}${p.bottleNote ? ` (${esc(p.bottleNote)})` : ""}`);
    return `<span class="price">${parts.map((x) => `<small>${x}</small>`).join("")}</span>`;
  }
  const tagIcons = (tags) => tags.map((id) => `<span class="tag" title="${esc(tagLabel(id))}" aria-label="${esc(tagLabel(id))}">${TAGS[id].icon}</span>`).join("");

 /* ---------- filtering: an item must have AT LEAST ONE ticked tag ---------- */
const tagScore = (it) => {
  let n = 0;
  for (const tg of state.tags) if (it.tags.includes(tg)) n++;
  return n;
};

function matches(it) {
  if (!visible(it)) return false;
  if (state.tags.size && tagScore(it) === 0) return false;

  if (state.q) {
    const hay = (tr(it, "name") + " " + it.name + " " + tr(it, "desc")).toLowerCase();
    if (!hay.includes(state.q.toLowerCase())) return false;
  }
  return true;
}

/* ---------- sorting: most ticked tags first, then the chosen sort ---------- */
function sorted(entries) {
  const byTags = state.tags.size > 0;
  if (state.sort === "menu" && !byTags) return entries;

  const dir = state.sort === "desc" ? -1 : 1;
  return entries.slice().sort((a, b) => {
    /* 1. more ticked tags matched = higher up */
    if (byTags) {
      const diff = tagScore(b[0]) - tagScore(a[0]);
      if (diff) return diff;
    }
    /* 2. tie-break by the selected sort */
    if (state.sort === "menu") return a[1] - b[1];
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
    document.documentElement.lang = "en";

    // Translate every labelled piece of static text, then let the staff desk override the editable copy.
    document.querySelectorAll("[data-i18n]").forEach((el) => (el.textContent = t(el.dataset.i18n)));
    $("#q").placeholder = t("search");
    $("#searchToggle").setAttribute("aria-label", t("searchBtn"));
    $("#optionsBtn").setAttribute("aria-label", t("optTitle"));
    $("#toolsClose").setAttribute("aria-label", t("close"));

    const setText = (selector, value) => {
      const el = $(selector);
      if (el && value) el.textContent = value;
    };

    // Text edited in the staff desk (Pages tab)
    setText("#heroKick", SITE.heroKick);
    setText("#heroLead", SITE.heroLead);
    setText("#storyTitle", SITE.storyTitle);
    setText("#storyP1", SITE.storyP1);
    setText("#storyP2", SITE.storyP2);
    setText("#storyP3", SITE.storyP3);

    // Opening hours appear in both the hero and footer.
    setText("#hours", SITE.hours);
    setText("#footerHours", SITE.hours);
    setText("#address", SITE.address);

    const ph = $("#phone");
    if (ph) {
      ph.textContent = SITE.phone || "";
      ph.href = SITE.phone
        ? "tel:" + SITE.phone.replace(/[^\d+]/g, "")
        : "javascript:void(0)";
    }

    const em = $("#email");
    if (em) {
      em.textContent = SITE.email || "";
      em.href = SITE.email ? "mailto:" + SITE.email : "javascript:void(0)";
    }

    const social = SITE.social || {};
    [["#fb", social.facebook], ["#ig", social.instagram], ["#tt", social.tiktok]].forEach(([selector, url]) => {
      const el = $(selector);
      if (!el) return;
      if (url) {
        el.href = url;
        el.target = "_blank";
        el.rel = "noopener noreferrer";
      } else {
        el.removeAttribute("href");
      }
    });

    // Reservation buttons
    ["#reserve", "#reserveTop", "#reserveLocation"].forEach((selector) => {
      const el = $(selector);
      if (el && SITE.opentable) {
        el.href = SITE.opentable;
        el.target = "_blank";
        el.rel = "noopener noreferrer";
      }
    });

    $("#lang").innerHTML = LANGS.map((l) =>
      `<option value="${l.code}" ${l.code === state.lang ? "selected" : ""}>${l.label}</option>`
    ).join("");

    renderStoryPhotos();
    renderBest();
  }

  /* Our story photos: three slots (1 large, 2 small). Staff upload them in the desk (Pages tab).
     An empty slot keeps the default image from index.html. */
  function renderStoryPhotos() {
    const box = $("#storyPhotos");
    if (!box) return;
    const custom = Array.isArray(SITE.storyPhotos) ? SITE.storyPhotos : [];
    box.querySelectorAll("figure").forEach((fig, i) => {
      const img = fig.querySelector("img");
      const cap = fig.querySelector("figcaption");
      const chosen = custom[i] && custom[i].url ? custom[i] : null;
      fig.classList.toggle("has-photo", !!chosen);
      img.src = chosen ? src(chosen.url) : fig.dataset.defaultSrc;
      img.alt = chosen ? (chosen.alt || "") : (fig.dataset.defaultAlt || "");
      if (cap) cap.hidden = !!chosen;
    });
  }

  /* Best sellers: the dishes picked in the desk (Pages tab), in that order.
     If nothing is picked, fall back to items tagged "Best Seller" (photos first). */
  const BEST_MAX = 4;
  function renderBest() {
    const byId = new Map();
    MENU.sections.forEach((s, si) => s.items.forEach((it, ii) => { if (it.id != null) byId.set(String(it.id), [it, si, ii]); }));

    const pickedIds = Array.isArray(SITE.bestIds) ? SITE.bestIds : [];
    let all = pickedIds.map((id) => byId.get(String(id))).filter((e) => e && visible(e[0]));

    if (!all.length) {
      MENU.sections.forEach((s, si) => s.items.forEach((it, ii) => { if (visible(it) && it.tags.includes("best")) all.push([it, si, ii]); }));
      all.sort((a, b) => (b[0].photos.length ? 1 : 0) - (a[0].photos.length ? 1 : 0));
    }

    $("#bestGrid").innerHTML = all.slice(0, BEST_MAX).map(([it, si, ii]) => {
      const has = it.photos.length;
      return `<button class="bcard" data-s="${si}" data-i="${ii}">
        <div class="bimg ${has ? "" : "ph"}"><img loading="lazy" src="${esc(has ? src(it.photos[0]) : "images/logo.webp")}" alt="${has ? esc(tr(it, "name")) : ""}"></div>
        <h3 class="name notranslate" translate="no">${esc(it.name)}</h3>${tr(it, "desc") ? `<p class="desc">${esc(tr(it, "desc"))}</p>` : ""}${priceHTML(it.price)}</button>`;
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
    $("#optionsBtn").style.display = setOnly ? "none" : "";

    /* badge on the phone sort/filter button: how many options are changed from the default */
    const nOpts = state.tags.size + (state.sort !== "menu" ? 1 : 0) + (state.block !== "all" ? 1 : 0);
    const badge = $("#optBadge");
    badge.hidden = !nOpts;
    badge.textContent = nOpts;
  }

  /* ---------- menu ---------- */
  function cardHTML(it, si, ii, compact) {
    const name = tr(it, "name"), desc = tr(it, "desc"), sold = it.status === "soldout", has = it.photos && it.photos.length;
    const thumb = compact ? "" : `<div class="thumb ${has ? "" : "ph"}"><img loading="lazy" src="${esc(has ? src(it.photos[0]) : "images/logo.webp")}" alt="${has ? esc(name) : ""}"></div>`;
    return `<button class="card ${compact ? "compact" : ""} ${sold ? "is-sold" : ""}" data-s="${si}" data-i="${ii}">${thumb}
      <div class="info"><div class="row1"><h4 class="name notranslate" translate="no">${esc(it.name)}</h4>${priceHTML(it.price)}</div>
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
function renderFlat() {
  const entries = [];
  let seq = 0;
  BLOCKS_LIST.filter(inScope).forEach((b) => {
    b.secs.forEach(({ s, si }) => {
      if (s.setmenu) return;
      s.items.forEach((it, ii) => {
        seq++;
        if (matches(it)) entries.push([it, seq, si, ii]);   // seq = global menu order
      });
    });
  });

  const list = sorted(entries);
  const back = state.block !== "all" && !state.q ? `<button class="link back" data-back>${esc(t("backFull"))}</button>` : "";

  $("#menuList").innerHTML = back + (list.length
    ? `<section class="section"><div class="grid">${list.map(([it, , si, ii]) => {
        const compact = MENU.sections[si].group === "drinks" && !(it.photos && it.photos.length);
        return cardHTML(it, si, ii, compact);
      }).join("")}</div></section>`
    : `<p class="empty">${esc(t("noResults"))}</p>`);
}

  function renderMenu() {
    if (state.tags.size || state.q) return renderFlat();   // flat results, no section banners
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

  /* ---------- filter panel (desktop dropdown) ---------- */
  const mobileMQ = matchMedia("(max-width:700px)");
  const isMobile = () => mobileMQ.matches;
  function toggleFilters(open) {
    if (isMobile()) return;                       /* on phones the filters live inside the sheet below */
    const p = $("#filterPanel"); open = open === undefined ? p.hidden : open;
    p.hidden = !open; $("#filterBtn").setAttribute("aria-expanded", String(open));
  }

  /* ---------- phone toolbar: search toggle + sort/filter sheet ---------- */
  function toggleSearch(open) {
    const nav = $(".nav");
    open = open === undefined ? !nav.classList.contains("search-open") : open;
    nav.classList.toggle("search-open", open);
    $("#searchToggle").setAttribute("aria-expanded", String(open));
    if (open) $("#q").focus();
    else if (state.q) { state.q = ""; $("#q").value = ""; refresh(); }
  }
  function toggleTools(open) {
    const tools = $("#tools");
    open = open === undefined ? !tools.classList.contains("open") : open;
    tools.classList.toggle("open", open);
    $("#optionsBtn").setAttribute("aria-expanded", String(open));
    $("#scrim").hidden = !open;
    document.body.style.overflow = open ? "hidden" : "";
    if (open) $("#toolsClose").focus();
  }
  const scrollToResults = () => {
    const y = $("#menuList").getBoundingClientRect().top + window.scrollY - $(".nav").offsetHeight - 8;
    if (window.scrollY > y) window.scrollTo({ top: y, behavior: "smooth" });
  };
  mobileMQ.addEventListener("change", () => { toggleTools(false); });

  /* ---------- modal + carousel ---------- */
  let cur = 0, lastFocus = null;
  function openItem(si, ii) {
    const it = MENU.sections[si].items[ii], name = tr(it, "name"), desc = tr(it, "desc");
    const photos = it.photos && it.photos.length ? it.photos : [null];
    $("#carousel").innerHTML = `<div class="slides" id="slides">${photos.map((p) => p ?
      `<div class="slide"><img src="${esc(src(p))}" alt="${esc(name)}"></div>` :
      `<div class="slide ph"><div><img src="images/logo.webp" alt=""><div>${esc(t("photo"))}</div></div></div>`).join("")}</div>
      ${photos.length > 1 ? `<button class="car-btn prev" aria-label="Previous">‹</button><button class="car-btn next" aria-label="Next">›</button><div class="dots">${photos.map((_, i) => `<i class="${i ? "" : "on"}"></i>`).join("")}</div>` : ""}`;
    $("#mBody").innerHTML = `<h3 id="mTitle" class="notranslate" translate="no">${esc(it.name)}</h3>${priceHTML(it.price)}${desc ? `<p>${esc(desc)}</p>` : ""}
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
    if (e.target.closest("#searchToggle")) return toggleSearch();
    if (e.target.closest("#optionsBtn")) return toggleTools();
    if (e.target.closest("#toolsClose") || e.target === $("#scrim")) { toggleTools(false); $("#optionsBtn").focus(); return; }
    if (e.target.closest("#toolsDone")) { toggleTools(false); scrollToResults(); return; }
    if (e.target.closest("#toolsClear")) { state.tags.clear(); state.sort = "menu"; state.block = "all"; refresh(); return; }
    if (e.target.closest("#filterBtn")) return toggleFilters();
    if (e.target.closest("#fDone, #fClose")) return toggleFilters(false);
    if (e.target.closest("#fClear")) { state.tags.clear(); refresh(); toggleFilters(true); return; }
    if (!e.target.closest(".filter-wrap")) toggleFilters(false);
    if (e.target === $("#modal") || e.target.closest("#mClose")) closeItem();
  });
  document.addEventListener("change", (e) => {
    const cb = e.target.closest("[data-tag]");
    if (cb) {
      const id = cb.dataset.tag;
      cb.checked ? state.tags.add(id) : state.tags.delete(id);
      renderMenu(); renderToolbar(); toggleFilters(true);
      const again = document.querySelector(`[data-tag="${id}"]`); if (again) again.focus();
      return;
    }
  });
  $("#sectionSel").addEventListener("change", (e) => {
    state.block = e.target.value; state.q = ""; $("#q").value = "";
    if (state.block !== "all") state.group = BLOCKS_LIST.find((b) => b.id === state.block).group;
    state.tags.clear(); refresh(); if (!isMobile()) scrollToTools();
  });
  $("#sortSel").addEventListener("change", (e) => { state.sort = e.target.value; renderMenu(); });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") { toggleFilters(false); if ($("#tools").classList.contains("open")) { toggleTools(false); $("#optionsBtn").focus(); } }
    const m = $("#modal"); if (m.hidden) return;
    if (e.key === "Escape") closeItem();
    if (e.key === "ArrowRight" && m._go) m._go(1);
    if (e.key === "ArrowLeft" && m._go) m._go(-1);
  });
  $("#lang").addEventListener("change", (e) => { state.lang = e.target.value; store.set("encima-lang", state.lang); render(); gTranslate(state.lang); });
  let timer;
  $("#q").addEventListener("input", (e) => { clearTimeout(timer); timer = setTimeout(() => { state.q = e.target.value.trim(); refresh(); }, 150); });

  state.lang = detectLang();
  render();
})();
