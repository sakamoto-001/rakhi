/**
 * RakhiVerse Certificate Generator & Social Sharing Studio
 * Generates high-res ceremonial certificates on Canvas with Sanskrit shlokas,
 * avatar portraits, sister's heartfelt prayer, royal wax seal, and 1-click PNG download & WhatsApp sharing.
 */

class CertificateEngine {
  constructor() {
    this.brotherName = 'Brother';
    this.sisterName = 'Sister';
    this.avatarUrl = 'assets/royal_indian_avatar_1787843850577.jpg';
    this.sisterWish = '';
    this.certId = 'RB-2026-' + Math.floor(100000 + Math.random() * 900000);
  }

  load(brotherName, sisterName, avatarUrl, sisterWish) {
    this.brotherName = brotherName || localStorage.getItem('rakhi_brother_name') || 'Brother';
    this.sisterName = sisterName || localStorage.getItem('rakhi_active_sister_name') || 'Sister';
    this.avatarUrl = avatarUrl || 'assets/royal_indian_avatar_1787843850577.jpg';
    this.sisterWish = sisterWish || localStorage.getItem('rakhi_sister_wish') || '';

    // Update DOM Elements
    const certSister = document.getElementById('cert-sister-name');
    const certBrother = document.getElementById('cert-brother-name');
    const certAvatar = document.getElementById('cert-avatar-img');
    const certCode = document.getElementById('cert-verification-id');
    const certDate = document.getElementById('cert-date-text');
    const certWishBox = document.getElementById('cert-sister-wish-box');

    if (certSister) certSister.innerText = this.sisterName;
    if (certBrother) certBrother.innerText = this.brotherName;
    if (certAvatar) certAvatar.src = this.avatarUrl;
    if (certCode) certCode.innerText = `ID: ${this.certId}`;
    if (certDate) certDate.innerText = `Raksha Bandhan 2026 • ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`;

    if (certWishBox) {
      if (this.sisterWish) {
        certWishBox.innerHTML = `<em>"${this.sisterWish}"</em> <span style="font-size:0.75rem;display:block;margin-top:0.25rem;color:#8c6d1f;">— Sister's Heartfelt Prayer 💕</span>`;
        certWishBox.style.display = 'block';
      } else {
        certWishBox.style.display = 'none';
      }
    }
  }

  async downloadCertificatePNG() {
    const canvas = document.createElement('canvas');
    canvas.width = 1600;
    canvas.height = 1000;
    const ctx = canvas.getContext('2d');

    // 1. Background Parchment with Rich Radial Glow
    const bgGrad = ctx.createRadialGradient(800, 500, 100, 800, 500, 900);
    bgGrad.addColorStop(0, '#fffdf6');
    bgGrad.addColorStop(0.7, '#faf1df');
    bgGrad.addColorStop(1, '#f5e4c3');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, 1600, 1000);

    // 2. Royal Borders
    ctx.lineWidth = 24;
    ctx.strokeStyle = '#7d0a0a';
    ctx.strokeRect(20, 20, 1560, 960);

    ctx.lineWidth = 6;
    ctx.strokeStyle = '#d4af37';
    ctx.strokeRect(36, 36, 1528, 928);

    ctx.lineWidth = 2;
    ctx.strokeStyle = 'rgba(125, 10, 10, 0.4)';
    ctx.strokeRect(48, 48, 1504, 904);

    // 3. Corner Ornaments
    this.drawCornerDecorations(ctx);

    // 4. Header Titles
    ctx.textAlign = 'center';
    ctx.font = 'bold 52px Georgia, serif';
    ctx.fillStyle = '#7d0a0a';
    ctx.fillText('CERTIFICATE OF ETERNAL BOND', 800, 125);

    ctx.font = 'italic 26px Georgia, serif';
    ctx.fillStyle = '#8c6d1f';
    ctx.fillText('Sacred Raksha Bandhan Ceremony 2026', 800, 168);

    // 5. Sanskrit Shloka
    ctx.font = '22px Georgia, serif';
    ctx.fillStyle = '#5c3a00';
    ctx.fillText('“येन बद्धो बली राजा दानवेन्द्रो महाबलः। तेन त्वामभिबध्नामि रक्षे मा चल मा चल॥”', 800, 220);

    // 6. Ceremony Text
    ctx.font = '28px "Outfit", sans-serif';
    ctx.fillStyle = '#333333';
    ctx.fillText('This auspiciously certifies that', 800, 290);

    ctx.font = 'bold 46px Georgia, serif';
    ctx.fillStyle = '#d90429';
    ctx.fillText(this.sisterName, 800, 350);

