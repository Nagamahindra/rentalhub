const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const db = new sqlite3.Database(path.join(__dirname, 'data', 'rental-system.db'));
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS app_settings (setting_key TEXT PRIMARY KEY, setting_value TEXT NOT NULL)`);
  bcrypt.hash('admin123', 10).then(hash => {
    db.run(`INSERT INTO app_settings(setting_key, setting_value) VALUES('admin_password_hash', ?)
      ON CONFLICT(setting_key) DO UPDATE SET setting_value=excluded.setting_value`, [hash], err => {
      if (err) { console.error('Could not reset admin password:', err.message); process.exitCode = 1; }
      else console.log('Admin password reset successfully. Username: admin | Password: admin123');
      db.close();
    });
  }).catch(err => { console.error(err); process.exitCode = 1; db.close(); });
});
