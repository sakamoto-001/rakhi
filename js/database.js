/**
 * RakhiVerse SQLite Database Engine (Browser-side via sql.js WASM)
 * Stores Brothers, RakhiLinks, and RakhiCeremonies in a persistent IndexedDB-backed SQLite.
 */

class RakhiDatabase {
  constructor() {
    this.db = null;
    this.ready = false;
  }

  async init() {
    try {
      // sql-wasm.js exposes initSqlJs globally
      const SQL = await initSqlJs({
        locateFile: file => `https://sql.js.org/dist/${file}`
      });

      // Try to load existing DB from IndexedDB
      const savedData = await this.loadFromIndexedDB();
      if (savedData) {
        this.db = new SQL.Database(new Uint8Array(savedData));
      } else {
        this.db = new SQL.Database();
      }

      this.createTables();
      this.ready = true;
      console.log('[RakhiDB] SQLite initialized successfully');
      return true;
    } catch (err) {
      console.error('[RakhiDB] Failed to initialize SQLite:', err);
      return false;
    }
  }

  createTables() {
    this.db.run(`
      CREATE TABLE IF NOT EXISTS Brother (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT DEFAULT '',
        originalImage TEXT DEFAULT '',
        avatarImage TEXT DEFAULT '',
        avatarStyle TEXT DEFAULT '',
        personalMessage TEXT DEFAULT '',
        createdAt TEXT DEFAULT (datetime('now'))
      );
    `);

    this.db.run(`
      CREATE TABLE IF NOT EXISTS RakhiLink (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        brotherId TEXT NOT NULL,
        uniqueToken TEXT UNIQUE NOT NULL,
        visits INTEGER DEFAULT 0,
        expiresAt TEXT DEFAULT '',
        createdAt TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (brotherId) REFERENCES Brother(id)
      );
    `);

    this.db.run(`
      CREATE TABLE IF NOT EXISTS RakhiCeremony (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        brotherId TEXT NOT NULL,
        sisterName TEXT NOT NULL,
        rakhiTiedImage TEXT DEFAULT '',
        ipAddress TEXT DEFAULT '',
        country TEXT DEFAULT '',
        city TEXT DEFAULT '',
        device TEXT DEFAULT '',
        completedSteps INTEGER DEFAULT 0,
        timestamp TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (brotherId) REFERENCES Brother(id)
      );
    `);

    this.db.run(`CREATE INDEX IF NOT EXISTS idx_link_token ON RakhiLink(uniqueToken);`);
    this.db.run(`CREATE INDEX IF NOT EXISTS idx_ceremony_brother ON RakhiCeremony(brotherId);`);
  }

  // ── Brother CRUD ──────────────────────────────────────────────
  insertBrother(id, name, avatarImage, avatarStyle, personalMessage, originalImage) {
    this.db.run(
      `INSERT OR REPLACE INTO Brother (id, name, avatarImage, avatarStyle, personalMessage, originalImage) VALUES (?, ?, ?, ?, ?, ?)`,
      [id, name, avatarImage, avatarStyle, personalMessage || '', originalImage || '']
    );
    this.persist();
  }

  getBrother(id) {
    const stmt = this.db.prepare(`SELECT * FROM Brother WHERE id = ?`);
    stmt.bind([id]);
    if (stmt.step()) {
      const row = stmt.getAsObject();
      stmt.free();
      return row;
    }
    stmt.free();
    return null;
  }

  // ── RakhiLink CRUD ────────────────────────────────────────────
  insertLink(brotherId, uniqueToken) {
    this.db.run(
      `INSERT INTO RakhiLink (brotherId, uniqueToken) VALUES (?, ?)`,
      [brotherId, uniqueToken]
    );
    this.persist();
    return uniqueToken;
  }

  incrementLinkVisits(token) {
    this.db.run(`UPDATE RakhiLink SET visits = visits + 1 WHERE uniqueToken = ?`, [token]);
    this.persist();
  }

  getLinkByToken(token) {
    const stmt = this.db.prepare(`SELECT rl.*, b.name as brotherName, b.avatarImage, b.avatarStyle, b.personalMessage FROM RakhiLink rl JOIN Brother b ON rl.brotherId = b.id WHERE rl.uniqueToken = ?`);
    stmt.bind([token]);
    if (stmt.step()) {
      const row = stmt.getAsObject();
      stmt.free();
      return row;
    }
    stmt.free();
    return null;
  }

