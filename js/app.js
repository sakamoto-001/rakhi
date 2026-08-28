/**
 * RakhiVerse Main Application Controller (v4.0 — Role-Separated & Admin Panel Consolidated)
 * Handles SPA navigation, dynamic role switching (Brother vs Sister),
 * consolidated Admin Panel tabs, SQLite persistence, and ceremony hydration.
 */

class RakhiVerseApp {
  constructor() {
    this.currentView = 'home';
    this.currentRole = 'brother'; // 'brother' | 'sister'
    this.bgCanvas = null;
    this.bgCtx = null;
    this.bgParticles = [];
  }

  async init() {
    // ── 1. Initialize SQLite Database ──────────────────────────────
    if (window.rakhiDB) {
      const dbOk = await window.rakhiDB.init();
      console.log('[App] SQLite DB ready:', dbOk);
    }

    // ── 2. Start geo lookup (fire-and-forget, don't block) ──────────
    if (window.rakhiRouter) {
      window.rakhiRouter.fetchGeoLocation();
    }

    // ── 3. Resolve deep-link / URL token ───────────────────────────
    let initialView = 'home';
    if (window.rakhiRouter) {
      initialView = await window.rakhiRouter.resolveDeepLink();
      if (initialView === 'sister' || window.rakhiRouter.token) {
        this.currentRole = 'sister';
      }
    }

    // ── 4. Boot UI subsystems ───────────────────────────────────────
    this.initBgCanvas();
    this.setupNavigation();
    this.setupAdminTabs();
    this.setupRoleSwitcher();
    this.updateNavbarForRole();
    this.setupGlobalListeners();

    if (window.avatarEngine) window.avatarEngine.init();
    if (window.antiGravityBrain) window.antiGravityBrain.init();

    // ── 5. Navigate to initial view (respects deep-link token) ──────
    this.navigate(initialView);
    window.addEventListener('hashchange', () => this.handleRoute());
  }

  /**
   * Set user role: 'brother' or 'sister'
   */
  setRole(role) {
    this.currentRole = role;
    this.updateNavbarForRole();
    if (window.notifications) {
      window.notifications.showToast(
        role === 'sister' ? '🌸 Switched to Sister Ceremony Portal' : '🚀 Switched to Brother Studio Portal',
        'info',
        2200
      );
    }
  }

