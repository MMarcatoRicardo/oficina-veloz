/* Página 404 que vira jogo: o carro da Veloz está quebrado (roda fugindo, fumaça, macaco, placa PAG-404).
   Ao apertar espaço (ou tocar), a roda volta, o carro se endireita e começa a corrida pulando cones e pneus.
   Sem dependências. Uso: Jogo404.mount(elemento). */
(function () {
  'use strict';

  var W = 680, H = 320, CHAO = 248;
  var REC_KEY = 'veloz:404:recorde';
  var AMARELO = '#f5c400', GRAFITE = '#16181d', ASFALTO = '#23262d';
  var X_QUEBRADO = 196, X_JOGO = 70, INCLINACAO = 5 * Math.PI / 180, ESTREITO = false;

  function lerRecorde() { try { return parseInt(localStorage.getItem(REC_KEY), 10) || 0; } catch (e) { return 0; } }
  function salvarRecorde(v) { try { localStorage.setItem(REC_KEY, String(v)); } catch (e) { /* ignora */ } }
  function rr(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
  }
  function suave(t) { return t < 0 ? 0 : t > 1 ? 1 : t * t * (3 - 2 * t); }

  function mount(host) {
    if (!host || host.dataset.montado) return;
    host.dataset.montado = '1';
    /* Tela estreita (celular em pé): enquadramento mais fechado, para o carro aparecer maior. */
    ESTREITO = host.clientWidth / Math.max(1, host.clientHeight) < 1.4;
    W = ESTREITO ? 440 : 680;
    X_QUEBRADO = ESTREITO ? 110 : 196; X_JOGO = ESTREITO ? 30 : 70;
    var toque = window.matchMedia && matchMedia('(pointer: coarse)').matches;
    var calmo = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
    host.innerHTML = '<canvas class="jogo-canvas" tabindex="0" role="img" aria-label="Carro amarelo com pane: a roda saiu rolando e a placa mostra PAG-404. ' +
      (toque ? 'Toque' : 'Pressione espaço') + ' para jogar: o carro pula cones e pneus."></canvas>';
    var cv = host.querySelector('canvas');
    var ctx = cv.getContext('2d');
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    cv.width = W * dpr; cv.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    var fonte = "'Barlow Condensed', 'Arial Narrow', Arial, sans-serif";
    function corTexto() { return getComputedStyle(document.body).color || GRAFITE; }

    var recorde = lerRecorde();
    var s = cenaQuebrada();
    var ultimo = 0;

    function cenaQuebrada() {
      return {
        modo: 'quebrado', t: 0, tm: 0, dist: 0, vel: 0, y: 0, vy: 0, faixa: 0, extra: 0,
        carX: X_QUEBRADO, incl: INCLINACAO,
        obst: [{ tipo: 'cone', x: ESTREITO ? W - 190 : 470, w: 24, h: 32 }],
        deco: [{ tipo: 'placa', x: ESTREITO ? W - 130 : 520 }, { tipo: 'macaco', x: X_QUEBRADO + 80 }],
        bonus: [], fumaca: [], flash: [], proximo: 520, novoRecorde: false
      };
    }

    function corridaNova() {
      var n = cenaQuebrada();
      n.modo = 'rodando'; n.vel = 320; n.carX = X_JOGO; n.incl = 0; n.obst = []; n.deco = []; n.proximo = 360;
      return n;
    }

    function acao() {
      if (s.modo === 'quebrado') { s.modo = 'montando'; s.tm = 0; s.fumaca = []; return; }
      if (s.modo === 'bateu') { if (s.tm > 0.5) s = corridaNova(); return; }
      if (s.modo === 'pausado') { s.modo = 'rodando'; return; }
      if (s.modo === 'rodando' && s.y === 0) s.vy = -830;
    }

    function pontos() { return Math.floor(s.dist / 12) + s.extra; }

    function gerar() {
      var r = Math.random();
      if (r < 0.55) s.obst.push({ tipo: 'cone', x: W + 20, w: 24, h: 32 });
      else if (r < 0.85) s.obst.push({ tipo: 'pneus', x: W + 20, w: 36, h: 40 });
      else s.obst.push({ tipo: 'cones', x: W + 20, w: 52, h: 32 });
      if (Math.random() < 0.35) s.bonus.push({ x: W + 160 + Math.random() * 80, y: CHAO - 78 - Math.random() * 26, pego: false });
      s.proximo = s.vel * (0.95 + Math.random() * 0.9) + 140;
    }

    function mover(dx) {
      s.dist += dx; s.faixa = (s.faixa + dx) % 80;
      s.obst.forEach(function (o) { o.x -= dx; });
      s.deco.forEach(function (d) { d.x -= dx; });
      s.bonus.forEach(function (b) { b.x -= dx; });
      s.obst = s.obst.filter(function (o) { return o.x + o.w > -60; });
      s.deco = s.deco.filter(function (d) { return d.x > -140; });
      s.bonus = s.bonus.filter(function (b) { return b.x > -20 && !b.pego; });
    }

    function atualizar(dt) {
      s.t += dt; s.tm += dt;
      if (s.modo === 'quebrado') {
        if (!calmo && Math.random() < dt * 2.2) s.fumaca.push({ x: s.carX + 118, y: CHAO - 48, r: 7, t: 0 });
      } else if (s.modo === 'montando') {
        var k = suave(s.tm / 0.7);
        s.incl = INCLINACAO * (1 - k);
        s.carX = X_QUEBRADO + (X_JOGO - X_QUEBRADO) * k;
        s.vel = 320 * k;
        mover(s.vel * dt);
        if (s.tm >= 0.7) { s.modo = 'rodando'; s.incl = 0; s.carX = X_JOGO; }
      } else if (s.modo === 'rodando') {
        s.vel = Math.min(760, s.vel + 14 * dt);
        var dx = s.vel * dt;
        mover(dx);
        s.proximo -= dx; if (s.proximo <= 0) gerar();
        s.vy += 2500 * dt; s.y += s.vy * dt;
        if (s.y > 0) { s.y = 0; s.vy = 0; }
        var cx = s.carX, cw = 124;
        for (var i = 0; i < s.obst.length; i++) {
          var o = s.obst[i];
          if (o.x + 6 < cx + cw - 10 && o.x + o.w - 6 > cx + 8 && CHAO - o.h + 6 < CHAO + s.y - 2) { bater(); break; }
        }
        s.bonus.forEach(function (b) {
          if (b.x > cx && b.x < cx + cw && b.y > CHAO + s.y - 80 && b.y < CHAO + s.y) {
            b.pego = true; s.extra += 25; s.flash.push({ x: b.x, y: b.y, t: 0 });
          }
        });
      } else if (s.modo === 'bateu') {
        if (s.fumaca.length < 16 && Math.random() < 0.3) s.fumaca.push({ x: s.carX + 118, y: CHAO + s.y - 44, r: 6, t: 0 });
      }
      s.flash.forEach(function (f) { f.t += dt; });
      s.flash = s.flash.filter(function (f) { return f.t < 0.8; });
      s.fumaca.forEach(function (f) { f.t += dt; f.y -= 30 * dt; f.x -= 12 * dt; f.r += 10 * dt; });
      s.fumaca = s.fumaca.filter(function (f) { return f.t < 2.2; });
    }

    function bater() {
      s.modo = 'bateu'; s.tm = 0;
      var p = pontos();
      if (p > recorde) { recorde = p; salvarRecorde(p); s.novoRecorde = true; }
    }

    /* ---------- desenho ---------- */

    function roda(rx, ry, ang) {
      ctx.fillStyle = GRAFITE; ctx.beginPath(); ctx.arc(rx, ry, 13, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#b4b8c0'; ctx.beginPath(); ctx.arc(rx, ry, 6, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = GRAFITE; ctx.lineWidth = 2; ctx.beginPath();
      ctx.moveTo(rx + Math.cos(ang) * 6, ry + Math.sin(ang) * 6); ctx.lineTo(rx - Math.cos(ang) * 6, ry - Math.sin(ang) * 6); ctx.stroke();
    }

    function carro(x, base, ang, incl, semRodaDianteira) {
      ctx.save();
      ctx.translate(x + 30, base); ctx.rotate(incl); ctx.translate(-(x + 30), -base);
      ctx.fillStyle = AMARELO;
      ctx.beginPath(); ctx.moveTo(x + 26, base - 40); ctx.lineTo(x + 42, base - 60); ctx.lineTo(x + 82, base - 60); ctx.lineTo(x + 100, base - 40); ctx.closePath(); ctx.fill();
      ctx.fillStyle = 'rgba(22,24,29,.85)';
      ctx.beginPath(); ctx.moveTo(x + 32, base - 41); ctx.lineTo(x + 45, base - 56); ctx.lineTo(x + 61, base - 56); ctx.lineTo(x + 61, base - 41); ctx.fill();
      ctx.beginPath(); ctx.moveTo(x + 65, base - 41); ctx.lineTo(x + 65, base - 56); ctx.lineTo(x + 80, base - 56); ctx.lineTo(x + 94, base - 41); ctx.fill();
      ctx.fillStyle = AMARELO; rr(ctx, x, base - 42, 124, 30, 9); ctx.fill();
      ctx.fillStyle = '#ddb000'; ctx.fillRect(x + 2, base - 22, 120, 5);
      var farolAceso = calmo || s.modo !== 'quebrado' || Math.floor(s.t * 2) % 2 === 0;
      ctx.fillStyle = farolAceso ? '#fff6c2' : '#c9b25a'; rr(ctx, x + 116, base - 37, 8, 7, 2); ctx.fill();
      ctx.fillStyle = '#e5484d'; rr(ctx, x, base - 37, 6, 7, 2); ctx.fill();
      ctx.fillStyle = GRAFITE; ctx.font = '800 15px ' + fonte; ctx.fillText('V', x + 46, base - 22);
      roda(x + 30, base - 12, ang);
      if (semRodaDianteira) {
        ctx.fillStyle = GRAFITE; ctx.beginPath(); ctx.arc(x + 96, base - 12, 15, Math.PI, 0); ctx.closePath(); ctx.fill();
      } else {
        roda(x + 96, base - 12, ang);
      }
      ctx.restore();
    }

    function macaco(x) {
      ctx.fillStyle = '#3a3d44'; rr(ctx, x, CHAO - 9, 32, 9, 2); ctx.fill();
      ctx.strokeStyle = AMARELO; ctx.lineWidth = 4; ctx.lineJoin = 'round';
      ctx.beginPath(); ctx.moveTo(x + 5, CHAO - 9); ctx.lineTo(x + 16, CHAO - 20); ctx.lineTo(x + 27, CHAO - 9); ctx.stroke();
      ctx.fillStyle = '#3a3d44'; rr(ctx, x + 9, CHAO - 27, 14, 5, 2); ctx.fill();
    }

    function cone(x) {
      ctx.fillStyle = '#f97316';
      ctx.beginPath(); ctx.moveTo(x + 12, CHAO - 32); ctx.lineTo(x + 22, CHAO - 4); ctx.lineTo(x + 2, CHAO - 4); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#fff'; ctx.fillRect(x + 7, CHAO - 20, 10, 6);
      ctx.fillStyle = GRAFITE; ctx.fillRect(x - 2, CHAO - 5, 28, 5);
    }

    function pneus(x) {
      for (var i = 0; i < 2; i++) {
        var y = CHAO - 20 - i * 20;
        ctx.fillStyle = GRAFITE; rr(ctx, x, y, 36, 19, 8); ctx.fill();
        ctx.fillStyle = '#4a4e57'; rr(ctx, x + 10, y + 6, 16, 7, 3); ctx.fill();
      }
    }

    function placa(x, y, txt, grande) {
      var w = grande ? 120 : 108, h = grande ? 54 : 42;
      ctx.fillStyle = '#fff'; rr(ctx, x, y, w, h, 6); ctx.fill();
      ctx.strokeStyle = GRAFITE; ctx.lineWidth = 2.5; rr(ctx, x, y, w, h, 6); ctx.stroke();
      ctx.fillStyle = '#1f3fa8'; ctx.fillRect(x + 2, y + 2, w - 4, grande ? 12 : 10);
      ctx.fillStyle = '#fff'; ctx.font = '700 ' + (grande ? 8 : 7) + 'px Arial, sans-serif'; ctx.textAlign = 'center';
      ctx.fillText('B R A S I L', x + w / 2, y + (grande ? 11 : 10));
      ctx.fillStyle = GRAFITE; ctx.font = '700 ' + (grande ? 28 : 22) + 'px ' + fonte; ctx.fillText(txt, x + w / 2, y + h - 8);
      ctx.textAlign = 'left';
    }

    function porca(b) {
      ctx.save(); ctx.translate(b.x, b.y); ctx.rotate(s.t * 3);
      ctx.fillStyle = AMARELO; ctx.beginPath();
      for (var i = 0; i < 6; i++) { var a = i * Math.PI / 3; ctx.lineTo(Math.cos(a) * 10, Math.sin(a) * 10); }
      ctx.closePath(); ctx.fill();
      ctx.fillStyle = GRAFITE; ctx.beginPath(); ctx.arc(0, 0, 4, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    }

    function texto(linha1, linha2, alfa, largura, desce) {
      var cx = ESTREITO ? W / 2 : (largura ? largura / 2 : W / 2);
      var dy = ESTREITO && desce ? 70 : 0;
      ctx.save(); ctx.globalAlpha = alfa == null ? 1 : alfa;
      ctx.textAlign = 'center'; ctx.fillStyle = corTexto();
      ctx.font = '700 ' + (ESTREITO ? 26 : 30) + 'px ' + fonte; ctx.fillText(linha1, cx, 46 + dy);
      if (linha2) { ctx.font = '500 ' + (ESTREITO ? 16 : 18) + 'px ' + fonte; ctx.fillText(linha2, cx, 72 + dy); }
      ctx.restore();
    }

    function desenhar() {
      ctx.clearRect(0, 0, W, H);
      /* estrada, esfumada nas pontas */
      var g = ctx.createLinearGradient(0, 0, W, 0);
      g.addColorStop(0, 'rgba(35,38,45,0)'); g.addColorStop(0.1, ASFALTO); g.addColorStop(0.9, ASFALTO); g.addColorStop(1, 'rgba(35,38,45,0)');
      ctx.fillStyle = g; ctx.fillRect(0, CHAO, W, H - CHAO);
      ctx.fillStyle = AMARELO;
      for (var fx = -s.faixa; fx < W; fx += 80) { ctx.globalAlpha = Math.max(0, Math.min(1, Math.min(fx, W - fx - 44) / 70)); ctx.fillRect(fx, CHAO + 32, 44, 7); }
      ctx.globalAlpha = 1;

      s.deco.forEach(function (d) {
        if (d.tipo === 'placa') { ctx.fillStyle = '#6b707a'; ctx.fillRect(d.x + 56, 150, 8, CHAO - 150); placa(d.x, 98, 'PAG-404', true); }
      });
      s.obst.forEach(function (o) {
        if (o.tipo === 'cone') cone(o.x);
        else if (o.tipo === 'cones') { cone(o.x); cone(o.x + 28); }
        else pneus(o.x);
      });
      s.bonus.forEach(porca);

      var quebrado = s.modo === 'quebrado';
      var ang = (s.modo === 'rodando' || s.modo === 'montando') ? s.dist / 13 : 0;
      carro(s.carX, CHAO + s.y, ang, s.incl, quebrado);
      s.deco.forEach(function (d) { if (d.tipo === 'macaco') macaco(d.x); });

      /* a roda que fugiu (só na cena parada) */
      if (quebrado) {
        var ciclo = calmo ? 0.45 : (s.t % 3.4) / 3.4;
        var rx = s.carX + 96 + ciclo * (W + 40 - (s.carX + 96));
        ctx.save(); ctx.globalAlpha = calmo ? 1 : Math.min(1, (1 - ciclo) * 4);
        roda(rx, CHAO - 13, ciclo * 24); ctx.restore();
      }

      s.fumaca.forEach(function (f) {
        ctx.fillStyle = 'rgba(180,184,192,' + Math.max(0, 0.75 - f.t / 2.6) + ')';
        ctx.beginPath(); ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2); ctx.fill();
      });
      s.flash.forEach(function (f) {
        ctx.fillStyle = 'rgba(245,196,0,' + (1 - f.t / 0.8) + ')'; ctx.font = '700 18px ' + fonte;
        ctx.fillText('+25', f.x - 12, f.y - 14 - f.t * 30);
      });

      if (!quebrado) {
        placa(W - 124, 12, 'KM-' + String(Math.min(9999, pontos())).padStart(4, '0'));
        ctx.fillStyle = corTexto(); ctx.font = '600 15px ' + fonte; ctx.textAlign = 'right';
        ctx.fillText('RECORDE ' + recorde + ' m', W - 16, 74); ctx.textAlign = 'left';
      }

      var chamada = toque ? 'TOQUE NA ESTRADA PARA JOGAR' : 'PRESSIONE ESPAÇO PARA JOGAR';
      if (quebrado) {
        texto(chamada, 'Conserte o carro e desvie dos cones' + (recorde ? ' · recorde: ' + recorde + ' m' : ''),
          calmo ? 1 : 0.65 + 0.35 * Math.sin(s.t * 3), W - 150);
      } else if (s.modo === 'bateu') {
        texto(s.novoRecorde ? 'NOVO RECORDE: ' + pontos() + ' m!' : 'BATEU! ' + pontos() + ' m', toque ? 'Toque para tentar de novo' : 'Espaço para tentar de novo', 1, W - 150, true);
      } else if (s.modo === 'pausado') {
        texto('PAUSADO', toque ? 'Toque para continuar' : 'Espaço para continuar', 1, W - 150, true);
      }
    }

    function passo(ts) {
      if (!document.body.contains(cv)) return; /* a tela mudou: encerra */
      var dt = ultimo ? Math.min(0.05, (ts - ultimo) / 1000) : 0;
      ultimo = ts;
      if (!document.hidden) { atualizar(dt); desenhar(); }
      requestAnimationFrame(passo);
    }

    cv.addEventListener('pointerdown', function (e) { e.preventDefault(); acao(); });
    function tecla(e) {
      if (!document.body.contains(cv)) { document.removeEventListener('keydown', tecla); return; }
      var alvo = e.target;
      if (alvo && alvo.closest && alvo.closest('a, button, input, textarea, select')) return; /* não rouba botões e links */
      if (e.code === 'Space' || e.code === 'ArrowUp' || e.key === ' ') { e.preventDefault(); acao(); }
    }
    document.addEventListener('keydown', tecla);
    document.addEventListener('visibilitychange', function () {
      if (document.hidden && s.modo === 'rodando') s.modo = 'pausado';
      ultimo = 0;
    });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(desenhar);
    requestAnimationFrame(passo);
  }

  window.Jogo404 = { mount: mount };
})();
