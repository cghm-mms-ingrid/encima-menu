/* Encima desk: data layer (Supabase). Every write confirms a row was affected,
   so a change blocked by permissions can never look like a success. */
(function () {
  "use strict";
  const D = (window.Desk = window.Desk || {});
  const cfg = window.ENCIMA_CONFIG || {};
  D.configured = !!(cfg.supabaseUrl && cfg.supabaseAnonKey);
  if (!D.configured) return;

  const sb = (D.sb = supabase.createClient(cfg.supabaseUrl, cfg.supabaseAnonKey));
  const S = (D.state = {
    profile: null, sections: [], items: [],
    settings: { payload: {}, review_status: "not_reviewed" },
    migrated: true
  });

  D.editor = () => !!S.profile && S.profile.role === "editor";
  D.activeSections = () => S.sections.filter((s) => !s.archived);
  D.itemsOf = (sectionId) => S.items.filter((i) => i.section_id === sectionId);

  const must = (res, fallback) => {
    if (res.error) throw res.error;
    if (!res.data || (Array.isArray(res.data) && !res.data.length)) throw new Error(fallback);
    return res.data;
  };

  D.api = {
    async loadAll() {
      const [a, b, c] = await Promise.all([
        sb.from("sections").select("*").order("sort_order"),
        sb.from("items").select("*").order("sort_order"),
        sb.from("site_settings").select("*").eq("id", "main").maybeSingle()
      ]);
      if (a.error) throw a.error;
      if (b.error) throw b.error;
      if (c.error) throw c.error;
      S.sections = a.data || [];
      S.items = b.data || [];
      if (c.data) S.settings = c.data;
      S.migrated = !S.sections.length || "archived" in S.sections[0];
    },

    /* ----- items ----- */
    nextSort(sectionId) {
      return Math.max(-1, ...D.itemsOf(sectionId).map((i) => i.sort_order || 0)) + 1;
    },
    async createItem(fields) {
      const row = { review_status: "not_reviewed", ...fields };
      const res = await sb.from("items").insert(row).select().single();
      if (res.error) throw res.error;
      return res.data;
    },
    async updateItem(id, patch) {
      const res = await sb.from("items").update(patch).eq("id", id).select();
      return must(res, "The change wasn’t saved. You may not have permission, or the item was removed.")[0];
    },
    async deleteItem(item) {
      const res = await sb.from("items").delete().eq("id", item.id).select("id");
      must(res, "Couldn’t delete this item. You may not have permission, or it was already removed.");
      await sb.from("review_comments").delete().eq("target_type", "item").eq("target_id", item.id); // best effort
      await D.api.removePhotos(item.photos || []);
    },
    async setVisibility(id, visibility) {
      return D.api.updateItem(id, { visibility });
    },
    async reorderItems(updates) { // [{id, sort_order}]
      await Promise.all(updates.map((u) => D.api.updateItem(u.id, { sort_order: u.sort_order })));
    },

    /* ----- photos ----- */
    async uploadPhoto(file, itemId) {
      const path = `${itemId}/${Date.now()}-${file.name.replace(/[^\w.\-]+/g, "_")}`;
      const { error } = await sb.storage.from("menu-photos").upload(path, file, { upsert: true, contentType: file.type });
      if (error) throw error;
      return sb.storage.from("menu-photos").getPublicUrl(path).data.publicUrl;
    },
    /* Deletes only files that live in our bucket; local image names are left alone. Never throws. */
    async removePhotos(urls) {
      const paths = (urls || []).map(D.storagePath).filter(Boolean);
      if (!paths.length) return;
      try {
        const { error } = await sb.storage.from("menu-photos").remove(paths);
        if (error) console.warn("Photo cleanup:", error.message);
      } catch (e) { console.warn("Photo cleanup:", e); }
    },

    /* ----- sections ----- */
    async createSection(f) {
      const ids = new Set(S.sections.map((s) => s.id));
      let id = D.slug(f.name), n = 2;
      while (ids.has(id)) id = D.slug(f.name) + "-" + n++;
      const sort_order = Math.max(-1, ...S.sections.map((s) => s.sort_order || 0)) + 1;
      const res = await sb.from("sections").insert({
        id, group_id: f.group_id, name: f.name, tone: f.tone, note: f.note || null,
        is_setmenu: false, sort_order, block_id: id, archived: false
      }).select().single();
      if (res.error) throw res.error;
      return res.data;
    },
    async updateSection(id, patch) {
      const res = await sb.from("sections").update(patch).eq("id", id).select();
      return must(res, "The section wasn’t saved. You may not have permission.")[0];
    },
    async moveSection(id, dir) {
      const me = S.sections.find((s) => s.id === id);
      const list = D.activeSections().filter((s) => s.group_id === me.group_id)
        .sort((a, b) => a.sort_order - b.sort_order);
      const i = list.findIndex((s) => s.id === id), j = i + dir;
      if (j < 0 || j >= list.length) return;
      const orders = list.map((s) => s.sort_order);
      const dup = new Set(orders).size !== orders.length;
      const next = list.slice();
      [next[i], next[j]] = [next[j], next[i]];
      const base = dup ? list.map((_, k) => k) : orders;
      await Promise.all(next.map((s, k) => s.sort_order !== base[k] ? D.api.updateSection(s.id, { sort_order: base[k] }) : null));
    },

    /* ----- review ----- */
    async comments(type, id) {
      const q = await sb.from("review_comments")
        .select("id, body, created_at, author_id, profiles!author_id(email)")
        .eq("target_type", type).eq("target_id", id).order("created_at");
      if (!q.error) return q.data || [];
      const { data } = await sb.from("review_comments")
        .select("id, body, created_at, author_id").eq("target_type", type).eq("target_id", id).order("created_at");
      return data || [];
    },
    async setStatus(type, id, status, body) {
      body = (body || "").trim();
      if (status === "for_revision" && !body) throw new Error("Add a comment explaining what should change.");
      const text = body || (status === "approved" ? "Approved" : "");
      if (text) {
        const { error } = await sb.from("review_comments").insert({
          target_type: type, target_id: id, body: text, author_id: S.profile.id
        });
        if (error) throw error;
      }
      const res = type === "item"
        ? await sb.from("items").update({ review_status: status }).eq("id", id).select()
        : await sb.from("site_settings").update({ review_status: status }).eq("id", "main").select();
      must(res, "The status wasn’t saved. You may not have permission.");
    },

    /* ----- site pages ----- */
    async saveSettings(payload) {
      const res = await sb.from("site_settings").update({ payload }).eq("id", "main").select();
      must(res, "The page content wasn’t saved. You may not have permission.");
    }
  };
})();
