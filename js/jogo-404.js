/* Joguinho da página 404: o carro da Veloz pula cones e pneus (no estilo do dinossauro do Chrome).
   Sem dependências. Uso: Jogo404.mount(elemento). Espaço, seta para cima ou toque para pular. */
(function () {
  'use strict';

  var W = 680, H = 250, CHAO = H - 58;
  var REC_KEY = 'veloz:404:recorde';
  var AMARELO = '#f5c400', GRAFITE = '#16181d', ASFALTO = '#23262d';

  function lerRecorde() { try { return parseInt(localStorage.getItem(REC_KEY), 10) || 0; } catch (e) { return 0; } }
  function salvarRecorde(v) { try { localStorage.setItem(REC_KEY, String(v)); } catch (e) { /* ignora */ } }

  function rr(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
  }

  function mount(host) {
    if (!host || host.dataset.montado) return;
    host.dataset.montado = '1';
    host.innerHTML =
      '<canvas class="jogo-canvas" tabindex="0" role="img" aria-label="Joguinho: o carro da Veloz pula cones e pneus. Aperte espaço ou toque para jogar."></canvas>' +
      '<p class="jogo-dica">Aperte <kbd>espaço</kbd> ou <kbd>↑</kbd>, ou toque na estrada, para pular os cones.</p>';
    var cv = host.querySelector('canvas');
    var ctx = cv.getContext('2d');
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    cv.width = W * dpr; cv.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    var css = getComputedStyle(document.body);
    var corTexto = css.color || GRAFITE;
    var fonte = "'Barlow Condensed', 'Arial Narrow', Arial, sans-serif";

    var s = novoEstado('parado');
    var recorde = lerRecorde();
    var ultimo = 0, raf = null;

    function novoEstado(modo) {
      return { modo: modo, t: 0, dist: 0, vel: 320, y: 0, vy: 0, obst: [], bonus: [], fumaca: [], proximo: 420, faixa: 0, pontosExtra: 0, flash: [], novoRecorde: false };
    }

    function pular() {
      if (s.modo === 'parado' || s.modo === 'bateu') {
        if (s.modo === 'bateu' && s.t < 0.5) return; /* evita reiniciar sem querer logo após bater */
        s = novoEstado('rodando');
        loop();
        return;
      }
      if (s.y === 0) { s.vy = -830; }
    }

    function pontos() { return Math.floor(s.dist / 12) + s.pontosExtra; }

    function gerar() {
      var r = Math.random();
      if (r < 0.55) s.obst.push({ tipo: 'cone', x: W + 20, w: 24, h: 32 });
      else if (r < 0.85) s.obst.push({ tipo: 'pneus', x: W + 20, w: 36, h: 40 });
      else s.obst.push({ tipo: 'cones', x: W + 20, w: 52, h: 32 });
      if (Math.random() < 0.35) s.bonus.push({ x: W + 20 + 140 + Math.random() * 80, y: CHAO - 78 - Math.random() * 26, pego: false });
      s.proximo = s.vel * (0.95 + Math.random() * 0.9) + 140;
    }

    function atualizar(dt) {
      s.t += dt;
      if (s.modo === 'rodando') {
        s.vel = Math.min(760, s.vel + 14 * dt);
        var dx = s.vel * dt;
        s.dist += dx; s.faixa = (s.faixa + dx) % 80;
        s.proximo -= dx; if (s.proximo <= 0) gerar();
        s.obst.forEach(function (o) { o.x -= dx; });
        s.obst = s.obst.filter(function (o) { return o.x + o.w > -10; });
        s.bonus.forEach(function (b) { b.x -= dx; });
        s.bonus = s.bonus.filter(function (b) { return b.x > -20 && !b.pego; });
        /* física do pulo */
        s.vy += 2500 * dt; s.y += s.vy * dt;
        if (s.y > 0) { s.y = 0; s.vy = 0; }
        /* colisões (caixa um pouco menor que o desenho, para ser justo) */
        var cx = 70, cw = 100, ctop = CHAO + s.y - 50;
        for (var i = 0; i < s.obst.length; i++) {
          var o = s.obst[i];
          if (o.x + 6 < cx + cw - 8 && o.x + o.w - 6 > cx + 8 && CHAO - o.h + 6 < CHAO + s.y - 2) { bater(); break; }
        }
        s.bonus.forEach(function (b) {
          if (b.x > cx && b.x < cx + cw && b.y > ctop - 20 && b.y < CHAO + s.y) {
            b.pego = true; s.pontosExtra += 25; s.flash.push({ x: b.x, y: b.y, t: 0 });
          }
        });
      }
      s.flash.forEach(function (f) { f.t += dt; });
      s.flash = s.flash.filter(function (f) { return f.t < 0.8; });
      if (s.modo === 'bateu' && s.fumaca.length < 14 && Math.random() < 0.3) {
        s.fumaca.push({ x: 160 + Math.random() * 8, y: CHAO + s.y - 40, r: 6, t: 0 });
      }
      s.fumaca.forEach(function (f) { f.t += dt; f.y -= 30 * dt; f.x -= 10 * dt; f.r += 10 * dt; });
      s.fumaca = s.fumaca.filter(function (f) { return f.t < 2; });
    }

    function bater() {
      s.modo = 'bateu'; s.t = 0; loop();
      var p = pontos();
      if (p > recorde) { recorde = p; salvarRecorde(p); s.novoRecorde = true; }
    }

    /* ---------- desenho ---------- */

    function carro(x, base, rodaAng) {
      ctx.save();
      ctx.fillStyle = AMARELO;
      ctx.beginPath(); ctx.moveTo(x + 26, base - 40); ctx.lineTo(x + 42, base - 60); ctx.lineTo(x + 82, base - 60); ctx.lineTo(x + 100, base - 40); ctx.closePath(); ctx.fill();
      ctx.fillStyle = 'rgba(22,24,29,.85)';
      ctx.beginPath(); ctx.moveTo(x + 32, base - 41); ctx.lineTo(x + 45, base - 56); ctx.lineTo(x + 61, base - 56); ctx.lineTo(x + 61, base - 41); ctx.fill();
      ctx.beginPath(); ctx.moveTo(x + 65, base - 41); ctx.lineTo(x + 65, base - 56); ctx.lineTo(x + 80, base - 56); ctx.lineTo(x + 94, base - 41); ctx.fill();
      ctx.fillStyle = AMARELO; rr(ctx, x, base - 42, 124, 30, 9); ctx.fill();
      ctx.fillStyle = '#ddb000'; ctx.fillRect(x + 2, base - 22, 120, 5);
      ctx.fillStyle = '#fff6c2'; rr(ctx, x + 116, base - 37, 8, 7, 2); ctx.fill();
      ctx.fillStyle = '#e5484d'; rr(ctx, x, base - 37, 6, 7, 2); ctx.fill();
      ctx.fillStyle = GRAFITE; ctx.font = '800 15px ' + fonte; ctx.fillText('V', x + 46, base - 22);
      [x + 30, x + 96].forEach(function (rx) {
        ctx.fillStyle = GRAFITE; ctx.beginPath(); ctx.arc(rx, base - 12, 13, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#b4b8c0'; ctx.beginPath(); ctx.arc(rx, base - 12, 6, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = GRAFITE; ctx.lineWidth = 2; ctx.beginPath();
        ctx.moveTo(rx + Math.cos(rodaAng) * 6, base - 12 + Math.sin(rodaAng) * 6);
        ctx.lineTo(rx - Math.cos(rodaAng) * 6, base - 12 - Math.sin(rodaAng) * 6); ctx.stroke();
      });
      ctx.restore();
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

    function porca(b) {
      ctx.save(); ctx.translate(b.x, b.y); ctx.rotate(s.t * 3);
      ctx.fillStyle = AMARELO; ctx.beginPath();
      for (var i = 0; i < 6; i++) { var a = i * Math.PI / 3; ctx.lineTo(Math.cos(a) * 10, Math.sin(a) * 10); }
      ctx.closePath(); ctx.fill();
      ctx.fillStyle = GRAFITE; ctx.beginPath(); ctx.arc(0, 0, 4, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    }

    function placa(x, y, texto) {
      ctx.fillStyle = '#fff'; rr(ctx, x, y, 108, 42, 5); ctx.fill();
      ctx.strokeStyle = GRAFITE; ctx.lineWidth = 2; rr(ctx, x, y, 108, 42, 5); ctx.stroke();
      ctx.fillStyle = '#1f3fa8'; ctx.fillRect(x + 2, y + 2, 104, 10);
      ctx.fillStyle = '#fff'; ctx.font = '700 7px Arial, sans-serif'; ctx.textAlign = 'center'; ctx.fillText('B R A S I L', x + 54, y + 10);
      ctx.fillStyle = GRAFITE; ctx.font = '700 22px ' + fonte; ctx.fillText(texto, x + 54, y + 35);
      ctx.textAlign = 'left';
    }

    function desenhar() {
      ctx.clearRect(0, 0, W, H);
      /* estrada */
      ctx.fillStyle = '#3a3d44'; ctx.fillRect(0, CHAO, W, 5);
      ctx.fillStyle = ASFALTO; ctx.fillRect(0, CHAO + 5, W, H - CHAO);
      ctx.fillStyle = AMARELO;
      for (var fx = -s.faixa; fx < W; fx += 80) ctx.fillRect(fx, CHAO + 28, 44, 6);

      s.obst.forEach(function (o) {
        if (o.tipo === 'cone') cone(o.x);
        else if (o.tipo === 'cones') { cone(o.x); cone(o.x + 28); }
        else pneus(o.x);
      });
      s.bonus.forEach(porca);

      var ang = s.modo === 'rodando' ? s.dist / 13 : 0;
      carro(62, CHAO + s.y, ang);
      s.fumaca.forEach(function (f) {
        ctx.fillStyle = 'rgba(180,184,192,' + Math.max(0, 0.7 - f.t / 3) + ')';
        ctx.beginPath(); ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2); ctx.fill();
      });
      s.flash.forEach(function (f) {
        ctx.fillStyle = 'rgba(245,196,0,' + (1 - f.t / 0.8) + ')'; ctx.font = '700 18px ' + fonte;
        ctx.fillText('+25', f.x - 12, f.y - 14 - f.t * 30);
      });

      /* placar no formato de placa */
      placa(W - 124, 12, 'KM-' + String(Math.min(9999, pontos())).padStart(4, '0'));
      ctx.fillStyle = corTexto; ctx.font = '600 15px ' + fonte; ctx.textAlign = 'right';
      ctx.fillText('RECORDE ' + recorde + ' m', W - 16, 74); ctx.textAlign = 'left';

      /* mensagens */
      ctx.textAlign = 'center'; ctx.fillStyle = corTexto;
      if (s.modo === 'parado') {
        ctx.font = '700 30px ' + fonte; ctx.fillText('PRONTO PARA ACELERAR?', (W - 140) / 2, 62);
        ctx.font = '500 18px ' + fonte; ctx.fillText('Toque ou aperte espaço. Pule os cones, pegue as porcas.', (W - 140) / 2, 90);
      } else if (s.modo === 'bateu') {
        ctx.font = '700 26px ' + fonte;
        ctx.fillText(s.novoRecorde ? 'NOVO RECORDE: ' + pontos() + ' m!' : 'BATEU! ' + pontos() + ' m', (W - 140) / 2, 62);
        ctx.font = '500 18px ' + fonte; ctx.fillText('Toque ou aperte espaço para tentar de novo', (W - 140) / 2, 90);
      }
      ctx.textAlign = 'left';
    }

    function loop(ts) {
      cancelAnimationFrame(raf);
      ultimo = 0;
      raf = requestAnimationFrame(passo);
    }

    function passo(ts) {
      if (!document.body.contains(cv)) return; /* a tela mudou: encerra */
      var dt = ultimo ? Math.min(0.05, (ts - ultimo) / 1000) : 0;
      ultimo = ts;
      atualizar(dt);
      desenhar();
      if (s.modo === 'rodando' || (s.modo === 'bateu' && s.t < 3) || s.fumaca.length) raf = requestAnimationFrame(passo);
    }

    /* controles */
    cv.addEventListener('pointerdown', function (e) { e.preventDefault(); cv.focus({ preventScroll: true }); pular(); });
    function tecla(e) {
      if (!document.body.contains(cv)) { document.removeEventListener('keydown', tecla); return; }
      var alvo = e.target;
      if (alvo !== cv && alvo !== document.body && alvo !== document.documentElement) return; /* não rouba botões e links */
      if (e.code === 'Space' || e.code === 'ArrowUp' || e.key === ' ') { e.preventDefault(); pular(); }
    }
    document.addEventListener('keydown', tecla);
    document.addEventListener('visibilitychange', function () {
      if (document.hidden && s.modo === 'rodando') { s.modo = 'parado'; desenhar(); }
    });

    desenhar();
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { if (s.modo !== 'rodando') desenhar(); });
  }

  window.Jogo404 = { mount: mount };
})();
