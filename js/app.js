/* Veloz Acompanha: SPA sem dependências. Estado salvo em localStorage. */
(function () {
  'use strict';

  var D = window.VELOZ_DATA;
  var DEV = window.VELOZ_DEV;
  var STORE_KEY = 'veloz:data:v3';
  var PREF_KEY = 'veloz:mecanico';
  var THEME_KEY = 'veloz:tema';
  var ALERTA_APROVACAO_MIN = 60;
  var TOUR_OS = 'OS-1042';
  var app = document.getElementById('app');
  var state = load();
  var filtro = { q: '', etapa: 'todas' };
  var notaSel = {};
  var lastRoute = null;

  /* ---------- Ícones (traço simples, herdam a cor do texto) ---------- */

  var ICON_PATHS = {
    left: '<path d="M15 18l-6-6 6-6"/>',
    right: '<path d="M9 18l6-6-6-6"/>',
    play: '<path d="M7 4l13 8-13 8z" fill="currentColor" stroke="none"/>',
    bell: '<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10 21h4"/>',
    doc: '<path d="M14 3H6v18h12V7z"/><path d="M14 3v4h4M9 13h6M9 17h6"/>',
    chat: '<path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z"/>',
    camera: '<path d="M4 7h3l2-3h6l2 3h3v13H4z"/><circle cx="12" cy="13" r="4"/>',
    check: '<path d="M5 12l5 5 9-10"/>',
    hand: '<path d="M8 13V5a2 2 0 0 1 4 0v6"/><path d="M12 11V4a2 2 0 0 1 4 0v8"/><path d="M16 9a2 2 0 0 1 4 0v5a7 7 0 0 1-7 7h-1a7 7 0 0 1-6-3l-3-5a2 2 0 0 1 3-2l2 2"/>',
    phone: '<rect x="6" y="2" width="12" height="20" rx="2"/><path d="M11 18h2"/>',
    github: '<path d="M9 19c-4 1.5-4-2-6-2.5M15 21v-3.5c0-1 .1-1.4-.5-2 2.8-.3 5.5-1.4 5.5-6a4.6 4.6 0 0 0-1.3-3.2 4.2 4.2 0 0 0-.1-3.2s-1.1-.3-3.5 1.3a12 12 0 0 0-6.2 0C6.5 2.8 5.4 3.1 5.4 3.1a4.2 4.2 0 0 0-.1 3.2A4.6 4.6 0 0 0 4 9.5c0 4.6 2.7 5.7 5.5 6-.6.6-.6 1.2-.5 2V21"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    school: '<path d="M2 9l10-5 10 5-10 5z"/><path d="M6 11v5c3 2 9 2 12 0v-5"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21c1-4 4-6 8-6s7 2 8 6"/>'
  };
  function icon(name) { return '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true">' + ICON_PATHS[name] + '</svg>'; }

  /* ---------- Estado ---------- */

  function load() {
    try {
      var raw = localStorage.getItem(STORE_KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) { /* sem storage: usa dados de exemplo em memória */ }
    var fresh = D.seed();
    persist(fresh);
    return fresh;
  }

  function persist(data) {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(data)); } catch (e) { /* ignora */ }
  }

  function save() { persist(state); }

  function getPref(key) { try { return localStorage.getItem(key); } catch (e) { return null; } }
  function setPref(key, v) { try { localStorage.setItem(key, v); } catch (e) { /* ignora */ } }

  function findOrder(q) {
    if (!q) return null;
    var k = String(q).toUpperCase().replace(/[^A-Z0-9]/g, '');
    return state.orders.filter(function (o) {
      return o.id.replace('-', '') === k || o.placa === k;
    })[0] || null;
  }

  function log(o, msg) { o.timeline.push({ t: Date.now(), msg: msg }); }

  function setStep(o, step, msg) {
    o.step = step;
    o.stepSince = Date.now();
    if (step >= 5 && o.elevador) o.elevador = null;
    log(o, msg || ('Etapa: ' + D.STEPS[step].label));
  }

  function pendentes(o) { return o.itens.filter(function (i) { return i.status === 'pendente'; }); }

  function total(o, status) {
    return o.itens.reduce(function (s, i) { return s + ((!status || i.status === status) ? i.valor : 0); }, 0);
  }

  /* ---------- Utilitários ---------- */

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function brl(v) { return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }); }

  function plural(n, um, varios) { return n + ' ' + (n === 1 ? um : varios); }

  function dur(ms) {
    var m = Math.max(0, Math.round(ms / 60000));
    if (m < 1) return 'agora';
    if (m < 60) return m + ' min';
    var h = Math.floor(m / 60), r = m % 60;
    return h + ' h' + (r ? ' ' + r + ' min' : '');
  }

  function ago(t) { var d = dur(Date.now() - t); return d === 'agora' ? 'agora' : 'há ' + d; }

  function hora(t) { return new Date(t).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }); }

  function dataHora(t) {
    return new Date(t).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  }

  function placaFmt(p) { return p.slice(0, 3) + '-' + p.slice(3); }
  function plate(p, small) { return '<span class="plate' + (small ? ' small' : '') + '" aria-label="Placa ' + placaFmt(p) + '"><span>' + placaFmt(p) + '</span></span>'; }

  function clientLink(o) { return location.href.split('#')[0] + '#/cliente/' + o.id; }

  function whatsLink(o) {
    var txt = 'Olá, ' + o.cliente.split(' ')[0] + '! Aqui é a Auto Center Veloz. ' +
      'Acompanhe o seu ' + o.modelo + ' (' + placaFmt(o.placa) + ') e aprove o orçamento por este link: ' + clientLink(o);
    return 'https://wa.me/55' + o.telefone + '?text=' + encodeURIComponent(txt);
  }

  function oficinaWhats(o) {
    var txt = 'Olá! Tenho uma dúvida sobre a ' + o.id + ' (' + placaFmt(o.placa) + ').';
    return 'https://wa.me/' + D.OFICINA.whatsapp + '?text=' + encodeURIComponent(txt);
  }

  var toastTimer;
  function toast(msg) {
    var el = document.getElementById('toast');
    el.textContent = msg;
    el.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { el.classList.remove('show'); }, 3200);
  }

  function badge(o) {
    var s = D.STEPS[o.step];
    return '<span class="badge badge-' + s.key + '">' + esc(s.label) + '</span>';
  }

  function waitingAlert(o) {
    return o.step === 2 && (Date.now() - o.stepSince) / 60000 > ALERTA_APROVACAO_MIN;
  }

  function stars(n) { return '★★★★★'.slice(0, n) + '☆☆☆☆☆'.slice(0, 5 - n); }

  function resizeImage(file, cb) {
    var reader = new FileReader();
    reader.onload = function () {
      var img = new Image();
      img.onload = function () {
        var max = 640, w = img.width, h = img.height, k = Math.min(1, max / Math.max(w, h));
        var c = document.createElement('canvas');
        c.width = Math.round(w * k); c.height = Math.round(h * k);
        c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
        cb(c.toDataURL('image/jpeg', 0.72));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  }

  /* ---------- Notificações ---------- */

  function canNotify() { return 'Notification' in window; }

  function notifyButton() {
    if (!canNotify() || Notification.permission !== 'default') return '';
    return '<button class="btn btn-ghost btn-sm" data-act="notificar">' + icon('bell') + ' Avisar quando mudar</button>';
  }

  /* Compara o estado anterior com o novo (vindo de outra aba) e descreve o que mudou. */
  function diffs(oldS, newS) {
    var msgs = [];
    newS.orders.forEach(function (n) {
      var o = oldS.orders.filter(function (x) { return x.id === n.id; })[0];
      if (!o) { msgs.push(n.id + ': nova OS cadastrada (' + placaFmt(n.placa) + ')'); return; }
      var pendO = o.itens.filter(function (i) { return i.status === 'pendente'; }).length;
      var pendN = n.itens.filter(function (i) { return i.status === 'pendente'; }).length;
      if (pendN > pendO) msgs.push(n.id + ': novo item aguardando aprovação');
      else if (pendN < pendO) msgs.push(n.id + ': cliente respondeu o orçamento');
      if (n.step !== o.step) msgs.push(n.id + ': ' + D.STEPS[n.step].label);
      if (n.avaliacao && !o.avaliacao) msgs.push(n.id + ': nova avaliação ' + stars(n.avaliacao.nota));
    });
    return msgs;
  }

  function notify(msgs) {
    if (!msgs.length) return;
    toast(msgs[0] + (msgs.length > 1 ? ' (+' + (msgs.length - 1) + ')' : ''));
    if (canNotify() && Notification.permission === 'granted' && document.hidden) {
      try { new Notification('Auto Center Veloz', { body: msgs.join('\n'), icon: 'assets/icon-192.png' }); } catch (e) { /* ignora */ }
    }
  }

  /* ---------- Molduras: celular e navegador ---------- */

  function phone(inner, owner, opts) {
    opts = opts || {};
    return '<div class="phone"' + (opts.inert ? ' inert' : '') + ' role="group" aria-label="' + esc(opts.label || 'Tela no celular') + '">' +
      '<div class="phone-status" aria-hidden="true"><span>' + esc(opts.time || '10:04') + '</span><span>5G ▮▮▮</span></div>' +
      (opts.noAppBar ? '' :
        '<div class="phone-app"><img src="assets/icon.svg" alt="" width="26" height="26"><div><strong>Veloz Acompanha</strong><small>Auto Center Veloz</small></div>' +
        (owner ? '<span class="phone-owner">celular de<br><b>' + esc(owner) + '</b></span>' : '') + '</div>') +
      '<div class="screen">' + inner + '</div></div>';
  }

  function browser(inner, url) {
    return '<div class="browser" role="group" aria-label="Painel da recepção no computador">' +
      '<div class="browser-bar" aria-hidden="true"><span><i></i><i></i><i></i></span><span class="browser-url">' + esc(url) + '</span></div>' +
      '<div class="screen">' + inner + '</div></div>';
  }

  function stage(panel, device, wide) {
    return '<div class="wrap"><div class="stage' + (wide ? ' wide' : '') + '">' +
      '<aside class="stage-panel">' + panel + '</aside>' +
      '<div class="stage-device">' + device + '</div></div></div>';
  }

  function lookList(title, items) {
    return '<div class="look"><strong>' + esc(title) + '</strong><ul>' + items.map(function (i) { return '<li>' + i + '</li>'; }).join('') + '</ul></div>';
  }

  /* ---------- Componentes ---------- */

  function stepper(o) {
    var visiveis = D.STEPS.slice(0, 6);
    return '<ol class="stepper" aria-label="Etapas do serviço">' + visiveis.map(function (s, i) {
      var cls = i < o.step ? 'done' : i === o.step ? 'current' : '';
      return '<li class="' + cls + '"' + (i === o.step ? ' aria-current="step"' : '') + '>' +
        '<span class="dot">' + (i < o.step ? '✓' : i + 1) + '</span>' +
        '<span class="label">' + esc(s.label) + '</span></li>';
    }).join('') + '</ol>';
  }

  function timeline(o) {
    return '<ul class="timeline">' + o.timeline.slice().reverse().map(function (e) {
      return '<li><time>' + hora(e.t) + '</time><span>' + esc(e.msg) + '</span></li>';
    }).join('') + '</ul>';
  }

  function itemCard(o, it, mode) {
    var st = { pendente: 'Aguardando sua decisão', aprovado: 'Aprovado', recusado: 'Recusado' }[it.status];
    if (mode !== 'cliente' && it.status === 'pendente') st = 'Aguardando o cliente';
    var actions = '';
    if (mode === 'cliente' && it.status === 'pendente') {
      actions = '<div class="item-actions">' +
        '<button class="btn btn-ghost" data-act="recusar" data-os="' + o.id + '" data-item="' + it.id + '">Recusar</button>' +
        '<button class="btn btn-primary" data-act="aprovar" data-os="' + o.id + '" data-item="' + it.id + '">Aprovar</button></div>';
    }
    return '<article class="item item-' + it.status + '">' +
      (it.foto ? '<img class="item-photo" src="' + esc(it.foto) + '" alt="Foto tirada pelo mecânico: ' + esc(it.desc) + '" loading="lazy">' : '') +
      '<div class="item-body">' +
        '<div class="item-head"><h4>' + esc(it.desc) + '</h4><strong>' + (it.valor ? brl(it.valor) : 'Sem custo') + '</strong></div>' +
        (it.obs ? '<p class="muted">' + esc(it.obs) + '</p>' : '') +
        '<span class="pill pill-' + it.status + '">' + st + '</span>' +
        actions +
      '</div></article>';
  }

  function ratingBlock(o) {
    if (o.step < 5) return '';
    if (o.avaliacao) {
      var boa = o.avaliacao.nota >= 4;
      return '<div class="card rating"><div class="rating-done">' +
        '<h3>Obrigado pela avaliação!</h3>' +
        '<span class="stars-static" aria-label="' + o.avaliacao.nota + ' de 5 estrelas">' + stars(o.avaliacao.nota) + '</span>' +
        (o.avaliacao.comentario ? '<p class="muted">“' + esc(o.avaliacao.comentario) + '”</p>' : '') +
        (boa ? '<a class="btn btn-primary" target="_blank" rel="noopener" href="' + D.OFICINA.google + '">Compartilhar no Google</a>'
             : '<p class="small">Sentimos muito. O Eduardo, gerente da oficina, vai entrar em contato para resolver.</p>') +
        '</div></div>';
    }
    var sel = notaSel[o.id] || 0;
    var btns = '';
    for (var i = 1; i <= 5; i++) {
      btns += '<button type="button" class="star' + (i <= sel ? ' on' : '') + '" data-act="nota" data-os="' + o.id + '" data-n="' + i + '" aria-label="' + plural(i, 'estrela', 'estrelas') + '" aria-pressed="' + (i <= sel) + '">★</button>';
    }
    return '<form class="card rating form" data-form="avaliar" data-os="' + o.id + '">' +
      '<h3>Como foi o atendimento?</h3><p class="muted small">Leva 10 segundos e ajuda a oficina a melhorar.</p>' +
      '<div class="stars" role="group" aria-label="Nota de 1 a 5">' + btns + '</div>' +
      '<label class="small" for="coment-' + o.id + '">Comentário (opcional)</label>' +
      '<textarea id="coment-' + o.id + '" name="comentario" rows="2"></textarea>' +
      '<button class="btn btn-primary" type="submit"' + (sel ? '' : ' disabled') + '>Enviar avaliação</button>' +
      '</form>';
  }

  /* ---------- Página inicial: o estudo de caso ---------- */

  function viewLanding() {
    var o = findOrder(TOUR_OS);
    var preview = o ? phone(clienteScreen(o, { tour: true }), 'Mariana', { inert: true, label: 'Prévia da tela do cliente' }) : '';
    return '' +
      '<section class="hero on-dark">' +
        '<div class="hero-inner">' +
          '<div class="hero-copy">' +
            '<p class="eyebrow">Estudo de caso · UX e front-end</p>' +
            '<h1>Seu carro no elevador. <em>Você no controle.</em></h1>' +
            '<p class="lead">A Auto Center Veloz perdia horas com o telefone tocando e carros parados esperando um “pode trocar”. ' +
            'O <strong>Veloz Acompanha</strong> leva o conserto para o celular do cliente: ele vê a foto da peça e aprova na hora.</p>' +
            '<div class="hero-actions">' +
              '<a class="btn btn-primary" href="#/tour/1">' + icon('play') + ' Fazer o tour de 2 minutos</a>' +
              '<a class="btn btn-ghost" href="#/" data-scroll="telas">Explorar as telas</a>' +
            '</div>' +
            '<p class="hero-meta"><span>' + icon('school') + ' Universidade Positivo · 2º período</span><span>' + icon('user') + ' Projeto individual</span><span>' + icon('phone') + ' Web app instalável (PWA)</span></p>' +
          '</div>' +
          '<div class="hero-device"><a href="#/tour/1" tabindex="-1" aria-hidden="true">' + preview + '</a></div>' +
        '</div>' +
      '</section>' +

      '<section class="band" aria-labelledby="t-problema"><div class="wrap">' +
        '<p class="eyebrow">O problema</p>' +
        '<h2 id="t-problema">Tudo passava pelo telefone da recepção</h2>' +
        '<p class="lead">A oficina tem ótima reputação técnica, 5 elevadores e 6 mecânicos. O gargalo não era o conserto: era a conversa com o cliente. Veja o mesmo dia de duas formas.</p>' +
        '<div class="compare">' +
          '<div class="card"><h3><span class="badge tag-before">Antes</span> Orçamento no papel</h3><ol class="day">' +
            '<li><time>08:00</time><span>Mariana deixa o Gol e leva o orçamento impresso.</span></li>' +
            '<li><time>10:00</time><span>Carlos acha a pastilha de freio gasta, para o serviço e vai até a recepção.</span></li>' +
            '<li><time>10:15</time><span>A recepção liga. Mariana está em reunião e não atende.</span></li>' +
            '<li><time>11:30</time><span>Ela retorna pedindo uma foto da peça. Ninguém está livre para tirar.</span></li>' +
            '<li><time>13:40</time><span>Responde por mensagem: “pode trocar”. O serviço volta a andar.</span></li>' +
          '</ol><div class="day-total bad"><span>Elevador parado esperando resposta</span><strong>3 h 40</strong></div></div>' +
          '<div class="card"><h3><span class="badge tag-after">Depois</span> Com o Veloz Acompanha</h3><ol class="day">' +
            '<li><time>08:00</time><span>Mariana recebe um link pelo WhatsApp. Não precisa instalar nada.</span></li>' +
            '<li><time>10:00</time><span>Carlos fotografa a pastilha pelo celular, sem sair do elevador.</span></li>' +
            '<li><time>10:04</time><span>Mariana vê a foto e o preço no meio da reunião e toca em “Aprovar”.</span></li>' +
            '<li><time>10:04</time><span>O serviço é liberado sozinho para o Carlos. A recepção nem precisou entrar.</span></li>' +
            '<li><time>17:30</time><span>Mariana retira o carro e recebe o relatório digital com as fotos.</span></li>' +
          '</ol><div class="day-total ok"><span>Elevador parado esperando resposta</span><strong>4 min</strong></div></div>' +
        '</div>' +
        '<p class="footnote">Cenário ilustrativo, montado a partir do briefing do estudo de caso (telefone sobrecarregado, mecânicos interrompidos, pátio lotado).</p>' +
      '</div></section>' +

      '<section class="band" id="telas" aria-labelledby="t-telas" style="padding-top:0"><div class="wrap">' +
        '<p class="eyebrow">A solução</p>' +
        '<h2 id="t-telas">Três pessoas, um só app</h2>' +
        '<p class="lead">Cada pessoa vê só o que precisa. Abra qualquer tela: todas funcionam com dados de exemplo e cada uma explica o que mostrar.</p>' +
        '<div class="roles">' +
          roleCard('#/cliente/OS-1042', D.IMG + 'pastilha.webp', 'Foto da pastilha de freio que o cliente recebe', 'Cliente', 'Mariana, dona do Gol',
            'Vê em que etapa o carro está, a foto de cada peça com defeito e aprova ou recusa item por item.', 'Abrir a tela do cliente') +
          roleCard('#/mecanico', D.IMG + 'mecanico.webp', 'Mecânico trabalhando com o carro no elevador', 'Mecânico', 'Carlos, no elevador 1',
            'Avança a etapa com um toque e manda foto e valor do problema direto para o cliente.', 'Abrir a tela do mecânico') +
          roleCard('#/recepcao', D.IMG + 'elevador.webp', 'Carro levantado no elevador da oficina', 'Recepção', 'Balcão e sócios',
            'Enxerga o pátio inteiro: quem está em cada elevador e quais carros esperam resposta do cliente.', 'Abrir o painel da recepção') +
        '</div>' +
      '</div></section>' +

      '<section class="band band-dark on-dark" aria-labelledby="t-decisoes"><div class="wrap">' +
        '<p class="eyebrow">Decisões de design</p>' +
        '<h2 id="t-decisoes">Por que ficou assim</h2>' +
        '<p class="lead">O enunciado deixava escolher entre app nativo, site institucional ou sistema. O problema era de comunicação durante o serviço, então a resposta foi um web app.</p>' +
        '<div class="decisions">' +
          decision('01', 'Link, não loja de apps', 'Ninguém instala app de oficina para usar duas vezes por ano. O link do WhatsApp abre em qualquer celular.') +
          decision('02', 'Foto ao lado do preço', 'A confiança vem de ver a peça. A foto, o motivo e o valor ficam juntos, em linguagem simples.') +
          decision('03', 'Uma decisão por vez', 'Cada item tem só Aprovar ou Recusar. Respondeu tudo, o serviço é liberado sem passar pela recepção.') +
          decision('04', 'Gargalo à vista', 'No painel, os carros esperando há mais de 1 hora ficam em amarelo. A recepção sabe onde agir.') +
        '</div>' +
      '</div></section>' +

      '<section class="band" aria-labelledby="t-sobre"><div class="wrap about">' +
        '<div>' +
          '<p class="eyebrow">Sobre o projeto</p>' +
          '<h2 id="t-sobre">Contexto e construção</h2>' +
          '<dl class="facts">' +
            '<dt>Atividade</dt><dd>Estudo de Caso 3: Oficina e Auto Center Veloz</dd>' +
            '<dt>Disciplina</dt><dd>Design Profissional: Produção de Portfólio e Desenvolvimento Empresarial, Prof. Sedenilso Antonio Machado</dd>' +
            '<dt>Curso</dt><dd>Engenharia de Software, Universidade Positivo, 2º período (out/2026)</dd>' +
            '<dt>Autoria</dt><dd>Individual: pesquisa, UX, interface e código por Ricardo Medeiros Marcato</dd>' +
            '<dt>Empresa</dt><dd>Fictícia, criada pelo professor para o estudo de caso</dd>' +
          '</dl>' +
        '</div>' +
        '<div class="card">' +
          '<h3>Feito com</h3>' +
          '<p class="muted small">HTML, CSS e JavaScript puros, sem framework e sem build. Funciona offline e roda no GitHub Pages.</p>' +
          '<div class="chips">' + ['HTML5 semântico', 'CSS Grid e container queries', 'JavaScript (SPA)', 'PWA e service worker', 'localStorage', 'Notification API', 'Acessibilidade'].map(function (t) { return '<span class="tag">' + t + '</span>'; }).join('') + '</div>' +
          '<div class="about-actions">' +
            '<a class="btn btn-dark" href="https://github.com/MMarcatoRicardo/oficina-veloz" target="_blank" rel="noopener">' + icon('github') + ' Código e README</a>' +
            '<a class="btn btn-ghost" href="#/sobre">Sobre o autor</a>' +
          '</div>' +
        '</div>' +
      '</div></section>';
  }

  function roleCard(href, img, alt, title, who, text, cta) {
    return '<a class="card role" href="' + href + '">' +
      '<img src="' + img + '" alt="' + esc(alt) + '" loading="lazy" width="480" height="360">' +
      '<div class="role-body"><span class="role-who">' + esc(who) + '</span><h3>' + esc(title) + '</h3><p>' + esc(text) + '</p>' +
      '<span class="cta">' + esc(cta) + ' ' + icon('right') + '</span></div></a>';
  }

  function decision(n, title, text) {
    return '<div class="decision"><span class="decision-num" aria-hidden="true">' + n + '</span><h3>' + esc(title) + '</h3><p>' + esc(text) + '</p></div>';
  }

  /* ---------- Tour guiado ---------- */

  var TOUR = [
    { key: 'recepcao', label: 'O carro chega' },
    { key: 'mecanico', label: 'O problema' },
    { key: 'cliente', label: 'A aprovação' },
    { key: 'patio', label: 'O pátio anda' }
  ];

  function tourOrder() { return findOrder(TOUR_OS); }
  function tourItem(o) { return o.itens.filter(function (i) { return i.desc === D.TOUR_ITEM.desc; })[0]; }
  function tourSent(o) { return !!tourItem(o); }
  function tourApproved(o) { var it = tourItem(o); return !!it && it.status !== 'pendente'; }

  function startTour() {
    var fresh = D.seed();
    D.tourScenario(fresh);
    state = fresh; notaSel = {}; filtro = { q: '', etapa: 'todas' };
    save();
  }

  function progress(n) {
    return '<ol class="progress" aria-label="Passos do tour">' + TOUR.map(function (t, i) {
      var k = i + 1;
      var cls = k < n ? 'done' : k === n ? 'current' : '';
      return '<li class="' + cls + '"><a href="#/tour/' + k + '"' + (k === n ? ' aria-current="step"' : '') + '>' + esc(t.label) + '</a></li>';
    }).join('') + '</ol>';
  }

  function tourNav(n) {
    var back = n > 1 ? '<a class="btn btn-ghost" href="#/tour/' + (n - 1) + '">' + icon('left') + ' Voltar</a>' : '<a class="btn btn-ghost" href="#/">' + icon('left') + ' Início</a>';
    var next = n < 4
      ? '<button class="btn btn-primary" data-act="tour-next" data-n="' + n + '">Próximo ' + icon('right') + '</button>'
      : '<a class="btn btn-primary" href="#/" data-scroll="telas">Explorar livremente</a>';
    return '<div class="panel-nav">' + back + next + '</div>';
  }

  function tourPanel(n, role, title, time, text, extra) {
    return '<div class="panel">' + progress(n) +
      '<span class="panel-role">Passo ' + n + ' de 4 · ' + esc(role) + '</span>' +
      '<h1><span class="time">' + esc(time) + '</span>' + title + '</h1>' +
      '<p>' + text + '</p>' + (extra || '') + tourNav(n) + '</div>';
  }

  function hint(done, textTodo, textDone) {
    return done
      ? '<p class="hint done">' + icon('check') + '<span>' + textDone + '</span></p>'
      : '<p class="hint">' + icon('hand') + '<span>' + textTodo + '</span></p>';
  }

  function viewTour(n) {
    var o = tourOrder();
    if (!o) { startTour(); o = tourOrder(); }
    if (n === 1) {
      var chat = '<div class="chat">' +
        '<div class="chat-head"><img src="assets/icon.svg" alt="" width="36" height="36"><div><strong>Auto Center Veloz</strong><small>conta comercial</small></div></div>' +
        '<div class="bubble">Olá, Mariana! Recebemos o seu <b>VW Gol (BRA-2E19)</b>. Acompanhe o conserto e aprove o orçamento por aqui:' +
          '<a class="link-card" href="#/cliente/' + TOUR_OS + '" tabindex="-1"><img src="' + D.IMG + 'hero.webp" alt="" loading="lazy"><span><b>Veloz Acompanha · OS-1042</b>Status do conserto e aprovação de orçamento</span></a>' +
          '<time>08:02</time></div>' +
        '<div class="bubble me">Obrigada! 👍<time>08:03</time></div>' +
        '</div>';
      return stage(
        tourPanel(1, 'Recepção', 'A Mariana deixa o Gol na oficina', '08:00',
          'A recepcionista abre a <abbr title="ordem de serviço: a ficha do carro na oficina">OS</abbr> e manda um link pelo WhatsApp. É o fim do orçamento em papel.',
          lookList('Repare', ['Nada para instalar: o link abre direto no navegador', 'O mesmo link vira QR code no comprovante impresso', 'À direita está o celular da Mariana'])),
        phone(chat, 'Mariana', { time: '08:03', noAppBar: true, label: 'Conversa do WhatsApp no celular da Mariana' }));
    }
    if (n === 2) {
      var sent = tourSent(o);
      return stage(
        tourPanel(2, 'Mecânico', 'O Carlos encontra a pastilha de freio gasta', '10:00',
          'Em vez de largar o elevador e ir até a recepção, ele fotografa a peça, escreve o valor e manda para a cliente, tudo pelo celular.',
          hint(sent, 'Sua vez: no celular do Carlos, toque em <b>Enviar para aprovação</b>. A foto já foi tirada.',
            'Enviado! O botão do Carlos travou até a Mariana responder: nada é feito sem autorização.')),
        phone(mecCard(o, { tour: true }), 'Carlos', { time: '10:00', label: 'Tela do mecânico no celular do Carlos' }));
    }
    if (n === 3) {
      var ok = tourApproved(o);
      return stage(
        tourPanel(3, 'Cliente', 'A Mariana aprova no meio de uma reunião', '10:04',
          'Ela recebe o aviso, vê a foto da pastilha ao lado do preço e decide sem precisar ligar para ninguém.',
          hint(ok, 'Sua vez: no celular da Mariana, toque em <b>Aprovar</b> na pastilha de freio.',
            'Aprovado! O serviço foi liberado sozinho para o Carlos, sem passar pela recepção.')),
        phone(clienteScreen(o, { tour: true }), 'Mariana', { time: '10:04', label: 'Tela do cliente no celular da Mariana' }));
    }
    var panel4 = '<div class="panel">' + progress(4) +
      '<div class="panel inline" style="padding:0;border:0;box-shadow:none;background:none">' +
        '<span class="panel-role">Passo 4 de 4 · Recepção</span>' +
        '<div><h1><span class="time">10:05</span>O pátio anda, e a recepção vê tudo</h1>' +
        '<p>O Gol da Mariana já aparece <b>Em serviço</b> (linha verde). Em amarelo ficam só os carros que ainda esperam o cliente: é ali que a recepção age.</p></div>' +
        '<div class="panel-side"></div>' +
        lookList('Como ler o painel', [
          '<b>Elevadores:</b> a plataforma que levanta o carro. São 5 na Veloz, e o painel mostra quem está em cada um',
          '<b>Tempo médio aguardando:</b> o gargalo que o app quer zerar',
          '<b>Nova OS:</b> cadastra o carro na chegada e já gera o QR code e o link do WhatsApp']) +
      '</div>' +
      '<div class="panel-nav" style="max-width:560px"><a class="btn btn-ghost" href="#/tour/3">' + icon('left') + ' Voltar</a>' +
        '<a class="btn btn-primary" href="#/" data-scroll="telas">Fim do tour: explorar livremente</a></div>' +
      '<p class="small muted" style="margin:10px 0 0">Quer ver de novo? <a href="#/tour/1" data-act="tour-restart">Refazer o tour</a> · <a href="https://github.com/MMarcatoRicardo/oficina-veloz" target="_blank" rel="noopener">Ver o código no GitHub</a></p>' +
      '</div>';
    return stage(panel4, browser(recepcaoScreen({ highlight: TOUR_OS }), 'veloz.app/recepcao'), true);
  }

  /* ---------- Telas livres (com faixa de contexto) ---------- */

  var ROLE_INFO = {
    cliente: {
      role: 'Cliente', title: 'O que a Mariana vê no celular',
      text: 'Ela chega aqui pelo link do WhatsApp ou pelo QR code do comprovante. Sem baixar app e sem senha.',
      look: ['As 6 etapas do conserto, com a atual em destaque', 'A foto de cada peça com defeito, ao lado do preço', 'Aprovar ou recusar item por item; no fim, relatório digital e avaliação']
    },
    mecanico: {
      role: 'Mecânico', title: 'O celular do mecânico, no elevador',
      text: 'Cada mecânico vê só as próprias ordens de serviço (OS). Troque de mecânico no seletor para ver outras.',
      look: ['Avançar a etapa com um toque: o cliente é avisado na hora', '“Encontrei um problema”: foto e valor vão direto para o cliente', 'O botão trava enquanto o cliente não responde']
    },
    recepcao: {
      role: 'Recepção', title: 'O painel do balcão',
      text: 'Para as 2 recepcionistas e os sócios Eduardo e Henrique. Mostra o pátio inteiro de uma vez.',
      look: ['<b>Elevadores:</b> a plataforma que levanta o carro (são 5) e quem está em cada um', '<b>Em amarelo:</b> carros parados há mais de 1 hora esperando o cliente aprovar', '<b>Nova OS</b> (a ficha do carro) já gera QR code e link para o WhatsApp']
    }
  };

  function otherScreens(current) {
    var links = { cliente: ['#/cliente/OS-1042', 'Cliente'], mecanico: ['#/mecanico', 'Mecânico'], recepcao: ['#/recepcao', 'Recepção'] };
    return '<p class="panel-switch">Ver também: ' + Object.keys(links).filter(function (k) { return k !== current; }).map(function (k) {
      return '<a href="' + links[k][0] + '">' + links[k][1] + '</a>';
    }).join(' · ') + '</p>';
  }

  function contextPanel(key) {
    var r = ROLE_INFO[key];
    return '<div class="panel">' +
      '<a class="back" href="#/">' + icon('left') + ' Início</a><br>' +
      '<span class="panel-role">Você está vendo: ' + esc(r.role) + '</span>' +
      '<h1>' + esc(r.title) + '</h1><p>' + r.text + '</p>' +
      lookList('O que olhar', r.look) +
      '<div class="panel-nav"><a class="btn btn-primary" href="#/tour/1">' + icon('play') + ' Fazer o tour guiado</a></div>' +
      otherScreens(key) + '</div>';
  }

  function contextPanelWide(key) {
    var r = ROLE_INFO[key];
    return '<div class="panel inline">' +
      '<span class="panel-role">Você está vendo: ' + esc(r.role) + '</span>' +
      '<div><h1>' + esc(r.title) + '</h1><p>' + r.text + '</p></div>' +
      '<div class="panel-side"><a class="btn btn-primary btn-sm" href="#/tour/1">' + icon('play') + ' Tour guiado</a><a class="back" href="#/" style="margin:0">' + icon('left') + ' Início</a></div>' +
      lookList('O que olhar', r.look) +
      '<div style="grid-column:1/-1">' + otherScreens(key) + '</div></div>';
  }

  function viewClienteBusca(erro) {
    var form = '<section>' +
      '<h1>Acompanhe seu veículo</h1>' +
      '<p class="muted">Digite a placa ou o número da ordem de serviço, ou escaneie o QR code do comprovante.</p>' +
      '<form class="card form" data-form="busca">' +
        '<label for="q">Placa ou nº da OS</label>' +
        '<input id="q" name="q" placeholder="Ex.: BRA2E19 ou OS-1042" autocomplete="off" required>' +
        (erro ? '<p class="error" role="alert">' + esc(erro) + '</p>' : '') +
        '<button class="btn btn-primary btn-block" type="submit">Ver status</button>' +
      '</form>' +
      '<p class="muted small">Placas de exemplo: ' + state.orders.filter(function (o) { return o.step < 6; }).map(function (o) {
        return '<a href="#/cliente/' + o.id + '">' + placaFmt(o.placa) + '</a>';
      }).join(' · ') + '</p></section>';
    return stage(contextPanel('cliente'), phone(form, null, { label: 'Busca do veículo no celular' }));
  }

  function clienteScreen(o, opts) {
    opts = opts || {};
    var pend = pendentes(o);
    var s = D.STEPS[o.step];
    var banner = '';
    if (pend.length) {
      banner = '<div class="banner banner-warn"><strong>' + (pend.length === 1 ? '1 item precisa' : pend.length + ' itens precisam') + ' da sua aprovação</strong>' +
        '<span>O mecânico aguarda sua resposta para continuar.</span>' +
        (pend.length > 1 ? '<button class="btn btn-primary" data-act="aprovar-todos" data-os="' + o.id + '">Aprovar todos (' + brl(total({ itens: pend })) + ')</button>' : '') +
        '</div>';
    } else if (o.step === 5) {
      banner = '<div class="banner banner-ok"><strong>Seu carro está pronto!</strong><span>Pode retirar na recepção. Total: ' + brl(total(o, 'aprovado')) + '</span></div>';
    } else if (o.step === 6) {
      banner = '<div class="banner banner-ok"><strong>Serviço entregue.</strong><span>Obrigado pela confiança!</span></div>';
    }
    return '<section class="narrow">' +
      (opts.tour ? '' : '<a class="back" href="#/cliente">' + icon('left') + ' Buscar outro veículo</a>') +
      '<div class="card vehicle">' +
        '<div><p class="eyebrow">' + esc(o.id) + '</p><h1>' + esc(o.modelo) + '</h1>' + plate(o.placa) + '</div>' +
        '<div class="vehicle-meta">' + badge(o) +
        '<span class="muted small">' + esc(s.desc) + ' · ' + ago(o.stepSince) + '</span>' +
        '<span class="small">Previsão: <strong>' + esc(o.previsao) + '</strong></span>' +
        '<span class="small">Mecânico: ' + esc(o.mecanico) + '</span>' +
        (opts.tour ? '' : notifyButton()) + '</div>' +
      '</div>' +
      stepper(o) + banner +
      ratingBlock(o) +
      '<h2 class="section-title">Orçamento</h2>' +
      '<div class="items">' + o.itens.map(function (it) { return itemCard(o, it, 'cliente'); }).join('') + '</div>' +
      '<div class="totals card"><span>Aprovado</span><strong>' + brl(total(o, 'aprovado')) + '</strong>' +
      (pend.length ? '<span>Aguardando decisão</span><strong>' + brl(total(o, 'pendente')) + '</strong>' : '') + '</div>' +
      (opts.tour ? '' :
        '<div class="client-actions">' +
          '<a class="btn btn-ghost" href="#/relatorio/' + o.id + '">' + icon('doc') + ' Relatório digital</a>' +
          '<a class="btn btn-ghost" target="_blank" rel="noopener" href="' + oficinaWhats(o) + '">' + icon('chat') + ' Falar com a oficina</a>' +
        '</div>') +
      '<h2 class="section-title">Histórico</h2>' + timeline(o) +
      '</section>';
  }

  function viewCliente(o) {
    return stage(contextPanel('cliente'), phone(clienteScreen(o), o.cliente.split(' ')[0], { label: 'Tela do cliente no celular' }));
  }

  function viewRelatorio(o) {
    var fotos = o.itens.filter(function (i) { return i.foto; });
    return '<div class="wrap"><section class="report">' +
      '<div class="report-toolbar"><a class="back" href="#/cliente/' + o.id + '">' + icon('left') + ' Voltar ao acompanhamento</a>' +
      '<button class="btn btn-primary" data-act="imprimir">' + icon('doc') + ' Salvar PDF / Imprimir</button></div>' +
      '<article class="report-doc">' +
        '<header class="report-head">' +
          '<div class="report-brand"><img src="assets/icon.svg" alt="" width="44" height="44">' +
          '<div><strong>Auto Center Veloz</strong><div class="muted small">Relatório digital de serviço</div></div></div>' +
          '<div><p class="eyebrow">' + o.id + '</p>' + badge(o) + '</div>' +
        '</header>' +
        '<div class="report-meta">' +
          '<div><span>Cliente</span>' + esc(o.cliente) + '</div>' +
          '<div><span>Veículo</span>' + esc(o.modelo) + '</div>' +
          '<div><span>Placa</span>' + placaFmt(o.placa) + '</div>' +
          '<div><span>Entrada</span>' + dataHora(o.entrada) + '</div>' +
          '<div><span>Mecânico</span>' + esc(o.mecanico) + '</div>' +
          '<div><span>Previsão</span>' + esc(o.previsao) + '</div>' +
        '</div>' +
        '<h2>Itens do orçamento</h2>' +
        '<table class="table"><thead><tr><th>Peça / serviço</th><th>Diagnóstico</th><th>Situação</th><th class="num">Valor</th></tr></thead><tbody>' +
          o.itens.map(function (i) {
            return '<tr><td data-th="Item"><strong>' + esc(i.desc) + '</strong></td><td data-th="Diagnóstico">' + esc(i.obs || '—') + '</td>' +
              '<td data-th="Situação"><span class="pill pill-' + i.status + '">' + { pendente: 'Pendente', aprovado: 'Aprovado', recusado: 'Recusado' }[i.status] + '</span></td>' +
              '<td data-th="Valor" class="num">' + brl(i.valor) + '</td></tr>';
          }).join('') +
          '<tr class="report-total"><td data-th="Total" colspan="3">Total aprovado</td><td class="num">' + brl(total(o, 'aprovado')) + '</td></tr>' +
        '</tbody></table>' +
        (fotos.length ? '<h2>Evidências fotográficas</h2><div class="report-photos">' + fotos.map(function (i) {
          return '<figure><img src="' + esc(i.foto) + '" alt="' + esc(i.desc) + '"><figcaption>' + esc(i.desc) + '</figcaption></figure>';
        }).join('') + '</div>' : '') +
        '<h2>Histórico do serviço</h2>' +
        '<ul class="timeline">' + o.timeline.map(function (e) {
          return '<li><time>' + dataHora(e.t) + '</time><span>' + esc(e.msg) + '</span></li>';
        }).join('') + '</ul>' +
        '<footer class="report-foot">Documento gerado em ' + dataHora(Date.now()) + ' pelo Veloz Acompanha. ' +
          'Auto Center Veloz · ' + esc(D.OFICINA.endereco) + '</footer>' +
      '</article></section></div>';
  }

  function viewMecanico() {
    var nome = getPref(PREF_KEY) || D.MECANICOS[0];
    var minhas = state.orders.filter(function (o) { return o.mecanico === nome && o.step < 6; });
    var inner = '<section>' +
      '<div class="page-head"><div><p class="eyebrow">Minhas ordens de serviço</p><h1>' + esc(nome) + '</h1></div>' +
      '<label class="select-inline">Mecânico <select data-pref="mecanico">' + D.MECANICOS.map(function (m) {
        return '<option' + (m === nome ? ' selected' : '') + '>' + m + '</option>';
      }).join('') + '</select></label></div>' +
      (minhas.length ? '<div class="os-list">' + minhas.map(function (o) { return mecCard(o); }).join('') + '</div>'
        : '<div class="card empty">Nenhuma OS ativa para ' + esc(nome) + '. Troque o mecânico acima.</div>') +
      '</section>';
    return stage(contextPanel('mecanico'), phone(inner, nome, { label: 'Tela do mecânico no celular' }));
  }

  function mecCard(o, opts) {
    opts = opts || {};
    var pend = pendentes(o);
    var next = D.STEPS[o.step + 1];
    var bloqueado = o.step === 2 && pend.length > 0;
    var avancar = o.step < 5
      ? '<button class="btn btn-primary" data-act="avancar" data-os="' + o.id + '"' + (bloqueado || opts.tour ? ' disabled' : '') + '>' +
        (bloqueado ? 'Aguardando o cliente aprovar' : 'Avançar para: ' + esc(next.label)) + '</button>'
      : '<span class="muted small">Aguardando retirada pelo cliente</span>';
    var form = '';
    if (opts.tour) {
      if (!tourSent(o)) {
        var t = D.TOUR_ITEM;
        form = '<details class="add-item" open><summary>' + icon('camera') + ' Encontrei um problema</summary>' +
          '<form class="form" data-form="item" data-os="' + o.id + '" data-foto-default="' + esc(t.foto) + '">' +
            '<div class="photo-taken"><img src="' + esc(t.foto) + '" alt="Foto da pastilha de freio gasta"><span>Foto tirada agora pelo celular</span></div>' +
            '<label>Peça ou serviço<input name="desc" required value="' + esc(t.desc) + '"></label>' +
            '<label>Valor (R$)<input name="valor" type="number" min="0" step="0.01" required value="' + t.valor + '"></label>' +
            '<label>Explique para o cliente<textarea name="obs" rows="3">' + esc(t.obs) + '</textarea></label>' +
            '<input name="foto" type="file" hidden>' +
            '<button class="btn btn-primary" type="submit">Enviar para aprovação</button>' +
          '</form></details>';
      }
    } else if (o.step <= 3) {
      form = '<details class="add-item"><summary>' + icon('camera') + ' Encontrei um problema</summary>' +
        '<form class="form" data-form="item" data-os="' + o.id + '">' +
          '<label>Peça ou serviço<input name="desc" required placeholder="Ex.: Disco de freio dianteiro"></label>' +
          '<label>Valor (R$)<input name="valor" type="number" min="0" step="0.01" required placeholder="0,00"></label>' +
          '<label>Explique para o cliente<textarea name="obs" rows="2" placeholder="O que foi encontrado e por que trocar"></textarea></label>' +
          '<label>Foto da peça<input name="foto" type="file" accept="image/*" capture="environment"></label>' +
          '<button class="btn btn-primary" type="submit">Enviar para aprovação</button>' +
        '</form></details>';
    }
    return '<article class="card os-card">' +
      '<header><div><p class="eyebrow">' + o.id + (o.elevador ? ' · Elevador ' + o.elevador : ' · No pátio') + '</p>' +
      '<h3>' + esc(o.modelo) + '</h3>' + plate(o.placa, true) + '</div>' + badge(o) + '</header>' +
      stepper(o) +
      '<div class="items compact">' + o.itens.map(function (it) { return itemCard(o, it, 'mecanico'); }).join('') + '</div>' +
      form +
      '<div class="os-actions">' + avancar + '</div>' +
      '</article>';
  }

  function filtrar(o) {
    if (filtro.etapa !== 'todas' && D.STEPS[o.step].key !== filtro.etapa) return false;
    var q = filtro.q.trim().toLowerCase();
    if (!q) return true;
    var hay = (o.id + ' ' + placaFmt(o.placa) + ' ' + o.cliente + ' ' + o.modelo + ' ' + o.mecanico).toLowerCase();
    var compact = function (x) { return x.replace(/[^a-z0-9]/g, ''); };
    return hay.indexOf(q) >= 0 || (compact(q) !== '' && compact(hay).indexOf(compact(q)) >= 0);
  }

  function linhasRecepcao(highlight) {
    var ativas = state.orders.filter(function (o) { return o.step < 6 && filtrar(o); });
    if (!ativas.length) return '<tr><td colspan="6" class="muted">Nenhuma OS encontrada.</td></tr>';
    return ativas.sort(function (a, b) {
      return (b.id === highlight) - (a.id === highlight) || (b.step === 2) - (a.step === 2) || a.stepSince - b.stepSince;
    }).map(function (o) {
      var cls = o.id === highlight ? 'row-highlight' : waitingAlert(o) ? 'row-alert' : '';
      return '<tr class="' + cls + '">' +
        '<td data-th="OS"><a href="#/cliente/' + o.id + '">' + o.id + '</a></td>' +
        '<td data-th="Veículo"><strong>' + placaFmt(o.placa) + '</strong><br><span class="muted small">' + esc(o.modelo) + '</span></td>' +
        '<td data-th="Cliente">' + esc(o.cliente) + '</td>' +
        '<td data-th="Etapa">' + badge(o) + '</td>' +
        '<td data-th="Na etapa">' + dur(Date.now() - o.stepSince) + (waitingAlert(o) ? ' <span class="pill pill-pendente">parado</span>' : '') + '</td>' +
        '<td data-th="Ações" class="actions-cell"><div class="actions">' +
          '<button class="btn btn-sm btn-ghost" data-act="comprovante" data-os="' + o.id + '">QR</button>' +
          '<button class="btn btn-sm btn-ghost" data-act="copiar" data-os="' + o.id + '">Copiar link</button>' +
          '<a class="btn btn-sm btn-ghost" target="_blank" rel="noopener" href="' + whatsLink(o) + '">WhatsApp</a>' +
          (o.step === 5 ? '<button class="btn btn-sm btn-primary" data-act="entregar" data-os="' + o.id + '">Entregar</button>' : '') +
        '</div></td></tr>';
    }).join('');
  }

  function recepcaoScreen(opts) {
    opts = opts || {};
    var ativas = state.orders.filter(function (o) { return o.step < 6; });
    var aguard = ativas.filter(function (o) { return o.step === 2; });
    var prontos = ativas.filter(function (o) { return o.step === 5; });
    var mediaAguard = aguard.length ? aguard.reduce(function (s, o) { return s + (Date.now() - o.stepSince); }, 0) / aguard.length : 0;
    var avals = state.orders.filter(function (o) { return o.avaliacao; });
    var nota = avals.length ? avals.reduce(function (s, o) { return s + o.avaliacao.nota; }, 0) / avals.length : 0;
    var ocupados = {};
    ativas.forEach(function (o) { if (o.elevador) ocupados[o.elevador] = o; });

    var elevadores = '';
    for (var e = 1; e <= D.ELEVADORES; e++) {
      var o = ocupados[e];
      elevadores += '<div class="lift ' + (o ? 'busy' : 'free') + (o && waitingAlert(o) ? ' alert' : '') + '">' +
        '<span class="lift-n">Elevador ' + e + '</span>' +
        (o ? '<strong>' + placaFmt(o.placa) + '</strong><span class="small">' + esc(o.mecanico) + ' · ' + esc(D.STEPS[o.step].label) + '</span>'
           : '<strong>Livre</strong><span class="small">Disponível</span>') + '</div>';
    }

    var contagem = {};
    ativas.forEach(function (x) { var k = D.STEPS[x.step].key; contagem[k] = (contagem[k] || 0) + 1; });
    var chips = '<button class="chip' + (filtro.etapa === 'todas' ? ' active' : '') + '" data-act="etapa" data-etapa="todas">Todas<small>' + ativas.length + '</small></button>' +
      D.STEPS.slice(0, 6).filter(function (s) { return contagem[s.key]; }).map(function (s) {
        return '<button class="chip' + (filtro.etapa === s.key ? ' active' : '') + '" data-act="etapa" data-etapa="' + s.key + '">' + s.label + '<small>' + contagem[s.key] + '</small></button>';
      }).join('');

    var livres = [];
    for (var l = 1; l <= D.ELEVADORES; l++) if (!ocupados[l]) livres.push(l);

    return '<section>' +
      '<div class="page-head"><div><p class="eyebrow">Recepção e gestão</p><h1>Pátio agora</h1></div>' +
      '<button class="btn btn-primary" data-act="nova-os">+ Nova OS</button></div>' +
      '<div class="kpis">' +
        kpi('Carros na oficina', ativas.length, '') +
        kpi('Aguardando o cliente', aguard.length, aguard.length ? 'warn' : '') +
        kpi('Tempo médio aguardando', aguard.length ? dur(mediaAguard) : '—', mediaAguard / 60000 > ALERTA_APROVACAO_MIN ? 'warn' : '') +
        kpi('Prontos para retirada', prontos.length, prontos.length ? 'ok' : '') +
        kpi('Nota dos clientes', avals.length ? nota.toFixed(1).replace('.', ',') + ' ★' : '—', nota >= 4 ? 'ok' : avals.length ? 'warn' : '') +
      '</div>' +
      '<h2 class="section-title">Elevadores</h2><div class="lifts">' + elevadores + '</div>' +
      '<h2 class="section-title">Ordens de serviço ativas</h2>' +
      '<div class="filters"><input type="search" data-filter="q" value="' + esc(filtro.q) + '" placeholder="Buscar por placa, cliente, OS ou mecânico" aria-label="Buscar OS">' + chips + '</div>' +
      '<div class="card table-wrap"><table class="table"><thead><tr><th>OS</th><th>Veículo</th><th>Cliente</th><th>Etapa</th><th>Na etapa</th><th>Ações</th></tr></thead>' +
      '<tbody id="os-rows" data-highlight="' + esc(opts.highlight || '') + '">' + linhasRecepcao(opts.highlight) + '</tbody></table></div>' +
      (avals.length ? '<h2 class="section-title">Últimas avaliações</h2><div class="reviews">' + avals.slice(-3).reverse().map(function (x) {
        return '<div class="card"><span class="stars-static">' + stars(x.avaliacao.nota) + '</span>' +
          '<p class="small">' + esc(x.avaliacao.comentario || 'Sem comentário.') + '</p><span class="muted small">' + esc(x.cliente) + ' · ' + x.id + '</span></div>';
      }).join('') + '</div>' : '') +
      '<dialog id="dlg-os" class="dialog"><form class="form" data-form="nova-os" method="dialog">' +
        '<h2>Nova ordem de serviço</h2><p class="muted small">Preencha na chegada do carro. Ao salvar, sai o comprovante com QR code e o link para o WhatsApp do cliente.</p>' +
        '<div class="form-grid">' +
          '<label>Placa<input name="placa" required maxlength="8" placeholder="ABC1D23" pattern="[A-Za-z]{3}-?[0-9][A-Za-z0-9][0-9]{2}" title="Placa no formato ABC1D23 ou ABC-1234"></label>' +
          '<label>Modelo<input name="modelo" required placeholder="Ex.: Renault Kwid 2020"></label>' +
          '<label>Cliente<input name="cliente" required autocomplete="off"></label>' +
          '<label>WhatsApp (DDD + número)<input name="telefone" required inputmode="numeric" placeholder="41999990000" pattern="[0-9 ()-]{10,15}" title="DDD e número, só dígitos"></label>' +
          '<label>Mecânico<select name="mecanico">' + D.MECANICOS.map(function (m) { return '<option>' + m + '</option>'; }).join('') + '</select></label>' +
          '<label>Elevador<select name="elevador"><option value="">Pátio (sem elevador)</option>' +
            livres.map(function (n) { return '<option value="' + n + '">Elevador ' + n + '</option>'; }).join('') + '</select></label>' +
          '<label>Serviço solicitado<input name="servico" required placeholder="Ex.: Revisão preventiva"></label>' +
          '<label>Valor (R$)<input name="valor" type="number" min="0" step="0.01" value="0"></label>' +
          '<label>Previsão de entrega<input name="previsao" placeholder="Ex.: Hoje, 18h00"></label>' +
        '</div>' +
        '<div class="dialog-actions"><button class="btn btn-ghost" value="cancel" formnovalidate>Cancelar</button>' +
        '<button class="btn btn-primary" value="ok">Criar OS e gerar comprovante</button></div>' +
      '</form></dialog>' +
      '<dialog id="dlg-qr" class="dialog" style="width:min(420px, calc(100vw - 32px))"><div id="qr-body"></div>' +
        '<div class="dialog-actions"><button class="btn btn-ghost" data-act="fechar-qr">Fechar</button></div></dialog>' +
      '</section>';
  }

  function viewRecepcao() {
    return stage(contextPanelWide('recepcao'), browser(recepcaoScreen(), 'veloz.app/recepcao'), true);
  }

  function kpi(label, value, tone) {
    return '<div class="kpi ' + tone + '"><span>' + label + '</span><strong>' + value + '</strong></div>';
  }

  function viewNotFound() {
    return '<section class="notfound">' +
      '<div class="notfound-cena" data-jogo404></div>' +
      '<div class="notfound-texto">' +
        '<p class="eyebrow">Erro 404 · página não encontrada</p>' +
        '<h1>Placa não encontrada</h1>' +
        '<p class="muted">Essa página não está no estoque: o endereço que você abriu não existe. Volte para o início ou faça o tour de 2 minutos.</p>' +
        '<div class="hero-actions"><a class="btn btn-primary" href="#/tour/1">' + icon('play') + ' Fazer o tour</a><a class="btn btn-ghost" href="#/">Voltar para o início</a></div>' +
      '</div></section>';
  }

  function abrirComprovante(o) {
    var dlg = document.getElementById('dlg-qr');
    var body = document.getElementById('qr-body');
    var link = clientLink(o);
    body.innerHTML = '<div class="ticket">' +
      '<p class="eyebrow">Comprovante digital · ' + o.id + '</p>' +
      '<h2>' + esc(o.modelo) + '</h2>' + plate(o.placa) +
      '<div class="qr" id="qr-code" aria-label="QR code do link de acompanhamento"></div>' +
      '<p class="small">Escaneie para acompanhar o serviço e aprovar o orçamento.</p>' +
      '<code>' + esc(link) + '</code>' +
      '<a class="btn btn-primary btn-block" target="_blank" rel="noopener" href="' + whatsLink(o) + '">Enviar link pelo WhatsApp</a>' +
      '</div>';
    var box = document.getElementById('qr-code');
    if (window.QRCode) {
      new window.QRCode(box, { text: link, width: 200, height: 200, colorDark: '#16181d', colorLight: '#ffffff' });
    } else {
      box.innerHTML = '<span class="small" style="color:#16181d;line-height:1.4;display:block;padding:20px">QR indisponível offline.<br>Use o link abaixo.</span>';
    }
    dlg.showModal();
  }

  /* ---------- Roteamento ---------- */

  function render() {
    var parts = location.hash.replace(/^#\/?/, '').split('/');
    var route = parts[0] || '';
    var html, o, nav = route;
    if (route === '') {
      html = viewLanding(); nav = 'inicio';
    } else if (route === 'tour') {
      var n = Math.min(4, Math.max(1, parseInt(parts[1], 10) || 1));
      html = viewTour(n);
    } else if (route === 'cliente') {
      o = parts[1] ? findOrder(decodeURIComponent(parts[1])) : null;
      html = o ? viewCliente(o) : viewClienteBusca(parts[1] ? 'Não encontramos esse veículo. Confira a placa ou o número da OS.' : '');
    } else if (route === 'relatorio') {
      o = findOrder(decodeURIComponent(parts[1] || ''));
      html = o ? viewRelatorio(o) : viewClienteBusca('Relatório não encontrado.');
      nav = 'cliente';
    } else if (route === 'mecanico') {
      html = viewMecanico();
    } else if (route === 'recepcao') {
      html = viewRecepcao();
    } else if (route === 'sobre' || route === 'desenvolvedor') {
      html = '<div class="wrap">' + DEV.view() + '</div>';
      DEV.fetchLive(function () { if (/sobre|desenvolvedor/.test(location.hash)) render(); });
    } else {
      html = viewNotFound();
    }

    /* Guarda formulário aberto e rolagem interna dos celulares, para o re-render não "pular". */
    var openDetails = Array.prototype.map.call(app.querySelectorAll('details[open] form'), function (f) { return f.dataset.os; });
    var scrolls = Array.prototype.map.call(app.querySelectorAll('.screen'), function (s) { return s.scrollTop; });
    app.innerHTML = html;
    openDetails.forEach(function (id) {
      var f = app.querySelector('form[data-form="item"][data-os="' + id + '"]');
      if (f) f.parentNode.open = true;
    });
    Array.prototype.forEach.call(app.querySelectorAll('.screen'), function (s, i) { if (scrolls[i]) s.scrollTop = scrolls[i]; });

    document.body.classList.toggle('is-404', !!app.querySelector('.notfound'));
    var jogo = app.querySelector('[data-jogo404]');
    if (jogo && window.Jogo404) window.Jogo404.mount(jogo);
    document.querySelectorAll('[data-nav]').forEach(function (a) {
      var on = a.dataset.nav === nav;
      a.classList.toggle('active', on);
      if (on) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
    });
    var titles = { inicio: 'Veloz Acompanha · estudo de caso de UX para oficina mecânica', tour: 'Tour guiado · Veloz Acompanha', cliente: 'Tela do cliente · Veloz Acompanha', mecanico: 'Tela do mecânico · Veloz Acompanha', recepcao: 'Painel da recepção · Veloz Acompanha', sobre: 'Sobre o projeto · Veloz Acompanha', desenvolvedor: 'Sobre o projeto · Veloz Acompanha' };
    document.title = titles[nav] || 'Placa não encontrada (404) · Veloz Acompanha';
  }

  function go() {
    var h = location.hash;
    /* Entrar no passo 1 do tour vindo de fora dele recomeça o cenário. */
    if (/^#\/tour\/1$|^#\/tour\/?$/.test(h) && !(lastRoute && /^#\/tour\/1$|^#\/tour\/?$/.test(lastRoute))) startTour();
    /* Saiu do tour: volta aos dados de exemplo, para as telas livres terem itens a aprovar. */
    if (lastRoute && /^#\/tour/.test(lastRoute) && !/^#\/tour/.test(h)) { state = D.seed(); notaSel = {}; save(); }
    var mudouTela = (h.split('/')[1] || '') !== ((lastRoute || '').split('/')[1] || '') || /tour/.test(h);
    lastRoute = h;
    render();
    if (pendingScroll) {
      var el = document.getElementById(pendingScroll);
      pendingScroll = null;
      if (el) { el.scrollIntoView(); return; }
    }
    if (mudouTela) window.scrollTo(0, 0);
    /* No tour, rola o celular até o botão que a pessoa precisa tocar. */
    var alvo = /^#\/tour\/2/.test(h) ? '.phone .add-item' : /^#\/tour\/3/.test(h) ? '.phone .item-pendente' : null;
    var el = alvo && app.querySelector(alvo);
    if (el && mudouTela) {
      var tela = el.closest('.screen');
      if (tela && tela.scrollHeight > tela.clientHeight) tela.scrollTop = el.offsetTop - tela.offsetTop - 12;
    }
    var h1 = app.querySelector('h1');
    if (h1 && mudouTela) { h1.setAttribute('tabindex', '-1'); h1.focus({ preventScroll: true }); }
  }

  var pendingScroll = null;

  /* ---------- Ações ---------- */

  function decidir(o, ids, status, silencioso) {
    ids.forEach(function (id) {
      var it = o.itens.filter(function (i) { return i.id === id; })[0];
      if (it && it.status === 'pendente') it.status = status;
    });
    var verbo = status === 'aprovado' ? 'aprovou' : 'recusou';
    log(o, 'Cliente ' + verbo + ' ' + plural(ids.length, 'item', 'itens') + ' pelo app');
    if (o.step === 2 && !pendentes(o).length) {
      setStep(o, 3, 'Orçamento respondido. Serviço liberado automaticamente para ' + o.mecanico);
    }
    save(); render();
    if (!silencioso) toast(status === 'aprovado' ? 'Aprovado! O mecânico já foi avisado.' : 'Item recusado. Não será executado.');
  }

  function addItem(os, item) {
    os.itens.push({ id: 'i' + Date.now(), desc: item.desc, valor: item.valor, obs: item.obs, status: 'pendente', foto: item.foto || null });
    if (os.step !== 2) setStep(os, 2, os.mecanico + ' enviou novo item para aprovação: ' + item.desc);
    else log(os, os.mecanico + ' adicionou ao orçamento: ' + item.desc);
    save(); render();
  }

  function tourNext(n) {
    var o = tourOrder();
    if (n === 2 && !tourSent(o)) {
      addItem(o, D.TOUR_ITEM);
      toast('Enviamos a foto por você. Agora veja o celular da Mariana.');
    } else if (n === 3 && !tourApproved(o)) {
      var it = tourItem(o);
      var outros = pendentes(o).map(function (i) { return i.id; });
      decidir(o, it ? [it.id] : outros, 'aprovado', true);
      toast('Aprovamos por você. O serviço foi liberado para o Carlos.');
    }
    location.hash = '#/tour/' + (n + 1);
  }

  document.addEventListener('click', function (ev) {
    var sc = ev.target.closest('[data-scroll]');
    if (sc) {
      var target = sc.dataset.scroll;
      var here = document.getElementById(target);
      if (here) { ev.preventDefault(); here.scrollIntoView(); return; }
      pendingScroll = target;
      if (location.hash === sc.getAttribute('href')) { ev.preventDefault(); go(); }
    }
  });

  app.addEventListener('click', function (ev) {
    var btn = ev.target.closest('[data-act]');
    if (!btn) return;
    var o = btn.dataset.os ? findOrder(btn.dataset.os) : null;
    var act = btn.dataset.act;

    if (act === 'aprovar' || act === 'recusar') {
      decidir(o, [btn.dataset.item], act === 'aprovar' ? 'aprovado' : 'recusado');
    } else if (act === 'aprovar-todos') {
      decidir(o, pendentes(o).map(function (i) { return i.id; }), 'aprovado');
    } else if (act === 'tour-next') {
      tourNext(parseInt(btn.dataset.n, 10));
    } else if (act === 'tour-restart') {
      lastRoute = null;
    } else if (act === 'avancar') {
      if (o.step === 2 && pendentes(o).length) return;
      setStep(o, o.step + 1);
      save(); render();
      toast(o.id + ': ' + D.STEPS[o.step].label + '. Cliente avisado.');
    } else if (act === 'entregar') {
      setStep(o, 6, 'Veículo entregue ao cliente');
      save(); render();
      toast(o.id + ' entregue. O cliente recebeu o pedido de avaliação.');
    } else if (act === 'copiar') {
      var link = clientLink(o);
      (navigator.clipboard ? navigator.clipboard.writeText(link) : Promise.reject())
        .then(function () { toast('Link do cliente copiado.'); })
        .catch(function () { window.prompt('Copie o link do cliente:', link); });
    } else if (act === 'nova-os') {
      document.getElementById('dlg-os').showModal();
    } else if (act === 'comprovante') {
      abrirComprovante(o);
    } else if (act === 'fechar-qr') {
      document.getElementById('dlg-qr').close();
    } else if (act === 'etapa') {
      filtro.etapa = btn.dataset.etapa;
      render();
    } else if (act === 'nota') {
      ev.preventDefault();
      notaSel[o.id] = parseInt(btn.dataset.n, 10);
      var form = btn.closest('form');
      form.querySelectorAll('.star').forEach(function (s) {
        var on = parseInt(s.dataset.n, 10) <= notaSel[o.id];
        s.classList.toggle('on', on);
        s.setAttribute('aria-pressed', on);
      });
      form.querySelector('[type="submit"]').disabled = false;
    } else if (act === 'imprimir') {
      window.print();
    } else if (act === 'notificar') {
      Notification.requestPermission().then(function (p) {
        render();
        toast(p === 'granted' ? 'Pronto! Você será avisado a cada mudança.' : 'Avisos não autorizados no navegador.');
      });
    }
  });

  app.addEventListener('change', function (ev) {
    if (ev.target.dataset.pref === 'mecanico') { setPref(PREF_KEY, ev.target.value); render(); }
  });

  app.addEventListener('input', function (ev) {
    if (ev.target.dataset.filter === 'q') {
      filtro.q = ev.target.value;
      var rows = document.getElementById('os-rows');
      rows.innerHTML = linhasRecepcao(rows.dataset.highlight);
    }
  });

  app.addEventListener('submit', function (ev) {
    var f = ev.target;
    var kind = f.dataset.form;
    if (kind === 'busca') {
      ev.preventDefault();
      var o = findOrder(f.q.value);
      location.hash = '#/cliente/' + (o ? o.id : encodeURIComponent(f.q.value.trim() || '?'));
    } else if (kind === 'avaliar') {
      ev.preventDefault();
      var av = findOrder(f.dataset.os);
      if (!notaSel[av.id]) return;
      av.avaliacao = { nota: notaSel[av.id], comentario: f.comentario.value.trim(), t: Date.now() };
      log(av, 'Cliente avaliou o atendimento: ' + stars(av.avaliacao.nota));
      save(); render();
      toast('Avaliação enviada. Obrigado!');
    } else if (kind === 'item') {
      ev.preventDefault();
      var os = findOrder(f.dataset.os);
      var dados = { desc: f.desc.value.trim(), valor: parseFloat(f.valor.value) || 0, obs: f.obs.value.trim() };
      var file = f.foto.files && f.foto.files[0];
      var done = function (foto) {
        dados.foto = foto;
        addItem(os, dados);
        toast(f.dataset.fotoDefault ? 'Foto enviada para a Mariana. Toque em Próximo.' : 'Enviado ao cliente. Você será avisado quando ele responder.');
      };
      if (file) resizeImage(file, done); else done(f.dataset.fotoDefault || null);
    } else if (kind === 'nova-os') {
      if (ev.submitter && ev.submitter.value !== 'ok') return;
      var placa = f.placa.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
      if (findOrder(placa) && findOrder(placa).step < 6) {
        ev.preventDefault();
        toast('Já existe uma OS ativa para essa placa.');
        return;
      }
      var max = state.orders.reduce(function (m, x) { return Math.max(m, parseInt(x.id.slice(3), 10)); }, 1000);
      var nova = {
        id: 'OS-' + (max + 1), placa: placa, modelo: f.modelo.value.trim(), cliente: f.cliente.value.trim(),
        telefone: f.telefone.value.replace(/\D/g, ''), mecanico: f.mecanico.value,
        elevador: f.elevador.value ? parseInt(f.elevador.value, 10) : null, step: 0,
        entrada: Date.now(), stepSince: Date.now(), previsao: f.previsao.value.trim() || 'A definir',
        itens: [{ id: 'i1', desc: f.servico.value.trim(), valor: parseFloat(f.valor.value) || 0, status: 'aprovado', obs: 'Solicitado na entrada.', foto: null }],
        timeline: [{ t: Date.now(), msg: 'Veículo recebido pela recepção' }]
      };
      state.orders.push(nova);
      save();
      setTimeout(function () { render(); abrirComprovante(nova); }, 0);
    }
  });

  document.getElementById('reset-demo').addEventListener('click', function () {
    if (!window.confirm('Restaurar os dados de exemplo? As alterações feitas neste navegador serão perdidas.')) return;
    state = D.seed(); notaSel = {}; save(); render(); toast('Dados de exemplo restaurados.');
  });

  /* Tema claro/escuro: segue o sistema até o usuário escolher. */
  document.getElementById('theme-toggle').addEventListener('click', function () {
    var root = document.documentElement;
    var atual = root.dataset.theme || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    root.dataset.theme = atual === 'dark' ? 'light' : 'dark';
    setPref(THEME_KEY, root.dataset.theme);
  });

  /* Sincroniza abas abertas (cliente x mecânico x recepção) em tempo real. */
  window.addEventListener('storage', function (ev) {
    if (ev.key === STORE_KEY && ev.newValue) {
      try {
        var novo = JSON.parse(ev.newValue);
        var msgs = diffs(state, novo);
        state = novo;
        if (!document.querySelector('dialog[open]')) render();
        notify(msgs);
      } catch (e) { /* ignora */ }
    }
  });

  window.addEventListener('hashchange', go);
  setInterval(function () {
    if (!document.querySelector('dialog[open], details[open], input:focus, textarea:focus, select:focus, [data-jogo404]')) render();
  }, 60000);
  go();
})();