  /**
   * Dynamically adjust navigation links based on whether user is in Brother or Sister role
   */
  updateNavbarForRole() {
    const desktopNav = document.getElementById('desktop-nav-links');
    const mobileNav = document.getElementById('mobile-nav-links');
    const roleBadgeText = document.getElementById('role-badge-text');
    const roleBadgeIcon = document.getElementById('role-badge-icon');
    const roleBadge = document.getElementById('btn-role-switcher');
    const ctaBtn = document.getElementById('nav-cta-action');

    if (this.currentRole === 'sister') {
      if (roleBadge) roleBadge.classList.add('sister-active');
      if (roleBadgeText) roleBadgeText.innerText = 'Sister Mode 🌸';
      if (roleBadgeIcon) roleBadgeIcon.innerText = '🌸';
      if (ctaBtn) {
        ctaBtn.innerText = 'Start Ceremony 🪔';
        ctaBtn.setAttribute('data-navigate', 'sister');
      }

      const sisterDesktopHTML = `
        <li><a class="nav-link" data-navigate="home" data-view="home">Home</a></li>
        <li><a class="nav-link" data-navigate="sister" data-view="sister">🪢 Sister's Ritual</a></li>
        <li><a class="nav-link" data-navigate="ceremony" data-view="ceremony">🪔 Sacred Ceremony</a></li>
        <li><a class="nav-link" data-navigate="certificate" data-view="certificate">📜 Certificate</a></li>
      `;

      const sisterMobileHTML = `
        <li><a class="mobile-nav-link" data-navigate="home">🏠 Home</a></li>
        <li><a class="mobile-nav-link" data-navigate="sister">🪢 Sister's Sacred Ritual</a></li>
        <li><a class="mobile-nav-link" data-navigate="ceremony">🪔 Sacred Ceremony</a></li>
        <li><a class="mobile-nav-link" data-navigate="certificate">📜 Certificate</a></li>
        <li><a class="mobile-nav-link" onclick="app.setRole('brother'); app.navigate('create');">🚀 Switch to Brother Mode</a></li>
      `;

      if (desktopNav) desktopNav.innerHTML = sisterDesktopHTML;
      if (mobileNav) mobileNav.innerHTML = sisterMobileHTML;

    } else {
      // Brother mode
      if (roleBadge) roleBadge.classList.remove('sister-active');
      if (roleBadgeText) roleBadgeText.innerText = 'Brother Mode 🚀';
      if (roleBadgeIcon) roleBadgeIcon.innerText = '🚀';
      if (ctaBtn) {
        ctaBtn.innerText = 'Create Avatar ✨';
        ctaBtn.setAttribute('data-navigate', 'create');
      }

      const brotherDesktopHTML = `
        <li><a class="nav-link" data-navigate="home" data-view="home">Home</a></li>
        <li><a class="nav-link" data-navigate="create" data-view="create">Create Avatar ✨</a></li>
        <li><a class="nav-link" data-navigate="certificate" data-view="certificate">Certificate 📜</a></li>
        <li><a class="nav-link" data-navigate="admin" data-view="admin">🛡️ Admin Panel</a></li>
      `;

      const brotherMobileHTML = `
        <li><a class="mobile-nav-link" data-navigate="home">🏠 Home</a></li>
        <li><a class="mobile-nav-link" data-navigate="create">✨ Create Brother Avatar</a></li>
        <li><a class="mobile-nav-link" data-navigate="certificate">📜 Certificate</a></li>
        <li><a class="mobile-nav-link" data-navigate="admin">🛡️ Admin Panel</a></li>
        <li><a class="mobile-nav-link" onclick="app.setRole('sister'); app.navigate('sister');">🌸 Switch to Sister Mode</a></li>
      `;

      if (desktopNav) desktopNav.innerHTML = brotherDesktopHTML;
      if (mobileNav) mobileNav.innerHTML = brotherMobileHTML;
    }

    // Rebind newly inserted nav link click events
    this.rebindNavLinks();
  }

  rebindNavLinks() {
    document.querySelectorAll('[data-navigate]').forEach(el => {
      // Remove any prior duplicate handler
      el.onclick = (e) => {
        e.preventDefault();
        const targetView = el.getAttribute('data-navigate');
        if (targetView) this.navigate(targetView);
      };
    });
  }

  setupRoleSwitcher() {
    const btnRole = document.getElementById('btn-role-switcher');
    if (btnRole) {
      btnRole.addEventListener('click', () => {
        const newRole = this.currentRole === 'brother' ? 'sister' : 'brother';
        this.setRole(newRole);
        this.navigate(newRole === 'sister' ? 'sister' : 'create');
      });
    }
  }

