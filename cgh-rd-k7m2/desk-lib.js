/* Encima desk: shared helpers (formatting, prices, toasts, modals). */
(function () {
  "use strict";
  const D = (window.Desk = window.Desk || {});

  D.$ = (s, r = document) => r.querySelector(s);
  D.$$ = (s, r = document) => [...r.querySelectorAll(s)];
  D.esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  D.peso = (n) => (n == null ? "" : "₱" + Number(n).toLocaleString("en-PH"));

  D.photoSrc = (p) => {
    if (!p) return "../images/logo.webp";
    if (/^https?:\/\//i.test(p) || p.includes("/")) return p;
    return "../images/" + p + ".webp";
  };

  /* Photos uploaded from the desk live in the public "menu-photos" bucket. */
  const MARK = "/storage/v1/object/public/menu-photos/";
  D.storagePath = (url) => {
    if (typeof url !== "string") return null;
    const i = url.indexOf(MARK);
    return i < 0 ? null : decodeURIComponent(url.slice(i + MARK.length).split("?")[0]);
  };

  D.stLabel = { not_reviewed: "Not reviewed", approved: "Approved", for_revision: "For revision" };
  D.stClass = { not_reviewed: "nr", approved: "ok", for_revision: "rev" };
  D.groupLabel = (id) => ((MENU.groups.find((g) => g.id === id) || {}).label) || id;

  D.slug = (name) =>
    String(name).toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "")
      .replace(/&/g, " and ").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40) || "section";

  /* ---------- prices ---------- */
  D.priceKind = (p) => {
    if (p == null) return "tbd";
    if (typeof p === "number") return "single";
    if (p.shot != null) return "shot";
    if (p.glass200 != null) return "glass200";
    return "glass";
  };
  D.priceText = (p) => {
    if (p == null) return "Price on request";
    if (typeof p === "number") return D.peso(p);
    const bits = [];
    if (p.glass != null) bits.push("Glass " + D.peso(p.glass));
    if (p.glass200 != null) bits.push("200 ml " + D.peso(p.glass200));
    if (p.shot != null) bits.push("Shot " + D.peso(p.shot));
    if (p.bottle != null) bits.push("Bottle " + D.peso(p.bottle));
    return bits.join(", ") || "—";
  };
  /* Returns the price value, or throws an Error with a message the user can act on. */
  D.readPrice = (f) => {
    const kind = f.kind.value;
    const num = (name, label) => {
      const raw = f[name].value.trim();
      if (raw === "") return null;
      const n = Number(raw);
      if (!Number.isFinite(n) || n < 0) throw new Error(label + " must be a number, 0 or more.");
      return n;
    };
    const note = f.bottleNote.value.trim() || undefined;
    if (kind === "tbd") return null;
    if (kind === "single") {
      const v = num("single", "Price");
      if (v == null) throw new Error("Enter a price, or choose “Price on request”.");
      return v;
    }
    const key = kind; // glass | glass200 | shot
    const first = num(key, key === "shot" ? "Shot price" : key === "glass200" ? "200 ml price" : "Glass price");
    const bottle = num("bottle", "Bottle price");
    if (first == null && bottle == null) throw new Error("Enter at least one price.");
    const out = {};
    out[key] = first;
    out.bottle = bottle;
    if (note) out.bottleNote = note;
    return out;
  };

  /* ---------- friendly errors ---------- */
  D.MIGRATION_HINT = "This needs the one-time database update. Run desk-migration.sql in the Supabase SQL editor, then try again.";
  D.friendly = (e) => {
    const m = (e && e.message) || String(e || "Something went wrong.");
    if (/items_visibility_check/.test(m)) return D.MIGRATION_HINT;
    if (/column .*archived|archived.*does not exist/i.test(m)) return D.MIGRATION_HINT;
    if (/row-level security|permission denied/i.test(m)) return "You don’t have permission to do that.";
    if (/jwt expired|not authenticated|invalid jwt/i.test(m)) return "Your session expired. Sign in again.";
    if (/duplicate key|already exists/i.test(m)) return "That already exists. Try a different name.";
    if (/failed to fetch|networkerror|load failed/i.test(m)) return "Can’t reach the server. Check your connection and try again.";
    return m;
  };

  /* ---------- toasts ---------- */
  D.toast = (msg, opts = {}) => {
    let box = document.getElementById("toasts");
    if (!box) {
      box = document.createElement("div");
      box.id = "toasts";
      box.setAttribute("role", "status");
      box.setAttribute("aria-live", "polite");
    }
    /* An open modal blocks the page behind it, so show the toast inside the top-most one. */
    const open = document.querySelectorAll("dialog[open]");
    const host = open.length ? open[open.length - 1] : document.body;
    if (box.parentNode !== host) host.appendChild(box);
    const el = document.createElement("div");
    el.className = "toast" + (opts.error ? " bad" : "");
    const span = document.createElement("span");
    span.textContent = msg;
    el.appendChild(span);
    const kill = () => { el.classList.add("out"); setTimeout(() => el.remove(), 180); };
    if (opts.action) {
      const b = document.createElement("button");
      b.type = "button";
      b.textContent = opts.action.label;
      b.addEventListener("click", () => { kill(); opts.action.run(); });
      el.appendChild(b);
    }
    box.appendChild(el);
    setTimeout(kill, opts.error ? 7000 : opts.action ? 7000 : 3800);
  };

  /* ---------- modals (native <dialog>) ---------- */
  let locks = 0;
  const lock = (on) => {
    locks += on ? 1 : -1;
    document.body.classList.toggle("lock", locks > 0);
  };

  /* D.modal({title, body, footer, form, small, wide, isDirty, onClose})
     returns { el, body, close(force), busy(on, label), error(msg), markDirty() } */
  D.modal = (o) => {
    const dlg = document.createElement("dialog");
    dlg.className = "modal" + (o.small ? " small" : "") + (o.wide ? " wide" : "");
    const tag = o.form ? "form" : "div";
    dlg.innerHTML =
      `<${tag} class="m-wrap"${o.form ? " novalidate" : ""}>
        <div class="m-head"><h2>${D.esc(o.title)}</h2><button type="button" class="m-x" data-close aria-label="Close">×</button></div>
        <div class="m-body">${o.body || ""}</div>
        <p class="m-err" role="alert" hidden></p>
        ${o.footer ? `<div class="m-foot">${o.footer}</div>` : ""}
      </${tag}>`;
    document.body.appendChild(dlg);
    let dirty = false, forced = false, down = null;
    const api = {
      el: dlg,
      body: dlg.querySelector(".m-body"),
      markDirty() { dirty = true; },
      error(msg) {
        const p = dlg.querySelector(".m-err");
        p.hidden = !msg;
        p.textContent = msg || "";
        if (msg) p.scrollIntoView({ block: "nearest" });
      },
      busy(on, label) {
        dlg.classList.toggle("is-busy", !!on);
        dlg.querySelectorAll(".m-foot button, .m-foot a").forEach((b) => (b.disabled = !!on));
        const primary = dlg.querySelector(".m-foot [data-primary]");
        if (primary) {
          if (on) { primary.dataset.label = primary.textContent; primary.textContent = label || "Saving…"; }
          else if (primary.dataset.label) primary.textContent = primary.dataset.label;
        }
      },
      close(force) {
        forced = !!force;
        if (dlg.open) dlg.close();
        else dlg.dispatchEvent(new Event("close"));
      }
    };
    async function tryClose() {
      if (dirty && !forced && !o.small) {
        const ok = await D.confirmBox({
          title: "Discard your changes?",
          body: "You have edits that haven’t been saved.",
          confirm: "Discard", cancel: "Keep editing", danger: true
        });
        if (!ok) return;
      }
      api.close(true);
    }
    dlg.addEventListener("input", () => (dirty = true));
    dlg.addEventListener("change", () => (dirty = true));
    dlg.addEventListener("cancel", (e) => { e.preventDefault(); tryClose(); });
    dlg.addEventListener("mousedown", (e) => (down = e.target));
    dlg.addEventListener("click", (e) => {
      if (e.target.closest("[data-close]")) { tryClose(); return; }
      if (e.target === dlg && down === dlg) tryClose();
    });
    dlg.addEventListener("close", () => {
      lock(false);
      const t = document.getElementById("toasts");
      if (t && dlg.contains(t)) document.body.appendChild(t);
      dlg.remove();
      if (o.onClose) o.onClose();
    });
    lock(true);
    if (typeof dlg.showModal === "function") dlg.showModal(); else dlg.setAttribute("open", "");
    const af = dlg.querySelector("[autofocus]");
    if (af) af.focus();
    return api;
  };

  /* D.confirmBox({title, body(html), confirm, cancel, danger}) → Promise<boolean> */
  D.confirmBox = (o) =>
    new Promise((resolve) => {
      let result = false;
      const m = D.modal({
        title: o.title, small: true,
        body: `<p class="m-text">${o.body || ""}</p>`,
        footer: `<button type="button" class="btn ghost" data-no autofocus>${D.esc(o.cancel || "Cancel")}</button>
                 <button type="button" class="btn ${o.danger ? "warn" : ""}" data-yes>${D.esc(o.confirm || "Confirm")}</button>`,
        onClose: () => resolve(result)
      });
      m.el.querySelector("[data-yes]").addEventListener("click", () => { result = true; m.close(true); });
      m.el.querySelector("[data-no]").addEventListener("click", () => m.close(true));
    });
})();
