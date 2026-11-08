/* Aba "Desenvolvedor": perfil do autor, com dados ao vivo da API pública do GitHub (sem token). */
(function () {
  'use strict';

  var USER = 'MMarcatoRicardo';

  /* Usado quando a API do GitHub não responde (offline ou limite de requisições). */
  var FALLBACK = {
    nome: 'Ricardo Medeiros Marcato',
    login: USER,
    cargo: 'Data Analyst | Software Engineer',
    bio: 'Python • SQL • PostgreSQL • BI • Data Engineering. Building data-driven solutions and software that solve real problems.',
    empresa: 'RH Numbers',
    local: 'Curitiba, PR',
    avatar: 'https://avatars.githubusercontent.com/u/208637720?v=4',
    stack: ['Python', 'SQL', 'PostgreSQL', 'BI', 'Data Engineering', 'JavaScript', 'HTML/CSS'],
    links: {
      github: 'https://github.com/' + USER,
      linkedin: 'https://www.linkedin.com/in/ricardo-medeiros-marcato/',
      instagram: 'https://www.instagram.com/ricardo.marcato/'
    },
    stats: { repos: 6, followers: 5, following: 5 },
    repos: [
      { name: 'autocenter-veloz', description: 'Veloz Acompanha: status do conserto e aprovação de orçamento pelo celular.', language: 'JavaScript', stars: 0, url: 'https://github.com/' + USER + '/autocenter-veloz' },
      { name: 'dashboard_pessoal_2026', description: '', language: 'HTML', stars: 0, url: 'https://github.com/' + USER + '/dashboard_pessoal_2026' },
      { name: 'DESIGN_PROFISSIONAL', description: '', language: 'HTML', stars: 0, url: 'https://github.com/' + USER + '/DESIGN_PROFISSIONAL' },
      { name: 'Motorista_Aplicativo', description: '', language: 'HTML', stars: 0, url: 'https://github.com/' + USER + '/Motorista_Aplicativo' },
      { name: 'ROCKETMUSIC', description: '', language: 'JavaScript', stars: 0, url: 'https://github.com/' + USER + '/ROCKETMUSIC' },
      { name: 'TINO_AI', description: '', language: 'HTML', stars: 0, url: 'https://github.com/' + USER + '/TINO_AI' }
    ]
  };

  var LANG_COLORS = { JavaScript: '#f1e05a', HTML: '#e34c26', CSS: '#563d7c', Python: '#3572A5', TypeScript: '#3178c6', SQL: '#e38c00', 'Jupyter Notebook': '#DA5B0B' };

  var ICONS = {
    github: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27s1.36.09 2 .27c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8z"/></svg>',
    linkedin: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M0 1.15C0 .52.52 0 1.17 0h13.66C15.48 0 16 .52 16 1.15v13.7c0 .63-.52 1.15-1.17 1.15H1.17C.52 16 0 15.48 0 14.85V1.15zm4.94 12.24V6.17H2.54v7.22h2.4zM3.74 5.18c.84 0 1.36-.55 1.36-1.25-.02-.71-.52-1.25-1.34-1.25-.82 0-1.36.54-1.36 1.25 0 .7.52 1.25 1.33 1.25h.01zm4.91 8.21V9.36c0-.22.02-.43.08-.59.17-.43.57-.88 1.23-.88.87 0 1.22.66 1.22 1.63v3.87h2.4V9.25c0-2.22-1.18-3.25-2.77-3.25-1.28 0-1.84.7-2.16 1.2h.02V6.17h-2.4c.03.68 0 7.22 0 7.22h2.38z"/></svg>',
    instagram: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 0C5.83 0 5.56.01 4.7.05 3.85.09 3.27.22 2.76.42a3.9 3.9 0 0 0-1.42.92A3.9 3.9 0 0 0 .42 2.76C.22 3.27.09 3.85.05 4.7.01 5.56 0 5.83 0 8s.01 2.44.05 3.3c.04.85.17 1.43.37 1.94.2.53.48.98.92 1.42.44.44.89.72 1.42.92.51.2 1.09.33 1.94.37.86.04 1.13.05 3.3.05s2.44-.01 3.3-.05c.85-.04 1.43-.17 1.94-.37a3.9 3.9 0 0 0 1.42-.92c.44-.44.72-.89.92-1.42.2-.51.33-1.09.37-1.94.04-.86.05-1.13.05-3.3s-.01-2.44-.05-3.3c-.04-.85-.17-1.43-.37-1.94a3.9 3.9 0 0 0-.92-1.42A3.9 3.9 0 0 0 13.24.42C12.73.22 12.15.09 11.3.05 10.44.01 10.17 0 8 0zm0 1.44c2.14 0 2.39.01 3.23.05.78.04 1.2.17 1.49.27.37.15.64.32.92.6.28.28.45.55.6.92.1.28.24.71.27 1.49.04.84.05 1.1.05 3.23s-.01 2.39-.05 3.23c-.04.78-.17 1.2-.27 1.49-.15.37-.32.64-.6.92-.28.28-.55.45-.92.6-.28.1-.71.24-1.49.27-.84.04-1.1.05-3.23.05s-2.39-.01-3.23-.05c-.78-.04-1.2-.17-1.49-.27a2.5 2.5 0 0 1-.92-.6 2.5 2.5 0 0 1-.6-.92c-.1-.28-.24-.71-.27-1.49C1.45 10.39 1.44 10.14 1.44 8s.01-2.39.05-3.23c.04-.78.17-1.2.27-1.49.15-.37.32-.64.6-.92.28-.28.55-.45.92-.6.28-.1.71-.24 1.49-.27C5.61 1.45 5.86 1.44 8 1.44zM8 3.9a4.1 4.1 0 1 0 0 8.2 4.1 4.1 0 0 0 0-8.2zm0 6.76a2.66 2.66 0 1 1 0-5.32 2.66 2.66 0 0 1 0 5.32zm5.23-6.92a.96.96 0 1 1-1.92 0 .96.96 0 0 1 1.92 0z"/></svg>'
  };

  var live = null;      // dados vindos da API nesta sessão
  var loading = false;

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function data() { return live || FALLBACK; }

  function repoCard(r) {
    var color = LANG_COLORS[r.language] || '#94a3b8';
    return '<a class="card repo" href="' + esc(r.url) + '" target="_blank" rel="noopener">' +
      '<strong>' + esc(r.name) + '</strong>' +
      '<p>' + (r.description ? esc(r.description) : 'Repositório público no GitHub.') + '</p>' +
      '<span class="small">' + (r.language ? '<span><span class="lang-dot" style="background:' + color + '"></span>' + esc(r.language) + '</span>' : '') +
      '<span>★ ' + r.stars + '</span></span></a>';
  }

  function view() {
    var d = data();
    var cred = (window.VELOZ_DATA && window.VELOZ_DATA.CREDITOS) || [];
    return '<section class="dev">' +
      '<a class="back" href="#/">← Início</a>' +
      '<p class="eyebrow">Sobre o projeto</p>' +
      '<h1>Veloz Acompanha</h1>' +
      '<p class="lead">Estudo de Caso 3 da disciplina Design Profissional (Engenharia de Software, Universidade Positivo, 2º período). Projeto individual: pesquisa, UX, interface e código.</p>' +
      '<div class="project-facts">' +
        '<div class="card"><h3>O problema</h3><p>Telefone da recepção lotado, mecânicos interrompidos e carros parados no pátio esperando aprovação de orçamento.</p></div>' +
        '<div class="card"><h3>A decisão</h3><p>Web app instalável (PWA): o cliente abre pelo link do WhatsApp, sem baixar nada, e a equipe usa o mesmo produto.</p></div>' +
        '<div class="card"><h3>A construção</h3><p>HTML, CSS e JavaScript puros, sem build e sem credenciais. Funciona offline e roda no GitHub Pages.</p></div>' +
      '</div>' +
      '<h2 class="section-title">Quem fez</h2>' +
      '<div class="card dev-hero">' +
        '<img class="dev-avatar" src="' + esc(d.avatar) + '" alt="Foto de ' + esc(d.nome) + '" width="120" height="120">' +
        '<div>' +
          '<h2>' + esc(d.nome) + '</h2>' +
          '<p class="dev-handle">@' + esc(d.login) + '</p>' +
          '<p class="dev-role">' + esc(d.cargo) + '</p>' +
          '<p class="dev-bio">' + esc(d.bio) + '</p>' +
          '<div class="dev-meta">' +
            (d.empresa ? '<span>' + esc(d.empresa) + '</span>' : '') +
            (d.local ? '<span>' + esc(d.local) + '</span>' : '') +
            '<span>Engenharia de Software · Universidade Positivo</span>' +
          '</div>' +
          '<div class="dev-links">' +
            '<a class="btn btn-dark" href="' + d.links.github + '" target="_blank" rel="noopener">' + ICONS.github + ' GitHub</a>' +
            '<a class="btn btn-ghost" href="' + d.links.linkedin + '" target="_blank" rel="noopener">' + ICONS.linkedin + ' LinkedIn</a>' +
            '<a class="btn btn-ghost" href="' + d.links.instagram + '" target="_blank" rel="noopener">' + ICONS.instagram + ' Instagram</a>' +
            '<a class="btn btn-primary" href="https://github.com/' + USER + '/oficina-veloz" target="_blank" rel="noopener">Código deste app</a>' +
          '</div>' +
        '</div>' +
      '</div>' +
      '<h2 class="section-title">Outros repositórios</h2>' +
      '<div class="repo-grid">' + d.repos.map(repoCard).join('') + '</div>' +
      '<p class="live-note">' + (live ? 'Dados ao vivo da API pública do GitHub.' : 'Carregando dados ao vivo do GitHub…') + '</p>' +
      '<h2 class="section-title" id="creditos">Créditos das fotos</h2>' +
      '<p class="muted small">Fotos reais do Wikimedia Commons, usadas conforme cada licença. A oficina, as pessoas, placas e telefones são fictícios.</p>' +
      '<ul class="credits">' + cred.map(function (c) {
        return '<li>' + esc(c.uso) + ': foto de ' + esc(c.autor) + ', <a href="' + esc(c.url) + '" target="_blank" rel="noopener">' + esc(c.licenca) + '</a></li>';
      }).join('') + '</ul>' +
      '</section>';
  }

  function fetchLive(onDone) {
    if (live || loading || !window.fetch) return;
    loading = true;
    var base = 'https://api.github.com/users/' + USER;
    Promise.all([
      fetch(base).then(function (r) { if (!r.ok) throw r; return r.json(); }),
      fetch(base + '/repos?sort=updated&per_page=6').then(function (r) { if (!r.ok) throw r; return r.json(); })
    ]).then(function (res) {
      var u = res[0], repos = res[1];
      /* A bio do GitHub vem em parágrafos: o primeiro é o cargo, o resto vira descrição. */
      var partes = (u.bio || '').split(/\r?\n\s*\r?\n/).map(function (x) { return x.replace(/\s*\r?\n\s*/g, '. ').trim(); }).filter(Boolean);
      live = {
        nome: FALLBACK.nome,
        login: u.login,
        cargo: partes.length > 1 ? partes[0] : FALLBACK.cargo,
        bio: partes.length > 1 ? partes.slice(1).join('. ') : (partes[0] || FALLBACK.bio),
        empresa: u.company || FALLBACK.empresa,
        local: u.location || FALLBACK.local,
        avatar: u.avatar_url || FALLBACK.avatar,
        stack: FALLBACK.stack,
        links: FALLBACK.links,
        stats: { repos: u.public_repos, followers: u.followers, following: u.following },
        repos: repos.filter(function (r) { return !r.fork; }).map(function (r) {
          return { name: r.name, description: r.description, language: r.language, stars: r.stargazers_count, url: r.html_url };
        })
      };
      onDone();
    }).catch(function () {
      var note = document.querySelector('.live-note');
      if (note) note.textContent = 'Sem conexão com o GitHub agora; mostrando dados salvos.';
    }).then(function () { loading = false; });
  }

  window.VELOZ_DEV = { view: view, fetchLive: fetchLive };
})();
