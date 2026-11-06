async function loadEncimaData() {
  const url = ENCIMA_CONFIG && ENCIMA_CONFIG.supabaseUrl;
  const key = ENCIMA_CONFIG && ENCIMA_CONFIG.supabaseAnonKey;
  if (!url || !key || typeof supabase === "undefined") return;
  try {
    const sb = supabase.createClient(url, key);
    const [{ data: secs, error: e1 }, { data: items, error: e2 }, { data: settings, error: e3 }] =
      await Promise.all([
        sb.from("sections").select("*").order("sort_order"),
        sb.from("items").select("*").order("sort_order"),
        sb.from("site_settings").select("*").eq("id", "main").maybeSingle()
      ]);
    if (e1 || e2 || !secs || !secs.length) {
      console.warn("Encima: database menu not used, showing built-in menu.", { sectionsError: e1 && e1.message, itemsError: e2 && e2.message, sections: secs && secs.length });
      return;
    }
    const bySec = {};
    (items || []).forEach((it) => {
      if (!bySec[it.section_id]) bySec[it.section_id] = [];
      bySec[it.section_id].push(it);
    });
    MENU.sections = secs.map((s) => {
      BLOCKS[s.id] = s.block_id || s.id;
      return {
        id: s.id,
        group: s.group_id,
        tone: s.tone,
        name: s.name,
        note: s.note || undefined,
        setmenu: s.is_setmenu,
        items: (bySec[s.id] || []).map(remoteItem)
      };
    });
    if (settings && settings.payload) Object.assign(SITE, settings.payload);
    console.info("Encima: menu loaded from database:", secs.length, "sections,", (items || []).length, "items,",
      secs.filter((s) => s.group_id === "roomservice").length, "room service sections,",
      (items || []).filter((i) => (i.tags || []).includes("roomservice")).length, "items tagged Room Service");
  } catch (err) {
    console.warn("Encima: using local menu data", err);
  }
}

function remoteItem(it) {
  const extra = it.extra || {};
  return {
    id: it.id,
    name: it.name,
    desc: it.description || "",
    price: it.price,
    tags: it.tags || [],
    photos: it.photos || [],
    pairing: it.pairing || undefined,
    courses: extra.courses,
    review: it.review_status,
    status: it.visibility
  };
}

function photoUrl(p) {
  if (!p) return "images/logo.webp";
  if (/^https?:\/\//i.test(p) || p.startsWith("data:") || p.includes("/")) return p;
  return "images/" + p + ".webp";
}
