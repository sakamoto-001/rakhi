/**
 * RakhiVerse Dashboard Engine (v2 — SQLite Integrated)
 * Reads data from SQLite DB and renders metrics, ceremony logs, and avatar gallery.
 */

class DashboardEngine {
  constructor() {
    this.activeToken = null;
  }

  load() {
    this.activeToken = localStorage.getItem('rakhi_active_token') || 'demo';
    let record = null;

    // Try SQLite first
    if (window.rakhiDB && window.rakhiDB.ready) {
      record = window.rakhiDB.getBrother(this.activeToken);
      if (record) {
        record.ceremonies = window.rakhiDB.getCeremoniesForBrother(this.activeToken);
        const stats = window.rakhiDB.getDashboardStats(this.activeToken);
        record.visits = stats.totalVisits || record.visits || 1;
        // Normalise avatar field names
        if (!record.avatarUrl) record.avatarUrl = record.avatarImage || '';
      }
    }

    // Fallback to localStorage or router
    if (!record) {
      record = JSON.parse(localStorage.getItem(`rakhi_brother_${this.activeToken}`) || 'null');
    }
    if (!record && window.rakhiRouter && window.rakhiRouter.brotherRecord) {
      record = window.rakhiRouter.brotherRecord;
    }

    if (!record) {
      const storedName = localStorage.getItem('rakhi_brother_name') || 'Brother';
      record = {
        id: this.activeToken,
        name: storedName,
        avatarStyle: 'Sacred Photo',
        avatarStyleId: 'sacred',
        avatarUrl: 'assets/royal_indian_avatar_1787843850577.jpg',
        avatarImage: 'assets/royal_indian_avatar_1787843850577.jpg',
        createdAt: new Date().toISOString(),
        visits: 42,
        ceremonies: [
          { id: 1, sisterName: 'Priya Sharma', timestamp: new Date(Date.now() - 1000*60*25).toISOString(), country: 'India 🇮🇳', city: 'Mumbai', device: 'iPhone 15 (iOS)', rakhiTiedImage: '' },
          { id: 2, sisterName: 'Ananya Sharma', timestamp: new Date(Date.now() - 1000*60*180).toISOString(), country: 'United States 🇺🇸', city: 'San Jose', device: 'MacBook Pro', rakhiTiedImage: '' },
          { id: 3, sisterName: 'Sneha Patel', timestamp: new Date(Date.now() - 1000*60*60*14).toISOString(), country: 'United Kingdom 🇬🇧', city: 'London', device: 'Samsung Galaxy S24', rakhiTiedImage: '' },
          { id: 4, sisterName: 'Kavita Verma', timestamp: new Date(Date.now() - 1000*60*60*28).toISOString(), country: 'India 🇮🇳', city: 'Bengaluru', device: 'OnePlus 12', rakhiTiedImage: '' }
        ]
      };
    }

    this.renderMetrics(record);
    this.renderCeremonyLogs(record);
    this.renderAvatarGallery(record);
  }

  renderMetrics(record) {
    const totalTied = (record.ceremonies || []).length;
    const visits = Math.max(record.visits || 1, totalTied);
    const conversion = visits > 0 ? Math.round((totalTied / visits) * 100) : 0;

    const mTotal = document.getElementById('metric-total-tied');
    const mVisits = document.getElementById('metric-total-visits');
    const mConversion = document.getElementById('metric-conversion-rate');
    const mStyle = document.getElementById('metric-top-style');

    if (mTotal) mTotal.innerText = totalTied;
    if (mVisits) mVisits.innerText = visits;
    if (mConversion) mConversion.innerText = `${conversion}%`;
    if (mStyle) mStyle.innerText = record.avatarStyle || 'Royal Prince';
  }

