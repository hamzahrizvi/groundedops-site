# GroundedOps website (staging)

Static marketing site for GroundedOps: plain HTML, CSS and JavaScript, no build tools beyond one Python script.

- `src/` holds the page sources and the shared head, header and footer.
- `python build.py` assembles them into the `.html` files at the repo root, which GitHub Pages serves.
- `assets/site.css` holds every colour as a theme token, light and dark. `assets/site.js` runs the theme toggle, the demo widget, the savings calculator and the checkout summary.

This is a staging preview: prices are suggestions, checkout takes no payment, and search engines are asked not to index it (`robots.txt`, `noindex`).

## The "Ask us" chat

The chat bottom-right is the real GroundedOps widget, served by a separate GroundedOps instance that only knows this site's documents (`knowledge/docs`) and approved FAQ answers (`knowledge/faqs.json`).

- Load or refresh that knowledge: `python knowledge/load_knowledge.py --src <groundedops>/src --data <bot data folder>` (stop the bot first).
- The bot's public address lives in `assets/bot.js` (`GO_BOT_API`). A Cloudflare quick tunnel gets a new address on every restart: update that line and push. Empty hides the chat.