  navigate(viewName, params = {}) {
    // Map legacy dashboard/brain navigation to admin panel
    if (viewName === 'dashboard' || viewName === 'brain') {
      viewName = 'admin';
    }

    this.currentView = viewName;

    // Automatically set role context if navigating to sister or create
    if (viewName === 'sister' || viewName === 'ceremony') {
      if (this.currentRole !== 'sister') {
        this.currentRole = 'sister';
        this.updateNavbarForRole();
      }
    } else if (viewName === 'create') {
      if (this.currentRole !== 'brother') {
        this.currentRole = 'brother';
        this.updateNavbarForRole();
      }
    }

    // Update hash
    const currentHash = window.location.hash.replace('#', '').split('?')[0];
    if (currentHash !== viewName) {
      history.replaceState(null, '', `#${viewName}`);
    }

    document.querySelectorAll('.view-section').forEach(sec => sec.classList.remove('active-view'));
    const target = document.getElementById(`view-${viewName}`);
    if (target) {
      target.classList.add('active-view');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    // Update active nav links
    document.querySelectorAll('.nav-link, .mobile-nav-link').forEach(link => {
      const targetV = link.dataset.view || link.getAttribute('data-navigate');
      link.classList.toggle('active', targetV === viewName);
    });

    // Close mobile drawer
    const drawer = document.getElementById('mobile-nav-drawer');
    const menuBtn = document.getElementById('btn-mobile-menu');
    if (drawer && drawer.classList.contains('open')) {
      drawer.classList.remove('open');
      if (menuBtn) menuBtn.classList.remove('open');
    }

    // Lifecycle hooks
    if (viewName === 'admin') {
      if (window.dashboardEngine) window.dashboardEngine.load();
      if (window.antiGravityBrain) window.antiGravityBrain.init();
    }

    if (viewName === 'certificate' && window.certificateEngine) {
      const token = localStorage.getItem('rakhi_active_token') || 'demo';
      let record = null;
      if (window.rakhiDB && window.rakhiDB.ready) {
        record = window.rakhiDB.getBrother(token);
        if (record) {
          const ceremonies = window.rakhiDB.getCeremoniesForBrother(token);
          record.ceremonies = ceremonies;
        }
      }
      if (!record) record = JSON.parse(localStorage.getItem(`rakhi_brother_${token}`) || '{}');

      const sisterWish = localStorage.getItem('rakhi_sister_wish') || '';
      const sName = params.sisterName || (record.ceremonies && record.ceremonies[0] ? record.ceremonies[0].sisterName : 'Priya Sharma');
      
      window.certificateEngine.load(
        record.name || 'Rahul Sharma',
        sName,
        record.avatarUrl || record.avatarImage || 'assets/avatar_royal.jpg',
        sisterWish
      );
    }

    if (viewName === 'sister') {
      this.hydrateSisterView(params);
    }

    if (viewName === 'ceremony') {
      if (window.ceremonyEngine && !window.ceremonyEngine.brotherData) {
        const token = localStorage.getItem('rakhi_active_token') || 'demo';
        let record = null;
        if (window.rakhiDB && window.rakhiDB.ready) {
          record = window.rakhiDB.getBrother(token);
        }
        if (!record) record = JSON.parse(localStorage.getItem(`rakhi_brother_${token}`) || '{}');
        const sWish = localStorage.getItem('rakhi_sister_wish') || '';
        window.ceremonyEngine.init(record, 'Priya Sharma', sWish);
      }
    }

    // Stop celebration particles when leaving ceremony
    if (viewName !== 'ceremony' && window.ceremonyEngine) {
      window.ceremonyEngine.stopCelebration();
    }
  }

  handleRoute() {
    const hash = window.location.hash.replace('#', '') || 'home';
    const [viewName] = hash.split('?');
    const validViews = ['home', 'create', 'sister', 'ceremony', 'certificate', 'admin'];
    if (viewName === 'dashboard' || viewName === 'brain') {
      this.navigate('admin');
    } else {
      this.navigate(validViews.includes(viewName) ? viewName : 'home');
    }
  }

  setupNavigation() {
    this.rebindNavLinks();

    // Mobile Hamburger Button Toggle
    const menuBtn = document.getElementById('btn-mobile-menu');
    const drawer = document.getElementById('mobile-nav-drawer');
    if (menuBtn && drawer) {
      menuBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const isOpen = drawer.classList.toggle('open');
        menuBtn.classList.toggle('open', isOpen);
      });

      // Click outside to close drawer
      document.addEventListener('click', (e) => {
        if (!drawer.contains(e.target) && !menuBtn.contains(e.target) && drawer.classList.contains('open')) {
          drawer.classList.remove('open');
          menuBtn.classList.remove('open');
        }
      });
    }
  }

  /**
   * Setup Admin Panel sub-tabs: Telemetry, AI Brain, System
   */
  setupAdminTabs() {
    const tabBtns = document.querySelectorAll('[data-admintab]');
    tabBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const tabKey = btn.getAttribute('data-admintab');
        
        // Toggle tab buttons
        tabBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        // Toggle tab panes
        document.querySelectorAll('.admin-tab-pane').forEach(pane => {
          pane.classList.remove('active-pane');
        });
        const targetPane = document.getElementById(`admintab-${tabKey}`);
        if (targetPane) {
          targetPane.classList.add('active-pane');
        }

        if (tabKey === 'telemetry' && window.dashboardEngine) {
          window.dashboardEngine.load();
        }
      });
    });
  }

  hydrateSisterView(params = {}) {
    const token = params.token
      || (window.rakhiRouter && window.rakhiRouter.token)
      || localStorage.getItem('rakhi_active_token')
      || 'demo';

    // Try SQLite first
    let record = null;
    if (window.rakhiDB && window.rakhiDB.ready) {
      record = window.rakhiDB.getBrother(token);
    }
    // Fallback localStorage
    if (!record) {
      record = JSON.parse(localStorage.getItem(`rakhi_brother_${token}`) || 'null');
    }

    const tokenBox = document.getElementById('sister-token-input-box');
    if (!record && token === 'demo') {
      // Prompt option to load custom token or default
      if (tokenBox) tokenBox.style.display = 'block';
    }

    const brotherName = (record && record.name) || 'Rahul Sharma';
    const avatarUrl = (record && (record.avatarUrl || record.avatarImage)) || 'assets/avatar_royal.jpg';
    const personalMsg = (record && record.personalMessage) || 'Dearest sister, I promise to always protect and cherish you! ❤️';

    const greetText = document.getElementById('sister-invitation-greeting');
    const avatarImg = document.getElementById('sister-view-brother-avatar');
    const blessingBox = document.getElementById('sister-brother-blessing');
    const blessingText = document.getElementById('sister-brother-blessing-text');

    if (greetText) greetText.innerText = `Your brother ${brotherName} has invited you to celebrate Raksha Bandhan!`;
    if (avatarImg) avatarImg.src = avatarUrl;
    if (blessingBox) {
      if (blessingText) blessingText.innerText = personalMsg;
      blessingBox.style.display = 'block';
    }
  }

  initBgCanvas() {
    this.bgCanvas = document.getElementById('bg-canvas');
    if (!this.bgCanvas) return;
    this.bgCtx = this.bgCanvas.getContext('2d');

    const resize = () => {
      this.bgCanvas.width = window.innerWidth;
      this.bgCanvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    this.bgParticles = [];
    for (let i = 0; i < 55; i++) {
      this.bgParticles.push({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        radius: Math.random() * 3 + 0.8,
        color: ['rgba(255,215,0,0.4)', 'rgba(255,153,51,0.35)', 'rgba(217,4,41,0.25)', 'rgba(168,85,247,0.2)'][Math.floor(Math.random() * 4)],
        vx: (Math.random() - 0.5) * 0.4,
        vy: -Math.random() * 0.5 - 0.15
      });
    }

    const render = () => {
      if (!this.bgCtx) return;
      this.bgCtx.clearRect(0, 0, this.bgCanvas.width, this.bgCanvas.height);

      this.bgParticles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.y < -10) { p.y = this.bgCanvas.height + 10; p.x = Math.random() * this.bgCanvas.width; }
        if (p.x < -10) p.x = this.bgCanvas.width + 10;
        if (p.x > this.bgCanvas.width + 10) p.x = -10;

        this.bgCtx.fillStyle = p.color;
        this.bgCtx.beginPath();
        this.bgCtx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        this.bgCtx.fill();
      });
      requestAnimationFrame(render);
    };
    render();
  }

  setupGlobalListeners() {
    // ── Sound Toggle & Visualizer ────────────────────────────────────
    const soundBtn = document.getElementById('btn-sound-toggle');
    const soundIcon = document.getElementById('sound-btn-icon');
    if (soundBtn) {
      soundBtn.addEventListener('click', () => {
        if (window.festiveAudio) {
          const playing = window.festiveAudio.toggleMusic();
          soundBtn.classList.toggle('playing', playing);
          if (soundIcon) soundIcon.innerText = playing ? '🔔' : '🎵';
          if (window.notifications) {
            window.notifications.showToast(playing ? '🎶 Playing: Sacred Raksha Bandhan Music & Video' : '🔇 Audio Paused', 'info', 2200);
          }
        }
      });
    }

    // ── Rakhi Elements Click Triggers Video & Music ───────────────────
    document.querySelectorAll('.rakhi-float-badge, .rakhi-badge-thumb, #congrats-wrist-rakhi').forEach(el => {
      el.style.cursor = 'pointer';
      el.setAttribute('title', 'Click to play Sacred Raksha Bandhan Celebration Video 🪢');
      el.addEventListener('click', () => {
        if (window.festiveAudio) {
          window.festiveAudio.playRakhiVideo(true);
        }
      });
    });

    // ── Generate Avatar (Strict Validation) ─────────────────────────
    const btnGenerate = document.getElementById('btn-generate-avatar');
    const brotherNameInput = document.getElementById('brother-name-input');

    if (brotherNameInput) {
      brotherNameInput.addEventListener('input', () => {
        if (brotherNameInput.value.trim()) {
          brotherNameInput.style.borderColor = '';
          brotherNameInput.style.boxShadow = '';
        }
      });
    }

    if (btnGenerate) {
      btnGenerate.addEventListener('click', async () => {
        const name = brotherNameInput ? brotherNameInput.value.trim() : '';

        // Strict validation: Don't advance until brother's name is filled
        if (!name) {
          if (brotherNameInput) {
            brotherNameInput.focus();
            brotherNameInput.style.borderColor = 'var(--kumkum-400)';
            brotherNameInput.style.boxShadow = '0 0 16px rgba(255, 42, 95, 0.6)';
            brotherNameInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
          if (window.notifications) {
            window.notifications.showToast('⚠️ Please enter Brother\'s Name to generate your avatar & link!', 'error', 3500);
          }
          return;
        }

        if (window.avatarEngine) {
          const result = await window.avatarEngine.generateAvatar(name);

          // Build the shareable URL using the router
          const shareUrl = window.rakhiRouter
            ? window.rakhiRouter.buildShareUrl(result.token)
            : `${window.location.origin}${window.location.pathname}?token=${result.token}`;

          const linkCard = document.getElementById('generated-link-card');
          const shareUrlInput = document.getElementById('shareable-rakhi-url');
          if (linkCard && shareUrlInput) {
            shareUrlInput.value = shareUrl;
            linkCard.style.display = 'block';
            linkCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
          }

          // Show toast
          if (window.notifications) {
            window.notifications.showToast('🚀 Avatar created! Share the sacred link with your sister.', 'success');
          }
        }
      });
    }

    // ── Copy Link ───────────────────────────────────────────────────
    const btnCopyLink = document.getElementById('btn-copy-rakhi-link');
    if (btnCopyLink) {
      btnCopyLink.addEventListener('click', () => {
        const shareUrlInput = document.getElementById('shareable-rakhi-url');
        if (shareUrlInput && window.notifications) {
          window.notifications.copyToClipboard(shareUrlInput.value, 'Rakhi invitation link');
        } else if (shareUrlInput) {
          navigator.clipboard.writeText(shareUrlInput.value).then(() => {
            btnCopyLink.innerText = 'Copied ✓';
            setTimeout(() => { btnCopyLink.innerText = 'Copy 📋'; }, 2000);
          });
        }
      });
    }

    // ── Share Sheet button ───────────────────────────────────────────
    const btnShareSheet = document.getElementById('btn-open-share-sheet');
    if (btnShareSheet) {
      btnShareSheet.addEventListener('click', () => {
        const shareUrlInput = document.getElementById('shareable-rakhi-url');
        const name = (document.getElementById('brother-name-input') || {}).value || '';
        const url = shareUrlInput ? shareUrlInput.value : window.location.href;
        if (window.notifications) window.notifications.openShareSheet(name || 'Brother', url);
      });
    }

    // ── Sister Manual Token Loader ──────────────────────────────────
    const btnSisterToken = document.getElementById('btn-sister-load-token');
    const sisterTokenInput = document.getElementById('sister-manual-token');
    if (btnSisterToken && sisterTokenInput) {
      btnSisterToken.addEventListener('click', () => {
        const tok = sisterTokenInput.value.trim();
        if (tok) {
          localStorage.setItem('rakhi_active_token', tok);
          this.hydrateSisterView({ token: tok });
          if (window.notifications) {
            window.notifications.showToast(`Loaded ceremony invitation (${tok})`, 'success');
          }
        }
      });
    }

    // ── Sister Start Ceremony (Strict Validation) ───────────────────
    const btnStartCeremony = document.getElementById('btn-start-sister-ceremony');
    const sisterNameInput = document.getElementById('sister-name-input');
    const sisterWishInput = document.getElementById('sister-wish-input');

    if (sisterNameInput) {
      sisterNameInput.addEventListener('input', () => {
        if (sisterNameInput.value.trim()) {
          sisterNameInput.style.borderColor = '';
          sisterNameInput.style.boxShadow = '';
        }
      });
    }

    if (btnStartCeremony) {
      btnStartCeremony.addEventListener('click', () => {
        const sName = sisterNameInput ? sisterNameInput.value.trim() : '';

        // Strict validation: Don't advance until sister's name is filled
        if (!sName) {
          if (sisterNameInput) {
            sisterNameInput.focus();
            sisterNameInput.style.borderColor = 'var(--kumkum-400)';
            sisterNameInput.style.boxShadow = '0 0 16px rgba(255, 42, 95, 0.6)';
            sisterNameInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
          if (window.notifications) {
            window.notifications.showToast('⚠️ Please enter Sister\'s Name before starting the ceremony!', 'error', 3500);
          }
          return;
        }

        const sWish = (sisterWishInput && sisterWishInput.value.trim()) || '';
        
        // Save sister's name and wish locally
        localStorage.setItem('rakhi_active_sister_name', sName);
        localStorage.setItem('rakhi_sister_wish', sWish);

        const token = localStorage.getItem('rakhi_active_token') || 'demo';

        let record = null;
        if (window.rakhiDB && window.rakhiDB.ready) {
          record = window.rakhiDB.getBrother(token);
        }
        if (!record) record = JSON.parse(localStorage.getItem(`rakhi_brother_${token}`) || '{}');

        if (window.ceremonyEngine) {
          window.ceremonyEngine.init(record, sName, sWish);
        }
        this.navigate('ceremony');
      });
    }

    // ── AntiGravity Audit ───────────────────────────────────────────
    const btnRunAudit = document.getElementById('btn-run-brain-audit');
    if (btnRunAudit) {
      btnRunAudit.addEventListener('click', () => {
        if (window.antiGravityBrain) window.antiGravityBrain.runFullProjectAudit();
      });
    }

    // ── AntiGravity Query ───────────────────────────────────────────
    const brainForm = document.getElementById('brain-query-form');
    const brainInput = document.getElementById('brain-query-input');
    if (brainForm && brainInput) {
      brainForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const q = brainInput.value.trim();
        if (q && window.antiGravityBrain) {
          window.antiGravityBrain.askBrainQuestion(q);
          brainInput.value = '';
        }
      });
    }

    // ── Rakhi Tied Image Modal Close ────────────────────────────────
    const modal = document.getElementById('rakhi-tied-modal');
    if (modal) {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.style.display = 'none';
      });
    }
  }
}

window.addEventListener('DOMContentLoaded', () => {
  window.app = new RakhiVerseApp();
  window.app.init();
});
