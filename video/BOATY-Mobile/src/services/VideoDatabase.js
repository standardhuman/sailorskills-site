import * as SQLite from 'expo-sqlite';

class VideoDatabase {
  constructor() {
    this.db = null;
  }

  async init() {
    this.db = await SQLite.openDatabaseAsync('boaty.db');
    await this.createTables();
  }

  async createTables() {
    // Videos table
    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS videos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        filename TEXT NOT NULL,
        original_filename TEXT,
        boat_name TEXT,
        video_date TEXT,
        video_type TEXT,
        local_path TEXT NOT NULL,
        size_bytes INTEGER,
        duration_seconds INTEGER,
        thumbnail_path TEXT,
        youtube_video_id TEXT,
        youtube_playlist_id TEXT,
        upload_status TEXT DEFAULT 'pending',
        created_at INTEGER DEFAULT (strftime('%s', 'now')),
        uploaded_at INTEGER
      );
    `);

    // Download queue table
    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS download_queue (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        gopro_filename TEXT NOT NULL,
        size_bytes INTEGER,
        progress_percent REAL DEFAULT 0,
        bytes_downloaded INTEGER DEFAULT 0,
        status TEXT DEFAULT 'pending',
        retry_count INTEGER DEFAULT 0,
        error_message TEXT,
        created_at INTEGER DEFAULT (strftime('%s', 'now'))
      );
    `);

    // Upload queue table
    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS upload_queue (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        video_id INTEGER,
        priority INTEGER DEFAULT 0,
        progress_percent REAL DEFAULT 0,
        bytes_uploaded INTEGER DEFAULT 0,
        upload_speed_mbps REAL,
        eta_seconds INTEGER,
        status TEXT DEFAULT 'pending',
        retry_count INTEGER DEFAULT 0,
        error_message TEXT,
        FOREIGN KEY(video_id) REFERENCES videos(id)
      );
    `);

    // Settings table
    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT
      );
    `);

    console.log('Database tables created successfully');
  }

  // Video operations
  async addVideo(video) {
    const result = await this.db.runAsync(
      `INSERT INTO videos (filename, original_filename, boat_name, video_date, video_type, local_path, size_bytes)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [video.filename, video.original_filename, video.boat_name, video.video_date, video.video_type, video.local_path, video.size_bytes]
    );
    return result.lastInsertRowId;
  }

  async getVideos() {
    const result = await this.db.getAllAsync('SELECT * FROM videos ORDER BY created_at DESC');
    return result;
  }

  async updateVideo(id, updates) {
    const fields = Object.keys(updates).map(key => `${key} = ?`).join(', ');
    const values = Object.values(updates);
    await this.db.runAsync(
      `UPDATE videos SET ${fields} WHERE id = ?`,
      [...values, id]
    );
  }

  async deleteVideo(id) {
    await this.db.runAsync('DELETE FROM videos WHERE id = ?', [id]);
  }

  // Download queue operations
  async addToDownloadQueue(download) {
    const result = await this.db.runAsync(
      `INSERT INTO download_queue (gopro_filename, size_bytes, status)
       VALUES (?, ?, ?)`,
      [download.gopro_filename, download.size_bytes, download.status || 'pending']
    );
    return result.lastInsertRowId;
  }

  async getDownloadQueue() {
    const result = await this.db.getAllAsync('SELECT * FROM download_queue WHERE status != \'completed\' ORDER BY created_at ASC');
    return result;
  }

  async updateDownloadProgress(id, progress) {
    await this.db.runAsync(
      `UPDATE download_queue SET progress_percent = ?, bytes_downloaded = ?, status = ? WHERE id = ?`,
      [progress.progress_percent, progress.bytes_downloaded, progress.status, id]
    );
  }

  // Upload queue operations
  async addToUploadQueue(upload) {
    const result = await this.db.runAsync(
      `INSERT INTO upload_queue (video_id, priority, status)
       VALUES (?, ?, ?)`,
      [upload.video_id, upload.priority || 0, upload.status || 'pending']
    );
    return result.lastInsertRowId;
  }

  async getUploadQueue() {
    const result = await this.db.getAllAsync(
      `SELECT uq.*, v.filename, v.local_path, v.size_bytes
       FROM upload_queue uq
       JOIN videos v ON uq.video_id = v.id
       WHERE uq.status != 'completed'
       ORDER BY uq.priority DESC, uq.id ASC`
    );
    return result;
  }

  async updateUploadProgress(id, progress) {
    await this.db.runAsync(
      `UPDATE upload_queue SET progress_percent = ?, bytes_uploaded = ?, upload_speed_mbps = ?, eta_seconds = ?, status = ? WHERE id = ?`,
      [progress.progress_percent, progress.bytes_uploaded, progress.upload_speed_mbps, progress.eta_seconds, progress.status, id]
    );
  }

  // Settings operations
  async getSetting(key) {
    const result = await this.db.getFirstAsync('SELECT value FROM settings WHERE key = ?', [key]);
    return result ? result.value : null;
  }

  async setSetting(key, value) {
    await this.db.runAsync(
      'INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)',
      [key, value]
    );
  }

  // Clean up
  async close() {
    if (this.db) {
      await this.db.closeAsync();
    }
  }
}

// Export singleton instance
const database = new VideoDatabase();
export default database;