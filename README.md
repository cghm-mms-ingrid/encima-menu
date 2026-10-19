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

## Files to edit by hand (optional)

- Hours/phone/story after go-live: use the desk **Pages** tab, not the JS files.
- UI translations (buttons only): `js/i18n.js`. Item translations come later.