    ctx.font = '26px "Outfit", sans-serif';
    ctx.fillStyle = '#444444';
    ctx.fillText('has tied the sacred virtual Rakhi of unconditional love & protection to her brother', 800, 400);

    ctx.font = 'bold 46px Georgia, serif';
    ctx.fillStyle = '#7d0a0a';
    ctx.fillText(this.brotherName, 800, 460);

    // 7. Sister's Heartfelt Prayer (if provided)
    if (this.sisterWish) {
      ctx.font = 'italic 22px Georgia, serif';
      ctx.fillStyle = '#8c6d1f';
      ctx.fillText(`“${this.sisterWish}”`, 800, 508);
    }

    // 8. Load & Draw Avatar Image (Center bottom)
    const avatarCenterY = this.sisterWish ? 670 : 640;
    await new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        ctx.save();
        ctx.beginPath();
        ctx.arc(800, avatarCenterY, 95, 0, Math.PI * 2);
        ctx.closePath();
        ctx.clip();
        ctx.drawImage(img, 705, avatarCenterY - 95, 190, 190);
        ctx.restore();

        // Avatar Gold Ring
        ctx.lineWidth = 8;
        ctx.strokeStyle = '#d4af37';
        ctx.beginPath();
        ctx.arc(800, avatarCenterY, 95, 0, Math.PI * 2);
        ctx.stroke();
        resolve();
      };
      img.onerror = () => resolve();
      img.src = this.avatarUrl;
    });

    // 9. Wax Seal Stamp
    this.drawWaxSeal(ctx, 1380, 780);

    // 10. Seal & Footer Details
    ctx.textAlign = 'left';
    ctx.font = '20px "Outfit", sans-serif';
    ctx.fillStyle = '#666';
    ctx.fillText(`Certificate ID: ${this.certId}`, 90, 910);
    ctx.fillText(`Date: ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`, 90, 940);

    ctx.textAlign = 'right';
    ctx.fillText('Verified by RakhiVerse AI Platform ✦', 1510, 940);

    // 11. Trigger Browser Download
    const link = document.createElement('a');
    link.download = `RakhiVerse_Certificate_${this.sisterName.replace(/\s+/g, '_')}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  }

  drawCornerDecorations(ctx) {
    const corners = [
      { x: 50, y: 50 },
      { x: 1550, y: 50 },
      { x: 50, y: 950 },
      { x: 1550, y: 950 }
    ];

    corners.forEach(c => {
      ctx.fillStyle = '#d4af37';
      ctx.beginPath();
      ctx.arc(c.x, c.y, 16, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = '#7d0a0a';
      ctx.lineWidth = 3;
      ctx.stroke();

      ctx.fillStyle = '#7d0a0a';
      ctx.beginPath();
      ctx.arc(c.x, c.y, 6, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  drawWaxSeal(ctx, x, y) {
    ctx.save();
    // Red wax base
    ctx.fillStyle = '#9e0024';
    ctx.beginPath();
    ctx.arc(x, y, 65, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#d4af37';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(x, y, 56, 0, Math.PI * 2);
    ctx.stroke();

    // Gold lettering
    ctx.fillStyle = '#ffd700';
    ctx.textAlign = 'center';
    ctx.font = 'bold 13px Georgia, serif';
    ctx.fillText('✦ SACRED ✦', x, y - 20);
    ctx.font = 'bold 20px Georgia, serif';
    ctx.fillText('RAKHI', x, y + 5);
    ctx.font = 'bold 13px Georgia, serif';
    ctx.fillText('SEAL 2026', x, y + 28);
    ctx.restore();
  }

  shareWhatsApp() {
    const msg = `🎉 Celebrating the eternal bond of Raksha Bandhan on RakhiVerse!\n\nSister *${this.sisterName}* tied a sacred virtual Rakhi to Brother *${this.brotherName}* ❤️\n\nCreate your AI Avatar & celebrate here: ${window.location.href.split('#')[0]}`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(msg)}`, '_blank');
  }

  shareTwitter() {
    const msg = `Tied a sacred Rakhi on RakhiVerse to my brother ${this.brotherName}! ❤️ Check out our ceremonial certificate: #RakshaBandhan #RakhiVerse`;
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(msg)}&url=${encodeURIComponent(window.location.href.split('#')[0])}`, '_blank');
  }

  copyShareLink() {
    const url = window.location.href;
    if (window.notifications) {
      window.notifications.copyToClipboard(url, 'Raksha Bandhan link');
    } else {
      navigator.clipboard.writeText(url).then(() => {
        alert('✨ Raksha Bandhan link copied to clipboard! Share it with your brother or sister ❤️');
      });
    }
  }
}

window.certificateEngine = new CertificateEngine();
