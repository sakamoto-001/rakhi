/**
 * RakhiVerse Interactive Sacred Ceremony Engine (v2 — Enhanced)
 * 5-Step Cinematic Ceremony with Rakhi-Tied Image Compositing.
 * When Rakhi is tied, the brother's avatar is edited to show Rakhi on wrist.
 * All ceremonies are saved to SQLite database.
 */

class CeremonyEngine {
  constructor() {
    this.currentStep = 1;
    this.brotherData = null;
    this.sisterName = 'Priya Sharma';
    this.canvas = null;
    this.ctx = null;
    this.particles = [];
    this.petals = [];
    this.animatingCelebration = false;
    this.rakhiTiedImageUrl = null;
  }

  init(brotherData, sisterName, sisterWish) {
    this.brotherData = brotherData || {
      id: 'demo',
      name: 'Rahul Sharma',
      avatarUrl: 'assets/avatar_royal.jpg',
      avatarStyle: 'Royal Prince',
      personalMessage: 'Dearest sister, I promise to always protect and cherish you! ❤️'
    };
    this.sisterName = sisterName || 'Priya Sharma';
    this.sisterWish = sisterWish || localStorage.getItem('rakhi_sister_wish') || '';
    this.currentStep = 1;
    this.rakhiTiedImageUrl = null;
    this.animatingCelebration = false;

    this.canvas = document.getElementById('celebration-canvas');
    if (this.canvas) {
      this.ctx = this.canvas.getContext('2d');
      this.resizeCanvas();
      window.addEventListener('resize', () => this.resizeCanvas());
    }

    this.setupCeremonyUI();
    this.setupInteractions();
    this.setStep(1);
  }

