# EG Lab website

Website of the Energy Grid (EG) Research Group, Department of EEE,
Jashore University of Science and Technology.

- **To update the site, read [HOW-TO-UPDATE.md](HOW-TO-UPDATE.md).**
- Content lives in `data/*.yml`; photos in `photos/`.
- `data/publications.json` is refreshed weekly from Google Scholar by
  `.github/workflows/update-publications.yml` (script: `scripts/update_publications.py`).
- No build step: `index.html`, `assets/style.css` and `assets/app.js` render the data in the browser.
  Works on GitHub Pages or Netlify as-is.
