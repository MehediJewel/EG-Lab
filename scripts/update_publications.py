#!/usr/bin/env python3
"""Refresh data/publications.json from a Google Scholar profile.

Run by .github/workflows/update-publications.yml every week (and on demand).

How it gets the data, in order:
  1. SerpAPI (if the SERPAPI_KEY secret is set). Reliable; free plan = 100 lookups/month.
  2. Reading the public Scholar profile page directly. Free, but Google sometimes
     blocks automated visits from cloud servers.
If both fail, the existing file is kept unchanged, so the website never breaks.

Scholar's author lists are sometimes shortened with "...". The site shows them as given.
"""
from __future__ import annotations

import datetime as dt
import json
import os
import re
import sys
import time
from pathlib import Path

import requests
import yaml
from bs4 import BeautifulSoup

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "data"
OUT = DATA / "publications.json"
UA = ("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
      "(KHTML, like Gecko) Chrome/124.0 Safari/537.36")


def norm(title: str) -> str:
    return re.sub(r"[^a-z0-9]+", "", (title or "").lower())


def clean_venue(v: str) -> str:
    return re.sub(r",\s*(?:19|20)\d{2}\s*$", "", (v or "").strip()).strip(" ,")


def to_int(v) -> int:
    try:
        return int(str(v).strip() or 0)
    except ValueError:
        return 0


# ---------------------------------------------------------------- SerpAPI
def from_serpapi(author_id: str, key: str) -> dict:
    items, profile, start = [], None, 0
    while True:
        r = requests.get("https://serpapi.com/search.json", timeout=60, params={
            "engine": "google_scholar_author", "author_id": author_id,
            "api_key": key, "num": 100, "start": start, "hl": "en",
        })
        r.raise_for_status()
        d = r.json()
        if d.get("error"):
            raise RuntimeError(d["error"])
        if profile is None:
            profile = {}
            for row in (d.get("cited_by") or {}).get("table", []):
                for k, v in row.items():
                    name = {"citations": "citations", "h_index": "h_index",
                            "i10_index": "i10_index"}.get(k)
                    if name:
                        profile[name] = to_int(v.get("all"))
        arts = d.get("articles") or []
        for a in arts:
            items.append({
                "title": a.get("title", "").strip(),
                "authors": a.get("authors", ""),
                "venue": clean_venue(a.get("publication", "")),
                "year": to_int(a.get("year")) or None,
                "citations": to_int((a.get("cited_by") or {}).get("value")),
                "url": a.get("link", ""),
            })
        if len(arts) < 100:
            break
        start += 100
    return {"profile": profile, "items": items, "source": "Google Scholar (via SerpAPI)"}


# ------------------------------------------------------- Direct page read
def from_scholar_page(author_id: str) -> dict:
    s = requests.Session()
    s.headers.update({"User-Agent": UA, "Accept-Language": "en-US,en;q=0.9"})
    items, profile, start = [], None, 0
    while True:
        r = s.get("https://scholar.google.com/citations", timeout=60, params={
            "user": author_id, "hl": "en", "cstart": start, "pagesize": 100,
            "sortby": "pubdate",
        })
        r.raise_for_status()
        soup = BeautifulSoup(r.text, "html.parser")
        if soup.select_one("#gs_captcha_ccl, #recaptcha") or "unusual traffic" in r.text:
            raise RuntimeError("Google showed a CAPTCHA (automated visits blocked)")
        if profile is None:
            cells = [to_int(td.get_text()) for td in soup.select("td.gsc_rsb_std")]
            if len(cells) >= 6:
                profile = {"citations": cells[0], "h_index": cells[2], "i10_index": cells[4]}
        rows = soup.select("tr.gsc_a_tr")
        for tr in rows:
            a = tr.select_one("a.gsc_a_at")
            if not a:
                continue
            gray = tr.select("div.gs_gray")
            venue = gray[1].get_text(" ", strip=True) if len(gray) > 1 else ""
            href = a.get("href") or a.get("data-href") or ""
            items.append({
                "title": a.get_text(" ", strip=True),
                "authors": gray[0].get_text(" ", strip=True) if gray else "",
                "venue": clean_venue(venue),
                "year": to_int(tr.select_one(".gsc_a_y span, .gsc_a_h").get_text()
                               if tr.select_one(".gsc_a_y span, .gsc_a_h") else 0) or None,
                "citations": to_int(tr.select_one("a.gsc_a_ac").get_text()
                                    if tr.select_one("a.gsc_a_ac") else 0),
                "url": ("https://scholar.google.com" + href) if href.startswith("/") else href,
            })
        if len(rows) < 100:
            break
        start += 100
        time.sleep(5)
    if not items:
        raise RuntimeError("No publications found on the Scholar page")
    return {"profile": profile, "items": items, "source": "Google Scholar"}


# ------------------------------------------------------------------ main
def main() -> int:
    site = yaml.safe_load((DATA / "profile.yml").read_text(encoding="utf-8")) or {}
    author_id = str(site.get("google_scholar_id") or "").strip()
    if not author_id:
        print("No google_scholar_id in data/site.yml; nothing to do.")
        return 0

    result, errors = None, []
    key = os.environ.get("SERPAPI_KEY", "").strip()
    if key:
        try:
            result = from_serpapi(author_id, key)
        except Exception as e:  # noqa: BLE001
            errors.append(f"SerpAPI: {e}")
    if result is None:
        try:
            result = from_scholar_page(author_id)
        except Exception as e:  # noqa: BLE001
            errors.append(f"Scholar page: {e}")

    if result is None:
        print("Could not reach Google Scholar this time. The website keeps its current list.")
        for e in errors:
            print("  -", e)
        print("Tip: add a free SERPAPI_KEY secret for reliable updates (see HOW-TO-UPDATE.md).")
        return 0  # keep the workflow green; nothing changes

    # Keep a DOI/link we already had when Scholar only gives its own page link.
    old = {}
    if OUT.exists():
        try:
            old = {norm(i["title"]): i for i in json.loads(OUT.read_text("utf-8")).get("items", [])}
        except Exception:  # noqa: BLE001
            old = {}

    seen, items = set(), []
    for it in result["items"]:
        k = norm(it["title"])
        if not k or k in seen:
            continue
        seen.add(k)
        prev = old.get(k)
        if prev and "doi.org" in prev.get("url", "") and "scholar.google" in it.get("url", ""):
            it["url"] = prev["url"]
        items.append(it)

    items.sort(key=lambda i: (-(i.get("year") or 0), -i.get("citations", 0)))
    payload = {
        "updated": dt.date.today().isoformat(),
        "source": result["source"],
        "profile": result["profile"],
        "items": items,
    }
    OUT.write_text(json.dumps(payload, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"Saved {len(items)} publications from {result['source']}.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
