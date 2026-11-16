/* Builds the pages from the files in data/. You should not need to edit this file. */
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

  /* ---------- Pages (Home, Research, Publications, Group, Teaching) ---------- */
  var VIEWS = ["home", "research", "publications", "group", "teaching"];
  function route() {
    var v = (location.hash || "").replace("#", "");
    if (VIEWS.indexOf(v) < 0) v = "home";
    Array.prototype.forEach.call(document.querySelectorAll("[data-view]"), function (el) { el.hidden = el.getAttribute("data-view") !== v; });
    Array.prototype.forEach.call(document.querySelectorAll("[data-nav]"), function (a) {
      var on = a.getAttribute("data-nav") === v;
      a.classList.toggle("on", on);
      if (on) a.setAttribute("aria-current", "page"); else a.removeAttribute("aria-current");
    });
    window.scrollTo(0, 0);
  }
  window.addEventListener("hashchange", route);
  route();

  /* ---------- Profile ---------- */
  var SELECTED = [];
  function renderProfile(p) {
    if (!p) return;
    var full = [p.first_name, p.last_name].filter(Boolean).join(" ");
    $("fn").textContent = p.first_name || "";
    $("ln").textContent = p.last_name || "";
    if (p.lab_name) $("lab-name").textContent = p.lab_name;
    $("lab-place").textContent = p.lab_place || "";
    $("lab-intro").innerHTML = list(p.lab_intro).map(function (x) { return "<p>" + esc(flat(x)) + "</p>"; }).join("");
    $("headline").innerHTML = (Array.isArray(p.headline) ? p.headline : [p.headline]).filter(Boolean).map(function (x) { return "<span>" + esc(x) + "</span>"; }).join("");
    if (p.banner === "" || p.banner === null) $("banner").hidden = true;
    else if (p.banner) $("banner").src = "photos/site/" + encodeURI(p.banner);
    $("logos").innerHTML = list(p.logos).filter(function (l) { return l && l.name; }).map(function (l) {
      var inner = l.file ? '<img src="photos/logos/' + encodeURI(l.file) + '" alt="' + esc(l.name) + '" title="' + esc(l.name) + '" onerror="this.replaceWith(Object.assign(document.createElement(\'span\'),{textContent:this.alt}))">' : "<span>" + esc(l.name) + "</span>";
      return l.url ? '<a href="' + esc(l.url) + '" target="_blank" rel="noopener">' + inner + "</a>" : "<div>" + inner + "</div>";
    }).join("");
    if (p.photo) { $("portrait").src = "photos/members/" + encodeURI(p.photo); $("portrait").alt = full; }
    $("intro").innerHTML = list(p.intro).map(function (x) { return "<p>" + esc(flat(x)) + "</p>"; }).join("");
    if ($("education")) $("education").innerHTML = list(p.education).map(function (x) { return "<li>" + esc(x) + "</li>"; }).join("");
    $("tags").innerHTML = list(p.interests).map(function (x) { return "<li>" + esc(x) + "</li>"; }).join("");
    var rows = [];
    var edu = list(p.education);
    if (edu.length) rows.push(["Education", edu.map(esc).join("<br>")]);
    if (p.research_line) rows.push(["Research interests", esc(flat(p.research_line))]);
    var mails = (Array.isArray(p.email) ? p.email : [p.email]).filter(Boolean);
    if (mails.length) rows.push(["Email", mails.map(esc).join("<br>")]);
    if (p.address) rows.push(["Office", esc(p.address)]);
    var links = list(p.links).map(function (l) { return '<a href="' + esc(l.url) + '" target="_blank" rel="noopener">' + esc(l.label) + "</a>"; });
    if (links.length) rows.push(["Links", links.join(" · ")]);
    $("contact").innerHTML = rows.map(function (r) { return "<dt>" + r[0] + "</dt><dd>" + r[1] + "</dd>"; }).join("");
    $("foot").textContent = "© " + new Date().getFullYear() + " " + (p.lab_short || "EG Lab") + (p.lab_place ? " · " + p.lab_place : "");
    SELECTED = list(p.selected_publications);
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
    $("news-more").textContent = NEWS_ALL ? "Show less" : "Older news";
  }

  /* ---------- Research ---------- */
  function renderResearch(r) {
    if (!r) return;
    $("focus").innerHTML = list(r.current).map(function (x) {
      var first = (flat(x.text).match(/^.*?[.!?](\s|$)/) || [flat(x.text)])[0];
      return '<div class="proj"><b>' + esc(x.title) + "</b><p>" + esc(first) + "</p></div>";
    }).join("");
    $("current").innerHTML = list(r.current).map(function (x) {
      return '<div class="proj"><b>' + esc(x.title) + "</b><p>" + esc(flat(x.text)) + "</p></div>";
    }).join("");
    var figs = list(r.figures).filter(function (f) { return f && f.photo; });
    $("figs").innerHTML = figs.length ? "<h2>Recent results</h2><p class=\"muted\">Figures from our submitted papers, to appear soon.</p><div class=\"figs\">" + figs.map(function (f) {
      var src = "photos/research/" + encodeURI(f.photo);
      return '<figure' + (f.wide ? ' class="wide"' : "") + '><a href="' + src + '" target="_blank" rel="noopener"><img src="' + src + '" alt="' + esc(f.caption || "Research figure") + '" loading="lazy"></a>' + (f.caption ? "<figcaption>" + esc(f.caption) + "</figcaption>" : "") + "</figure>";
    }).join("") + "</div>" : "";
    $("funded").innerHTML = list(r.funded).map(function (x) {
      return "<li>" + esc(x.title) + '<span class="meta">' + [x.role, x.funder, x.period].filter(Boolean).map(esc).join(" · ") + "</span></li>";
    }).join("");
  }

  /* ---------- Publications ---------- */
  var PUBS = [];
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
  function authors(a) { return esc(a).replace(/\b(M\.? ?Hassan|Mehedi Hassan)\b/g, '<span class="me">$1</span>'); }
  function pubItem(p) {
    var t = p.url ? '<a class="t" href="' + esc(p.url) + '" target="_blank" rel="noopener">' + esc(p.title) + "</a>" : '<span class="t">' + esc(p.title) + "</span>";
    return "<li>" + t + (p.authors ? '<div class="a">' + authors(p.authors) + "</div>" : "") +
      '<div class="v"><i>' + esc(p.venue || "") + "</i>" + (p._year ? ", " + p._year : "") +
      (p._kind !== "journal" ? '<span class="badge">' + esc(p._kind) + "</span>" : "") +
      (p.citations ? '<span class="badge cite">' + p.citations + " cited</span>" : "") + "</div></li>";
  }
  function renderPubs(data) {
    // Front page: chosen papers, or the 4 most cited
    var picks = [];
    SELECTED.map(norm).filter(Boolean).forEach(function (s) {
      var hit = PUBS.filter(function (p) { return norm(p.title).indexOf(s) === 0 && picks.indexOf(p) < 0; })[0];
      if (hit) picks.push(hit);
    });
    if (!picks.length) picks = PUBS.slice().sort(function (a, b) { return (b.citations || 0) - (a.citations || 0); }).slice(0, 4);
    $("selected").innerHTML = picks.map(pubItem).join("");
    $("all-pubs-link").textContent = "All " + PUBS.length + " publications →";

    // Publications page: grouped by type, newest first
    var groups = [["journal", "Journal articles"], ["conference", "Conference papers"], ["preprint", "Preprints"], ["other", "Other"]];
    $("pubs-all").innerHTML = groups.map(function (g) {
      var items = PUBS.filter(function (p) { return p._kind === g[0]; });
      if (!items.length) return "";
      return "<h2>" + g[1] + " (" + items.length + ')</h2><ol class="pubs">' + items.map(pubItem).join("") + "</ol>";
    }).join("");
    var pr = (data && data.profile) || {}, bits = [];
    if (pr.citations != null) bits.push("<b>" + pr.citations + "</b> citations");
    if (pr.h_index != null) bits.push("h-index <b>" + pr.h_index + "</b>");
    if (pr.i10_index != null) bits.push("i10-index <b>" + pr.i10_index + "</b>");
    $("metrics").innerHTML = bits.join(" · ") + (bits.length ? " · " : "") + "Updated weekly from Google Scholar";
  }

  /* ---------- Group ---------- */
  function renderGroup(m, g) {
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
          return "<li>" + esc(a.name) + (a.year ? " (" + esc(a.year) + ")" : "") + (a.now ? " <span>· " + esc(a.now) + "</span>" : "") + "</li>";
        }).join("") + "</ul></div>";
      }
      $("groups").innerHTML = html;
      var tiles = list(m.groups).filter(function (gr) { return !gr.collapsed && list(gr.people).length; }).map(function (gr) {
        return '<div class="tile"><b>' + list(gr.people).length + "</b><span>" + esc(gr.title) + "</span></div>";
      });
      if (al.length) tiles.push('<div class="tile"><b>' + al.length + '</b><span>Alumni at ' + al.map(function (a) { return esc(String(a.now || "").split(",").slice(-2, -1)[0] || a.now || a.name).trim(); }).join(" and ") + "</span></div>");
      $("glance").innerHTML = tiles.join("");
    }
    $("photos").innerHTML = list(g && g.photos).filter(function (p) { return p && p.photo; }).slice(0, 3).map(function (p) {
      return '<img src="photos/gallery/' + encodeURI(p.photo) + '" alt="EG Research Group' + (p.year ? ", " + esc(p.year) : "") + '" loading="lazy">';
    }).join("");
  }

  /* ---------- Teaching ---------- */
  function renderTeaching(t) {
    if (!t) return;
    var block = function (title, arr) {
      arr = list(arr);
      if (!arr.length) return "";
      return "<div><h3>" + title + "</h3><ul>" + arr.map(function (c) { return "<li><code>" + esc(c.code) + "</code>" + esc(c.name) + "</li>"; }).join("") + "</ul></div>";
    };
    $("teach").innerHTML = block("Postgraduate", t.postgraduate) + block("Undergraduate", t.undergraduate);
  }

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
    renderPubs(d[3]);
    renderGroup(d[5], d[6]);
    renderTeaching(d[7]);
  });
})();
