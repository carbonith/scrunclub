/* SC Run Club — link-in-bio
   Conteúdo em /_data/content.json. Zero dependências. */
(() => {
  'use strict';

  const $ = (s, r = document) => r.querySelector(s);
  const el = (t, c, txt) => { const n = document.createElement(t); if (c) n.className = c; if (txt != null) n.textContent = txt; return n; };
  const ok = (v) => typeof v === 'string' && v.length > 0 && !v.startsWith('TROCAR');
  const track = (name, params = {}) => { if (typeof window.gtag === 'function') window.gtag('event', name, params); };

  const ICONS = {
    instagram: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2c2.7 0 3.1 0 4.1.06 1.1.05 1.8.22 2.4.46.7.27 1.2.63 1.7 1.15.5.5.9 1 1.15 1.7.24.6.4 1.3.46 2.4C22 8.9 22 9.3 22 12s0 3.1-.06 4.1c-.05 1.1-.22 1.8-.46 2.4a4.6 4.6 0 0 1-1.15 1.7c-.5.5-1 .9-1.7 1.15-.6.24-1.3.4-2.4.46C15.1 22 14.7 22 12 22s-3.1 0-4.1-.06c-1.1-.05-1.8-.22-2.4-.46a4.6 4.6 0 0 1-1.7-1.15 4.6 4.6 0 0 1-1.15-1.7c-.24-.6-.4-1.3-.46-2.4C2 15.1 2 14.7 2 12s0-3.1.06-4.1c.05-1.1.22-1.8.46-2.4A4.6 4.6 0 0 1 3.67 3.8 4.6 4.6 0 0 1 5.37 2.6c.6-.24 1.3-.4 2.4-.46C8.9 2 9.3 2 12 2Zm0 5a5 5 0 1 0 0 10 5 5 0 0 0 0-10Zm0 2a3 3 0 1 1 0 6 3 3 0 0 1 0-6Zm5.5-3.2a1.2 1.2 0 1 0 0 2.4 1.2 1.2 0 0 0 0-2.4Z"/></svg>',
    strava: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M13.8 2 8 13.4h3.4L13.8 8.7l2.4 4.7h3.4L13.8 2Zm2.4 11.4-1.8 3.5-1.8-3.5h-2.7l4.5 8.6 4.5-8.6h-2.7Z"/></svg>',
    tiktok: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M16.6 5.8a5 5 0 0 1-1.1-2.8h-3v12a2.6 2.6 0 1 1-1.9-2.5V9.4a5.6 5.6 0 1 0 4.9 5.6V9.3a8 8 0 0 0 4.2 1.2V7.6a4.8 4.8 0 0 1-3.1-1.8Z"/></svg>',
    mail: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 5h18a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1Zm9 8L4.2 7.2v.1L12 12.9l7.8-5.6v-.1L12 13Z"/></svg>'
  };

  let D = null, lastFocus = null;
  const overlay = $('#overlay'), sheet = $('#sheet'),
        sheetTitle = $('#sheetTitle'), sheetBody = $('#sheetBody');

  /* ============ ANALYTICS ============ */
  function initGA(id) {
    if (!ok(id)) return;
    const s = document.createElement('script');
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(id);
    document.head.appendChild(s);
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    window.gtag('js', new Date());
    window.gtag('config', id, { anonymize_ip: true });
  }

  /* ============ RENDER ============ */
  function render() {
    const p = D.perfil;

    $('#avatar').src = p.avatar || '/assets/logo.svg';
    $('#avatar').alt = 'Logo do ' + p.nome;
    $('#subtitle').textContent = p.subtitulo || '';
    $('#bio').textContent = p.bio || '';

    if (D.destaque && D.destaque.ativo) {
      const n = $('#notice');
      n.textContent = D.destaque.texto;
      n.href = D.destaque.href || '#cards';
      n.hidden = false;
    }

    if (ok(p.hero)) {
      $('#heroImg').src = p.hero;
      $('#heroImg').alt = p.heroAlt || '';
      $('#hero').hidden = false;
    }

    const nav = $('#socials');
    (D.sociais || []).forEach(s => {
      if (s.ativo === false || !ok(s.href)) return;
      const a = el('a');
      a.href = s.href;
      a.setAttribute('aria-label', s.label);
      a.title = s.label;
      if (!s.href.startsWith('mailto:')) { a.target = '_blank'; a.rel = 'noopener'; }
      a.innerHTML = ICONS[s.icone] || '';
      a.addEventListener('click', () => track('click_social', { rede: s.id }));
      nav.appendChild(a);
    });

    const pills = $('#pills');
    (D.atalhos || []).forEach(t => {
      if (!ok(t.href)) return;
      const a = el('a', null, t.label);
      a.href = t.href;
      if (/^https?:/.test(t.href)) { a.target = '_blank'; a.rel = 'noopener'; }
      a.addEventListener('click', () => track(t.evento || 'click_pill', { label: t.label }));
      pills.appendChild(a);
    });

    const box = $('#cards');
    box.classList.remove('skeleton');
    (D.cards || []).forEach(c => box.appendChild(buildCard(c)));

    $('#copyright').textContent = D.footer.copyright;
    $('#linkPriv').href = D.footer.privacidade;
    const ct = $('#linkContato');
    if (ok(D.footer.contato)) ct.href = D.footer.contato; else ct.remove();
  }

  function buildCard(c) {
    const isLink = c.tipo === 'link' && ok(c.href);
    const node = isLink ? el('a', 'card') : el('button', 'card');
    node.id = 'card-' + c.id;

    if (isLink) {
      node.href = c.href; node.target = '_blank'; node.rel = 'noopener';
    } else {
      node.type = 'button';
    }

    const img = el('img', 'thumb');
    img.src = c.icone || '/assets/logo.svg';
    img.alt = '';
    img.loading = 'lazy';
    img.width = 56; img.height = 56;

    const mid = el('div');
    mid.appendChild(el('h2', null, c.titulo));
    if (c.descricao) mid.appendChild(el('p', null, c.descricao));

    node.append(img, mid, el('span', 'cta', c.cta || 'Abrir'));

    node.addEventListener('click', () => {
      track('click_card', { card_id: c.id, card_titulo: c.titulo });
      if (c.tipo === 'modal') openInfo(c.modal, c.titulo);
      else if (c.tipo === 'form') openForm(c.formVariante || 'reserva', c.titulo);
    });

    return node;
  }

  /* ============ MODAL: infra ============ */
  function openSheet(titulo) {
    lastFocus = document.activeElement;
    sheetTitle.textContent = titulo;
    sheetBody.replaceChildren();
    overlay.hidden = false;
    document.body.style.overflow = 'hidden';
    setTimeout(() => $('#closeBtn').focus(), 30);
  }

  function closeSheet() {
    overlay.hidden = true;
    document.body.style.overflow = '';
    sheetBody.replaceChildren();
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  $('#closeBtn').addEventListener('click', closeSheet);
  overlay.addEventListener('mousedown', e => { if (e.target === overlay) closeSheet(); });
  document.addEventListener('keydown', e => {
    if (overlay.hidden) return;
    if (e.key === 'Escape') { closeSheet(); return; }
    if (e.key !== 'Tab') return;
    const f = sheet.querySelectorAll('a[href],button:not([disabled]),input:not([type="hidden"]),select,textarea');
    if (!f.length) return;
    const first = f[0], last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  });

  /* ============ MODAL: conteúdos ============ */
  function openInfo(tipo, fallbackTitulo) {
    if (tipo === 'guia') {
      const g = D.guia;
      openSheet(g.titulo || fallbackTitulo);
      sheetBody.appendChild(listaSimples(g.itens));
      sheetBody.appendChild(botaoPill('Quero participar 👟', D.comunidade.whatsapp, 'click_whatsapp'));
    }

    else if (tipo === 'programas') {
      const pr = D.programas;
      openSheet(pr.titulo || fallbackTitulo);
      const ul = el('ul', 'list');
      (pr.itens || []).forEach(i => {
        const li = el('li');
        li.appendChild(el('strong', null, i.nome));
        li.appendChild(el('span', null, i.detalhe));
        ul.appendChild(li);
      });
      sheetBody.appendChild(ul);
      sheetBody.appendChild(botaoPill('Reservar meu treino', null, null, () => openForm('reserva', 'Reserve seu treino')));
    }

    else if (tipo === 'unidades') {
      openSheet(fallbackTitulo);
      const ul = el('ul', 'list');
      (D.unidades || []).forEach(u => {
        const li = el('li');
        const a = el('a', null, u.nome);
        a.href = u.mapsUrl; a.target = '_blank'; a.rel = 'noopener';
        a.addEventListener('click', () => track('click_maps', { unidade: u.nome }));
        li.appendChild(el('strong')).appendChild(a);
        li.appendChild(el('span', null, u.detalhe));
        ul.appendChild(li);
      });
      sheetBody.appendChild(ul);
    }

    else if (tipo === 'comunidade') {
      openSheet(fallbackTitulo);
      sheetBody.appendChild(el('p', 'hint',
        D.encontro.diaSemana + ', ' + D.encontro.horario + ' — ' + D.encontro.endereco + '. ' + D.encontro.observacao));
      if (ok(D.comunidade.whatsapp)) sheetBody.appendChild(botaoPill('Entrar no grupo do WhatsApp 💬', D.comunidade.whatsapp, 'click_whatsapp'));
      if (ok(D.comunidade.strava))   sheetBody.appendChild(botaoPill('Seguir o clube no Strava 🏃', D.comunidade.strava, 'click_strava'));
      sheetBody.appendChild(botaoPill('Inscrever no próximo encontro', null, null, () => openForm('reserva', 'Próximo encontro')));
    }
  }

  function listaSimples(itens) {
    const ul = el('ul', 'list');
    (itens || []).forEach(t => ul.appendChild(el('li', null, t)));
    return ul;
  }

  function botaoPill(label, href, evento, onClick) {
    const b = href ? el('a', 'btn', label) : el('button', 'btn', label);
    if (href) { b.href = href; b.target = '_blank'; b.rel = 'noopener'; }
    else b.type = 'button';
    b.style.display = 'block';
    b.style.textAlign = 'center';
    b.addEventListener('click', () => {
      if (evento) track(evento, { origem: 'modal' });
      if (onClick) onClick();
    });
    return b;
  }

  /* ============ FORMULÁRIO ============ */
  function openForm(variante, titulo) {
    const cfg = D.formulario;
    openSheet(titulo);

    const form = $('#tplForm').content.cloneNode(true).firstElementChild;
    const parceria = variante === 'parceria';

    $('[data-hint]', form).textContent = parceria
      ? 'Conta rapidinho teu interesse que a gente responde por WhatsApp.'
      : D.encontro.observacao;

    const cs = $('[data-consent]', form);
    cs.textContent = cfg.consentimento;
    cs.appendChild(document.createTextNode(' '));
    const lp = el('a', null, 'Ler política');
    lp.href = D.footer.privacidade; lp.target = '_blank'; lp.rel = 'noopener';
    cs.appendChild(lp);

    const nivel = $('#f-nivel', form), servico = $('#f-servico', form);
    (cfg.niveis || []).forEach(v => nivel.appendChild(new Option(v, v)));
    const servicos = parceria ? ['Franquia', 'Parceria / patrocínio', 'Outro'] : (cfg.servicos || []);
    servicos.forEach(v => servico.appendChild(new Option(v, v)));

    if (parceria) {
      $('label[for="f-nivel"]', form).remove();
      nivel.remove();
      $('.btn', form).textContent = 'Enviar interesse';
      $('label[for="f-unidade"]', form).textContent = 'Cidade / região';
      $('#f-unidade', form).placeholder = 'Ex.: Palhoça, SC';
    }

    form.addEventListener('submit', e => handleSubmit(e, form, variante));
    sheetBody.appendChild(form);
    setTimeout(() => $('#f-nome', sheetBody).focus(), 60);
  }

  const digits = (s) => (s || '').replace(/\D+/g, '');

  async function handleSubmit(e, form, variante) {
    e.preventDefault();
    const status = $('[data-status]', form);
    const btn = $('.btn', form);
    const data = Object.fromEntries(new FormData(form).entries());

    if (data._gotcha) { status.className = 'status ok'; status.textContent = D.formulario.sucesso; return; }

    const nome = (data.nome || '').trim();
    const fone = digits(data.telefone);
    const setErr = (sel, msg) => {
      const f = $(sel, form);
      f.setAttribute('aria-invalid', 'true');
      f.focus();
      status.className = 'status err';
      status.textContent = msg;
    };
    form.querySelectorAll('[aria-invalid]').forEach(f => f.removeAttribute('aria-invalid'));

    if (nome.length < 2) return setErr('#f-nome', 'Escreve teu nome, por favor.');
    if (fone.length < 10 || fone.length > 13) return setErr('#f-fone', 'Confere o WhatsApp com DDD.');
    if (!data.consentimento) {
      status.className = 'status err';
      status.textContent = 'Precisa autorizar o contato via WhatsApp pra continuar.';
      return;
    }

    btn.disabled = true;
    status.className = 'status';
    status.textContent = 'Enviando…';

    const payload = {
      nome,
      telefone: fone,
      nivel: data.nivel || '',
      servico: data.servico || '',
      unidade: data.unidade || '',
      observacoes: data.observacoes || '',
      consentimento: true,
      tipo: variante,
      origem: location.hostname,
      enviadoEm: new Date().toISOString(),
      token: await recaptchaToken()
    };

    try {
      const res = await fetch('/.netlify/functions/inscricao', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error('HTTP ' + res.status);

      track('send_form', { tipo: variante, servico: payload.servico, nivel: payload.nivel });
      form.replaceChildren();
      const p = el('p', 'status ok', D.formulario.sucesso);
      p.setAttribute('role', 'status');
      form.appendChild(p);
      if (ok(D.comunidade.whatsapp)) {
        form.appendChild(botaoPill('Entrar no grupo do WhatsApp 💬', D.comunidade.whatsapp, 'click_whatsapp'));
      }
    } catch (err) {
      btn.disabled = false;
      status.className = 'status err';
      status.textContent = D.formulario.erro;
      track('form_error', { tipo: variante, msg: String(err.message || err) });
    }
  }

  function recaptchaToken() {
    const g = window.grecaptcha;
    if (!g || !g.execute) return Promise.resolve('');
    return new Promise(resolve => {
      g.ready(() => g.execute('SUA_SITE_KEY', { action: 'inscricao' }).then(resolve).catch(() => resolve('')));
    });
  }

  /* ============ BOOT ============ */
  fetch('/_data/content.json', { cache: 'no-cache' })
    .then(r => r.json())
    .then(json => { D = json; initGA(D.analytics && D.analytics.ga4); render(); })
    .catch(() => {
      const box = $('#cards');
      box.classList.remove('skeleton');
      box.appendChild(el('p', 'hint', 'Não deu pra carregar o conteúdo. Recarrega a página, por favor.'));
    });
})();
