/**
 * RakhiVerse Notifications & Sharing Engine
 * Centralizes all sharing flows:
 *  - WhatsApp deep links with pre-filled message
 *  - Email sharing via mailto: URI
 *  - Native Web Share API (mobile)
 *  - Clipboard copy with toast feedback
 *  - Instagram story prompt (copy link + redirect)
 *  - SMS share (mobile)
 */

class NotificationsEngine {
  constructor() {
    this.toastTimeout = null;
  }

  /**
   * Display a temporary toast message at bottom-center of screen.
   * @param {string} message  Text to show
   * @param {'success'|'error'|'info'} type  Controls color
   * @param {number} durationMs  How long to show it
   */
  showToast(message, type = 'success', durationMs = 2800) {
    // Remove existing toast if any
    const existing = document.getElementById('rv-toast');
    if (existing) existing.remove();
    if (this.toastTimeout) clearTimeout(this.toastTimeout);

    const bgMap = {
      success: 'linear-gradient(135deg, #10b981, #059669)',
      error:   'linear-gradient(135deg, #d90429, #9b0219)',
      info:    'linear-gradient(135deg, #a855f7, #6366f1)'
    };

    const toast = document.createElement('div');
    toast.id = 'rv-toast';
    toast.innerText = message;
    Object.assign(toast.style, {
      position: 'fixed',
      bottom: '2rem',
      left: '50%',
      transform: 'translateX(-50%) translateY(20px)',
      background: bgMap[type] || bgMap.success,
      color: '#fff',
      padding: '0.75rem 1.5rem',
      borderRadius: '2rem',
      fontFamily: 'Outfit, sans-serif',
      fontWeight: '700',
      fontSize: '0.92rem',
      zIndex: '99999',
      boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
      transition: 'all 0.35s cubic-bezier(0.34,1.56,0.64,1)',
      opacity: '0',
      pointerEvents: 'none',
      whiteSpace: 'nowrap'
    });

    document.body.appendChild(toast);

    // Animate in
    requestAnimationFrame(() => {
      toast.style.opacity = '1';
      toast.style.transform = 'translateX(-50%) translateY(0)';
    });

    this.toastTimeout = setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(-50%) translateY(20px)';
      setTimeout(() => toast.remove(), 350);
    }, durationMs);
  }

  /**
   * Copy text to clipboard and show a toast confirmation.
   */
  async copyToClipboard(text, label = 'Link') {
    try {
      await navigator.clipboard.writeText(text);
      this.showToast(`✓ ${label} copied to clipboard!`);
      return true;
    } catch (err) {
      // Fallback for older browsers
      const el = document.createElement('textarea');
      el.value = text;
      el.style.position = 'fixed';
      el.style.opacity = '0';
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      el.remove();
      this.showToast(`✓ ${label} copied!`);
      return true;
    }
  }

  /**
   * Try native Web Share API first (mobile); fallback to WhatsApp link.
   */
  async shareNative(options = {}) {
    if (navigator.share) {
      try {
        await navigator.share(options);
        return true;
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.warn('[Notifications] Web Share failed:', err);
        }
        return false;
      }
    }
    return false;
  }

  /**
   * Generate the ceremony invitation message for a brother.
   */
  _buildInviteMessage(brotherName, shareUrl) {
    return `🌸 *Raksha Bandhan Ceremony Invitation* 🌸\n\n` +
      `Dear Sister,\n\n` +
      `Your brother *${brotherName}* has created a special digital Raksha Bandhan ceremony for you on *RakhiVerse* — a sacred virtual ceremony experience! 🪢\n\n` +
      `✨ Light the Diya\n✨ Apply the Tilak\n✨ Tie the Rakhi\n✨ Receive your Royal Certificate\n\n` +
      `Click below to start the ceremony:\n${shareUrl}\n\n` +
      `_With love & protection — ${brotherName}_ ❤️`;
  }

  /**
   * Open WhatsApp with pre-filled ceremony invitation message.
   */
  shareViaWhatsApp(brotherName, shareUrl) {
    const message = this._buildInviteMessage(brotherName, shareUrl);
    const encoded = encodeURIComponent(message);
    window.open(`https://api.whatsapp.com/send?text=${encoded}`, '_blank');
  }

  /**
   * Open email client with pre-filled rakhi invitation.
   */
  shareViaEmail(brotherName, shareUrl, toEmail = '') {
    const subject = `🪢 ${brotherName} invites you for a Sacred Raksha Bandhan Ceremony!`;
    const body = this._buildInviteMessage(brotherName, shareUrl) +
      `\n\n---\nSent via RakhiVerse AI Celebration Studio`;
    const mailto = `mailto:${encodeURIComponent(toEmail)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(mailto, '_blank');
    this.showToast('✉️ Email client opened!', 'info');
  }

  /**
   * Share via SMS (works on mobile — opens SMS app with pre-filled text).
   */
  shareViaSMS(brotherName, shareUrl) {
    const text = `🎉 ${brotherName} invites you for a virtual Raksha Bandhan ceremony! Tie the sacred Rakhi here: ${shareUrl}`;
    window.open(`sms:?body=${encodeURIComponent(text)}`, '_blank');
    this.showToast('📱 SMS app opened!', 'info');
  }

  /**
   * Share on X (Twitter) with ceremony message.
   */
  shareViaTwitter(brotherName, sisterName, shareUrl) {
    const tweet = `I celebrated Raksha Bandhan with my sister ${sisterName} on #RakhiVerse! Create your AI avatar ceremony with your sibling 🪢❤️`;
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(tweet)}&url=${encodeURIComponent(shareUrl)}`, '_blank');
  }

  /**
   * Show a share sheet dialog for a given brother/link combo.
   * Tries native share first, then shows a mini share overlay.
   */
  async openShareSheet(brotherName, shareUrl) {
    const shared = await this.shareNative({
      title: `Raksha Bandhan Ceremony — ${brotherName}`,
      text: this._buildInviteMessage(brotherName, shareUrl),
      url: shareUrl
    });

    if (!shared) {
      // Show custom share overlay
      this._showShareOverlay(brotherName, shareUrl);
    }
  }

  _showShareOverlay(brotherName, shareUrl) {
    const existing = document.getElementById('rv-share-overlay');
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.id = 'rv-share-overlay';
    overlay.innerHTML = `
      <div id="rv-share-box" style="
        position:relative;background:linear-gradient(135deg,#1a0a2e,#12071f);
        border:1px solid rgba(255,215,0,0.3);border-radius:1.25rem;
        padding:2rem;max-width:460px;width:90%;
        box-shadow:0 20px 60px rgba(0,0,0,0.7);
        animation:slideUp 0.35s cubic-bezier(0.34,1.56,0.64,1) both;
      ">
        <button id="rv-share-close" style="position:absolute;top:1rem;right:1rem;background:none;border:none;color:rgba(255,255,255,0.5);font-size:1.5rem;cursor:pointer;line-height:1;">✕</button>
        <div style="font-size:1.5rem;margin-bottom:0.25rem;">🪢 Share Ceremony Invitation</div>
        <div style="font-size:0.85rem;color:rgba(255,255,255,0.5);margin-bottom:1.5rem;">from <strong style="color:#ffd700;">${brotherName}</strong></div>
        
        <div style="background:rgba(255,255,255,0.05);border-radius:0.75rem;padding:0.75rem 1rem;display:flex;align-items:center;gap:0.75rem;margin-bottom:1.25rem;">
          <input id="rv-share-url-input" type="text" value="${shareUrl}" readonly style="
            flex:1;background:none;border:none;color:#fff;font-size:0.82rem;
            font-family:monospace;outline:none;min-width:0;
          ">
          <button id="rv-share-copy-btn" style="
            background:linear-gradient(135deg,#ffd700,#ff9933);color:#1a0a2e;
            border:none;padding:0.4rem 0.85rem;border-radius:0.5rem;font-weight:700;
            font-size:0.82rem;cursor:pointer;white-space:nowrap;flex-shrink:0;
          ">Copy Link 📋</button>
        </div>

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:0.75rem;">
          <button id="rv-share-wa" style="
            background:#25d366;border:none;color:#fff;padding:0.75rem;
            border-radius:0.75rem;font-weight:700;font-size:0.9rem;cursor:pointer;
          ">💬 WhatsApp</button>
          <button id="rv-share-email" style="
            background:linear-gradient(135deg,#a855f7,#6366f1);border:none;color:#fff;
            padding:0.75rem;border-radius:0.75rem;font-weight:700;font-size:0.9rem;cursor:pointer;
          ">✉️ Email</button>
          <button id="rv-share-sms" style="
            background:linear-gradient(135deg,#0ea5e9,#0284c7);border:none;color:#fff;
            padding:0.75rem;border-radius:0.75rem;font-weight:700;font-size:0.9rem;cursor:pointer;
          ">📱 SMS</button>
          <button id="rv-share-twitter" style="
            background:#000;border:1px solid rgba(255,255,255,0.15);color:#fff;
            padding:0.75rem;border-radius:0.75rem;font-weight:700;font-size:0.9rem;cursor:pointer;
          ">🐦 X (Twitter)</button>
        </div>
      </div>
    `;

    Object.assign(overlay.style, {
      position: 'fixed',
      inset: '0',
      background: 'rgba(10,4,20,0.8)',
      zIndex: '99998',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backdropFilter: 'blur(6px)'
    });

    // Inject slide-up animation
    if (!document.getElementById('rv-share-style')) {
      const style = document.createElement('style');
      style.id = 'rv-share-style';
      style.textContent = `@keyframes slideUp { from { opacity:0;transform:translateY(30px); } to { opacity:1;transform:translateY(0); } }`;
      document.head.appendChild(style);
    }

    document.body.appendChild(overlay);

    const close = () => overlay.remove();
    overlay.addEventListener('click', e => { if (e.target === overlay) close(); });
    document.getElementById('rv-share-close').addEventListener('click', close);
    document.getElementById('rv-share-copy-btn').addEventListener('click', () => {
      this.copyToClipboard(shareUrl, 'Ceremony link');
    });
    document.getElementById('rv-share-wa').addEventListener('click', () => {
      this.shareViaWhatsApp(brotherName, shareUrl);
      close();
    });
    document.getElementById('rv-share-email').addEventListener('click', () => {
      this.shareViaEmail(brotherName, shareUrl);
      close();
    });
    document.getElementById('rv-share-sms').addEventListener('click', () => {
      this.shareViaSMS(brotherName, shareUrl);
      close();
    });
    document.getElementById('rv-share-twitter').addEventListener('click', () => {
      this.shareViaTwitter(brotherName, 'Sister', shareUrl);
      close();
    });
  }
}

window.notifications = new NotificationsEngine();