  resizeCanvas() {
    if (!this.canvas) return;
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  setupCeremonyUI() {
    const avatarImg = document.getElementById('ceremony-brother-avatar');
    if (avatarImg) {
      avatarImg.src = this.brotherData.avatarUrl || this.brotherData.avatarImage || 'assets/avatar_royal.jpg';
    }

    // Update greeting message with brother's personal message
    const blessingEl = document.getElementById('ceremony-brother-blessing');
    if (blessingEl) {
      const msg = this.brotherData.personalMessage || 'Dearest sister, I promise to stand by your side forever! ❤️';
      blessingEl.innerHTML = `<span>“${msg}”</span> <span style="font-size:0.75rem;color:var(--gold-400);display:block;margin-top:0.2rem;">— Brother's Sacred Promise 🪢</span>`;
      blessingEl.style.display = 'block';
    }

    const flame = document.getElementById('ceremony-diya-flame');
    if (flame) flame.classList.remove('lit');

    const tilakMark = document.getElementById('forehead-tilak-mark');
    if (tilakMark) tilakMark.style.display = 'none';

    const tiedRakhi = document.getElementById('wrist-tied-rakhi');
    if (tiedRakhi) tiedRakhi.style.display = 'none';

    const congratsCard = document.getElementById('ceremony-congrats-card');
    if (congratsCard) congratsCard.style.display = 'none';

    const controlsBox = document.getElementById('ceremony-controls-box');
    if (controlsBox) controlsBox.style.display = 'flex';
  }

  setStep(stepNumber) {
    this.currentStep = stepNumber;

    document.querySelectorAll('.ceremony-step-dot').forEach((dot, idx) => {
      const stepIdx = idx + 1;
      dot.classList.toggle('active', stepIdx === stepNumber);
      dot.classList.toggle('completed', stepIdx < stepNumber);
    });

    const instruction = document.getElementById('ceremony-step-instruction');
    const diyaTool = document.getElementById('tool-diya-wrap');
    const tilakTool = document.getElementById('tool-tilak-wrap');
    const rakhiTool = document.getElementById('tool-rakhi-wrap');
    const sweetsTool = document.getElementById('tool-sweets-wrap');
    const foreheadTarget = document.getElementById('forehead-tilak-target');
    const wristTarget = document.getElementById('wrist-drop-target');

    [diyaTool, tilakTool, rakhiTool, sweetsTool, foreheadTarget, wristTarget].forEach(el => {
      if (el) el.style.display = 'none';
    });

    switch (stepNumber) {
      case 1:
        if (instruction) instruction.innerHTML = `Step 1: Click the auspicious brass <span>Diya</span> to ignite the sacred flame 🪔`;
        if (diyaTool) diyaTool.style.display = 'flex';
        break;

      case 2:
        if (instruction) instruction.innerHTML = `Step 2: Tap or click <span>anywhere on brother's forehead</span> to place the sacred Tilak 🔴`;
        if (tilakTool) tilakTool.style.display = 'flex';
        if (foreheadTarget) foreheadTarget.style.display = 'none'; // Replaced by direct photo click
        break;

      case 3:
        if (instruction) instruction.innerHTML = `Step 3: Drag or tap the sacred <span>Rakhi</span> to tie it onto your brother's wrist! 🪢`;
        if (rakhiTool) rakhiTool.style.display = 'flex';
        if (wristTarget) wristTarget.style.display = 'flex';
        break;

      case 4:
        if (instruction) instruction.innerHTML = `Step 4: Offer sweet <span>Mithai</span> to your brother to seal the celebration! 🍬`;
        if (sweetsTool) sweetsTool.style.display = 'flex';
        break;

      case 5:
        this.triggerGrandCelebration();
        break;
    }
  }

  setupInteractions() {
    // 1. Diya click
    const diyaWrap = document.getElementById('tool-diya-wrap');
    if (diyaWrap) {
      diyaWrap.onclick = () => {
        const flame = document.getElementById('ceremony-diya-flame');
        if (flame) flame.classList.add('lit');
        if (window.festiveAudio) window.festiveAudio.playTempleBell();
        this.spawnParticleBurst(window.innerWidth / 2, window.innerHeight / 2 - 100);
        setTimeout(() => this.setStep(2), 800);
      };
    }

    // 2. Interactive Tilak Placement directly by clicking on the Brother Avatar Image
    const avatarFrame = document.getElementById('ceremony-avatar-interactive-frame') || document.querySelector('.stage-avatar-frame');
    const tilakWrap = document.getElementById('tool-tilak-wrap');
    const tilakMark = document.getElementById('forehead-tilak-mark');

    const placeTilakAt = (xPercent = 50, yPercent = 36) => {
      if (this.currentStep !== 2) return;

      if (tilakMark) {
        tilakMark.style.left = `${xPercent}%`;
        tilakMark.style.top = `${yPercent}%`;
        tilakMark.style.display = 'block';
        tilakMark.style.animation = 'none';
        // Trigger reflow
        void tilakMark.offsetWidth;
        tilakMark.style.animation = 'popIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)';
      }

      if (window.festiveAudio) window.festiveAudio.playAartiChime();
      this.spawnParticleBurst(window.innerWidth * 0.35, window.innerHeight * 0.35);
      setTimeout(() => this.setStep(3), 900);
    };

    if (avatarFrame) {
      avatarFrame.addEventListener('click', (e) => {
        if (this.currentStep !== 2) return;
        const rect = avatarFrame.getBoundingClientRect();
        const x = Math.max(10, Math.min(90, ((e.clientX - rect.left) / rect.width) * 100));
        const y = Math.max(10, Math.min(90, ((e.clientY - rect.top) / rect.height) * 100));
        placeTilakAt(x, y);
      });
    }

    if (tilakWrap) {
      tilakWrap.onclick = () => {
        if (this.currentStep === 2) {
          placeTilakAt(50, 36);
        }
      };
    }

    // 3. Rakhi Drag & Drop & Click Interactions
    const draggableRakhi = document.getElementById('draggable-rakhi');
    const wristTarget = document.getElementById('wrist-drop-target');
    const tiedRakhi = document.getElementById('wrist-tied-rakhi');

    if (draggableRakhi) {
      draggableRakhi.setAttribute('draggable', 'true');
      draggableRakhi.ondragstart = (e) => {
        e.dataTransfer.setData('text/plain', 'rakhi');
        draggableRakhi.style.opacity = '0.5';
      };
      draggableRakhi.ondragend = () => { draggableRakhi.style.opacity = '1'; };
      draggableRakhi.onclick = () => { this.tieRakhiSuccess(); };
    }

    if (wristTarget) {
      wristTarget.ondragover = (e) => { e.preventDefault(); wristTarget.classList.add('drag-over'); };
      wristTarget.ondragleave = () => { wristTarget.classList.remove('drag-over'); };
      wristTarget.ondrop = (e) => { e.preventDefault(); wristTarget.classList.remove('drag-over'); this.tieRakhiSuccess(); };
      wristTarget.onclick = () => { this.tieRakhiSuccess(); };
    }

    if (tiedRakhi) {
      tiedRakhi.style.cursor = 'pointer';
      tiedRakhi.title = 'Click to play sacred Raksha Bandhan celebration video';
      tiedRakhi.onclick = () => {
        if (window.festiveAudio) window.festiveAudio.playRakhiVideo(true);
      };
    }

    // 4. Sweets click
    document.querySelectorAll('.sweet-item').forEach(item => {
      item.onclick = () => {
        item.style.transform = 'scale(1.4) rotate(15deg)';
        item.style.boxShadow = '0 0 30px rgba(255, 215, 0, 0.8)';
        setTimeout(() => this.setStep(5), 600);
      };
    });
  }

  async tieRakhiSuccess() {
    const tiedRakhi = document.getElementById('wrist-tied-rakhi');
    const wristTarget = document.getElementById('wrist-drop-target');
    const rakhiTool = document.getElementById('tool-rakhi-wrap');

    if (tiedRakhi) tiedRakhi.style.display = 'inline-flex';
    if (wristTarget) wristTarget.style.display = 'none';
    if (rakhiTool) rakhiTool.style.display = 'none';

    // ═══════════════════════════════════════════════════════════
    //  KEY FEATURE: Automatically Play Rakhi MP4 Video & Music on Click
    // ═══════════════════════════════════════════════════════════
    if (window.festiveAudio) {
      window.festiveAudio.playRakhiVideo(true);
    }

    const avatarSrc = this.brotherData.avatarUrl || this.brotherData.avatarImage || 'assets/avatar_royal.jpg';
    this.rakhiTiedImageUrl = avatarSrc;

    // Enhance ceremony avatar with golden glow (keeping face clean and unhidden)
    const ceremonyAvatar = document.getElementById('ceremony-brother-avatar');
    if (ceremonyAvatar) {
      ceremonyAvatar.style.transition = 'transform 0.5s ease, filter 0.5s ease';
      ceremonyAvatar.style.transform = 'scale(1.04)';
      ceremonyAvatar.style.filter = 'drop-shadow(0 0 25px rgba(255, 215, 0, 0.8))';
      setTimeout(() => {
        ceremonyAvatar.style.transform = 'scale(1)';
      }, 300);
    }

    // Big particle burst for the celebration
    this.spawnParticleBurst(window.innerWidth / 2, window.innerHeight / 2);
    this.spawnParticleBurst(window.innerWidth * 0.3, window.innerHeight * 0.6);
    this.spawnParticleBurst(window.innerWidth * 0.7, window.innerHeight * 0.4);

    setTimeout(() => this.setStep(4), 1000);
  }

  async triggerGrandCelebration() {
    const controlsBox = document.getElementById('ceremony-controls-box');
    const congratsCard = document.getElementById('ceremony-congrats-card');

    if (controlsBox) controlsBox.style.display = 'none';
    if (congratsCard) {
      congratsCard.style.display = 'block';
      const greeting = document.getElementById('congrats-greeting-text');
      if (greeting) {
        greeting.innerText = `May the divine bond between ${this.brotherData.name} and ${this.sisterName} be blessed with everlasting joy, protection, and boundless love! ❤️`;
      }

      // Show the rakhi-tied image in the congrats card
      const tiedPreview = document.getElementById('congrats-tied-avatar');
      if (tiedPreview) {
        const imgSrc = this.rakhiTiedImageUrl || this.brotherData.avatarUrl || 'assets/avatar_royal.jpg';
        tiedPreview.src = imgSrc;
        tiedPreview.style.display = 'block';
      }

      // Show sister's return wish
      const wishDisplay = document.getElementById('congrats-sister-wish-display');
      if (wishDisplay) {
        const wish = this.sisterWish || localStorage.getItem('rakhi_sister_wish');
        if (wish) {
          wishDisplay.innerHTML = `<em>"${wish}"</em> <span style="font-size:0.75rem;color:var(--gold-400);display:block;margin-top:0.25rem;">— Sister ${this.sisterName}'s Return Prayer 💕</span>`;
          wishDisplay.style.display = 'block';
        } else {
          wishDisplay.style.display = 'none';
        }
      }
    }

    // Pre-populate certificate engine
    if (window.certificateEngine) {
      window.certificateEngine.load(
        this.brotherData.name,
        this.sisterName,
        this.rakhiTiedImageUrl || this.brotherData.avatarUrl || 'assets/avatar_royal.jpg',
        this.sisterWish
      );
    }

    // Continue festive music from MP4
    if (window.festiveAudio) {
      window.festiveAudio.playRakhiVideo(false);
    }

    // Record ceremony in SQLite DB
    this.recordCeremony();

    // Start Petals & Confetti
    this.animatingCelebration = true;
    this.initPetalsAndConfetti();
    this.runCelebrationLoop();
  }

  recordCeremony() {
    const brotherId = this.brotherData.id || localStorage.getItem('rakhi_active_token') || 'demo';

    // Use real device detection & geolocation from router
    const device = window.rakhiRouter
      ? window.rakhiRouter.detectDevice()
      : (navigator.userAgent.includes('Mobile') ? 'Mobile Device' : 'Desktop Browser');

    const geo = (window.rakhiRouter && window.rakhiRouter.geoReady)
      ? window.rakhiRouter.getGeo()
      : { country: 'India 🇮🇳', city: 'Mumbai' };

    // Save to SQLite
    if (window.rakhiDB && window.rakhiDB.ready) {
      // Patch the insertCeremony call with real geo data
      window.rakhiDB.db.run(
        `INSERT INTO RakhiCeremony (brotherId, sisterName, rakhiTiedImage, device, country, city) VALUES (?, ?, ?, ?, ?, ?)`,
        [brotherId, this.sisterName, this.rakhiTiedImageUrl || '', device, geo.country, geo.city]
      );
      window.rakhiDB.persist();
      window.rakhiDB.incrementLinkVisits(brotherId);
      console.log('[DB] Ceremony saved to SQLite — from', geo.country, '/', geo.city);
    }

    // Also update localStorage for backward compat
    const key = `rakhi_brother_${brotherId}`;
    const record = JSON.parse(localStorage.getItem(key) || '{}');
    const ceremonyLog = {
      id: 'c_' + Math.random().toString(36).substring(2, 8),
      sisterName: this.sisterName,
      rakhiTiedImage: this.rakhiTiedImageUrl || '',
      timestamp: new Date().toISOString(),
      country: geo.country,
      city: geo.city,
      device: device
    };
    if (record.ceremonies) {
      record.ceremonies.unshift(ceremonyLog);
    } else {
      record.ceremonies = [ceremonyLog];
    }
    record.visits = (record.visits || 0) + 1;
    localStorage.setItem(key, JSON.stringify(record));

    // Show toast notification
    if (window.notifications) {
      window.notifications.showToast(`🪢 Ceremony recorded! From ${geo.city}, ${geo.country}`, 'success', 3500);
    }
  }

  spawnParticleBurst(x, y) {
    for (let i = 0; i < 50; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 10 + 3;
      this.particles.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 2,
        radius: Math.random() * 5 + 2,
        color: ['#ffd700', '#ff9933', '#ff0055', '#ffffff', '#ff4d6d', '#10b981'][Math.floor(Math.random() * 6)],
        alpha: 1,
        decay: Math.random() * 0.02 + 0.012
      });
    }

