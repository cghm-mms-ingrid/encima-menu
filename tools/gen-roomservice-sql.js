"use strict";
/* Builds supabase/room-service.sql from js/data.js.
   Adds ROWS only (no table/column changes): the Room Service sections + items, and the "roomservice" tag
   on Encima dishes that are also on the room service menu. Safe to run more than once. */
const fs = require("fs");
const path = require("path");
const vm = require("vm");
const crypto = require("crypto");

const root = path.join(__dirname, "..");
const ctx = {};
vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(root, "js", "data.js"), "utf8") + "\nglobalThis.MENU = MENU; globalThis.RS_SHARED = RS_SHARED;", ctx);
const { MENU, RS_SHARED } = ctx;

const lit = (s) => (s == null ? "null" : "'" + String(s).replace(/'/g, "''") + "'");
const arr = (a) => (!a || !a.length ? "'{}'::text[]" : "ARRAY[" + a.map(lit).join(",") + "]::text[]");
const j = (v) => (v == null ? "null" : lit(JSON.stringify(v)) + "::jsonb");
function itemId(sectionId, index) {
  const hex = crypto.createHash("sha256").update(sectionId + ":" + index).digest("hex").slice(0, 32);
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-4${hex.slice(13, 16)}-a${hex.slice(17, 20)}-${hex.slice(20, 32)}`;
}

const out = [];
out.push("-- Room Service menu. Run once in the Supabase SQL editor AFTER schema.sql + seed.sql.");
out.push("-- Adds rows only (no structure changes). Safe to re-run: existing rows are left untouched.");
out.push("");
out.push("-- 1) Room Service sections and items that exist only on the room service menu");
MENU.sections.forEach((s, si) => {
  if (s.group !== "roomservice") return;
  out.push(`insert into public.sections (id, group_id, name, tone, note, is_setmenu, sort_order, block_id) values (${lit(s.id)}, 'roomservice', ${lit(s.name)}, ${lit(s.tone || "slate")}, ${lit(s.note || null)}, false, ${si}, ${lit(s.id)}) on conflict (id) do nothing;`);
});
out.push("");
MENU.sections.forEach((s) => {
  if (s.group !== "roomservice") return;
  s.items.forEach((it, ii) => {
    out.push(`insert into public.items (id, section_id, name, description, price, tags, photos, pairing, extra, visibility, review_status, sort_order) values (${lit(itemId(s.id, ii))}::uuid, ${lit(s.id)}, ${lit(it.name)}, ${lit(it.desc || "")}, ${j(it.price)}, ${arr(it.tags)}, ${arr(it.photos)}, null, '{}'::jsonb, 'published', 'approved', ${ii}) on conflict (id) do nothing;`);
  });
});
out.push("");
out.push("-- 2) Tag Encima dishes that are also on the room service menu (they then show in both tabs)");
Object.entries(RS_SHARED).forEach(([sec, names]) => {
  out.push(`update public.items set tags = array_append(tags, 'roomservice') where section_id = ${lit(sec)} and name in (${names.map(lit).join(", ")}) and not ('roomservice' = any(tags));`);
});
out.push("");
fs.writeFileSync(path.join(root, "supabase", "room-service.sql"), out.join("\n"));
console.log("wrote supabase/room-service.sql", out.length, "lines");
