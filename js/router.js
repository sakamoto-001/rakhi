/**
 * RakhiVerse URL Router & Deep-Link Engine
 * Handles URL token resolution so sisters who arrive via a shared link
 * are automatically placed into the correct ceremony context.
 *
 * Supported URL patterns:
 *  index.html?token=rk_abc123              → sister view for that brother
 *  index.html#sister?token=rk_abc123       → same, via hash
 *  index.html?view=dashboard               → navigate to dashboard
 *
 * Also handles IP geolocation (using ipapi.co free tier) so ceremony
 * logs can store real country/city instead of hardcoded "India / Mumbai".
 */

class RakhiRouter {
  constructor() {
    this.token = null;
    this.brotherRecord = null;
    this.geoData = { country: '🌍 Unknown', city: 'Unknown', ip: '' };
    this.geoReady = false;
  }

  /**
   * Safely encode an object into a URL-safe Base64 string.
   */
  encodePayload(obj) {
    try {
      const json = JSON.stringify(obj);
      const bytes = new TextEncoder().encode(json);
      let bin = '';
      const len = bytes.length;
      for (let i = 0; i < len; i++) {
        bin += String.fromCharCode(bytes[i]);
      }
      return btoa(bin)
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');
    } catch (err) {
      console.error('[Router] Error encoding payload:', err);
      return '';
    }
  }

