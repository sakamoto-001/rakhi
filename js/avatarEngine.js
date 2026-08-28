/**
 * RakhiVerse Photo & Ceremony Engine
 * Handles direct photo upload (drag-and-drop, browse, webcam, or preset sample),
 * high-resolution canvas framing, and unique invitation link generation.
 */

class AvatarEngine {
  constructor() {
    this.currentImage = null;
    this.currentImageDataUrl = null;
    this.canvas = null;
    this.ctx = null;
    this.videoStream = null;
  }

  init() {
    this.canvas = document.getElementById('avatar-canvas');
    if (this.canvas) {
      this.ctx = this.canvas.getContext('2d');
    }
    this.setupListeners();
    this.loadSample('assets/royal_indian_avatar_1787843850577.jpg');
  }

  loadSample(imageSrc) {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      this.currentImage = img;
      this.currentImageDataUrl = imageSrc;
      this.renderCanvas();
    };
    img.src = imageSrc;
  }

  setupListeners() {
    const dropZone = document.getElementById('upload-dropzone');
    const fileInput = document.getElementById('brother-photo-input');

    if (dropZone && fileInput) {
      dropZone.addEventListener('click', (e) => {
        if (e.target.closest('#btn-start-webcam')) return;
        fileInput.click();
      });

      fileInput.addEventListener('change', (e) => {
        if (e.target.files && e.target.files[0]) {
          this.handleFile(e.target.files[0]);
        }
      });

      dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.classList.add('dragover');
      });

      dropZone.addEventListener('dragleave', () => {
        dropZone.classList.remove('dragover');
      });

      dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('dragover');
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
          this.handleFile(e.dataTransfer.files[0]);
        }
      });
    }

    const webcamBtn = document.getElementById('btn-start-webcam');
    if (webcamBtn) {
      webcamBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.toggleWebcam();
      });
    }

    const snapBtn = document.getElementById('btn-snap-webcam');
    if (snapBtn) {
      snapBtn.addEventListener('click', () => this.snapWebcam());
    }
  }

  handleFile(file) {
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      alert('Please upload a valid JPG, PNG, or WEBP photo.');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      alert('File size exceeds 10MB limit. Please upload a smaller image.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        this.currentImage = img;
        this.currentImageDataUrl = e.target.result;
        this.renderCanvas();
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  }

  async toggleWebcam() {
    const container = document.getElementById('webcam-box');
    const video = document.getElementById('webcam-video');
    if (!container || !video) return;

    if (this.videoStream) {
      this.stopWebcam();
      container.style.display = 'none';
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480, facingMode: 'user' } });
        this.videoStream = stream;
        video.srcObject = stream;
        video.play();
        container.style.display = 'flex';
      } catch (err) {
        alert('Webcam access was denied or not available: ' + err.message);
      }
    }
  }

  snapWebcam() {
    const video = document.getElementById('webcam-video');
    if (!video) return;
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = video.videoWidth || 640;
    tempCanvas.height = video.videoHeight || 480;
    const tCtx = tempCanvas.getContext('2d');
    tCtx.drawImage(video, 0, 0);

    const dataUrl = tempCanvas.toDataURL('image/jpeg');
    const img = new Image();
    img.onload = () => {
      this.currentImage = img;
      this.currentImageDataUrl = dataUrl;
      this.renderCanvas();
      this.stopWebcam();
      document.getElementById('webcam-box').style.display = 'none';
    };
    img.src = dataUrl;
  }

  stopWebcam() {
    if (this.videoStream) {
      this.videoStream.getTracks().forEach(t => t.stop());
      this.videoStream = null;
    }
  }

  renderCanvas() {
    if (!this.canvas || !this.ctx || !this.currentImage) return;

    const w = this.canvas.width = 600;
    const h = this.canvas.height = 600;
    this.ctx.clearRect(0, 0, w, h);

    const img = this.currentImage;
    const minDim = Math.min(img.width, img.height);
    const sx = (img.width - minDim) / 2;
    const sy = (img.height - minDim) / 2;
    this.ctx.drawImage(img, sx, sy, minDim, minDim, 0, 0, w, h);

    // Warm festive subtle vignette glow
    const gradient = this.ctx.createRadialGradient(w/2, h/2, w*0.38, w/2, h/2, w*0.52);
    gradient.addColorStop(0, 'rgba(255, 215, 0, 0)');
    gradient.addColorStop(0.85, 'rgba(217, 4, 41, 0.18)');
    gradient.addColorStop(1, 'rgba(10, 4, 20, 0.6)');
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, w, h);

    this.drawSparkles(w, h);
  }

  drawSparkles(w, h) {
    this.ctx.fillStyle = '#ffd700';
    for (let i = 0; i < 14; i++) {
      const x = Math.random() * w;
      const y = Math.random() * h;
      const r = Math.random() * 2.5 + 1;
      this.ctx.beginPath();
      this.ctx.arc(x, y, r, 0, Math.PI * 2);
      this.ctx.fill();
    }
  }

  /**
   * Generates unique invitation token, saves to DB and prepares link
   */
  async generateAvatar(brotherName) {
    const overlay = document.getElementById('ai-progress-overlay');
    const statusText = document.getElementById('ai-status-text');
    const subText = document.getElementById('ai-sub-text');
    const fill = document.getElementById('progress-bar-fill');

    if (overlay) overlay.style.display = 'flex';

    if (statusText) statusText.innerText = 'Creating Ceremony Link...';
    if (subText) subText.innerText = 'Storing your photo and sacred promise';
    if (fill) fill.style.width = '60%';

    await new Promise(r => setTimeout(r, 400));
    if (fill) fill.style.width = '100%';
    await new Promise(r => setTimeout(r, 200));

    if (overlay) overlay.style.display = 'none';

    // Generate token and save to DB
    const token = 'rk_' + Math.random().toString(36).substring(2, 9);
    const avatarDataUrl = this.canvas.toDataURL('image/jpeg', 0.85);
    const name = brotherName ? brotherName.trim() : 'Brother';
    const personalMessage = document.getElementById('brother-blessing-input')?.value || '';

    // Create a compact thumbnail for cross-device URL sharing
    let shareAvatar = '';
    if (this.currentImageDataUrl && (this.currentImageDataUrl.startsWith('assets/') || this.currentImageDataUrl.startsWith('http'))) {
      shareAvatar = this.currentImageDataUrl;
    } else {
      try {
        const thumbCanvas = document.createElement('canvas');
        thumbCanvas.width = 200;
        thumbCanvas.height = 200;
        const tCtx = thumbCanvas.getContext('2d');
        tCtx.drawImage(this.canvas, 0, 0, 200, 200);
        shareAvatar = thumbCanvas.toDataURL('image/jpeg', 0.65);
      } catch (e) {
        shareAvatar = avatarDataUrl;
      }
    }

    // Save to SQLite Database
    if (window.rakhiDB && window.rakhiDB.ready) {
      window.rakhiDB.insertBrother(token, name, avatarDataUrl, 'Sacred Photo', personalMessage, this.currentImageDataUrl || '');
      window.rakhiDB.insertLink(token, token);
      console.log('[DB] Brother & Link saved to SQLite:', token);
    }

    // Also keep in localStorage
    const brotherRecord = {
      id: token,
      name: name,
      avatarStyle: 'Sacred Photo',
      avatarUrl: avatarDataUrl,
      avatarImage: avatarDataUrl,
      shareAvatar: shareAvatar,
      personalMessage: personalMessage,
      createdAt: new Date().toISOString(),
      visits: 1,
      ceremonies: []
    };
    localStorage.setItem(`rakhi_brother_${token}`, JSON.stringify(brotherRecord));
    localStorage.setItem('rakhi_active_token', token);
    localStorage.setItem('rakhi_brother_name', name);

    return { token, avatarDataUrl, brotherRecord };
  }

  /**
   * Returns clean portrait image (keeping face clear & sacred without overlapping stickers)
   */
  createRakhiTiedImage(avatarDataUrl) {
    return Promise.resolve(avatarDataUrl);
  }
}

window.avatarEngine = new AvatarEngine();
