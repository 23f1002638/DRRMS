import sqlite3 from 'sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const __dirname = dirname(fileURLToPath(import.meta.url));
const dbPath = process.env.DB_PATH || join(__dirname, 'database.sqlite');

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database ' + dbPath + ': ' + err.message);
  } else {
    console.log('Connected to the SQLite database.');
    initDb();
  }
});

function initDb() {
  db.serialize(() => {
    // Users table
    db.run(`CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE,
      password_hash TEXT,
      name TEXT,
      role TEXT,
      bio TEXT,
      location TEXT,
      avatar_url TEXT,
      phone TEXT,
      skills TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // Aid Requests table
    db.run(`CREATE TABLE IF NOT EXISTS aid_requests (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      title TEXT,
      description TEXT,
      category TEXT,
      urgency INTEGER,
      status TEXT,
      location_lat REAL,
      location_lng REAL,
      location_address TEXT,
      created_at TEXT,
      FOREIGN KEY(user_id) REFERENCES users(id)
    )`);

    // Donations
    db.run(`CREATE TABLE IF NOT EXISTS donations (
    id TEXT PRIMARY KEY,
    donor_id TEXT NOT NULL,
    donation_type TEXT CHECK(donation_type IN ('money', 'supplies', 'services')),
    category TEXT CHECK(category IN ('food', 'medical', 'shelter', 'general')),
    amount REAL,
    description TEXT,
    status TEXT DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(donor_id) REFERENCES users(id)
  )`);

    db.run(`CREATE TABLE IF NOT EXISTS notifications (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT CHECK(type IN ('info', 'success', 'warning', 'error')),
    read BOOLEAN DEFAULT 0,
    link TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id)
  )`);

    // Inventory table
    db.run(`CREATE TABLE IF NOT EXISTS inventory (
      id TEXT PRIMARY KEY,
      item_name TEXT,
      category TEXT,
      quantity INTEGER,
      unit TEXT,
      min_threshold INTEGER,
      status TEXT,
      location TEXT,
      created_at TEXT
    )`);

    // Volunteer Tasks (Assignments)
    db.run(`CREATE TABLE IF NOT EXISTS volunteer_tasks (
      id TEXT PRIMARY KEY,
      volunteer_id TEXT,
      request_id TEXT,
      status TEXT,
      accepted_at TEXT,
      completed_at TEXT,
      FOREIGN KEY(volunteer_id) REFERENCES users(id),
      FOREIGN KEY(request_id) REFERENCES aid_requests(id)
    )`);



    // Resources (Fixed locations like Shelters, Hospitals)
    db.run(`CREATE TABLE IF NOT EXISTS resources (
      id TEXT PRIMARY KEY,
      name TEXT,
      type TEXT,
      capacity INTEGER,
      status TEXT,
      location_lat REAL,
      location_lng REAL,
      location_address TEXT,
      created_at TEXT
    )`);

    // Seed Admin User if not exists
    db.get("SELECT id FROM users WHERE email = ?", ['admin@example.com'], (err, row) => {
      if (!row) {
        const passwordHash = bcrypt.hashSync('admin123', 10);
        const adminId = 'admin-' + Date.now();
        db.run(`INSERT INTO users (id, email, password_hash, name, role, created_at)
                VALUES (?, ?, ?, ?, ?, ?)`,
          [adminId, 'admin@example.com', passwordHash, 'System Admin', 'admin', new Date().toISOString()]);
        console.log('Seeded admin user: admin@example.com / admin123');
      }
    });

    // Seed some resources
    db.get("SELECT count(*) as count FROM resources", (err, row) => {
      if (row.count === 0) {
        const now = new Date().toISOString();
        const stmt = db.prepare(`INSERT INTO resources (id, name, type, capacity, status, location_lat, location_lng, location_address, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`);
        stmt.run([crypto.randomUUID(), 'Central Hospital', 'medical', 500, 'open', 40.7128, -74.0060, '100 Main St', now]);
        stmt.run([crypto.randomUUID(), 'Community Shelter', 'shelter', 200, 'open', 40.7200, -74.0100, '200 Oak Ave', now]);
        stmt.finalize();
        console.log('Seeded initial resources');
      }
    });
  });
}

export default db;
