/* GroundedOps staging site: theme, menu, demo widget, calculators. No dependencies. */
(function () {
  'use strict';
  var root = document.documentElement;

  // ---- Theme: follows the system until the visitor picks one ----
  function storedTheme() { try { return localStorage.getItem('go-theme'); } catch (e) { return null; } }
  function isDark() {
    var t = root.getAttribute('data-theme');
    if (t) return t === 'dark';
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  }
  function labelToggles() {
    document.querySelectorAll('[data-theme-toggle]').forEach(function (b) {
      b.setAttribute('aria-label', isDark() ? 'Switch to light mode' : 'Switch to dark mode');
    });
  }
  var saved = storedTheme();
  if (saved === 'light' || saved === 'dark') root.setAttribute('data-theme', saved);
  document.querySelectorAll('[data-theme-toggle]').forEach(function (b) {
    b.addEventListener('click', function () {
      var next = isDark() ? 'light' : 'dark';
      root.setAttribute('data-theme', next);
      try { localStorage.setItem('go-theme', next); } catch (e) { /* private mode: still works for this page */ }
      labelToggles();
    });
  });
  labelToggles();

  // ---- Mobile menu ----
  var menuBtn = document.querySelector('[data-menu]');
  var nav = document.querySelector('.nav');
  if (menuBtn && nav) {
    menuBtn.addEventListener('click', function () {
      var open = nav.classList.toggle('open');
      menuBtn.setAttribute('aria-expanded', String(open));
    });
  }

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }
  var money = function (n) { return '$' + n.toLocaleString('en-US'); };

  // ---- Demo widget ----
  var demo = document.querySelector('[data-demo]');
  if (demo) {
    var OUT = [
      { tag: 'Answered · cited', q: 'What power supply does it need?', trace: 'grounded',
        reply: { k: 'answer', text: 'It needs a 12 V DC supply rated for at least 2 A. The installation guide gives an operating range of 10.8 to 13.2 V.', cites: ['Installation guide · p. 14'] } },
      { tag: 'Approved answer', q: 'What does error code E04 mean?', trace: 'faq',
        reply: { k: 'faq', text: 'E04 means the unit got too hot and paused itself. Switch it off, clear anything blocking the vents, and wait 10 minutes before restarting. If it happens again the same day, contact support.', cites: ['Troubleshooting · p. 41'] } },
      { tag: 'Asks first', q: 'How do I reset it?', trace: 'clarify',
        reply: { k: 'clarify', text: 'The manual describes two kinds of reset. Which one do you need?', options: [['restart', 'Restart, keep my settings'], ['factory', 'Factory reset, erase everything']] } },
      { tag: 'Step by step', q: 'How do I mount it on a wall?', trace: 'steps',
        reply: { k: 'steps', text: 'From the installation guide:', list: ['Hold the paper template against the wall and mark the four holes.', 'Drill 6 mm holes and push in the wall plugs.', 'Screw the bracket on with the four M5 screws.', 'Hook the unit onto the bracket and press until it clicks.'], cites: ['Installation guide · pp. 8–9'] } },
      { tag: 'Not in the manual', q: 'Can I use it outdoors in the rain?', trace: 'refuse',
        reply: { k: 'refuse', text: 'Outdoor use isn’t covered in our documentation, so I’d rather point you to someone than guess.' } },
      { tag: 'Failed the check', q: 'Will it work with my existing software?', trace: 'blocked',
        reply: { k: 'blocked', text: 'I found a page about connectivity, but it doesn’t confirm that, so I won’t guess. Our support team can check it for you.' } }
    ];
    var FOLLOW = {
      restart: { k: 'answer', text: 'Hold the power button for 3 seconds until the light goes off, then press it again. Your settings are kept.', cites: ['Operator manual · p. 21'] },
      factory: { k: 'steps', text: 'Factory reset, from the operator manual:', list: ['Switch the unit off.', 'Hold the RESET button and switch it on.', 'Keep holding for 10 seconds, until the light flashes amber.', 'Release. All settings are back to factory defaults.'], cites: ['Operator manual · p. 22'] }
    };
    var TR = {
      grounded: { title: 'Answered from one page', tone: 'ok', result: 'Shown, with its source', cost: 'One AI call, on your own key.',
        stages: [['FAQ check', 'No approved answer matches', 'skip'], ['Search the manual', '3 relevant passages found', 'pass'], ['Confidence gate', 'Strong match, safe to answer', 'pass'], ['Write the answer', 'Drafted from those passages only', 'pass'], ['Grounding check', 'Every claim found on p. 14', 'pass']] },
      faq: { title: 'Served from your approved answers', tone: 'ok', result: 'Served instantly', cost: 'No AI call at all.',
        stages: [['FAQ check', 'Matches an answer your team approved', 'pass'], ['Search the manual', 'Not needed', 'skip'], ['Confidence gate', 'Not needed', 'skip'], ['Write the answer', 'Not needed, served word for word', 'skip'], ['Grounding check', 'A person checked it when approving', 'skip']] },
      clarify: { title: 'Two good answers, so it asks', tone: 'info', result: 'Asked a clarifying question', cost: 'No AI call until they choose.',
        stages: [['FAQ check', 'No approved answer matches', 'skip'], ['Search the manual', 'Two different procedures found', 'pass'], ['Confidence gate', 'Ambiguous, asks before answering', 'warn'], ['Write the answer', 'Waiting for the visitor to choose', 'skip'], ['Grounding check', 'Runs after they choose', 'skip']] },
      steps: { title: 'A procedure, kept in order', tone: 'ok', result: 'Shown as a checklist', cost: 'Steps copied from the manual, not rewritten.',
        stages: [['FAQ check', 'No approved answer matches', 'skip'], ['Search the manual', 'Procedure found on pp. 8–9', 'pass'], ['Confidence gate', 'Strong match', 'pass'], ['Extract the steps', 'Copied in order, not rewritten', 'pass'], ['Grounding check', 'Each step found on its page', 'pass']] },
      refuse: { title: 'Nothing to stand on', tone: 'bad', result: 'Refused, with a route to a person', cost: 'No AI call made.',
        stages: [['FAQ check', 'No approved answer matches', 'skip'], ['Search the manual', 'No passage covers this', 'warn'], ['Confidence gate', 'Too weak to answer, stopped here', 'stop'], ['Write the answer', 'Never started', 'skip'], ['Grounding check', 'Not reached', 'skip']] },
      blocked: { title: 'Draft blocked before it was shown', tone: 'bad', result: 'Blocked, and told honestly', cost: 'One AI call. The draft was thrown away.',
        stages: [['FAQ check', 'No approved answer matches', 'skip'], ['Search the manual', '2 loosely related passages', 'pass'], ['Confidence gate', 'Close enough to try', 'pass'], ['Write the answer', 'Draft said “yes, compatible”', 'pass'], ['Grounding check', 'p. 31 doesn’t say that. Draft discarded', 'stop']] },
      restart: { title: 'Answered after asking', tone: 'ok', result: 'Shown, with its source', cost: 'One AI call, on your own key.',
        stages: [['Clarifying question', 'Visitor chose: restart', 'pass'], ['Search the manual', 'Restart procedure on p. 21', 'pass'], ['Confidence gate', 'Strong match', 'pass'], ['Write the answer', 'Drafted from p. 21 only', 'pass'], ['Grounding check', 'Every claim found on p. 21', 'pass']] },
      factory: { title: 'Answered after asking', tone: 'ok', result: 'Shown as a checklist', cost: 'Steps copied from the manual, not rewritten.',
        stages: [['Clarifying question', 'Visitor chose: factory reset', 'pass'], ['Search the manual', 'Reset procedure on p. 22', 'pass'], ['Confidence gate', 'Strong match', 'pass'], ['Extract the steps', 'Copied in order, not rewritten', 'pass'], ['Grounding check', 'Each step found on p. 22', 'pass']] }
    };
    var ICON = { pass: '✓', skip: '–', warn: '?', stop: '✕' };
    var LABEL = { pass: 'passed', skip: 'skipped', warn: 'uncertain', stop: 'stopped' };
    var qList = demo.querySelector('[data-questions]');
    var thread = demo.querySelector('[data-thread]');
    var traceBox = demo.querySelector('[data-trace]');
    var busy = false;
    var qButtons = [];

    function cites(box, list) { (list || []).forEach(function (c) { box.appendChild(el('span', 'cite', c + ' ↗')); }); }

    function renderReply(r) {
      var m = el('div', 'msg');
      if (r.k === 'faq') m.appendChild(el('span', 'approved', '✓ Approved by Acme support'));
      m.appendChild(el('span', null, r.text));
      if (r.k === 'steps') {
        var ol = el('ol', 'steps');
        r.list.forEach(function (s) { ol.appendChild(el('li', null, s)); });
        m.appendChild(ol);
      }
      cites(m, r.cites);
      thread.appendChild(m);
      if (r.k === 'clarify') {
        var box = el('div', 'choices');
        r.options.forEach(function (o) {
          var b = el('button', 'chip pick', o[1]);
          b.type = 'button';
          b.addEventListener('click', function () {
            if (busy) return;
            box.querySelectorAll('button').forEach(function (x) { x.disabled = true; x.className = 'chip done'; });
            send(o[1], FOLLOW[o[0]], o[0]);
          });
          box.appendChild(b);
        });
        thread.appendChild(box);
      }
      if (r.k === 'refuse' || r.k === 'blocked') {
        var acts = el('div', 'choices');
        if (r.k === 'refuse') acts.appendChild(el('span', 'label', 'What would you like to do?'));
        acts.appendChild(el('span', 'chip solid', r.k === 'refuse' ? 'Email support' : 'Ask support to confirm'));
        if (r.k === 'refuse') acts.appendChild(el('span', 'chip ghost', 'Try rewording my question'));
        thread.appendChild(acts);
      }
    }

    function renderTrace(key) {
      var t = TR[key];
      traceBox.innerHTML = '';
      traceBox.appendChild(el('span', 'eyebrow muted', 'Behind the answer'));
      traceBox.appendChild(el('h3', null, t.title));
      var ol = el('ol', 'stages');
      t.stages.forEach(function (s) {
        var li = el('li');
        var ic = el('span', 'st ' + s[2], ICON[s[2]]);
        ic.setAttribute('aria-label', LABEL[s[2]]);
        var txt = el('span');
        txt.appendChild(el('b', null, s[0]));
        txt.appendChild(el('small', null, s[1]));
        li.appendChild(ic); li.appendChild(txt);
        ol.appendChild(li);
      });
      traceBox.appendChild(ol);
      var res = el('div', 'result ' + t.tone);
      res.appendChild(el('b', null, t.result));
      res.appendChild(el('small', null, t.cost));
      traceBox.appendChild(res);
    }

    function scrollDown() { thread.scrollTop = thread.scrollHeight; }

    function send(userText, reply, traceKey) {
      busy = true;
      thread.appendChild(el('div', 'msg user', userText));
      var typing = el('div', 'msg typing');
      var dots = el('span', 'dots'); dots.innerHTML = '<i></i><i></i><i></i>';
      typing.appendChild(dots); typing.appendChild(document.createTextNode('Checking the manual…'));
      thread.appendChild(typing);
      scrollDown();
      setTimeout(function () {
        typing.remove();
        renderReply(reply);
        renderTrace(traceKey);
        busy = false;
        scrollDown();
      }, 800);
    }

    function select(i) { qButtons.forEach(function (b, j) { b.setAttribute('aria-pressed', String(i === j)); }); }

    function reset() {
      thread.innerHTML = '';
      renderReply({ k: 'answer', text: 'Hi! Ask me anything about the Sample product. I’ll show you the page each answer comes from.' });
      thread.appendChild(el('div', 'msg user', OUT[0].q));
      renderReply(OUT[0].reply);
      renderTrace('grounded');
      select(0);
      scrollDown();
    }

    OUT.forEach(function (o, i) {
      var b = el('button', 'q');
      b.type = 'button';
      b.appendChild(el('span', 'tag', o.tag));
      b.appendChild(el('span', null, o.q));
      b.addEventListener('click', function () {
        if (busy) return;
        select(i);
        send(o.q, o.reply, o.trace);
      });
      qList.appendChild(b);
      qButtons.push(b);
    });
    var again = el('button', 'linklike', 'Start over');
    again.type = 'button';
    again.addEventListener('click', function () { if (!busy) reset(); });
    qList.appendChild(again);
    reset();
  }

  // ---- ROI calculator ----
  var roi = document.querySelector('[data-roi]');
  if (roi) {
    var inputs = roi.querySelectorAll('input[type=range]');
    var update = function () {
      var v = {};
      inputs.forEach(function (i) { v[i.name] = Number(i.value); });
      roi.querySelector('[data-out=tickets]').textContent = v.tickets.toLocaleString('en-US');
      roi.querySelector('[data-out=pct]').textContent = v.pct + '%';
      roi.querySelector('[data-out=cost]').textContent = '$' + v.cost;
      var deflected = Math.round(v.tickets * v.pct / 100 * 0.5);
      roi.querySelector('[data-out=saving]').textContent = money(deflected * v.cost);
      roi.querySelector('[data-out=deflected]').textContent = deflected.toLocaleString('en-US');
    };
    inputs.forEach(function (i) { i.addEventListener('input', update); });
    update();
  }

  // ---- Monthly / annual switch on pricing ----
  document.querySelectorAll('[data-period]').forEach(function (group) {
    var btns = group.querySelectorAll('button');
    btns.forEach(function (b) {
      b.addEventListener('click', function () {
        var annual = b.getAttribute('data-value') === 'annual';
        btns.forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); });
        document.querySelectorAll('[data-monthly]').forEach(function (p) {
          p.textContent = annual ? p.getAttribute('data-annual') : p.getAttribute('data-monthly');
        });
        document.querySelectorAll('[data-per]').forEach(function (p) { p.textContent = annual ? '/ year' : '/ month'; });
      });
    });
  });

  // ---- Get started: live order summary ----
  var co = document.querySelector('[data-checkout]');
  if (co) {
    var PRICES = { starter: [199, 1990], pro: [599, 5990] };
    var HOST = [149, 1490];
    var NAMES = { starter: 'Starter', pro: 'Professional' };
    var refresh = function () {
      var plan = co.querySelector('input[name=plan]:checked').value;
      var annual = co.querySelector('input[name=period]:checked').value === 'annual';
      var hosting = co.querySelector('input[name=hosting]').checked;
      var setup = co.querySelector('input[name=setup]').checked;
      var paid = plan !== 'trial';
      co.querySelector('[data-paid-only]').hidden = !paid;
      co.querySelector('[data-details-label]').textContent = paid ? '3 · Your details' : '2 · Your details';
      co.querySelectorAll('[data-plan-price]').forEach(function (s) {
        var p = PRICES[s.getAttribute('data-plan-price')];
        s.textContent = annual ? money(p[1]) + ' / year' : money(p[0]) + ' / month';
      });
      var lines = co.querySelector('[data-lines]');
      lines.innerHTML = '';
      var add = function (a, b) { var r = el('div', 'sum-line'); r.appendChild(el('span', null, a)); r.appendChild(el('span', null, b)); lines.appendChild(r); };
      var cta = co.querySelector('[data-cta]');
      if (!paid) {
        add('14-day trial licence', '$0'); add('Installer download', 'Included');
        co.querySelector('[data-due]').textContent = '$0';
        co.querySelector('[data-then]').textContent = 'After 14 days the widget pauses until you choose a plan. Nothing is charged automatically.';
        cta.textContent = 'Email me my trial licence';
        cta.href = 'welcome.html?trial=1';
      } else {
        var per = annual ? 'year' : 'month';
        var base = PRICES[plan][annual ? 1 : 0];
        var host = HOST[annual ? 1 : 0];
        add(NAMES[plan] + ' licence, per ' + per, money(base));
        if (hosting) add('Managed hosting, per ' + per, money(host));
        if (setup) add('Setup & onboarding', 'Quoted later');
        var total = base + (hosting ? host : 0);
        co.querySelector('[data-due]').textContent = money(total);
        co.querySelector('[data-then]').textContent = 'Then ' + money(total) + ' every ' + per + ' until you cancel. Updates and support included.';
        cta.textContent = 'Continue to secure payment';
        cta.href = 'welcome.html';
      }
    };
    co.addEventListener('change', refresh);
    var pre = new URLSearchParams(location.search).get('plan');
    if (pre) { var r = co.querySelector('input[name=plan][value="' + pre + '"]'); if (r) r.checked = true; }
    refresh();
  }

  // ---- Welcome: trial or paid ----
  var wel = document.querySelector('[data-welcome]');
  if (wel && new URLSearchParams(location.search).get('trial')) {
    wel.querySelector('[data-headline]').textContent = 'Your 14-day trial is ready.';
    wel.querySelector('[data-planline]').textContent = 'Trial · ends in 14 days';
    wel.querySelector('[data-key]').textContent = 'GO-TRL-4M8C-J2PX-7VQE-1KSD';
  }
  document.querySelectorAll('[data-copy]').forEach(function (b) {
    b.addEventListener('click', function () {
      var src = document.querySelector(b.getAttribute('data-copy'));
      if (!src || !navigator.clipboard) return;
      navigator.clipboard.writeText(src.textContent.trim()).then(function () {
        var old = b.textContent; b.textContent = 'Copied'; setTimeout(function () { b.textContent = old; }, 1500);
      }).catch(function () {});
    });
  });
})();
