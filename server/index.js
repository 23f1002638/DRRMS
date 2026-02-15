import express from 'express';
import cors from 'cors';
import db from './db.js';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = 'dev-secret-key-123'; // In prod, use .env

app.use(cors());
app.use(express.json());

// Helper to generate UUIDs
const uuid = () => crypto.randomUUID();

// Middleware to verify token
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.sendStatus(401);

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
    });
};

// ==========================================
// AUTH ROUTE
// ==========================================

app.post('/api/auth/signup', (req, res) => {
    const { email, password, name, role } = req.body;
    const hash = bcrypt.hashSync(password, 8);
    const id = uuid();
    const now = new Date().toISOString();

    db.run(`INSERT INTO users (id, email, password_hash, name, role, created_at) VALUES (?, ?, ?, ?, ?, ?)`,
        [id, email, hash, name, role, now],
        function (err) {
            if (err) {
                if (err.message.includes('UNIQUE')) return res.status(400).json({ error: 'Email already exists' });
                return res.status(500).json({ error: err.message });
            }
            const token = jwt.sign({ id, email, role, name }, JWT_SECRET, { expiresIn: '24h' });
            res.json({ user: { id, email, name, role }, token });
        }
    );
});

app.post('/api/auth/login', (req, res) => {
    const { email, password } = req.body;
    db.get(`SELECT * FROM users WHERE email = ?`, [email], (err, user) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!user) return res.status(401).json({ error: 'Invalid credentials' });

        const isValid = bcrypt.compareSync(password, user.password_hash);
        if (!isValid) return res.status(401).json({ error: 'Invalid credentials' });

        const token = jwt.sign({ id: user.id, email: user.email, role: user.role, name: user.name }, JWT_SECRET, { expiresIn: '24h' });
        res.json({ user: { id: user.id, email: user.email, name: user.name, role: user.role }, token });
    });
});

app.get('/api/auth/me', (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'No token provided' });

    const token = authHeader.split(' ')[1];
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        // Fetch full user details from DB to ensure they still exist/role matches
        db.get(`SELECT id, email, name, role FROM users WHERE id = ?`, [decoded.id], (err, user) => {
            if (!user) return res.status(401).json({ error: 'User not found' });
            res.json({ user });
        });
    } catch (e) {
        res.status(401).json({ error: 'Invalid token' });
    }
});

// ==========================================
// DATA ROUTES
// ==========================================

// AID REQUESTS
app.get('/api/requests', (req, res) => {
    const userId = req.query.userId;
    let query = `SELECT * FROM aid_requests ORDER BY created_at DESC`;
    let params = [];

    if (userId) {
        query = `SELECT * FROM aid_requests WHERE user_id = ? ORDER BY created_at DESC`;
        params = [userId];
    }

    db.all(query, params, (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.post('/api/requests', authenticateToken, (req, res) => {
    const { category, title, description, urgency, lat, lng, address, people_count } = req.body;
    const id = uuid();
    const now = new Date().toISOString();
    // Map urgency number to mapped priority string if needed, or just store as is. 
    // Frontend sends mapped fields sometimes.
    // We'll trust frontend uses correct fields or map them here.

    db.run(`INSERT INTO aid_requests (id, user_id, title, description, category, urgency, status, location_lat, location_lng, location_address, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [id, req.user.id, title, description, category, urgency, 'pending', lat, lng, address, now],
        (err) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ id, status: 'success' });
        }
    );
});

app.patch('/api/requests/:id', authenticateToken, (req, res) => {
    const { status } = req.body;
    // Ensure user owns request or is admin/volunteer (simple owner check for cancellation)
    db.run(`UPDATE aid_requests SET status = ?, updated_at = ? WHERE id = ? AND user_id = ?`,
        [status, new Date().toISOString(), req.params.id, req.user.id],
        function (err) {
            if (err) return res.status(500).json({ error: err.message });
            if (this.changes === 0) return res.status(403).json({ error: 'Not authorized or request not found' });
            res.json({ success: true });
        }
    );
});

// INVENTORY
app.get('/api/inventory', (req, res) => {
    db.all(`SELECT * FROM inventory ORDER BY created_at DESC`, [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.post('/api/inventory', authenticateToken, (req, res) => {
    const { item_name, category, quantity, unit, min_threshold, status, location } = req.body;
    const id = uuid();
    const now = new Date().toISOString();
    db.run(`INSERT INTO inventory (id, item_name, category, quantity, unit, min_threshold, status, location, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [id, item_name, category, quantity, unit, min_threshold, status, location, now],
        (err) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ id, status: 'success' });
        }
    );
});

app.patch('/api/inventory/:id', authenticateToken, (req, res) => {
    const { quantity, status, location } = req.body;
    db.run(`UPDATE inventory SET quantity = COALESCE(?, quantity), status = COALESCE(?, status), location = COALESCE(?, location), updated_at = ? WHERE id = ?`,
        [quantity, status, location, new Date().toISOString(), req.params.id],
        function (err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ success: true });
        }
    );
});