  /**
   * Safely decode a URL-safe Base64 string back into an object.
   */
  decodePayload(str) {
    try {
      if (!str) return null;
      let b64 = str.replace(/-/g, '+').replace(/_/g, '/');
      while (b64.length % 4) b64 += '=';
      const bin = atob(b64);
      const len = bin.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = bin.charCodeAt(i);
      }
      const json = new TextDecoder().decode(bytes);
      return JSON.parse(json);
    } catch (err) {
      console.warn('[Router] Error decoding payload:', err);
      return null;
    }
  }

  /**
   * Parse all URL parameters from both query string and hash.
   * Handles ?token=...&bname=... and #d=... / #sister?token=...
   */
  parseParams() {
    const params = {};

    // 1. Query string params (everything after ?)
    const search = window.location.search.slice(1);
    if (search) {
      search.split('&').forEach(pair => {
        if (!pair) return;
        const [k, ...v] = pair.split('=');
        if (k) params[decodeURIComponent(k)] = decodeURIComponent(v.join('=') || '');
      });
    }

    // 2. Hash fragment params (e.g. "#d=abc" or "#sister?token=abc" or "#session=abc")
    const hash = window.location.hash.slice(1);
    if (hash) {
      // Check if hash contains a query string e.g. "sister?token=..."
      const hashParts = hash.includes('?') ? hash.split('?')[1] : hash;
      hashParts.split('&').forEach(pair => {
        if (!pair) return;
        const [k, ...v] = pair.split('=');
        if (k) {
          const key = decodeURIComponent(k);
          const val = decodeURIComponent(v.join('=') || '');
          params[key] = val;
        }
      });
    }

    return params;
  }

  /**
   * Called on DOMContentLoaded — before any view renders.
   * Resolves the brother token & payload, hydrations local DB & localStorage,
   * and sets it as the active session for the sister.
   */
  async resolveDeepLink() {
    const params = this.parseParams();
    
    // Check for encoded payload in hash (#d=... or #data=... or #session=...)
    const rawPayload = params.d || params.data || params.session || null;
    let decoded = null;
    if (rawPayload) {
      decoded = this.decodePayload(rawPayload);
    }

    const token = (decoded && decoded.t) || params.token || null;
    const brotherName = (decoded && decoded.n) || params.bname || params.name || null;
    const personalMsg = (decoded && decoded.m) || params.bmsg || params.msg || null;
    const avatarImg = (decoded && decoded.a) || params.bavatar || params.avatar || null;

    if (token) {
      this.token = token;
      localStorage.setItem('rakhi_active_token', token);
      console.log('[Router] Deep-link token resolved:', token);

      // Check if we have brother details from payload or URL parameters
      if (brotherName || avatarImg || personalMsg) {
        const record = {
          id: token,
          name: brotherName || 'Brother',
          avatarStyle: 'Sacred Photo',
          avatarUrl: avatarImg || 'assets/royal_indian_avatar_1787843850577.jpg',
          avatarImage: avatarImg || 'assets/royal_indian_avatar_1787843850577.jpg',
          personalMessage: personalMsg || 'Dearest sister, I promise to always protect and cherish you! ❤️',
          createdAt: (decoded && decoded.c) || new Date().toISOString(),
          visits: 1,
          ceremonies: []
        };
        this.brotherRecord = record;
        localStorage.setItem(`rakhi_brother_${token}`, JSON.stringify(record));
        localStorage.setItem('rakhi_brother_name', record.name);

        // If SQLite is ready, save to DB
        if (window.rakhiDB && window.rakhiDB.ready) {
          window.rakhiDB.insertBrother(token, record.name, record.avatarImage, 'Sacred Photo', record.personalMessage);
          window.rakhiDB.insertLink(token, token);
          window.rakhiDB.incrementLinkVisits(token);
        }
      } else {
        // Fallback to local storage if brother was created locally
        const existing = localStorage.getItem(`rakhi_brother_${token}`);
        if (existing) {
          try {
            this.brotherRecord = JSON.parse(existing);
          } catch(e) {}
        }
      }

      // Optionally increment visit count in DB
      if (window.rakhiDB && window.rakhiDB.ready) {
        window.rakhiDB.incrementLinkVisits(token);
      }

      // Navigate to sister view after app loads
      return 'sister';
    }

    const hashView = window.location.hash.replace('#', '').split('?')[0].split('&')[0];
    if (hashView && hashView !== '' && !hashView.startsWith('d=') && !hashView.startsWith('data=')) {
      return hashView;
    }

    return params.view || 'home';
  }

  /**
   * Build a portable self-contained shareable URL for a brother's ceremony.
   * Embeds brother's name, message, and compressed avatar into URL hash so it works across devices.
   */
  buildShareUrl(token, brotherRecord = {}) {
    const base = window.location.href.split('?')[0].split('#')[0];
    const name = brotherRecord.name || '';
    const msg = brotherRecord.personalMessage || '';
    const avatar = brotherRecord.shareAvatar || brotherRecord.avatarImage || brotherRecord.avatarUrl || '';

    const payload = {
      t: token,
      n: name,
      m: msg,
      a: avatar,
      c: brotherRecord.createdAt || new Date().toISOString()
    };

    const encoded = this.encodePayload(payload);
    const qName = encodeURIComponent(name);
    
    // We provide query parameters for readable URLs + hash payload for full rich state & avatar image
    return `${base}?token=${token}&bname=${qName}#d=${encoded}`;
  }

  /**
   * Fetch geolocation data from ipapi.co (free, no key required, 1000 req/day).
   * Falls back gracefully to unknown if offline or quota exceeded.
   */
  async fetchGeoLocation() {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);
      const res = await fetch('https://ipapi.co/json/', { signal: controller.signal });
      clearTimeout(timeoutId);
      if (!res.ok) throw new Error('Non-OK response');
      const data = await res.json();

      const countryEmoji = this._countryToEmoji(data.country_code || '');
      this.geoData = {
        country: `${data.country_name || 'Unknown'} ${countryEmoji}`,
        city: data.city || 'Unknown',
        ip: data.ip || '',
        timezone: data.timezone || '',
        region: data.region || ''
      };
      this.geoReady = true;
      console.log('[Router] Geo resolved:', this.geoData.country, '/', this.geoData.city);
    } catch (err) {
      console.warn('[Router] Geolocation lookup failed (offline?):', err.message);
      this.geoReady = true;
    }
  }

  /**
   * Map ISO 3166-1 alpha-2 country codes to flag emojis.
   */
  _countryToEmoji(code) {
    if (!code || code.length !== 2) return '🌍';
    const upper = code.toUpperCase();
    const toFlag = c => String.fromCodePoint(0x1F1E6 - 65 + c.charCodeAt(0));
    return toFlag(upper[0]) + toFlag(upper[1]);
  }

  /**
   * Returns geo data ready for use in ceremony recording.
   */
  getGeo() {
    return this.geoData;
  }

  /**
   * Detect device type from userAgent.
   */
  detectDevice() {
    const ua = navigator.userAgent;
    if (/iPhone/.test(ua)) return 'iPhone (iOS)';
    if (/iPad/.test(ua)) return 'iPad (iPadOS)';
    if (/Android/.test(ua) && /Mobile/.test(ua)) return 'Android Phone';
    if (/Android/.test(ua)) return 'Android Tablet';
    if (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1) return 'MacBook (Mac)';
    if (/Mac/.test(ua)) return 'Mac Desktop';
    if (/Windows/.test(ua)) return 'Windows PC';
    if (/Linux/.test(ua)) return 'Linux Desktop';
    return 'Unknown Device';
  }
}

window.rakhiRouter = new RakhiRouter();