  // ── RakhiCeremony CRUD ────────────────────────────────────────
  insertCeremony(brotherId, sisterName, rakhiTiedImage, device) {
    this.db.run(
      `INSERT INTO RakhiCeremony (brotherId, sisterName, rakhiTiedImage, device, country, city) VALUES (?, ?, ?, ?, ?, ?)`,
      [brotherId, sisterName, rakhiTiedImage || '', device || navigator.userAgent, 'India 🇮🇳', 'Mumbai']
    );
    this.persist();
  }

  getCeremoniesForBrother(brotherId) {
    const results = [];
    const stmt = this.db.prepare(`SELECT * FROM RakhiCeremony WHERE brotherId = ? ORDER BY timestamp DESC`);
    stmt.bind([brotherId]);
    while (stmt.step()) {
      results.push(stmt.getAsObject());
    }
    stmt.free();
    return results;
  }

  // ── Analytics Aggregation ─────────────────────────────────────
  getDashboardStats(brotherId) {
    let totalTied = 0, totalVisits = 0;

    const stmtCeremony = this.db.prepare(`SELECT COUNT(*) as cnt FROM RakhiCeremony WHERE brotherId = ?`);
    stmtCeremony.bind([brotherId]);
    if (stmtCeremony.step()) totalTied = stmtCeremony.getAsObject().cnt;
    stmtCeremony.free();

    const stmtVisits = this.db.prepare(`SELECT SUM(visits) as total FROM RakhiLink WHERE brotherId = ?`);
    stmtVisits.bind([brotherId]);
    if (stmtVisits.step()) totalVisits = stmtVisits.getAsObject().total || 0;
    stmtVisits.free();

    return { totalTied, totalVisits };
  }

  getAllBrothers() {
    const results = [];
    const stmt = this.db.prepare(`SELECT * FROM Brother ORDER BY createdAt DESC`);
    while (stmt.step()) {
      results.push(stmt.getAsObject());
    }
    stmt.free();
    return results;
  }

  updateBrother(id, fields = {}) {
    const allowed = ['name', 'avatarImage', 'avatarStyle', 'personalMessage', 'email'];
    const sets = [];
    const vals = [];
    for (const [k, v] of Object.entries(fields)) {
      if (allowed.includes(k)) { sets.push(`${k} = ?`); vals.push(v); }
    }
    if (sets.length === 0) return;
    vals.push(id);
    this.db.run(`UPDATE Brother SET ${sets.join(', ')} WHERE id = ?`, vals);
    this.persist();
  }

  getAllLinks(brotherId) {
    const results = [];
    const stmt = this.db.prepare(`SELECT * FROM RakhiLink WHERE brotherId = ? ORDER BY createdAt DESC`);
    stmt.bind([brotherId]);
    while (stmt.step()) { results.push(stmt.getAsObject()); }
    stmt.free();
    return results;
  }

  deleteCeremony(id) {
    this.db.run(`DELETE FROM RakhiCeremony WHERE id = ?`, [id]);
    this.persist();
  }

  clearAllData() {
    this.db.run('DELETE FROM RakhiCeremony');
    this.db.run('DELETE FROM RakhiLink');
    this.db.run('DELETE FROM Brother');
    this.persist();
    console.log('[RakhiDB] All data cleared.');
  }

  // ── Persistence (IndexedDB backing) ──────────────────────────
  async persist() {
    if (!this.db) return;
    try {
      const data = this.db.export();
      const buffer = data.buffer;
      await this.saveToIndexedDB(buffer);
    } catch (err) {
      console.error('[RakhiDB] Persist failed:', err);
    }
  }

  saveToIndexedDB(buffer) {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('RakhiVerseDB', 1);
      request.onupgradeneeded = (e) => {
        e.target.result.createObjectStore('sqlite');
      };
      request.onsuccess = (e) => {
        const db = e.target.result;
        const tx = db.transaction('sqlite', 'readwrite');
        tx.objectStore('sqlite').put(buffer, 'db');
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      };
      request.onerror = () => reject(request.error);
    });
  }

  loadFromIndexedDB() {
    return new Promise((resolve) => {
      const request = indexedDB.open('RakhiVerseDB', 1);
      request.onupgradeneeded = (e) => {
        e.target.result.createObjectStore('sqlite');
      };
      request.onsuccess = (e) => {
        const db = e.target.result;
        const tx = db.transaction('sqlite', 'readonly');
        const getReq = tx.objectStore('sqlite').get('db');
        getReq.onsuccess = () => resolve(getReq.result || null);
        getReq.onerror = () => resolve(null);
      };
      request.onerror = () => resolve(null);
    });
  }
}

window.rakhiDB = new RakhiDatabase();