// RESOURCES (Fixed Locations)
app.get('/api/resources', (req, res) => {
    db.all(`SELECT * FROM resources`, [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// VOLUNTEERS
app.get('/api/volunteers', (req, res) => {
    const query = `
    SELECT 
      u.id, u.name, u.email, u.role, u.created_at,
      COUNT(CASE WHEN t.status IN ('claimed', 'in_progress') THEN 1 END) as assigned_tasks,
      COUNT(CASE WHEN t.status = 'completed' THEN 1 END) as completed_tasks
    FROM users u
    LEFT JOIN volunteer_tasks t ON u.id = t.volunteer_id
    WHERE u.role = 'volunteer'
    GROUP BY u.id
  `;

    db.all(query, [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });

        const enriched = rows.map(r => ({
            ...r,
            full_name: r.name, // compatibility
            status: r.assigned_tasks > 0 ? 'active' : 'available',
            volunteer_tasks: [] // legacy structure support if needed, or just rely on counts
        }));
        res.json(enriched);
    });
});

// ASSIGNMENTS / TASKS
app.get('/api/assignments', authenticateToken, (req, res) => {
    // Get assignments for the logged in volunteer
    db.all(`SELECT t.*, r.title as request_title, r.description as request_description 
          FROM volunteer_tasks t 
          JOIN aid_requests r ON t.request_id = r.id 
          WHERE t.volunteer_id = ?`,
        [req.user.id],
        (err, rows) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json(rows);
        }
    );
});

// ALL TASKS (For Admin/Analytics)
app.get('/api/tasks', (req, res) => {
    db.all(`SELECT * FROM volunteer_tasks`, [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.post('/api/tasks/claim', authenticateToken, (req, res) => {
    const { task_id } = req.body; // In frontend this is the request_id usually
    const id = uuid();
    const now = new Date().toISOString();

    // Create task entry
    db.run(`INSERT INTO volunteer_tasks (id, volunteer_id, request_id, status, accepted_at)
          VALUES (?, ?, ?, ?, ?)`,
        [id, req.user.id, task_id, 'claimed', now],
        function (err) {
            if (err) return res.status(500).json({ error: err.message });

            // Update request status
            db.run(`UPDATE aid_requests SET status = 'in_progress' WHERE id = ?`, [task_id]);

            res.json({ success: true, taskId: id });
        }
    );
});

app.patch('/api/tasks/:id', authenticateToken, (req, res) => {
    const { status, volunteer_id, claimed_at, completed_at } = req.body;

    // Dynamic update query
    let fields = [];
    let values = [];

    if (status !== undefined) { fields.push('status = ?'); values.push(status); }
    if (volunteer_id !== undefined) { fields.push('volunteer_id = ?'); values.push(volunteer_id); }
    if (claimed_at !== undefined) { fields.push('claimed_at = ?'); values.push(claimed_at); }
    if (completed_at !== undefined) { fields.push('completed_at = ?'); values.push(completed_at); }

    if (fields.length === 0) return res.status(400).json({ error: 'No fields to update' });

    values.push(req.params.id);
    values.push(req.user.id); // Ensure user owns the task

    db.run(`UPDATE volunteer_tasks SET ${fields.join(', ')} WHERE id = ? AND volunteer_id = ?`, values, function (err) {
        if (err) return res.status(500).json({ error: err.message });
        if (this.changes === 0) return res.status(404).json({ error: 'Task not found or not owned by user' });

        // If status is completed, update linked request too
        if (status === 'completed') {
            db.get(`SELECT request_id FROM volunteer_tasks WHERE id = ?`, [req.params.id], (err, row) => {
                if (row && row.request_id) {
                    db.run(`UPDATE aid_requests SET status = 'resolved', resolved_at = ? WHERE id = ?`, [new Date().toISOString(), row.request_id]);
                }
            });
        }

        res.json({ success: true });
    });
});

app.post('/api/tasks/:id/unclaim', authenticateToken, (req, res) => {
    db.get(`SELECT request_id FROM volunteer_tasks WHERE id = ? AND volunteer_id = ?`, [req.params.id, req.user.id], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!row) return res.status(404).json({ error: 'Task not found' });

        // Delete volunteer task
        db.run(`DELETE FROM volunteer_tasks WHERE id = ?`, [req.params.id], function (err) {
            if (err) return res.status(500).json({ error: err.message });

            // Reset request status
            if (row.request_id) {
                db.run(`UPDATE aid_requests SET status = 'pending' WHERE id = ?`, [row.request_id]);
            }
            res.json({ success: true });
        });
    });
});

// NOTIFICATIONS
app.get('/api/notifications', authenticateToken, (req, res) => {
    db.all(`SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 50`, [req.user.id], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows.map(row => ({ ...row, read: !!row.read })));
    });
});

app.patch('/api/notifications/:id/read', authenticateToken, (req, res) => {
    db.run(`UPDATE notifications SET read = 1 WHERE id = ? AND user_id = ?`, [req.params.id, req.user.id], function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true });
    });
});

