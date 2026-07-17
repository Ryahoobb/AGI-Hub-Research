/**
 * AGI HUB shared header loader.
 * Fetches partials/header.html and injects it into #site-header-mount.
 * Adds .active class to the current page nav link.
 * Self-locates base path from its own script src.
 */
(function () {
  // Determine current page identifier early so theme-init can use it
  var path = location.pathname.replace(/\/$/, '');
  var fileName = path.substring(path.lastIndexOf('/') + 1).replace(/\.html$/, '');
  if (!fileName || path.endsWith('/AGI-hub') || path === '') fileName = 'index';
  // Article pages all count as "articles"
  if (location.pathname.indexOf('/articles/') !== -1) fileName = 'articles';

  // Dark mode is enabled only on index and article pages (reading-oriented).
  // Feature pages (map, prediction, taxonomy, etc.) stay light-only.
  var darkEnabled = (fileName === 'index' || fileName === 'articles');

  // ── Theme init (runs ASAP to minimize FOUC when stored pref differs from OS) ──
  try {
    if (darkEnabled) {
      var storedTheme = localStorage.getItem('agi-hub-theme');
      if (storedTheme === 'dark' || storedTheme === 'light') {
        document.documentElement.setAttribute('data-theme', storedTheme);
      }
      // if nothing stored, CSS @media (prefers-color-scheme: dark) handles OS preference
    } else {
      // Force light mode on feature pages (overrides OS preference and any stored theme)
      document.documentElement.setAttribute('data-theme', 'light');
    }
  } catch (e) { /* noop */ }

  var currentScript = document.currentScript;
  if (!currentScript) {
    var scripts = document.getElementsByTagName('script');
    for (var i = scripts.length - 1; i >= 0; i--) {
      if (scripts[i].src && scripts[i].src.indexOf('header.js') !== -1) {
        currentScript = scripts[i];
        break;
      }
    }
  }
  if (!currentScript) return;

  // partials/header.js → strip filename → partials/ → strip partials/ → site base
  var scriptUrl = currentScript.src;
  var partialsBase = scriptUrl.substring(0, scriptUrl.lastIndexOf('/') + 1);
  var siteBase = partialsBase.replace(/partials\/$/, '');

  fetch(partialsBase + 'header.html')
    .then(function (r) {
      if (!r.ok) throw new Error('header.html fetch failed: ' + r.status);
      return r.text();
    })
    .then(function (html) {
      html = html.replace(/\{\{base\}\}/g, siteBase);
      var mount = document.getElementById('site-header-mount');
      if (!mount) return;
      var wrapper = document.createElement('div');
      wrapper.innerHTML = html;
      var headerEl = wrapper.firstElementChild;
      mount.parentNode.replaceChild(headerEl, mount);

      // Mark active link
      var links = headerEl.querySelectorAll('[data-page]');
      for (var j = 0; j < links.length; j++) {
        if (links[j].getAttribute('data-page') === fileName) {
          links[j].classList.add('active');
        }
      }

      // Hamburger toggle (mobile)
      var toggle = headerEl.querySelector('.site-nav-toggle');
      var navRight = headerEl.querySelector('.site-nav-right');
      if (toggle && navRight) {
        toggle.addEventListener('click', function () {
          var isOpen = navRight.classList.toggle('open');
          toggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
        });
        // Close menu when a link is clicked
        var navLinks = navRight.querySelectorAll('a');
        for (var k = 0; k < navLinks.length; k++) {
          navLinks[k].addEventListener('click', function () {
            navRight.classList.remove('open');
            toggle.setAttribute('aria-expanded', 'false');
          });
        }
      }

      // Theme toggle wiring (only on dark-enabled pages; hidden elsewhere)
      var themeToggle = headerEl.querySelector('[data-theme-toggle]');
      if (themeToggle) {
        if (!darkEnabled) {
          themeToggle.style.display = 'none';
        } else {
          themeToggle.addEventListener('click', function () {
            var current = document.documentElement.getAttribute('data-theme');
            var next;
            if (current === 'dark') {
              next = 'light';
            } else if (current === 'light') {
              next = 'dark';
            } else {
              // no explicit attribute: derive from current OS preference and flip
              var osDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
              next = osDark ? 'light' : 'dark';
            }
            document.documentElement.setAttribute('data-theme', next);
            try { localStorage.setItem('agi-hub-theme', next); } catch (e) { /* noop */ }
          });
        }
      }

      // Initialize Google Translate widget if the function exists
      if (typeof googleTranslateElementInit === 'function') {
        try { googleTranslateElementInit(); } catch (e) { /* noop */ }
      }

      // Inject backlinks + related sections on article pages
      if (fileName === 'articles') {
        injectConnections();
      }
    })
    .catch(function (err) {
      console.warn('[AGI HUB header] ' + err.message);
    });

  function injectConnections() {
    var currentSlug = location.pathname.substring(location.pathname.lastIndexOf('/') + 1);
    if (!currentSlug || !/^\d+-[\w-]+\.html$/i.test(currentSlug)) return;
    var currentSlugBare = currentSlug.replace(/\.html$/, '');

    Promise.all([
      fetch(siteBase + 'backlinks.json').then(function (r) { return r.ok ? r.json() : null; }),
      fetch(siteBase + 'articles.json').then(function (r) { return r.ok ? r.json() : null; }),
      fetch(siteBase + 'related.json').then(function (r) { return r.ok ? r.json() : null; }).catch(function () { return null; })
    ]).then(function (results) {
      var blData = results[0];
      var articles = results[1];
      var relData = results[2];
      if (!articles || !Array.isArray(articles)) return;

      var bySlugFile = {}; // key: "NN-xxx.html"
      var bySlugBare = {}; // key: "NN-xxx"
      for (var i = 0; i < articles.length; i++) {
        var bare = articles[i].slug.replace(/\.html$/, '');
        var file = bare + '.html';
        bySlugFile[file] = articles[i];
        bySlugBare[bare] = articles[i];
      }

      // Collect backlinks (articles pointing to current)
      var backlinks = [];
      if (blData && Array.isArray(blData.edges)) {
        for (var j = 0; j < blData.edges.length; j++) {
          var edge = blData.edges[j];
          if (edge.to === currentSlug && bySlugFile[edge.from]) {
            backlinks.push(bySlugFile[edge.from]);
          }
        }
        backlinks.sort(function (a, b) { return (a.no || 0) - (b.no || 0); });
      }

      // Collect related (undirected; current article on either side)
      var related = [];
      var seenRelated = {};
      if (relData && Array.isArray(relData.relations)) {
        for (var k = 0; k < relData.relations.length; k++) {
          var rel = relData.relations[k];
          var other = null;
          if (rel.a === currentSlugBare) other = rel.b;
          else if (rel.b === currentSlugBare) other = rel.a;
          if (other && bySlugBare[other] && !seenRelated[other]) {
            seenRelated[other] = true;
            related.push(bySlugBare[other]);
          }
        }
        related.sort(function (a, b) { return (a.no || 0) - (b.no || 0); });
      }

      if (backlinks.length === 0 && related.length === 0) return;

      var main = document.querySelector('main');
      if (!main) return;

      // Shared styles injected once per page
      if (!document.getElementById('connections-style')) {
        var styleEl = document.createElement('style');
        styleEl.id = 'connections-style';
        styleEl.textContent =
          '.connections-section{max-width:720px;margin:0 auto;padding:32px 24px;font-family:HelveticaNeue,"Helvetica Neue",Helvetica,Arial,"Hiragino Kaku Gothic ProN",sans-serif;font-feature-settings:"palt";}' +
          '.connections-section.first{margin-top:64px;border-top:1px solid var(--cn-border,#e5e5e5);padding-top:32px;}' +
          '.connections-section.last{padding-bottom:48px;}' +
          '[data-theme="dark"] .connections-section.first{--cn-border:#2a2a2a;}' +
          '.connections-section .cn-label{font-family:"SF Mono","Fira Code",Menlo,Consolas,monospace;font-size:12px;font-weight:500;letter-spacing:0.08em;text-transform:uppercase;color:var(--cn-muted,#555);margin-bottom:20px;display:flex;align-items:center;gap:10px;}' +
          '[data-theme="dark"] .connections-section .cn-label{--cn-muted:#777;}' +
          '.connections-section .cn-count{display:inline-flex;align-items:center;justify-content:center;min-width:22px;height:22px;padding:0 7px;border-radius:11px;font-size:11px;font-weight:600;letter-spacing:0;background:var(--cn-badge-bg,#1a1a1a);color:var(--cn-badge-fg,#fff);}' +
          '[data-theme="dark"] .connections-section .cn-count{--cn-badge-bg:#e5e5e5;--cn-badge-fg:#1a1a1a;}' +
          '.connections-section.related .cn-count{--cn-badge-bg:#007acc;--cn-badge-fg:#fff;}' +
          '[data-theme="dark"] .connections-section.related .cn-count{--cn-badge-bg:#4ea3d9;--cn-badge-fg:#0f0f0f;}' +
          '.connections-section ul{list-style:none;padding:0;margin:0;}' +
          '.connections-section li{padding:12px 0;border-bottom:1px solid var(--cn-border-soft,#f0f0f0);}' +
          '[data-theme="dark"] .connections-section li{--cn-border-soft:#1f1f1f;}' +
          '.connections-section li:last-child{border-bottom:none;}' +
          '.connections-section a{display:block;color:var(--cn-text,#1a1a1a);text-decoration:none;transition:color 0.15s;}' +
          '[data-theme="dark"] .connections-section a{--cn-text:#e5e5e5;}' +
          '.connections-section a:hover{color:var(--cn-hover,#007acc);}' +
          '.connections-section .cn-no{display:inline-block;font-family:"SF Mono","Fira Code",Menlo,Consolas,monospace;font-size:12px;color:var(--cn-muted,#999);margin-right:12px;min-width:48px;}' +
          '.connections-section .cn-title{font-size:15px;line-height:1.5;}';
        document.head.appendChild(styleEl);
      }

      var sectionsToAppend = [];
      if (related.length > 0) sectionsToAppend.push({ kind: 'related', label: '関連記事', items: related });
      if (backlinks.length > 0) sectionsToAppend.push({ kind: 'backlinks', label: 'この記事を参照している記事', items: backlinks });

      sectionsToAppend.forEach(function (cfg, idx) {
        var section = document.createElement('section');
        section.className = 'connections-section ' + cfg.kind + (idx === 0 ? ' first' : '') + (idx === sectionsToAppend.length - 1 ? ' last' : '');
        section.setAttribute('aria-label', cfg.label);
        section.innerHTML =
          '<div class="cn-label">' + cfg.label + ' <span class="cn-count">' + cfg.items.length + '</span></div>' +
          '<ul>' +
          cfg.items.map(function (a) {
            var num = a.no != null ? ('No.' + String(a.no).padStart(2, '0')) : '';
            var bare = a.slug.replace(/\.html$/, '');
            var href = bare + '.html';
            return '<li><a href="' + href + '"><span class="cn-no">' + num + '</span><span class="cn-title">' + escapeHtml(a.title || a.slug) + '</span></a></li>';
          }).join('') +
          '</ul>';
        main.appendChild(section);
      });
    }).catch(function (err) {
      console.warn('[AGI HUB connections] ' + (err && err.message ? err.message : err));
    });
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
})();
