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
    this.geoData = { country: '🌍 Unknown', city: 'Unknown', ip: '' };
    this.geoReady = false;
  }

  /**
   * Parse all URL parameters from both query string and hash.
   * e.g. index.html?token=rk_abc#sister  → { token:'rk_abc', view:'sister' }
   */
  parseParams() {
    const params = {};

    // Query string params (everything after ?)
    const qs = window.location.search.slice(1);
    if (qs) {
      qs.split('&').forEach(pair => {
        const [k, v] = pair.split('=');
        if (k) params[decodeURIComponent(k)] = decodeURIComponent(v || '');
      });
    }

    // Hash fragment params (everything after # that contains ?)
    const hash = window.location.hash; // e.g. "#sister?token=rk_abc"
    if (hash.includes('?')) {
      const hashQs = hash.split('?')[1];
      hashQs.split('&').forEach(pair => {
        const [k, v] = pair.split('=');
        if (k) params[decodeURIComponent(k)] = decodeURIComponent(v || '');
      });
    }

    return params;
  }

  /**
   * Called on DOMContentLoaded — before any view renders.
   * Resolves the brother token and sets it as the active session.
   */
  async resolveDeepLink() {
    const params = this.parseParams();
    const token = params.token || null;

    if (token) {
      this.token = token;
      localStorage.setItem('rakhi_active_token', token);
      console.log('[Router] Deep-link token resolved:', token);

      // Optionally increment visit count in DB
      if (window.rakhiDB && window.rakhiDB.ready) {
        window.rakhiDB.incrementLinkVisits(token);
      }

      // Navigate to sister view after app loads
      return 'sister';
    }

    const hashView = window.location.hash.replace('#', '').split('?')[0];
    if (hashView && hashView !== '') return hashView;

    return params.view || 'home';
  }

  /**
   * Build a shareable deep-link URL for a brother's token.
   * Generates both a full URL and a short-form that works when hosted.
   */
  buildShareUrl(token) {
    const base = window.location.href.split('?')[0].split('#')[0];
    return `${base}?token=${token}`;
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