app.patch('/api/notifications/read-all', authenticateToken, (req, res) => {
    db.run(`UPDATE notifications SET read = 1 WHERE user_id = ?`, [req.user.id], function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true });
    });
});

// DONATIONS
app.get('/api/donations', authenticateToken, (req, res) => {
    db.all(`SELECT * FROM donations WHERE donor_id = ? ORDER BY created_at DESC`, [req.user.id], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.post('/api/donations', authenticateToken, (req, res) => {
    const { donation_type, category, amount, description } = req.body;
    const id = uuid();
    const now = new Date().toISOString();

    db.run(`INSERT INTO donations (id, donor_id, donation_type, category, amount, status, description, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [id, req.user.id, donation_type, category, amount || 0, 'pending', description, now],
        (err) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ id, status: 'success' });
        }
    );
});

// PROFILES
app.get('/api/profiles/:id', (req, res) => {
    db.get(`SELECT id, name, email, role, bio, location, avatar_url, phone, skills, created_at FROM users WHERE id = ?`, [req.params.id], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        if (row && row.skills) {
            try {
                row.skills = JSON.parse(row.skills);
            } catch (e) {
                row.skills = [];
            }
        }
        res.json(row);
    });
});

app.put('/api/profiles/:id', authenticateToken, (req, res) => {
    if (req.user.id !== req.params.id && req.user.role !== 'admin') {
        return res.sendStatus(403);
    }

    const { name, bio, location, avatar_url, phone, skills } = req.body;
    db.run(
        `UPDATE users SET name = COALESCE(?, name), bio = ?, location = ?, avatar_url = ?, phone = ?, skills = ? WHERE id = ?`,
        [name, bio, location, avatar_url, phone, JSON.stringify(skills || []), req.params.id],
        function (err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ success: true });
        }
    );
});

// Start Server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
