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

  function load(path) {
    return fetch(path, { cache: "no-cache" }).then(function (r) {
      if (!r.ok) throw new Error("file not found (" + r.status + ")");
      return r.text();
    }).then(function (t) {
      return path.slice(-5) === ".json" ? JSON.parse(t) : jsyaml.load(t);
    }).catch(function (e) {
      var box = document.createElement("div");
      box.className = "load-error"; box.setAttribute("role", "alert");
      box.innerHTML = "<b>Problem in " + esc(path) + ":</b> " + esc(String(e.message || e).split("\n")[0]) +
        ". Check the spacing and quotes near the line mentioned, or undo your last change.";
      document.querySelector("main").prepend(box);
      return null;
    });
  }

  /* ---------- Profile ---------- */
  function renderProfile(p) {
    if (!p) return;
    var full = [p.first_name, p.last_name].filter(Boolean).join(" ");
    $("fn").textContent = p.first_name || "";
    $("ln").textContent = p.last_name || "";
    $("top-name").textContent = full;
    $("headline").textContent = p.headline || "";
    if (p.photo) { $("portrait").src = "photos/members/" + encodeURI(p.photo); $("portrait").alt = full; }
    $("address").textContent = p.address || "";
    $("intro").innerHTML = list(p.intro).map(function (x) { return "<p>" + esc(flat(x)) + "</p>"; }).join("");
    $("tags").innerHTML = list(p.interests).map(function (x) { return "<li>" + esc(x) + "</li>"; }).join("");
    $("links").innerHTML = (p.email ? '<span class="em">' + esc(p.email) + "</span>" : "") +
      list(p.links).map(function (l) { return '<a href="' + esc(l.url) + '" target="_blank" rel="noopener">' + esc(l.label) + "</a>"; }).join("");
    $("foot").textContent = "© " + new Date().getFullYear() + " " + full + (p.nickname ? " (" + p.nickname + ")" : "");
    if (p.publications_shown) PUB_LIMIT = +p.publications_shown || PUB_LIMIT;
  }

  /* ---------- News ---------- */
  var NEWS = [], NEWS_ALL = false, NEWS_LIMIT = 5;
  function renderNews(n) {
    if (n) NEWS = list(n);
    var shown = NEWS_ALL ? NEWS : NEWS.slice(0, NEWS_LIMIT);
    $("news-list").innerHTML = shown.map(function (x) {
      var d = x.date instanceof Date ? x.date.toISOString().slice(0, 10) : (x.date || "");
      return "<tr><td>" + esc(d) + "</td><td>" + esc(flat(x.text)) +
        (x.link ? ' <a href="' + esc(x.link) + '" target="_blank" rel="noopener">Link</a>' : "") + "</td></tr>";
    }).join("");
    $("news-more").hidden = NEWS.length <= NEWS_LIMIT;
    $("news-more").textContent = NEWS_ALL ? "Show less" : "Show all news";
  }

  /* ---------- Research ---------- */
  function renderResearch(r) {
    if (!r) return;
    $("current").innerHTML = list(r.current).map(function (x) {
      return '<div class="proj"><b>' + esc(x.title) + "</b><p>" + esc(flat(x.text)) + "</p></div>";
    }).join("");
    $("funded").innerHTML = list(r.funded).map(function (x) {
      return "<li>" + esc(x.title) + '<span class="meta">' + [x.role, x.funder, x.period].filter(Boolean).map(esc).join(" · ") + "</span></li>";
    }).join("");
  }

  /* ---------- Publications ---------- */
  var PUBS = [], PUB_ALL = false, PUB_LIMIT = 8;
  function norm(t) { return String(t || "").toLowerCase().replace(/[^a-z0-9]+/g, ""); }
  function kind(p) {
    if (p.type) return String(p.type).toLowerCase();
    var v = (p.venue || "") + " " + (p.url || "");
    if (/ssrn|arxiv|preprint|techrxiv|under review/i.test(v)) return "preprint";
    if (/conference|proceedings|proc\.|symposium|workshop|congress|\bICE|PEEIACON|ICISET|ICDRET|ICEEICT|ECCE|EICT|ICAEE|ICECTE|IOP Conf/i.test(v)) return "conference";
    return "journal";
  }
  function preparePubs(data, extra) {
    var items = list(data && data.items).slice();
    extra = extra || {};
    var hide = list(extra.hide).map(norm).filter(Boolean), have = {};
    items.forEach(function (p) { have[norm(p.title)] = true; });
    list(extra.add).forEach(function (p) { if (p && p.title && !have[norm(p.title)]) items.push(p); });
    items = items.filter(function (p) { var n = norm(p.title); return n && !hide.some(function (h) { return n.indexOf(h) === 0; }); });
    items.forEach(function (p) { p._year = parseInt(p.year, 10) || 0; p._kind = kind(p); });
    items.sort(function (a, b) { return b._year - a._year || (b.citations || 0) - (a.citations || 0); });
    return items;
  }
  function authors(a) {
    return esc(a).replace(/\b(M\.? ?Hassan|Mehedi Hassan)\b/g, '<span class="me">$1</span>');
  }
  function renderPubs() {
    var shown = PUB_ALL ? PUBS : PUBS.slice(0, PUB_LIMIT);
    $("pubs").innerHTML = shown.map(function (p) {
      var t = p.url ? '<a class="t" href="' + esc(p.url) + '" target="_blank" rel="noopener">' + esc(p.title) + "</a>" : '<span class="t">' + esc(p.title) + "</span>";
      return "<li>" + t + (p.authors ? '<div class="a">' + authors(p.authors) + "</div>" : "") +
        '<div class="v"><i>' + esc(p.venue || "") + "</i>" + (p._year ? ", " + p._year : "") +
        (p._kind !== "journal" ? '<span class="badge">' + esc(p._kind) + "</span>" : "") +
        (p.citations ? '<span class="badge">' + p.citations + " cited</span>" : "") + "</div></li>";
    }).join("");
    $("pub-more").hidden = PUBS.length <= PUB_LIMIT;
    $("pub-more").textContent = PUB_ALL ? "Show fewer" : "Show all " + PUBS.length + " publications";
  }
  function renderMetrics(data) {
    var pr = (data && data.profile) || {};
    var j = PUBS.filter(function (p) { return p._kind === "journal"; }).length;
    var c = PUBS.filter(function (p) { return p._kind === "conference"; }).length;
    var bits = ["<b>" + j + "</b> journal", "<b>" + c + "</b> conference"];
    if (pr.citations != null) bits.push("<b>" + pr.citations + "</b> citations");
    if (pr.h_index != null) bits.push("h-index <b>" + pr.h_index + "</b>");
    $("metrics").innerHTML = bits.join(" · ") + (data && data.updated ? " · from Google Scholar, updated weekly" : "");
  }

  /* ---------- Students ---------- */
  function renderStudents(m, g) {
    if (m) {
      var html = list(m.groups).map(function (gr) {
        var ppl = list(gr.people);
        if (!ppl.length) return "";
        var items = "<ul>" + ppl.map(function (p) {
          return "<li>" + esc(p.name) + (p.topic ? " <span>· " + esc(p.topic) + "</span>" : "") + "</li>";
        }).join("") + "</ul>";
        var title = esc(gr.title) + (gr.badge ? " (" + esc(gr.badge) + ")" : "");
        return gr.collapsed ? '<details class="grp"><summary>' + title + " · " + ppl.length + "</summary>" + items + "</details>"
          : '<div class="grp"><h3>' + title + "</h3>" + items + "</div>";
      }).join("");
      var al = list(m.alumni).filter(function (a) { return a && a.name; });
      if (al.length) {
        html += '<div class="grp"><h3>Alumni, where they are now</h3><ul>' + al.map(function (a) {
          return "<li>" + esc(a.name) + (a.now ? " <span>· " + esc(a.now) + "</span>" : "") + "</li>";
        }).join("") + "</ul></div>";
      }
      $("groups").innerHTML = html;
    }
    var photos = list(g && g.photos).filter(function (p) { return p && p.photo; }).slice(0, 3);
    $("photos").innerHTML = photos.map(function (p) {
      return '<img src="photos/gallery/' + encodeURI(p.photo) + '" alt="EG Research Group' + (p.year ? ", " + esc(p.year) : "") + '" loading="lazy">';
    }).join("");
  }

  /* ---------- Teaching ---------- */
  function renderTeaching(t) {
    if (!t) { $("teaching").hidden = true; return; }
    var block = function (title, arr) {
      arr = list(arr);
      if (!arr.length) return "";
      return "<div><h3>" + title + "</h3><ul>" + arr.map(function (c) { return "<li><code>" + esc(c.code) + "</code>" + esc(c.name) + "</li>"; }).join("") + "</ul></div>";
    };
    $("teach").innerHTML = block("Postgraduate", t.postgraduate) + block("Undergraduate", t.undergraduate);
  }

  /* ---------- Buttons ---------- */
  $("pub-more").addEventListener("click", function () { PUB_ALL = !PUB_ALL; renderPubs(); if (!PUB_ALL) $("publications").scrollIntoView(); });
  $("news-more").addEventListener("click", function () { NEWS_ALL = !NEWS_ALL; renderNews(); });

  Promise.all([
    load("data/profile.yml"), load("data/news.yml"), load("data/research.yml"),
    load("data/publications.json"), load("data/publications-extra.yml"),
    load("data/members.yml"), load("data/gallery.yml"), load("data/teaching.yml")
  ]).then(function (d) {
    renderProfile(d[0]);
    renderNews(d[1]);
    renderResearch(d[2]);
    PUBS = preparePubs(d[3], d[4]);
    renderMetrics(d[3]); renderPubs();
    renderStudents(d[5], d[6]);
    renderTeaching(d[7]);
  });
})();
