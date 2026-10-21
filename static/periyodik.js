(function () {
  var CAT = {
    alk: ["Alkali metal", "#ff8a80"],
    yt:  ["Toprak alkali metal", "#ffb74d"],
    gec: ["Geçiş metali", "#ffe082"],
    gsm: ["Zayıf metal", "#a5d6a7"],
    ym:  ["Yarı metal", "#80cbc4"],
    ame: ["Ametal", "#81d4fa"],
    hal: ["Halojen", "#b39ddb"],
    sgz: ["Soygaz", "#f48fb1"],
    lan: ["Lantanit", "#c5e1a5"],
    akt: ["Aktinit", "#bcaaa4"],
    bil: ["Özellikleri bilinmeyen", "#cfd8dc"]
  };
  var STATE = { g: "Gaz", s: "Sıvı", k: "Katı", b: "Bilinmiyor" };

  var els = window.ELEMENTLER.map(function (line) {
    var p = line.split("|");
    return { n: +p[0], sym: p[1], name: p[2], mass: p[3], cat: p[4], cfg: p[5], st: p[6] };
  });

  function period(n) {
    if (n <= 2) return 1; if (n <= 10) return 2; if (n <= 18) return 3;
    if (n <= 36) return 4; if (n <= 54) return 5; if (n <= 86) return 6; return 7;
  }
  function group(n) {
    if (n === 1) return 1; if (n === 2) return 18;
    if (n <= 4) return n - 2; if (n <= 10) return n + 8;
    if (n <= 12) return n - 10; if (n <= 18) return n;
    if (n <= 36) return n - 18; if (n <= 54) return n - 36;
    if (n <= 56) return n - 54;
    if (n >= 57 && n <= 71) return null;
    if (n <= 86) return n - 68;
    if (n <= 88) return n - 86;
    if (n >= 89 && n <= 103) return null;
    return n - 100;
  }
  function sup(s) { return s.replace(/([spdf])(\d+)/g, "$1<sup>$2</sup>"); }

  var grid = document.getElementById("pt-grid");
  var cells = {};

  els.forEach(function (e) {
    var b = document.createElement("button");
    b.type = "button";
    b.className = "pt-cell";
    b.style.background = CAT[e.cat][1];
    b.setAttribute("data-cat", e.cat);
    b.innerHTML = '<span class="pn">' + e.n + '</span><span class="ps">' + e.sym + '</span><span class="pm">' + e.name + '</span>';
    var row, col;
    if (e.n >= 57 && e.n <= 71) { row = 9; col = e.n - 57 + 3; }
    else if (e.n >= 89 && e.n <= 103) { row = 10; col = e.n - 89 + 3; }
    else { row = period(e.n); col = group(e.n); }
    b.style.gridRow = row;
    b.style.gridColumn = col;
    b.addEventListener("click", function () { openPanel(e); });
    grid.appendChild(b);
    cells[e.n] = b;
  });

  // Lantanit / aktinit yer tutucuları
  [[6, "57–71", "lan"], [7, "89–103", "akt"]].forEach(function (x) {
    var d = document.createElement("div");
    d.className = "pt-cell pt-ph";
    d.style.gridRow = x[0]; d.style.gridColumn = 3;
    d.style.background = CAT[x[2]][1];
    d.setAttribute("data-cat", x[2]);
    d.textContent = x[1];
    grid.appendChild(d);
  });

  // Renk açıklaması
  var legend = document.getElementById("pt-legend");
  var activeCat = null;
  Object.keys(CAT).forEach(function (k) {
    var b = document.createElement("button");
    b.type = "button";
    b.className = "pt-leg";
    b.innerHTML = '<i style="background:' + CAT[k][1] + '"></i>' + CAT[k][0];
    b.addEventListener("click", function () {
      activeCat = (activeCat === k) ? null : k;
      applyFilter();
      legend.querySelectorAll(".pt-leg").forEach(function (x) { x.classList.remove("on"); });
      if (activeCat) b.classList.add("on");
    });
    legend.appendChild(b);
  });

  // Arama
  var search = document.getElementById("pt-search");
  search.addEventListener("input", applyFilter);

  function tr(s) { return s.toLocaleLowerCase("tr"); }

  function applyFilter() {
    var q = tr(search.value.trim());
    els.forEach(function (e) {
      var okCat = !activeCat || e.cat === activeCat;
      var okQ = !q || tr(e.name).indexOf(q) !== -1 || tr(e.sym) === q || tr(e.sym).indexOf(q) === 0 || String(e.n) === q;
      cells[e.n].classList.toggle("dim", !(okCat && okQ));
    });
    grid.querySelectorAll(".pt-ph").forEach(function (d) {
      d.classList.toggle("dim", !!activeCat && d.getAttribute("data-cat") !== activeCat);
    });
  }

  // Bilgi paneli
  var panel = document.getElementById("el-panel");
  var overlay = document.getElementById("el-overlay");
  function $(id) { return document.getElementById(id); }

  function openPanel(e) {
    $("el-box").textContent = e.sym;
    $("el-box").style.background = CAT[e.cat][1];
    $("el-name").textContent = e.name;
    $("el-cat").textContent = CAT[e.cat][0];
    $("el-num").textContent = e.n;
    $("el-mass").textContent = e.mass + " u";
    var g = group(e.n);
    $("el-group").textContent = g ? g : (e.cat === "lan" ? "Lantanit (f bloğu)" : "Aktinit (f bloğu)");
    $("el-period").textContent = period(e.n);
    $("el-state").textContent = STATE[e.st];
    $("el-config").innerHTML = sup(e.cfg);
    $("el-note").hidden = e.n < 104;
    panel.hidden = false;
    overlay.hidden = false;
  }
  function closePanel() { panel.hidden = true; overlay.hidden = true; }
  $("el-close").addEventListener("click", closePanel);
  overlay.addEventListener("click", closePanel);
  document.addEventListener("keydown", function (ev) { if (ev.key === "Escape") closePanel(); });
})();
