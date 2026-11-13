/* Builds the page from the files in data/. You should not need to edit this file. */
(function () {
  "use strict";
  var $ = function (id) { return document.getElementById(id); };
  var esc = function (s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  };
  var list = function (v) { return Array.isArray(v) ? v : []; };
  var flat = function (s) { return String(s || "").replace(/\s+/g, " ").trim(); };
  var ICON = {
    check: '<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="2"/><path d="m8.5 12 2.5 2.5 4.5-5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    pin: '<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M12 22s7-6.2 7-12a7 7 0 1 0-14 0c0 5.8 7 12 7 12Z" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="12" cy="10" r="2.5" fill="none" stroke="currentColor" stroke-width="2"/></svg>',
    mail: '<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2" fill="none" stroke="currentColor" stroke-width="2"/><path d="m3 7 9 6 9-6" fill="none" stroke="currentColor" stroke-width="2"/></svg>',
    phone: '<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2Z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg>',
    chev: '<svg class="chev" viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="m6 9 6 6 6-6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>'
  };

  function load(path) {
    return fetch(path, { cache: "no-cache" }).then(function (r) {
      if (!r.ok) throw new Error("file not found (" + r.status + ")");
      return r.text();
    }).then(function (t) {
      return path.slice(-5) === ".json" ? JSON.parse(t) : jsyaml.load(t);
    }).catch(function (e) {
      console.error("Could not read " + path, e);
      var box = $("load-error");
      if (!box) {
        box = document.createElement("div");
        box.id = "load-error"; box.className = "load-error"; box.setAttribute("role", "alert");
        document.querySelector("main").prepend(box);
      }
      box.innerHTML += "<div><b>Problem in " + esc(path) + ":</b> " + esc(String(e.message || e).split("\n")[0]) +
        ". Check the spacing and quotes near the line mentioned, or undo your last change.</div>";
      return null;
    });
  }
  function img(folder, file) { return file ? folder + encodeURI(file) : ""; }

  /* ---------- Site, hero, contact ---------- */
  function renderSite(s) {
    if (!s) return;
    var c = s.contact || {};
    if (s.logo) ["nav-logo", "hero-logo", "foot-logo"].forEach(function (id) { $(id).src = img("photos/site/", s.logo); });
    if (s.favicon) $("favicon").href = img("photos/site/", s.favicon);
    if (s.hero_photo) $("hero-bg").src = img("photos/site/", s.hero_photo);
    $("brand-name").textContent = s.short_name || "";
    $("hero-dept").textContent = [s.department, s.university].filter(Boolean).join(" · ");
    $("title-main").textContent = s.title_main || "";
    $("title-gold").textContent = s.title_gold || "";
    $("hero-sub").textContent = s.subtitle || "";
    $("hero-kw").textContent = s.keywords || "";

    $("about-text").innerHTML = list(s.about).map(function (p) { return "<p>" + esc(flat(p)) + "</p>"; }).join("");

    if (s.band_photo) $("band-bg").src = img("photos/site/", s.band_photo);
    [["research", s.research_photo, s.research_photo_caption], ["teaching", s.teaching_photo, s.teaching_photo_caption]].forEach(function (x) {
      if (!x[1]) return;
      $(x[0] + "-img").src = img("photos/site/", x[1]);
      $(x[0] + "-img").alt = x[2] || "";
      $(x[0] + "-cap").textContent = x[2] || "";
      $(x[0] + "-fig").hidden = false;
    });
    $("campus-title").textContent = s.campus_title || "";
    $("campus-text").textContent = flat(s.campus_text);
    $("campus-addr").textContent = s.campus_address || "";

    var mail = c.email ? "mailto:" + c.email : "#contact";
    var tel = c.phone ? "tel:" + String(c.phone).replace(/[^\d+]/g, "") : "#contact";
    $("btn-email").href = mail; $("foot-email").href = mail;
    $("btn-call").href = tel;
    if (c.profile_url) { $("btn-profile").href = c.profile_url; $("foot-profile").href = c.profile_url; }
    else { $("btn-profile").hidden = true; $("foot-profile").hidden = true; }
    if (!c.phone) $("btn-call").hidden = true;
    $("invite").textContent = flat(c.invite);
    $("foot-contact").innerHTML =
      (c.address ? "<div>" + ICON.pin + "<p>" + esc(flat(c.address)) + "</p></div>" : "") +
      (c.email ? "<div>" + ICON.mail + '<p><a href="mailto:' + esc(c.email) + '">' + esc(c.email) + "</a></p></div>" : "") +
      (c.phone ? "<div>" + ICON.phone + '<p><a href="' + esc(tel) + '">' + esc(c.phone) + "</a></p></div>" : "");
    $("foot-copy").textContent = "© " + new Date().getFullYear() + " " + [s.title_main, s.title_gold].filter(Boolean).join(" ") + " — " + (s.university || "");
    $("foot-right").textContent = s.footer_right || "";
  }

  /* ---------- People ---------- */
  function renderPeople(m) {
    if (!m) return 0;
    var L = m.lead || {};
    $("pi-bio").innerHTML = list(L.bio).map(function (p) { return "<p>" + esc(flat(p)) + "</p>"; }).join("");
    $("lead-card").innerHTML =
      (L.photo ? '<div class="ph"><img src="' + esc(img("photos/members/", L.photo)) + '" alt="' + esc(L.name) + '"></div>' : "") +
      "<figcaption><b>" + esc(L.name) + '</b><div class="t">' + esc(L.title) + "</div>" +
      (L.badge ? '<span class="badge">' + esc(L.badge) + "</span>" : "") +
      '<a class="lead-link" href="#pi">Full profile →</a></figcaption>';
    $("pi-name").textContent = L.name || "";
    $("education").innerHTML = list(L.education).map(function (e) {
      return "<li><b>" + esc(e.degree) + '</b><div class="i">' + esc(e.institution) + '</div><div class="w">' + esc(e.where) + "</div>" +
        (e.note ? '<div class="n">' + esc(e.note) + "</div>" : "") + "</li>";
    }).join("");
    $("positions").innerHTML = list(L.positions).map(function (p) {
      return '<li class="card"><b>' + esc(p.role) + '</b><div class="p">' + esc(p.place) + '</div><div class="w">' + esc(p.when) + "</div></li>";
    }).join("");

    var total = 0;
    var groupsHtml = function (g) {
      var ppl = list(g.people);
      total += ppl.length;
      if (!ppl.length) return "";
      if (g.collapsed) {
        return '<div class="fold card" data-fold><button type="button" aria-expanded="false"><span>' + esc(g.title) +
          '<span class="outline">' + ppl.length + " students" + (g.badge ? " · " + esc(g.badge) : "") + "</span></span>" + ICON.chev +
          '</button><div class="fold-body" hidden><div class="past">' + ppl.map(function (p) {
            return "<div><span>" + esc(p.name) + "</span><span>" + esc(p.topic || p.now || "") + "</span></div>";
          }).join("") + "</div>" + (g.note ? '<p class="fold-note">' + esc(g.note) + "</p>" : "") + "</div></div>";
      }
      var badge = g.badge ? '<span class="cnt goldc">' + esc(g.badge) + " · " + ppl.length + "</span>" : '<span class="cnt">' + ppl.length + "</span>";
      return '<div><h3 class="g-h">' + esc(g.title) + " " + badge + '</h3><div class="students' + (ppl.length % 4 ? " three" : "") + '">' +
        ppl.map(function (p) {
          return '<div class="student card">' +
            (p.photo ? '<img src="' + esc(img("photos/members/", p.photo)) + '" alt="' + esc(p.name) + '" loading="lazy" onerror="this.remove()">' : "") +
            "<b>" + esc(p.name) + "</b>" +
            (p.email ? '<a class="mail" href="mailto:' + esc(p.email) + '">' + esc(p.email) + "</a>" : "") +
            (p.topic ? '<p class="topic"><span>Topic:</span> ' + esc(p.topic) + "</p>" : "") +
            (p.now ? '<div class="now">' + esc(p.now) + "</div>" : "") + "</div>";
        }).join("") + "</div></div>";
    };
    var gs = list(m.groups);
    $("groups").innerHTML = gs.filter(function (g) { return !g.collapsed; }).map(groupsHtml).join("");
    $("groups-past").innerHTML = gs.filter(function (g) { return g.collapsed; }).map(groupsHtml).join("");
    var al = list(m.alumni).filter(function (a) { return a && a.name; });
    if (al.length) {
      $("alumni-wrap").hidden = false;
      $("alumni").innerHTML = al.map(function (a) {
        var ini = String(a.name).replace(/\(.*?\)/g, "").replace(/\b(Md|Mst|Dr)\.?\s/gi, "").trim().split(/\s+/);
        ini = ((ini[0] || "")[0] || "") + (ini.length > 1 ? ini[ini.length - 1][0] : "");
        return '<div class="alum card">' + (a.photo ? '<img src="' + esc(img("photos/members/", a.photo)) + '" alt="' + esc(a.name) + '" loading="lazy">'
          : '<span class="ini" aria-hidden="true">' + esc(ini.toUpperCase()) + "</span>") +
          "<div><b>" + esc(a.name) + "</b>" + (a.now ? '<p class="now">' + esc(a.now) + "</p>" : "") +
          (a.worked_on ? '<p class="was">In EG Lab: ' + esc(a.worked_on) + "</p>" : "") + "</div></div>";
      }).join("");
    }
    Array.prototype.forEach.call(document.querySelectorAll("[data-fold] > button"), function (b) {
      b.addEventListener("click", function () {
        var open = b.getAttribute("aria-expanded") !== "true";
        b.setAttribute("aria-expanded", open);
        b.parentNode.classList.toggle("open", open);
        b.nextElementSibling.hidden = !open;
      });
    });
    return total;
  }

  /* ---------- Research ---------- */
  function renderResearch(r) {
    if (!r) return 0;
    $("research-intro").textContent = flat(r.intro);
    $("mission").innerHTML = list(r.mission).map(function (m) { return '<div class="card">' + ICON.check + "<span>" + esc(m) + "</span></div>"; }).join("");
    $("interests").innerHTML = list(r.interests).map(function (x) {
      return '<div class="card"><h4>' + esc(x.title) + "</h4><p>" + esc(x.text) + "</p></div>";
    }).join("");
    $("current").innerHTML = list(r.current).map(function (x, i) {
      return '<div class="card proj"><span class="num">' + String(i + 1).padStart(2, "0") + "</span><h4>" + esc(x.title) + "</h4><p>" + esc(flat(x.text)) + "</p></div>";
    }).join("");
    $("funded").innerHTML = list(r.funded).map(function (x) {
      return '<div class="frow"><div><h4>' + esc(x.title) + '</h4><p>' + esc(x.funder) + '</p></div><div class="fmeta"><span class="tagpill">' + esc(x.role) + '</span><span class="fwhen">' + esc(x.period) + "</span></div></div>";
    }).join("");
    return list(r.funded).length;
  }

  /* ---------- Publications ---------- */
  var PUBS = [], TAB = "journal", PUB_ALL = false, PUB_LIMIT = 6;
  var TABS = [["journal", "Journal Papers"], ["conference", "Conference Papers"], ["other", "Preprints & Other"]];
  function norm(t) { return String(t || "").toLowerCase().replace(/[^a-z0-9]+/g, ""); }
  function guessType(p) {
    if (p.type) { var t = String(p.type).toLowerCase(); return t === "preprint" ? "other" : t; }
    var v = (p.venue || "") + " " + (p.url || "");
    if (/ssrn|arxiv|preprint|techrxiv|research square|under review|thesis|patent/i.test(v)) return "other";
    if (/conference|proceedings|proc\.|symposium|workshop|congress|summit|\bICE|PEEIACON|ICISET|ICDRET|ICEEICT|ECCE|EICT|ICAEE|ICECTE|IOP Conf/i.test(v)) return "conference";
    if (!p.venue) return "other";
    return "journal";
  }
  function preparePubs(data, extra) {
    var items = list(data && data.items).slice();
    extra = extra || {};
    var hide = list(extra.hide).map(norm).filter(Boolean), have = {};
    items.forEach(function (p) { have[norm(p.title)] = true; });
    list(extra.add).forEach(function (p) { if (p && p.title && !have[norm(p.title)]) items.push(p); });
    items = items.filter(function (p) { var n = norm(p.title); return n && !hide.some(function (h) { return n.indexOf(h) === 0; }); });
    items.forEach(function (p) { p._type = guessType(p); p._year = parseInt(p.year, 10) || 0; });
    items.sort(function (a, b) { return b._year - a._year || (b.citations || 0) - (a.citations || 0); });
    return items;
  }
  function renderTabs() {
    $("pub-tabs").innerHTML = TABS.map(function (t) {
      var n = PUBS.filter(function (p) { return p._type === t[0]; }).length;
      if (!n) return "";
      return '<button type="button" role="tab" class="tab' + (t[0] === TAB ? " on" : "") + '" data-tab="' + t[0] + '" aria-selected="' + (t[0] === TAB) + '">' +
        t[1] + ' <span class="n">' + n + "</span></button>";
    }).join("");
  }
  function renderPubs() {
    var all = PUBS.filter(function (p) { return p._type === TAB; });
    var shown = PUB_ALL ? all : all.slice(0, PUB_LIMIT);
    $("pub-more").hidden = all.length <= PUB_LIMIT;
    $("pub-more").textContent = PUB_ALL ? "Show fewer" : "Show all " + all.length + " papers";
    $("pubs").innerHTML = shown.map(function (p, i) {
      var title = p.url ? '<a href="' + esc(p.url) + '" target="_blank" rel="noopener">' + esc(p.title) + "</a>" : '<span class="ttl">' + esc(p.title) + "</span>";
      return '<li class="card"><span class="idx">' + (i + 1) + '</span><p class="txt">' +
        (p.authors ? esc(p.authors) + ", " : "") + "“" + title + ",” " + (p.venue ? "<i>" + esc(p.venue) + "</i>" : "") +
        (p._year ? ", " + p._year : "") + "." + (p.citations ? '<span class="cite">' + p.citations + " citations</span>" : "") + "</p></li>";
    }).join("");
  }
  function renderScholar(data) {
    var pr = data && data.profile;
    $("scholar").innerHTML = pr ? [["citations", "Citations"], ["h_index", "h-index"], ["i10_index", "i10-index"]].filter(function (k) { return pr[k[0]] != null; })
      .map(function (k) { return "<span><b>" + Number(pr[k[0]]).toLocaleString() + "</b>" + k[1] + "</span>"; }).join("") : "";
    if (data) $("pub-note").textContent = "Source: " + (data.source || "Google Scholar") + (data.updated ? " · last checked " + data.updated : "");
  }

  /* ---------- Teaching ---------- */
  function renderTeaching(t) {
    if (!t) return;
    var pg = list(t.postgraduate), ug = list(t.undergraduate);
    if (!pg.length && !ug.length) return;
    $("teaching").hidden = false;
    $("pg").innerHTML = pg.map(function (c) { return '<div class="card"><span class="code">' + esc(c.code) + "</span><span>" + esc(c.name) + "</span></div>"; }).join("");
    $("ug").innerHTML = ug.map(function (c) { return '<div class="card"><span class="code">' + esc(c.code) + "</span><div>" + esc(c.name) + "</div></div>"; }).join("");
  }

  /* ---------- Gallery ---------- */
  var PHOTOS = [], YEAR = "All", VISIBLE = [], LB = -1;
  function renderGallery(g) {
    PHOTOS = list(g && g.photos).filter(function (p) { return p && p.photo; });
    if (!PHOTOS.length) return;
    $("gallery").hidden = false;
    var years = ["All"];
    PHOTOS.forEach(function (p) { var y = String(p.year || ""); if (y && years.indexOf(y) < 0) years.push(y); });
    $("year-btns").innerHTML = years.map(function (y) {
      return '<button type="button" data-year="' + esc(y) + '"' + (y === YEAR ? ' class="on"' : "") + ">" + (y === "All" ? "All (" + PHOTOS.length + ")" : esc(y)) + "</button>";
    }).join("");
    drawPhotos();
  }
  function drawPhotos() {
    VISIBLE = YEAR === "All" ? PHOTOS : PHOTOS.filter(function (p) { return String(p.year) === YEAR; });
    $("photos").innerHTML = VISIBLE.map(function (p, i) {
      var alt = p.caption || "EG Lab group photo" + (p.year ? ", " + p.year : "");
      return '<button type="button" data-i="' + i + '"><img src="' + esc(img("photos/gallery/", p.photo)) + '" alt="' + esc(alt) + '" loading="lazy">' +
        (p.year ? '<span class="yr">' + esc(p.year) + "</span>" : "") + "</button>";
    }).join("");
  }
  function openLB(i) {
    LB = (i + VISIBLE.length) % VISIBLE.length;
    var p = VISIBLE[LB], alt = p.caption || "EG Lab group photo" + (p.year ? ", " + p.year : "");
    $("lb-img").src = img("photos/gallery/", p.photo); $("lb-img").alt = alt;
    $("lb-cap").textContent = alt + " · " + (LB + 1) + " of " + VISIBLE.length;
    $("lightbox").hidden = false;
  }
  function closeLB() { $("lightbox").hidden = true; LB = -1; }

  /* ---------- News ---------- */
  var NEWS = [], NEWS_ALL = false, NEWS_LIMIT = 3;
  function renderNews(n) {
    NEWS = list(n);
    $("news-more").hidden = NEWS.length <= NEWS_LIMIT;
    $("news-more").textContent = NEWS_ALL ? "Show fewer" : "Show all " + NEWS.length + " updates";
    $("news-list").innerHTML = (NEWS_ALL ? NEWS : NEWS.slice(0, NEWS_LIMIT)).map(function (x) {
      var d = x.date instanceof Date ? x.date.toISOString().slice(0, 10) : (x.date || "");
      return '<li><div class="card"><div class="top">' + (x.tag ? '<span class="ntag ' + esc(String(x.tag).replace(/\W/g, "")) + '">' + esc(x.tag) + "</span>" : "") +
        (d ? '<span class="ndate">' + esc(d) + "</span>" : "") + "</div><p>" + esc(flat(x.text)) +
        (x.link ? ' <a href="' + esc(x.link) + '" target="_blank" rel="noopener">Read more</a>' : "") + "</p></div></li>";
    }).join("");
  }

  /* ---------- Stats ---------- */
  function renderStats(funded, students) {
    var j = PUBS.filter(function (p) { return p._type === "journal"; }).length;
    var c = PUBS.filter(function (p) { return p._type === "conference"; }).length;
    var cells = [[j, "Journal Papers"], [c, "Conference Papers"], [funded, "Funded Projects"], [students + "+", "Students Supervised"]];
    $("stats").innerHTML = cells.map(function (s) { return "<div><dt>" + s[1] + "</dt><dd>" + s[0] + "</dd></div>"; }).join("");
  }

  /* ---------- Behaviour ---------- */
  function bind() {
    var nav = $("nav");
    var onScroll = function () {
      nav.classList.toggle("scrolled", window.scrollY > 12);
      $("to-top").hidden = window.scrollY < 600;
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    $("menu-btn").addEventListener("click", function () {
      var open = !nav.classList.contains("open");
      nav.classList.toggle("open", open);
      this.setAttribute("aria-expanded", open);
    });
    $("nav-links").addEventListener("click", function (e) { if (e.target.tagName === "A") nav.classList.remove("open"); });
    $("to-top").addEventListener("click", function () { window.scrollTo({ top: 0, behavior: "smooth" }); });
    $("pub-tabs").addEventListener("click", function (e) {
      var b = e.target.closest("[data-tab]"); if (!b) return;
      TAB = b.getAttribute("data-tab"); PUB_ALL = false; renderTabs(); renderPubs();
    });
    $("pub-more").addEventListener("click", function () {
      PUB_ALL = !PUB_ALL; renderPubs();
      if (!PUB_ALL) $("publications").scrollIntoView();
    });
    $("news-more").addEventListener("click", function () {
      NEWS_ALL = !NEWS_ALL; renderNews(NEWS);
    });
    $("year-btns").addEventListener("click", function (e) {
      var b = e.target.closest("[data-year]"); if (!b) return;
      YEAR = b.getAttribute("data-year");
      Array.prototype.forEach.call(this.children, function (x) { x.classList.toggle("on", x === b); });
      drawPhotos();
    });
    $("photos").addEventListener("click", function (e) { var b = e.target.closest("[data-i]"); if (b) openLB(+b.getAttribute("data-i")); });
    $("lightbox").addEventListener("click", function (e) { if (e.target === this) closeLB(); });
    $("lb-close").addEventListener("click", closeLB);
    $("lb-prev").addEventListener("click", function () { openLB(LB - 1); });
    $("lb-next").addEventListener("click", function () { openLB(LB + 1); });
    document.addEventListener("keydown", function (e) {
      if (LB < 0) return;
      if (e.key === "Escape") closeLB();
      if (e.key === "ArrowRight") openLB(LB + 1);
      if (e.key === "ArrowLeft") openLB(LB - 1);
    });
  }

  bind();
  Promise.all([
    load("data/site.yml"), load("data/members.yml"), load("data/research.yml"),
    load("data/publications.json"), load("data/publications-extra.yml"),
    load("data/teaching.yml"), load("data/gallery.yml"), load("data/news.yml")
  ]).then(function (d) {
    renderSite(d[0]);
    var students = renderPeople(d[1]);
    var funded = renderResearch(d[2]);
    PUBS = preparePubs(d[3], d[4]);
    if (!PUBS.some(function (p) { return p._type === TAB; }) && PUBS.length) TAB = PUBS[0]._type;
    renderScholar(d[3]); renderTabs(); renderPubs();
    renderTeaching(d[5]);
    renderGallery(d[6]);
    renderNews(d[7]);
    renderStats(funded, students);
  });
})();