  renderCeremonyLogs(record) {
    const tbody = document.getElementById('ceremony-logs-tbody');
    if (!tbody) return;

    const ceremonies = record.ceremonies || [];
    if (ceremonies.length === 0) {
      tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;color:var(--text-muted);padding:2rem;">No ceremonies yet. Share your Rakhi link!</td></tr>`;
      return;
    }

    tbody.innerHTML = ceremonies.map((c, idx) => {
      const ts = c.timestamp ? new Date(c.timestamp).toLocaleString([], { month:'short', day:'numeric', hour:'2-digit', minute:'2-digit' }) : '—';
      const hasImg = c.rakhiTiedImage
        ? `<button class="btn-festive" style="padding:0.3rem 0.6rem;font-size:0.72rem;background:#10b981;border:none;" onclick="dashboardEngine.viewRakhiTiedImage('${encodeURIComponent(c.rakhiTiedImage)}')">View Tied 🪢</button>`
        : '';
      const delBtn = (c.id && !String(c.id).startsWith('c_'))
        ? `<button class="btn-festive" style="padding:0.3rem 0.6rem;font-size:0.72rem;background:#d90429;border:none;" onclick="dashboardEngine.deleteCeremony(${c.id})">✕</button>`
        : '';
      return `<tr>
        <td><strong style="color:#fff;">${c.sisterName}</strong></td>
        <td>${c.country || '🌍'} (${c.city || '—'})</td>
        <td style="font-size:0.85rem;color:var(--text-muted);">${c.device || '—'}</td>
        <td>${ts}</td>
        <td style="display:flex;gap:0.4rem;flex-wrap:wrap;">
          <button class="btn-festive" style="padding:0.3rem 0.6rem;font-size:0.72rem;"
                  onclick="dashboardEngine.viewCeremonyCert('${c.sisterName}','${record.name || 'Brother'}','${record.avatarUrl || record.avatarImage || ''}')">Cert 📜</button>
          ${hasImg}
          ${delBtn}
        </td>
      </tr>`;
    }).join('');
  }

  renderAvatarGallery(record) {
    const container = document.getElementById('dashboard-avatar-gallery');
    if (!container) return;

    const galleryAvatars = [
      { name: 'Royal Prince', img: 'assets/avatar_royal.jpg' },
      { name: 'Anime Shinkai', img: 'assets/avatar_anime.jpg' },
      { name: 'Pixar 3D', img: 'assets/avatar_pixar.jpg' },
      { name: 'Cute Chibi', img: 'assets/avatar_chibi.jpg' }
    ];

    container.innerHTML = galleryAvatars.map(av => `
      <div style="text-align:center;background:rgba(255,255,255,0.04);border:1px solid var(--border-glass);border-radius:var(--radius-md);padding:0.8rem;transition:transform 0.3s ease;cursor:pointer;" onmouseenter="this.style.transform='translateY(-4px)'" onmouseleave="this.style.transform='translateY(0)'">
        <img src="${av.img}" style="width:70px;height:70px;border-radius:50%;object-fit:cover;border:2px solid var(--gold-400);margin-bottom:0.4rem;" alt="${av.name}">
        <div style="font-size:0.78rem;font-weight:700;color:#fff;">${av.name}</div>
      </div>
    `).join('');
  }

  viewCeremonyCert(sisterName, brotherName, avatarUrl) {
    if (window.certificateEngine && window.app) {
      window.certificateEngine.load(brotherName, sisterName, avatarUrl);
      window.app.navigate('certificate');
    }
  }

  viewRakhiTiedImage(encodedUrl) {
    const url = decodeURIComponent(encodedUrl);
    const modal = document.getElementById('rakhi-tied-modal');
    const modalImg = document.getElementById('rakhi-tied-modal-img');
    if (modal && modalImg) {
      modalImg.src = url;
      modal.style.display = 'flex';
    }
  }

  deleteCeremony(id) {
    if (!confirm('Remove this ceremony log?')) return;
    if (window.rakhiDB && window.rakhiDB.ready) {
      window.rakhiDB.deleteCeremony(id);
    }
    this.load(); // Refresh dashboard
    if (window.notifications) window.notifications.showToast('Ceremony log removed.', 'info');
  }

  exportCeremonyCSV() {
    this.activeToken = localStorage.getItem('rakhi_active_token') || 'demo';
    let ceremonies = [];

    if (window.rakhiDB && window.rakhiDB.ready) {
      ceremonies = window.rakhiDB.getCeremoniesForBrother(this.activeToken);
    } else {
      const record = JSON.parse(localStorage.getItem(`rakhi_brother_${this.activeToken}`) || '{}');
      ceremonies = record.ceremonies || [];
    }

    if (ceremonies.length === 0) {
      if (window.notifications) window.notifications.showToast('No ceremonies to export yet.', 'info');
      return;
    }

    const header = ['Sister Name', 'Country', 'City', 'Device', 'Timestamp'];
    const rows = ceremonies.map(c => [
      `"${(c.sisterName || '').replace(/"/g, '""')}"`,
      `"${(c.country || '').replace(/"/g, '""')}"`,
      `"${(c.city || '').replace(/"/g, '""')}"`,
      `"${(c.device || '').replace(/"/g, '""')}"`,
      `"${(c.timestamp || '').replace(/"/g, '""')}"`
    ].join(','));

    const csv = [header.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `RakhiVerse_Ceremonies_${this.activeToken}.csv`;
    a.click();
    URL.revokeObjectURL(url);

    if (window.notifications) window.notifications.showToast('📊 CSV exported successfully!', 'success');
  }
}

window.dashboardEngine = new DashboardEngine();
