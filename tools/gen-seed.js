"use strict";
const fs = require("fs");
const path = require("path");
const vm = require("vm");
const crypto = require("crypto");

const root = path.join(__dirname, "..");
const code = fs.readFileSync(path.join(root, "js", "data.js"), "utf8");
const ctx = {};
vm.createContext(ctx);
vm.runInContext(code + "\nglobalThis.MENU = MENU; globalThis.SITE = SITE; globalThis.BLOCKS = BLOCKS;", ctx);
const { MENU, SITE, BLOCKS } = ctx;

function lit(s) {
  if (s == null) return "null";
  return "'" + String(s).replace(/'/g, "''") + "'";
}
function j(v) {
  if (v == null) return "null";
  return lit(JSON.stringify(v)) + "::jsonb";
}
function tags(arr) {
  if (!arr || !arr.length) return "'{}'::text[]";
  return "ARRAY[" + arr.map(lit).join(",") + "]::text[]";
}
function photos(arr) {
  if (!arr || !arr.length) return "'{}'::text[]";
  return "ARRAY[" + arr.map(lit).join(",") + "]::text[]";
}
function itemId(sectionId, index) {
  const hex = crypto.createHash("sha256").update(sectionId + ":" + index).digest("hex").slice(0, 32);
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-4${hex.slice(13, 16)}-a${hex.slice(17, 20)}-${hex.slice(20, 32)}`;
}

const lines = [];
lines.push("-- Generated from js/data.js — run after schema.sql");
lines.push("truncate public.review_comments, public.items, public.sections, public.site_settings restart identity cascade;");
lines.push("");

MENU.sections.forEach((s, si) => {
  const block = BLOCKS[s.id] || s.id;
  lines.push(
    `insert into public.sections (id, group_id, name, tone, note, is_setmenu, sort_order, block_id) values (` +
    `${lit(s.id)}, ${lit(s.group)}, ${lit(s.name)}, ${lit(s.tone || "slate")}, ${lit(s.note || null)}, ` +
    `${s.setmenu ? "true" : "false"}, ${si}, ${lit(block)});`
  );
});

lines.push("");
MENU.sections.forEach((s) => {
  s.items.forEach((it, ii) => {
    const extra = {};
    if (it.courses) extra.courses = it.courses;
    const id = itemId(s.id, ii);
    lines.push(
      `insert into public.items (id, section_id, name, description, price, tags, photos, pairing, extra, visibility, review_status, sort_order) values (` +
      `${lit(id)}::uuid, ${lit(s.id)}, ${lit(it.name)}, ${lit(it.desc || "")}, ${j(it.price)}, ` +
      `${tags(it.tags)}, ${photos(it.photos)}, ${lit(it.pairing || null)}, ${j(extra)}, ` +
      `${lit(it.status || "published")}, 'approved', ${ii});`
    );
  });
});

const payload = {
  hours: SITE.hours,
  phone: SITE.phone,
  email: SITE.email,
  address: SITE.address,
  opentable: SITE.opentable,
  social: SITE.social,
  heroKick: "Rooftop dining · 23rd floor",
  heroLead: "Mexican- and Spanish-inspired plates, wine, cocktails and coffee, high above Makati.",
  storyTitle: "Above the city, around the table",
  storyP1: "Encima means \"above\" in Spanish, and that is where you will find us: on the 23rd floor of City Garden Hotel Makati, with the skyline at your table.",
  storyP2: "Our kitchen cooks Mexican- and Spanish-inspired plates alongside pasta, pizza and steaks, made for sharing. Pair them with wine, a signature cocktail or a good cup of coffee.",
  storyP3: "Open every day from morning until midnight."
};

lines.push("");
lines.push(
  `insert into public.site_settings (id, payload, review_status) values ('main', ${j(payload)}, 'approved');`
);
lines.push("");

fs.writeFileSync(path.join(root, "supabase", "seed.sql"), lines.join("\n") + "\n");
console.log("Wrote supabase/seed.sql (" + lines.length + " statements)");
