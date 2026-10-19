/* Encima desk: sign-in and start-up. Screens live in desk-views.js, data in desk-api.js. */
(async function () {
  "use strict";
  const D = window.Desk;
  const { $ } = D;

  if (!D.configured) {
    $("#setup").hidden = false;
    $("#gateNote").textContent = "Supabase is not connected yet.";
    return;
  }

  const sb = D.sb;
  const loginErr = (msg) => { $("#loginErr").hidden = !msg; $("#loginErr").textContent = msg || ""; };

  async function enter() {
    const { data: { session } } = await sb.auth.getSession();
    if (!session) { $("#loginForm").hidden = false; return; }
    const { data: prof, error } = await sb.from("profiles").select("*").eq("id", session.user.id).maybeSingle();
    if (error || !prof) {
      await sb.auth.signOut();
      $("#loginForm").hidden = false;
      loginErr("This email is not on the staff list.");
      return;
    }
    D.state.profile = prof;
    try {
      await D.api.loadAll();
    } catch (err) {
      D.state.profile = null;
      $("#loginForm").hidden = false;
      loginErr("Signed in, but the menu couldn’t load: " + D.friendly(err));
      return;
    }
    $("#gate").hidden = true;
    $("#desk").hidden = false;
    D.views.init();
    await D.views.paint();
  }

  $("#loginForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    loginErr("");
    const btn = $("button[type=submit]", e.target);
    btn.disabled = true; btn.textContent = "Signing in…";
    const fd = new FormData(e.target);
    const { error } = await sb.auth.signInWithPassword({ email: fd.get("email"), password: fd.get("password") });
    btn.disabled = false; btn.textContent = "Sign in";
    if (error) { loginErr(error.message); return; }
    await enter();
  });

  $("#out").addEventListener("click", async () => { await sb.auth.signOut(); location.reload(); });

  /* If the session ends in another tab, return to the sign-in screen. */
  sb.auth.onAuthStateChange((event) => {
    if (event === "SIGNED_OUT" && D.state.profile) location.reload();
  });

  $("#loginForm").hidden = false;
  await enter();
})();
