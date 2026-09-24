# GroundedOps website (staging)

Static marketing site for GroundedOps: plain HTML, CSS and JavaScript, no build tools beyond one Python script.

- `src/` holds the page sources and the shared head, header and footer.
- `python build.py` assembles them into the `.html` files at the repo root, which GitHub Pages serves.
- `assets/site.css` holds every colour as a theme token, light and dark. `assets/site.js` runs the theme toggle, the demo widget, the savings calculator and the checkout summary.

This is a staging preview: prices are suggestions, checkout takes no payment, and search engines are asked not to index it (`robots.txt`, `noindex`).
