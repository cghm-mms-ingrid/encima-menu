# Encima Roofdeck digital menu (Phase 1: public site)

Plain HTML/CSS/JS. Deploy: drag this folder onto Netlify Drop (app.netlify.com/drop) or connect a repo. No build step.

- Menu content lives in `js/data.js` for now. The admin panel (Phase 2) will replace this.
- Hours, phone, email, social links and the OpenTable link: `SITE` at the bottom of `js/data.js` (phone, email and social links are placeholders).
- Photos: add `images/<name>.webp` and list the name in an item's `photos` array. Items without photos show the placeholder.
- UI translations: `js/i18n.js`. Item-level translations come in Phase 3; items fall back to English until then.
