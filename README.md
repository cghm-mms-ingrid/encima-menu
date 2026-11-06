# Encima Roofdeck digital menu

Public site: view-only menu. Staff desk: same website, unlisted URL, login required.

## Public site

Plain HTML/CSS/JS. Deploy the folder on Netlify (drag-and-drop or a connected repo). No build step.

Until Supabase is connected, the menu is served from `js/data.js`. After you paste keys into `js/config.js` and run the SQL, the live menu and Our Story text come from the database.

## Staff desk (bookmark this)

Path: **`/cgh-rd-k7m2/`**  
Example: `https://YOUR-SITE.netlify.app/cgh-rd-k7m2/`

It is not linked from the public menu. Search engines are told to skip it. Login is still required.

| Email | Role | Access |
|---|---|---|
| graphicartist@citygardenhotels.com | Editor | Publish immediately (items, prices, hide, photos, hours, Our Story) |
| fnbcoordinator@citygardenhotelmakati.com | Editor | Same |
| fnbmanager@citygardenhotelmakati.com | Approver | View, comments, Approved / For revision |
| Executive chef | Approver | Add their email later (see below) |

Sold out is instant and does not reset review status. Removed or edited items stay on the live site until an editor hides them; **For revision** is a flag plus comments only.

## Connect Supabase (once)

1. Open **Project Settings → API**. Copy **Project URL** and **anon public** key into `js/config.js`.
2. SQL editor: run `supabase/schema.sql`, then `supabase/seed.sql`.
3. **Authentication → Users → Invite** the three work emails. They set a password from the invite.
4. **Authentication → URL configuration**: add your Netlify URL and `https://YOUR-SITE.netlify.app/cgh-rd-k7m2/` as a redirect.
5. Redeploy / refresh so `js/config.js` is on Netlify.

If someone was invited before the SQL ran, run `schema.sql` again (the backfill at the bottom attaches profiles).

### Executive chef later

```sql
insert into public.staff_allowlist (email, role, note)
values ('THEIR-EMAIL', 'approver', 'Executive chef');
```

Then invite that email in Authentication → Users.

## Room Service tab

The **Room Service** tab sits next to Food / Drinks / Set Menu. Its label and the tag are always shown in English.

- **Room-service-only dishes** live in Room Service sections (e.g. All Day Breakfast, Filipino Breakfast). In the desk, **Add section → Menu: Room Service**, then add items as usual. Add, edit, hide, sold out, delete all work the same as the rest of the menu.
- **Dishes on both menus** are single records tagged **Room Service** (tick the tag on the item in the desk). They show in their normal tab and in the Room Service tab. Untick to remove them from the tab.
- Inside the tab, sections are merged by name so it reads like the room service menu (layout list: `RS_BLOCKS` in `js/data.js`). A new section with a new name simply appears at the end; a section named like an existing one (e.g. "Dessert") joins it.
- **Hours and dial number** shown at the top of the tab: desk **Pages → Room Service**.
- **One-time load into Supabase:** run `supabase/room-service.sql` in the SQL editor (after `schema.sql` and `seed.sql`). It only adds rows, and is safe to run again. It is generated from `js/data.js` with `node tools/gen-roomservice-sql.js`.

## Never translated

Brand and contact details stay as written in every language: Encima Roofdeck Bar & Restaurant (logo, header, hero), City Garden Hotel Makati, OpenTable, the address, phone, email, opening hours, dish names, the "Room Service" tab and tag, and prices (₱, Glass / Bottle / Shot). Allergen and diet tags (Pork, Peanuts, Vegetarian...) are translated on purpose, for guest safety.

## Files to edit by hand (optional)

- Hours/phone/story, **Best Sellers** (pick up to 4 dishes) and **Our Story photos** (3 uploads) after go-live: use the desk **Pages** tab, not the JS files.
- UI translations (buttons only): `js/i18n.js`. Item translations come later.
