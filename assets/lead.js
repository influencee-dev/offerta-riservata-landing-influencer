/* Modulo contatto prima di WhatsApp / email. Salva il contatto via /api/lead (Brevo), poi apre il canale scelto.
   Senza JavaScript i link funzionano normalmente. */
(function () {
  var meta = function (n) { var m = document.querySelector('meta[name="' + n + '"]'); return m ? m.getAttribute('content') : ''; };
  var OFFER = meta('lead-offer'), BRAND = meta('lead-brand') || 'noi', WHO = meta('lead-who') || 'il nostro referente';
  var ref = (new URLSearchParams(location.search).get('ref') || '').slice(0, 60);
  var modal, form, target, channel, openedAt, lastFocus;

  function build() {
    modal = document.createElement('div');
    modal.className = 'lm';
    modal.setAttribute('hidden', '');
    modal.innerHTML =
      '<div class="lm-bg" data-close></div>' +
      '<div class="lm-box" role="dialog" aria-modal="true" aria-labelledby="lm-t">' +
      '<button type="button" class="lm-x" data-close aria-label="Chiudi">×</button>' +
      '<h3 id="lm-t">Ricevi le informazioni</h3>' +
      '<p class="lm-s">Lascia i tuoi dati: ' + WHO + ' ti ricontatta. Poi continui su <b class="lm-ch">WhatsApp</b>.</p>' +
      '<form novalidate>' +
      '<label>Nome<input name="nome" autocomplete="name" required maxlength="80"></label>' +
      '<label>Email<input name="email" type="email" autocomplete="email" required maxlength="120"></label>' +
      '<label>Telefono <small>(facoltativo)</small><input name="telefono" type="tel" autocomplete="tel" maxlength="25"></label>' +
      '<div class="lm-hp" aria-hidden="true"><label>Sito<input name="website" tabindex="-1" autocomplete="off"></label></div>' +
      '<label class="lm-c"><input type="checkbox" name="privacy" required><span>Ho letto la <a href="privacy.html" target="_blank" rel="noopener">Privacy Policy</a> e voglio essere ricontattato per questa offerta.</span></label>' +
      '<label class="lm-c"><input type="checkbox" name="marketing"><span>Voglio ricevere altre offerte e novità da ' + BRAND + ' via email <small>(facoltativo)</small>.</span></label>' +
      '<p class="lm-e" role="alert" hidden></p>' +
      '<button type="submit" class="lm-go">Continua</button>' +
      '</form></div>';
    document.body.appendChild(modal);
    form = modal.querySelector('form');
    modal.addEventListener('click', function (e) { if (e.target.hasAttribute('data-close')) close(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !modal.hasAttribute('hidden')) close(); });
    form.addEventListener('submit', submit);
  }

  function open(href, ch) {
    if (!modal) build();
    target = href; channel = ch; openedAt = Date.now(); lastFocus = document.activeElement;
    modal.querySelector('.lm-ch').textContent = ch === 'email' ? 'la tua email' : 'WhatsApp';
    modal.querySelector('.lm-go').textContent = ch === 'email' ? 'Continua via email →' : 'Continua su WhatsApp →';
    showErr('');
    modal.removeAttribute('hidden');
    document.documentElement.classList.add('lm-open');
    setTimeout(function () { form.nome.focus(); }, 30);
  }
  function close() {
    modal.setAttribute('hidden', '');
    document.documentElement.classList.remove('lm-open');
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }
  function showErr(t) { var e = modal.querySelector('.lm-e'); e.textContent = t; if (t) e.removeAttribute('hidden'); else e.setAttribute('hidden', ''); }

  function submit(ev) {
    ev.preventDefault();
    var f = form, nome = f.nome.value.trim(), email = f.email.value.trim(), tel = f.telefono.value.trim();
    if (nome.length < 2) { showErr('Inserisci il tuo nome.'); f.nome.focus(); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) { showErr('Controlla l\'indirizzo email.'); f.email.focus(); return; }
    if (tel && !/^[+0-9 ().-]{6,25}$/.test(tel)) { showErr('Il telefono sembra non valido.'); f.telefono.focus(); return; }
    if (!f.privacy.checked) { showErr('Per continuare serve la presa visione della Privacy Policy.'); return; }
    var btn = f.querySelector('.lm-go'); btn.disabled = true; btn.textContent = 'Un attimo…';
    var body = { nome: nome, email: email, telefono: tel, privacy: true, marketing: f.marketing.checked, website: f.website.value,
      channel: channel, offer: OFFER, ref: ref, elapsed: Date.now() - openedAt };
    var done = false, go = function () { if (done) return; done = true; location.href = target; };
    var timer = setTimeout(go, 5000); // se la rete è lenta, non facciamo aspettare: apriamo comunque il canale
    fetch('/api/lead', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      .then(function () { clearTimeout(timer); go(); }, function () { clearTimeout(timer); go(); });
  }

  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href]');
    if (!a || a.closest('.lm')) return;
    var h = a.getAttribute('href') || '';
    if (/^https:\/\/wa\.me\//.test(h)) { e.preventDefault(); open(h, 'whatsapp'); }
    else if (/^mailto:/.test(h)) { e.preventDefault(); open(h, 'email'); }
  });
})();
