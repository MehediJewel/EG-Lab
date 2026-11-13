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

  function load(path) {
    return fetch(path, { cache: "no-cache" }).then(function (r) {
      if (!r.ok) throw new Error(path + " (" + r.status + ")");
      return r.text();
    }).then(function (t) {
      return path.slice(-5) === ".json" ? JSON.parse(t) : jsyaml.load(t);
    }).catch(function (e) {
      console.error("Could not read " + path, e);
      showError(path, e);
      return null;
    });
  }

  function showError(path, e) {
    var box = $("load-error");
    if (!box) {
      box = document.createElement("div");
      box.id = "load-error";
      box.setAttribute("role", "alert");
      box.style.cssText = "margin:16px auto;max-width:1080px;padding:12px 16px;border:2px solid var(--ph-r);border-radius:6px;background:var(--surface);color:var(--fg);font-size:14px";
      document.querySelector("main").prepend(box);
    }
    var msg = String(e && e.message || e).split("\n")[0];
    box.innerHTML += "<div><b>Problem in " + esc(path) + ":</b> " + esc(msg) +
      ". Check spacing and quotes near the line mentioned, or undo your last change.</div>";
  }

  function initials(name) {
    var parts = String(name || "").replace(/\(.*?\)/g, "").replace(/\b(Dr|Md|Mst|Mr|Ms)\.?\s/gi, "").trim().split(/\s+/);
    return ((parts[0] || "")[0] || "").concat((parts.length > 1 ? parts[parts.length - 1][0] : "") || "").toUpperCase();
  }

  function avatar(photo, name, folder) {
    var ini = esc(initials(name));
    if (!photo) return '<span class="avatar" aria-hidden="true">' + ini + "</span>";
    return '<img class="avatar" src="' + esc(folder + photo) + '" alt="' + esc(name) +
      '" loading="lazy" onerror="this.outerHTML=\'<span class=&quot;avatar&quot; aria-hidden=&quot;true&quot;>' + ini + '</span>\'">';
  }

  /* ---------- Site ---------- */
  function renderSite(s) {
    if (!s) return;
    document.title = (s.short_name || "Lab") + " · " + (s.name || "");
    if (s.logo) {
      $("brand").insertAdjacentHTML("afterbegin", '<img src="photos/site/' + esc(s.logo) + '" alt="">');
      $("brand").classList.add("has-logo");
      $("hero-logo").src = "photos/site/" + s.logo;
      $("hero-logo").hidden = false;
    }
    if (s.favicon && $("favicon")) $("favicon").href = "photos/site/" + s.favicon;
    if (s.campus_photo) {
      $("campus-img").src = "photos/site/" + s.campus_photo;
      $("campus-img").alt = s.campus_caption || "";
      $("campus-cap").textContent = s.campus_caption || "";
      $("campus").hidden = false;
    }
    $("brand-name").textContent = s.short_name || "";
    $("hero-dept").textContent = [s.department, s.university].filter(Boolean).join(" · ");
    $("hero-name").textContent = s.name || "";
    $("hero-tagline").textContent = s.tagline || "";
    $("about-text").textContent = (s.about || "").replace(/\s+/g, " ").trim();
    $("foot-name").textContent = "© " + new Date().getFullYear() + " " + [s.short_name, s.university].filter(Boolean).join(", ");

    var c = s.contact || {};
    var rows = [["Lead", c.person], ["Email", c.email], ["Phone", c.phone], ["Office", c.address]];
    $("contact-box").innerHTML = rows.filter(function (r) { return r[1]; }).map(function (r) {
      return '<div class="row"><span class="k">' + r[0] + '</span><span class="v">' + esc(r[1]) + "</span></div>";
    }).join("");
    $("links").innerHTML = list(s.links).map(function (l) {
      return '<a href="' + esc(l.url) + '" target="_blank" rel="noopener">' + esc(l.label) + "</a>";
    }).join("");
    if (s.join_us) { $("join").hidden = false; $("join-text").textContent = s.join_us; }
  }

  /* ---------- Research ---------- */
  function renderResearch(r) {
    if (!r) return;
    $("focus").innerHTML = list(r.focus_areas).map(function (f) {
      return "<li><div><b>" + esc(f.title) + "</b><span>" + esc(f.text) + "</span></div></li>";
    }).join("");
    $("interests").innerHTML = list(r.interests).map(function (f) {
      return "<div><b>" + esc(f.title) + "</b><span>" + esc(f.text) + "</span></div>";
    }).join("");
    $("methods").textContent = r.methods ? "Methods: " + r.methods : "";
    $("projects").innerHTML = list(r.current).map(function (p) {
      return '<article class="project">' +
        (p.image ? '<img src="photos/research/' + esc(p.image) + '" alt="" loading="lazy" onerror="this.remove()">' : "") +
        "<div><h3>" + esc(p.title) + "</h3><p>" + esc(p.text) + "</p></div></article>";
    }).join("");
    $("funded").innerHTML = list(r.funded).map(function (f) {
      return "<li><div><b>" + esc(f.title) + "</b>" + (f.role ? '<span class="role">' + esc(f.role) + "</span>" : "") +
        '<div class="meta">' + esc(f.funder) + '</div></div><span class="when">' + esc(f.period) + "</span></li>";
    }).join("");
  }

  /* ---------- People ---------- */
  function renderPeople(m) {
    if (!m) return;
    var L = m.lead;
    if (L) {
      $("lead").innerHTML = avatar(L.photo, L.name, "photos/members/") +
        "<div><h3>" + esc(L.name) + '</h3><div class="title">' + esc(L.title) + "</div>" +
        (L.role ? '<div class="role">' + esc(L.role) + "</div>" : "") +
        (L.bio ? "<p>" + esc(String(L.bio).replace(/\s+/g, " ").trim()) + "</p>" : "") +
        (list(L.education).length ? "<ul>" + L.education.map(function (e) { return "<li>" + esc(e) + "</li>"; }).join("") + "</ul>" : "") +
        (L.email ? '<div class="mail">' + esc(L.email) + "</div>" : "") + "</div>";
    } else { $("lead").hidden = true; }

    $("groups").innerHTML = list(m.groups).map(function (g) {
      var ppl = list(g.people);
      if (!ppl.length) return "";
      return '<h3 class="group-h">' + esc(g.title) + " <small>" + ppl.length + '</small></h3><div class="people">' +
        ppl.map(function (p) {
          return '<div class="person">' + avatar(p.photo, p.name, "photos/members/") + "<div><b>" + esc(p.name) + "</b>" +
            (p.topic ? '<div class="topic">' + esc(p.topic) + "</div>" : "") +
            (p.now ? '<div class="now">' + esc(p.now) + "</div>" : "") +
            (p.email ? '<div class="mail">' + esc(p.email) + "</div>" : "") + "</div></div>";
        }).join("") + "</div>";
    }).join("");
  }

  /* ---------- Publications ---------- */
  var PUBS = [], filterType = "all", query = "";

  function guessType(p) {
    if (p.type) return String(p.type).toLowerCase();
    var v = (p.venue || "") + " " + (p.url || "");
    if (/ssrn|arxiv|preprint|techrxiv|research square|under review/i.test(v)) return "preprint";
    if (/conference|proceedings|proc\.|symposium|workshop|congress|summit|ICE|PEEIACON|ICISET|ICDRET|ICEEICT|ECCE|EICT|ICAEE|ICECTE/.test(v)) return "conference";
    if (!p.venue) return "other";
    return "journal";
  }
  function norm(t) { return String(t || "").toLowerCase().replace(/[^a-z0-9]+/g, ""); }

  function preparePubs(data, extra) {
    var items = list(data && data.items).slice();
    extra = extra || {};
    var hide = list(extra.hide).map(norm).filter(Boolean);
    var have = {};
    items.forEach(function (p) { have[norm(p.title)] = true; });
    list(extra.add).forEach(function (p) { if (p && p.title && !have[norm(p.title)]) items.push(p); });
    items = items.filter(function (p) {
      var n = norm(p.title);
      return n && !hide.some(function (h) { return n.indexOf(h) === 0; });
    });
    items.forEach(function (p) { p._type = guessType(p); p._year = parseInt(p.year, 10) || 0; });
    items.sort(function (a, b) { return b._year - a._year || (b.citations || 0) - (a.citations || 0); });
    return items;
  }

  function renderMetrics(data) {
    var p = data && data.profile;
    var n = PUBS.length;
    var cells = [["Publications", n]];
    if (p) {
      if (p.citations != null) cells.push(["Citations", p.citations]);
      if (p.h_index != null) cells.push(["h-index", p.h_index]);
      if (p.i10_index != null) cells.push(["i10-index", p.i10_index]);
    }
    $("metrics").innerHTML = cells.map(function (c) {
      return "<div><dt>" + c[0] + "</dt><dd>" + Number(c[1]).toLocaleString() + "</dd></div>";
    }).join("");
    if (data) {
      $("pub-note").textContent = "Source: " + (data.source || "Google Scholar") + (data.updated ? " · updated " + data.updated : "");
      $("foot-updated").textContent = data.updated ? "Publications updated " + data.updated : "";
    }
  }

  function renderPubs() {
    var q = query.toLowerCase();
    var shown = PUBS.filter(function (p) {
      if (filterType !== "all" && p._type !== filterType) return false;
      if (!q) return true;
      return [p.title, p.authors, p.venue, p.year].join(" ").toLowerCase().indexOf(q) !== -1;
    });
    if (!shown.length) { $("pubs").innerHTML = '<p class="empty">No publications match.</p>'; return; }
    var byYear = {}, years = [];
    shown.forEach(function (p) {
      var y = p._year || "Other";
      if (!byYear[y]) { byYear[y] = []; years.push(y); }
      byYear[y].push(p);
    });
    $("pubs").innerHTML = years.map(function (y) {
      return '<section class="year"><h3>' + y + '</h3><ol class="pubs">' + byYear[y].map(function (p) {
        var title = p.url ? '<a class="t" href="' + esc(p.url) + '" target="_blank" rel="noopener">' + esc(p.title) + "</a>"
          : '<span class="t">' + esc(p.title) + "</span>";
        var tags = '<span class="tags"><span class="tag">' + esc(p._type) + "</span>" +
          (p.citations ? '<span class="tag cite">' + p.citations + " cited</span>" : "") + "</span>";
        return '<li class="pub">' + title + (p.authors ? '<div class="a">' + esc(p.authors) + "</div>" : "") +
          '<div class="v">' + esc(p.venue || "") + tags + "</div></li>";
      }).join("") + "</ol></section>";
    }).join("");
  }

  function bindPubTools() {
    $("pub-filter").addEventListener("click", function (e) {
      var b = e.target.closest("button[data-type]");
      if (!b) return;
      filterType = b.getAttribute("data-type");
      Array.prototype.forEach.call(this.children, function (c) { c.classList.toggle("on", c === b); });
      renderPubs();
    });
    $("pub-search").addEventListener("input", function () { query = this.value.trim(); renderPubs(); });
  }

  /* ---------- Teaching ---------- */
  function renderTeaching(t) {
    if (!t) return;
    var blocks = [["Postgraduate courses", t.postgraduate], ["Undergraduate courses", t.undergraduate]]
      .filter(function (b) { return list(b[1]).length; });
    if (!blocks.length) return;
    $("teaching").hidden = false;
    $("teach").innerHTML = blocks.map(function (b) {
      return "<div><h3>" + b[0] + '</h3><ul class="courses">' + b[1].map(function (c) {
        return "<li><code>" + esc(c.code) + "</code><span>" + esc(c.name) + "</span></li>";
      }).join("") + "</ul></div>";
    }).join("");
  }

  /* ---------- News + gallery ---------- */
  function fmtDate(d) {
    if (!d) return "";
    d = String(d);
    var m = d.match(/^(\d{4})-(\d{2})(?:-(\d{2}))?/);
    if (!m) return d;
    var months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    return (m[3] ? +m[3] + " " : "") + months[+m[2] - 1] + " " + m[1];
  }
  function renderNews(n) {
    var items = list(n);
    $("news-list").innerHTML = items.length ? items.map(function (x) {
      var d = x.date instanceof Date ? x.date.toISOString().slice(0, 10) : x.date;
      return "<li>" + (d ? "<time>" + esc(fmtDate(d)) + "</time>" : "") + esc(x.text) +
        (x.link ? ' <a href="' + esc(x.link) + '" target="_blank" rel="noopener">Read more</a>' : "") + "</li>";
    }).join("") : '<li class="empty">No news yet.</li>';
  }
  function renderGallery(g) {
    var photos = list(g && g.photos);
    var grid = $("news").querySelector(".news-grid");
    if (!photos.length) { grid.classList.add("single"); return; }
    $("gallery-wrap").hidden = false;
    grid.classList.remove("single");
    $("gallery").innerHTML = photos.map(function (p) {
      return '<figure><img src="photos/gallery/' + esc(p.photo) + '" alt="' + esc(p.caption || "") +
        '" loading="lazy">' + (p.caption ? "<figcaption>" + esc(p.caption) + "</figcaption>" : "") + "</figure>";
    }).join("");
  }

  /* ---------- Go ---------- */
  bindPubTools();
  Promise.all([
    load("data/site.yml"), load("data/research.yml"), load("data/members.yml"),
    load("data/news.yml"), load("data/gallery.yml"),
    load("data/publications.json"), load("data/publications-extra.yml"),
    load("data/teaching.yml")
  ]).then(function (d) {
    renderTeaching(d[7]);
    renderSite(d[0]);
    renderResearch(d[1]);
    renderPeople(d[2]);
    renderNews(d[3]);
    renderGallery(d[4]);
    PUBS = preparePubs(d[5], d[6]);
    renderMetrics(d[5]);
    renderPubs();
  });
})();
