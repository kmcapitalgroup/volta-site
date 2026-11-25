// Maquettes animées du site Volta. Chaque scène tourne en boucle tant
// qu'elle est visible, et se met en pause hors de l'écran.
(() => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const $ = (root, sel) => root.querySelector(sel);
  const $$ = (root, sel) => [...root.querySelectorAll(sel)];

  // Apparition au défilement
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
  }, { threshold: 0.15 });
  $$(document, '.reveal').forEach((el) => io.observe(el));

  // Visibilité de chaque scène
  const visible = new Map();
  const waiters = new Map();
  const seen = new IntersectionObserver((entries) => {
    for (const e of entries) {
      visible.set(e.target, e.isIntersecting);
      if (e.isIntersecting && waiters.has(e.target)) { waiters.get(e.target)(); waiters.delete(e.target); }
    }
  }, { threshold: 0.25 });
  const whenVisible = (el) => visible.get(el) ? Promise.resolve() : new Promise((r) => waiters.set(el, r));
  const watch = (el) => { seen.observe(el); return el; };

  const bump = (el, text) => {
    el.textContent = text;
    el.classList.remove('bump'); void el.offsetWidth; el.classList.add('bump');
  };

  // ---------- Le banc et la tribune ----------
  const live = document.getElementById('live');
  if (live) {
    watch(live);
    const bench = $(live, '.bench .screen');
    const stand = $(live, '.stand .screen');
    const tap = $(bench, '[data-tap]');
    const sheet = $(bench, '[data-sheet]');
    const sheetTitle = $(bench, '[data-sheet-title]');
    const goal = $(stand, '[data-goal]');
    const toast = $(stand, '[data-toast]');
    const steps = $$(document, '#steps li');
    const feeds = { bench: $(bench, '[data-feed]'), stand: $(stand, '[data-feed]') };
    const initialFeed = feeds.bench.innerHTML;
    const chip = (p) => $(bench, `[data-p="${p}"]`);
    const reacts = $$(stand, '[data-r]');

    const step = (n) => steps.forEach((li) => li.classList.toggle('on', +li.dataset.step === n));
    const setMin = (m) => $$(live, '[data-min]').forEach((el) => { el.textContent = `${m}’`; });
    const setScore = (home, away, animate) => {
      $$(live, '[data-home]').forEach((el) => animate && el.textContent !== String(home) ? bump(el, home) : (el.textContent = home));
      $$(live, '[data-away]').forEach((el) => { el.textContent = away; });
    };
    const addEvent = (min, dot, text) => {
      for (const feed of Object.values(feeds)) {
        const ev = document.createElement('div');
        ev.className = 'ev new';
        ev.innerHTML = `<em>${min}’</em><i class="dot ${dot}"></i>${text}`;
        feed.prepend(ev);
        while (feed.children.length > 3) feed.lastElementChild.remove();
      }
    };
    const tapOn = async (el) => {
      const s = bench.getBoundingClientRect();
      const r = el.getBoundingClientRect();
      tap.style.left = `${r.left - s.left + r.width / 2}px`;
      tap.style.top = `${r.top - s.top + r.height / 2}px`;
      tap.classList.add('show');
      await sleep(520);
      tap.classList.remove('hit'); void tap.offsetWidth; tap.classList.add('hit');
      el.classList.add('pressed');
      await sleep(380);
      el.classList.remove('pressed');
    };
    const cheer = (ms) => {
      const end = Date.now() + ms;
      const t = setInterval(() => {
        const el = reacts[Math.floor(Math.random() * reacts.length)];
        el.textContent = +el.textContent + 1 + Math.floor(Math.random() * 3);
        el.classList.remove('pop'); void el.offsetWidth; el.classList.add('pop');
        if (Date.now() > end) clearInterval(t);
      }, 180);
    };
    const reset = () => {
      setScore(1, 1); setMin(52);
      feeds.bench.innerHTML = initialFeed; feeds.stand.innerHTML = initialFeed;
      chip('royer').classList.remove('has-b'); chip('girard').classList.remove('has-y');
      toast.classList.remove('show'); goal.classList.remove('show'); sheet.classList.remove('open');
      tap.classList.remove('show');
      [18, 9, 6].forEach((n, i) => { reacts[i].textContent = n; });
      step(0);
    };
    const action = async (player, title, act) => {
      step(1);
      await tapOn(chip(player));
      sheetTitle.textContent = title;
      sheet.classList.add('open');
      await sleep(650);
      step(2);
      await tapOn($(bench, `[data-act="${act}"]`));
      sheet.classList.remove('open');
      tap.classList.remove('show');
      await sleep(250);
    };

    const run = async () => {
      if (reduce) { setScore(2, 1); setMin(54); step(3); return; }
      for (;;) {
        await whenVisible(live);
        reset();
        await sleep(900); setMin(53); await sleep(700);
        await action('royer', '8 · Noah Royer', 'but');
        setMin(54); setScore(2, 1, true); chip('royer').classList.add('has-b');
        addEvent(54, 'v', 'But de Noah Royer');
        step(3);
        await sleep(250);
        goal.classList.add('show'); cheer(2600);
        await sleep(2900);
        goal.classList.remove('show');
        await sleep(1300); setMin(55); await sleep(900);
        await action('girard', '4 · Tom Girard', 'jaune');
        setMin(56); chip('girard').classList.add('has-y');
        addEvent(56, 'y', 'Carton jaune pour Tom Girard');
        step(3);
        toast.classList.add('show');
        await sleep(3000);
        toast.classList.remove('show');
        await sleep(1500);
      }
    };
    run();
  }

  // ---------- La carte joueur ----------
  const cardPhone = document.getElementById('cardPhone');
  if (cardPhone) {
    watch(cardPhone);
    const card = $(cardPhone, '[data-card]');
    const segs = $$(cardPhone, '[data-seg]');
    const players = [
      { rate: 84, pos: 'MG', no: 'n°8', av: 'NR', name: 'ROYER', stats: [93, 612, 4, 3, 88, 2], foot: 'Titulaire · milieu gauche · 4-3-3', pills: ['4 buts cette saison', '3 passes décisives', '2 fois joueur du match'], silver: false },
      { rate: 71, pos: 'AIL', no: 'n°13', av: 'MD', name: 'DIALLO', stats: [54, 233, 1, 1, 79, 0], foot: 'Remplaçant · entrée prévue en 2e période', pills: ['1 but cette saison', '1 passe décisive', 'Série de 4 présences'], silver: true },
    ];
    let tilt = { x: 0, y: 0 };
    let flipping = false;
    const apply = () => {
      card.style.transform = flipping ? 'rotateY(90deg) scale(.9)' : `rotateX(${tilt.y}deg) rotateY(${tilt.x}deg)`;
    };
    if (!reduce) {
      cardPhone.addEventListener('pointermove', (e) => {
        const r = card.getBoundingClientRect();
        tilt = { x: ((e.clientX - r.left) / r.width - 0.5) * 22, y: -((e.clientY - r.top) / r.height - 0.5) * 18 };
        apply();
      });
      cardPhone.addEventListener('pointerleave', () => { tilt = { x: 0, y: 0 }; apply(); });
    }
    const countUp = () => {
      const els = $$(card, '[data-count]');
      const start = performance.now();
      const frame = (now) => {
        const k = Math.min(1, (now - start) / 900);
        const e = 1 - Math.pow(1 - k, 3);
        els.forEach((el) => { el.textContent = Math.round(+el.dataset.count * e); });
        if (k < 1) requestAnimationFrame(frame);
      };
      requestAnimationFrame(frame);
    };
    const show = (i) => {
      const p = players[i];
      $(card, '.pc-rate').dataset.count = p.rate;
      $(card, '[data-pos]').textContent = p.pos;
      $(card, '[data-no]').textContent = p.no;
      $(card, '[data-av]').textContent = p.av;
      $(card, '[data-name]').textContent = p.name;
      $$(card, '.pc-stats b').forEach((b, j) => { b.dataset.count = p.stats[j]; });
      $(cardPhone, '[data-foot]').textContent = p.foot;
      $(cardPhone, '[data-pills]').innerHTML = p.pills.map((t) => `<span>${t}</span>`).join('');
      card.classList.toggle('silver', p.silver);
      segs.forEach((s, j) => s.classList.toggle('on', j === i));
    };
    const run = async () => {
      if (reduce) return;
      let i = 0;
      for (;;) {
        await whenVisible(cardPhone);
        countUp();
        await sleep(4200);
        flipping = true; apply();
        await sleep(260);
        i = 1 - i; show(i);
        flipping = false; apply();
      }
    };
    run();
  }

  // ---------- Le récap du dimanche ----------
  const story = document.getElementById('story');
  if (story) {
    watch(story);
    const img = $(story, '[data-story]');
    const bars = $(story, '[data-bars]');
    const n = 9;
    const srcs = Array.from({ length: n }, (_, i) => `img/recap-${i + 1}.webp`);
    srcs.forEach((s) => { const im = new Image(); im.src = s; });
    bars.innerHTML = '<i></i>'.repeat(n);
    const items = [...bars.children];
    let idx = 0, t0 = 0, skip = false;
    const dur = 2600;
    story.addEventListener('click', () => { skip = true; });
    const go = (i) => {
      idx = i % n;
      img.style.opacity = 0;
      setTimeout(() => { img.src = srcs[idx]; img.style.opacity = 1; }, 160);
      items.forEach((b, j) => b.style.setProperty('--p', j < idx ? '100%' : '0%'));
      t0 = performance.now();
    };
    if (!reduce) {
      go(0);
      const frame = (now) => {
        if (visible.get(story)) {
          const k = (now - t0) / dur;
          items[idx].style.setProperty('--p', `${Math.min(100, k * 100)}%`);
          if (k >= 1 || skip) { skip = false; go(idx + 1); }
        } else {
          t0 = now - ((parseFloat(items[idx].style.getPropertyValue('--p')) || 0) / 100) * dur;
        }
        requestAnimationFrame(frame);
      };
      requestAnimationFrame(frame);
    }
  }

  // ---------- Le chat modéré ----------
  const chat = document.getElementById('chat');
  if (chat) {
    watch(chat);
    const box = $(chat, '[data-msgs]');
    const typing = $(chat, '[data-typing]');
    const blocked = $(chat, '[data-blocked]');
    const screen = $(chat, '.screen');
    const block = (on) => { blocked.classList.toggle('show', on); screen.classList.toggle('blocking', on); };
    const add = (html, cls = '') => {
      const m = document.createElement('div');
      m.className = `msg ${cls}`;
      m.innerHTML = html;
      box.append(m);
      while (box.children.length > 4) box.firstElementChild.remove();
      return m;
    };
    const other = async (who, text) => {
      const t = add(`<small>${who}</small><p><i></i><i></i><i></i></p>`, 'typing');
      await sleep(1100);
      t.remove();
      add(`<small>${who}</small><p>${text}</p>`);
    };
    const type = async (text) => {
      typing.textContent = '';
      for (const ch of text) { typing.textContent += ch; await sleep(ch === ' ' ? 70 : 45); }
      await sleep(450);
      typing.textContent = '';
    };
    const run = async () => {
      if (reduce) {
        add('<small>Coach Thomas</small><p>Séance de jeudi décalée à 18h30, terrain synthétique 2.</p>');
        add('<p>Terrain de <span class="mask">✱✱✱✱✱</span>, on glisse partout 😅</p><span class="flag">1 mot masqué</span>', 'me');
        block(true);
        return;
      }
      for (;;) {
        await whenVisible(chat);
        box.innerHTML = '';
        block(false);
        await sleep(500);
        await other('Coach Thomas', 'Séance de jeudi décalée à 18h30, terrain synthétique 2.');
        await sleep(700);
        await other('Rayan Benali', 'Ok coach, bien reçu 👍');
        await sleep(600);
        await type('Terrain de merde, on glisse partout 😅');
        add('<p>Terrain de <span class="mask">✱✱✱✱✱</span>, on glisse partout 😅</p><span class="flag">1 mot masqué</span>', 'me');
        await sleep(1600);
        await type('Lucas écris-moi au 06 12 34 56 78');
        block(true);
        await sleep(3200);
        block(false);
        await sleep(800);
      }
    };
    run();
  }
})();