    // Start rendering if not already
    if (!this.animatingCelebration) {
      this.animatingCelebration = true;
      this.runCelebrationLoop();
      setTimeout(() => {
        if (this.currentStep < 5) {
          this.animatingCelebration = false;
          if (this.ctx && this.canvas) this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        }
      }, 2000);
    }
  }

  initPetalsAndConfetti() {
    this.petals = [];
    const colors = ['#ff9933', '#ffd700', '#d90429', '#ff4d6d', '#ffb703', '#ffffff', '#10b981'];

    for (let i = 0; i < 80; i++) {
      this.petals.push({
        x: Math.random() * window.innerWidth,
        y: Math.random() * -window.innerHeight,
        size: Math.random() * 14 + 8,
        color: colors[Math.floor(Math.random() * colors.length)],
        speedY: Math.random() * 2.5 + 1.2,
        speedX: Math.sin(Math.random() * Math.PI) * 1.5,
        rotation: Math.random() * 360,
        rotSpeed: (Math.random() - 0.5) * 5,
        type: Math.random() > 0.35 ? 'petal' : 'confetti'
      });
    }
  }

  runCelebrationLoop() {
    if (!this.ctx || !this.animatingCelebration) return;

    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.15; // Gravity
      p.alpha -= p.decay;
      if (p.alpha <= 0) { this.particles.splice(i, 1); continue; }
      this.ctx.save();
      this.ctx.globalAlpha = p.alpha;
      this.ctx.fillStyle = p.color;
      this.ctx.shadowColor = p.color;
      this.ctx.shadowBlur = 8;
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.restore();
    }

    // Petals & Confetti
    this.petals.forEach(p => {
      p.y += p.speedY;
      p.x += Math.sin(p.y * 0.015) * 1.5 + p.speedX * 0.3;
      p.rotation += p.rotSpeed;

      if (p.y > window.innerHeight + 20) {
        p.y = -20;
        p.x = Math.random() * window.innerWidth;
      }

      this.ctx.save();
      this.ctx.translate(p.x, p.y);
      this.ctx.rotate((p.rotation * Math.PI) / 180);
      this.ctx.fillStyle = p.color;
      this.ctx.globalAlpha = 0.85;

      if (p.type === 'petal') {
        this.ctx.beginPath();
        this.ctx.ellipse(0, 0, p.size, p.size * 0.5, 0, 0, Math.PI * 2);
        this.ctx.fill();
      } else {
        this.ctx.fillRect(-p.size/2, -p.size/3, p.size, p.size * 0.55);
      }
      this.ctx.restore();
    });

    requestAnimationFrame(() => this.runCelebrationLoop());
  }

  stopCelebration() {
    this.animatingCelebration = false;
    this.particles = [];
    this.petals = [];
    if (this.ctx && this.canvas) {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
  }
}

window.ceremonyEngine = new CeremonyEngine();
