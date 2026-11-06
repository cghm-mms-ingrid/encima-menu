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

## Room Service page (hidden link)

Room Service has its own page: **`/room-service/`** (example: `https://YOUR-SITE.netlify.app/room-service/`).

- It is **not linked anywhere** on the public menu: no tab, no entry in the Section dropdown, no "Room Service" tag or filter. Share the link (or a QR code) with guests directly.
- Search engines are told to skip it (`robots.txt`, a `noindex` meta tag and an `X-Robots-Tag` header). Anyone with the link can open it.
- It uses the same data, look, languages and search as the main menu, and shows only the Room Service menu. Hours and dial number at the top come from the desk: **Pages -> Room Service**.
- **Nothing changes in the staff desk.** Room-service-only dishes still live in Room Service sections (**Add section -> Menu: Room Service**). Dishes on both menus are single records ticked with the **Room Service** tag; they appear in their normal tab on the main menu and on `/room-service/`.
- Inside the page, sections are merged by name so it reads like the room service menu (layout list: `RS_BLOCKS` in `js/data.js`).
- **One-time load into Supabase:** run `supabase/room-service.sql` in the SQL editor (after `schema.sql` and `seed.sql`). It only adds rows and is safe to run again. It is generated from `js/data.js` with `node tools/gen-roomservice-sql.js`.
- How it works: `room-service/index.html` sets `window.ENCIMA_PAGE = "room-service"` before loading the same scripts. `js/app.js` then shows only the Room Service group there and hides it on the main page.

## Languages

The language menu shows each language by its own name, with the English name in brackets: English, Filipino, Español (Spanish), Français (French), 日本語 (Japanese), 한국어 (Korean), 简体中文 (Simplified Chinese), 繁體中文 (Traditional Chinese). The menu is locked from Google Translate (`translate="no"`), so the labels never change.

**To add a language** everything is in `js/i18n.js` (full steps are in the comment at the top of that file):

1. Add one line to `LANGS` (code, label, optional `google` code and `detect` prefixes).
2. Copy the Spanish block at the bottom of the file, change `es` to the new code and translate the strings. Anything missing simply shows in English, so it can be done in stages.
3. Check the Google code is in `includedLanguages` in `index.html` and `room-service/index.html`.

Spanish and French strings were written without a native-speaker review: have someone check them before launch.

## Never translated

Brand and contact details stay as written in every language: Encima Roofdeck Bar & Restaurant (logo, header, hero), City Garden Hotel Makati, OpenTable, the address, phone, email, opening hours, dish names, the "Room Service" page title, and prices (₱, Glass / Bottle / Shot). Allergen and diet tags (Pork, Peanuts, Vegetarian...) are translated on purpose, for guest safety.

## Files to edit by hand (optional)

- Hours/phone/story, **Best Sellers** (pick up to 4 dishes) and **Our Story photos** (3 uploads) after go-live: use the desk **Pages** tab, not the JS files.
- UI translations (buttons only): `js/i18n.js`. Item translations come later.
