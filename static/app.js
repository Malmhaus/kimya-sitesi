(function () {
  var BASE = document.body.getAttribute("data-base") || "";
  var body = document.body;

  // ---------- Sol menü ----------
  function toggleSidebar(open) {
    body.classList.toggle("sidebar-open", open);
  }
  document.getElementById("menu-btn").addEventListener("click", function () {
    toggleSidebar(!body.classList.contains("sidebar-open"));
  });
  document.getElementById("overlay").addEventListener("click", function () {
    toggleSidebar(false);
  });

  // Bulunulan sayfayı menüde işaretle
  document.querySelectorAll("#sidebar nav a").forEach(function (a) {
    var isHome = a.pathname === BASE + "/" || a.pathname === "/";
    var here = location.pathname;
    if (isHome ? here === a.pathname : here.indexOf(a.pathname) === 0) {
      a.classList.add("active");
    }
  });

  // ---------- Kullanıcı menüsü ----------
  var userBtn = document.getElementById("user-btn");
  var userMenu = document.getElementById("user-menu");
  function closeUser() { userMenu.hidden = true; }
  userBtn.addEventListener("click", function (e) {
    e.stopPropagation();
    userMenu.hidden = !userMenu.hidden;
  });
  document.addEventListener("click", function (e) {
    if (!userMenu.contains(e.target)) closeUser();
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") { closeUser(); toggleSidebar(false); }
  });

  // ---------- Üyelik (Supabase) ----------
  var configured = window.SUPABASE_URL && window.SUPABASE_ANON_KEY && window.supabase;
  var sb = configured
    ? window.supabase.createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY)
    : null;
  window.kimyaAuth = sb;

  function userName(user) {
    return (user.user_metadata && user.user_metadata.ad) || user.email;
  }

  function setUser(user) {
    document.querySelectorAll('[data-auth="out"]').forEach(function (el) { el.hidden = !!user; });
    document.querySelectorAll('[data-auth="in"]').forEach(function (el) { el.hidden = !user; });
    if (user) {
      var n = document.getElementById("user-name");
      if (n) n.textContent = userName(user);
      var pn = document.getElementById("profile-name");
      if (pn) pn.textContent = userName(user);
      var pe = document.getElementById("profile-email");
      if (pe) pe.textContent = user.email;
    }
  }

  if (sb) {
    sb.auth.getSession().then(function (r) {
      setUser(r.data.session ? r.data.session.user : null);
    });
    sb.auth.onAuthStateChange(function (_event, session) {
      setUser(session ? session.user : null);
    });
  } else {
    setUser(null);
  }

  function showMsg(text, ok) {
    var el = document.getElementById("form-msg");
    if (!el) return;
    el.textContent = text;
    el.className = "form-msg " + (ok ? "ok" : "err");
  }

  var NOT_READY = "Üyelik sistemi henüz bağlanmadı (Supabase ayarı gerekli).";

  var loginForm = document.getElementById("login-form");
  if (loginForm) {
    loginForm.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!sb) return showMsg(NOT_READY, false);
      var f = new FormData(loginForm);
      sb.auth.signInWithPassword({ email: f.get("email"), password: f.get("password") })
        .then(function (r) {
          if (r.error) return showMsg("Giriş başarısız: e-posta veya şifre hatalı ya da e-posta onaylanmamış.", false);
          location.href = BASE + "/";
        });
    });
  }

  var signupForm = document.getElementById("signup-form");
  if (signupForm) {
    signupForm.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!sb) return showMsg(NOT_READY, false);
      var f = new FormData(signupForm);
      sb.auth.signUp({
        email: f.get("email"),
        password: f.get("password"),
        options: { data: { ad: f.get("ad") } }
      }).then(function (r) {
        if (r.error) return showMsg("Kayıt başarısız: " + r.error.message, false);
        showMsg("Kayıt alındı! E-postana gelen onay bağlantısına tıkla, sonra giriş yap.", true);
        signupForm.reset();
      });
    });
  }

  var logoutBtn = document.getElementById("logout-btn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", function () {
      if (!sb) return;
      sb.auth.signOut().then(function () { location.href = BASE + "/"; });
    });
  }
})();
