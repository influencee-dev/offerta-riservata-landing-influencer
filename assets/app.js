/* Animazioni condivise. Rispetta prefers-reduced-motion. */
(function () {
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  /* Reveal allo scroll */
  var rv = $('.rv');
  if (reduce || !('IntersectionObserver' in window)) {
    rv.forEach(function (e) { e.classList.add('in'); });
  } else {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { threshold: 0.15, rootMargin: '0px 0px -6% 0px' });
    rv.forEach(function (e) { io.observe(e); });
  }

  /* Count-up sui prezzi */
  function fmt(n) { return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.'); }
  function count(el) {
    var to = parseInt(el.getAttribute('data-count'), 10), pre = el.getAttribute('data-prefix') || '';
    if (reduce) { el.textContent = pre + fmt(to); return; }
    var t0 = null, dur = 1100;
    function step(t) {
      if (!t0) t0 = t;
      var p = Math.min((t - t0) / dur, 1), e = 1 - Math.pow(1 - p, 3);
      el.textContent = pre + fmt(Math.round(to * e));
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }
  var cs = $('[data-count]');
  if ('IntersectionObserver' in window) {
    var io2 = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { count(e.target); io2.unobserve(e.target); } });
    }, { threshold: 0.6 });
    cs.forEach(function (e) { io2.observe(e); });
  } else { cs.forEach(count); }

  /* Countdown: Black Friday 2026 (27 nov), poi Natale (25 dic) */
  var cd = document.getElementById('cd');
  if (cd) {
    var bf = new Date('2026-11-27T00:00:00+01:00'), nat = new Date('2026-12-25T00:00:00+01:00');
    var lab = document.getElementById('cd-label');
    var tick = function () {
      var now = new Date(), target = now < bf ? bf : nat;
      if (now >= nat) { cd.style.display = 'none'; return; }
      if (lab) lab.textContent = now < bf ? 'Black Friday tra' : 'Natale tra';
      var s = Math.max(0, Math.floor((target - now) / 1000));
      var v = [Math.floor(s / 86400), Math.floor(s % 86400 / 3600), Math.floor(s % 3600 / 60), s % 60];
      $('[data-u]', cd).forEach(function (n, i) { n.textContent = String(v[i]).padStart(2, '0'); });
    };
    tick(); setInterval(tick, 1000);
  }

  /* Luce che segue il mouse + tilt sulle card */
  if (!reduce) {
    var root = document.documentElement;
    window.addEventListener('pointermove', function (e) {
      root.style.setProperty('--mx', e.clientX + 'px');
      root.style.setProperty('--my', e.clientY + 'px');
    }, { passive: true });
    $('.tilt').forEach(function (el) {
      el.addEventListener('pointermove', function (e) {
        var r = el.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
        el.style.transform = 'perspective(800px) rotateY(' + (x * 8) + 'deg) rotateX(' + (-y * 8) + 'deg) translateY(-4px)';
      });
      el.addEventListener('pointerleave', function () { el.style.transform = ''; });
    });
  }

  /* Barra CTA mobile dopo l'hero */
  var bar = document.querySelector('.sticky-cta');
  if (bar) {
    var onScroll = function () { bar.classList.toggle('show', window.scrollY > window.innerHeight * .7); };
    window.addEventListener('scroll', onScroll, { passive: true }); onScroll();
  }
})();
