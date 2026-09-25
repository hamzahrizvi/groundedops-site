/* The site's "Ask us" chat: the real GroundedOps widget, served by the website bot.
 *
 * GO_BOT_API is the bot's public address. A Cloudflare quick tunnel gets a NEW
 * address every time it restarts: paste the new one here and push. Leave it
 * empty to hide the chat (for example while the PC running the bot is off).
 */
window.GO_BOT_API = 'https://distributors-bridge-thanks-beef.trycloudflare.com';

(function () {
  var api = (window.GO_BOT_API || '').replace(/\/+$/, '');
  // Local preview talks to the bot on this machine.
  if (/^(localhost|127\.0\.0\.1)$/.test(location.hostname)) api = 'http://127.0.0.1:8010';
  if (!api) return;
  var s = document.createElement('script');
  s.src = api + '/widget/groundedops-widget.js';
  s.async = true;
  s.setAttribute('data-api', api);
  s.setAttribute('data-title', 'GroundedOps');
  s.setAttribute('data-accent', '#1A262C');
  s.setAttribute('data-agent-name', 'GroundedOps assistant');
  s.setAttribute('data-sales-email', 'hello@groundedops.example');
  document.body.appendChild(s);
})();
