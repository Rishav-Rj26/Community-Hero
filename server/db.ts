import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import bcrypt from 'bcryptjs';

const dbPath = process.env.DATABASE_PATH || 'server/community_hero.db';
const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

export const db = new Database(dbPath);

db.pragma('foreign_keys = ON');
db.pragma('journal_mode = WAL');

// Initialize database schema
export function initDB() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT NOT NULL,
      points INTEGER DEFAULT 0,
      avatar TEXT,
      joinedAt TEXT NOT NULL,
      streak INTEGER DEFAULT 1,
      lastActiveDate TEXT NOT NULL,
      issuesReported INTEGER DEFAULT 0,
      issuesVerified INTEGER DEFAULT 0,
      commentsPosted INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS badges (
      id TEXT,
      userId TEXT,
      name TEXT,
      icon TEXT,
      description TEXT,
      requirement TEXT,
      threshold INTEGER,
      dateEarned TEXT,
      PRIMARY KEY (id, userId),
      FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS issues (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      category TEXT NOT NULL,
      severity TEXT NOT NULL,
      status TEXT NOT NULL,
      lat REAL NOT NULL,
      lng REAL NOT NULL,
      address TEXT NOT NULL,
      imageUrl TEXT NOT NULL,
      videoUrl TEXT,
      aiConfidence REAL,
      aiDescription TEXT,
      department TEXT NOT NULL,
      upvotes INTEGER DEFAULT 0,
      verifiedCount INTEGER DEFAULT 0,
      isVerifiedByAuthority INTEGER DEFAULT 0,
      reporterId TEXT NOT NULL,
      reporterName TEXT NOT NULL,
      reporterAvatar TEXT,
      createdAt TEXT NOT NULL,
      resolvedAt TEXT,
      resolvedNotes TEXT,
      assignedTo TEXT,
      estimatedResolutionDays INTEGER,
      FOREIGN KEY (reporterId) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS timeline_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      issueId TEXT NOT NULL,
      status TEXT NOT NULL,
      date TEXT NOT NULL,
      description TEXT NOT NULL,
      actor TEXT,
      FOREIGN KEY (issueId) REFERENCES issues(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS comments (
      id TEXT PRIMARY KEY,
      issueId TEXT NOT NULL,
      authorId TEXT NOT NULL,
      authorName TEXT NOT NULL,
      authorAvatar TEXT,
      content TEXT NOT NULL,
      createdAt TEXT NOT NULL,
      role TEXT NOT NULL,
      FOREIGN KEY (issueId) REFERENCES issues(id) ON DELETE CASCADE,
      FOREIGN KEY (authorId) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS upvotes (
      issueId TEXT,
      userId TEXT,
      PRIMARY KEY (issueId, userId),
      FOREIGN KEY (issueId) REFERENCES issues(id) ON DELETE CASCADE,
      FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS verifications (
      issueId TEXT,
      userId TEXT,
      PRIMARY KEY (issueId, userId),
      FOREIGN KEY (issueId) REFERENCES issues(id) ON DELETE CASCADE,
      FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      type TEXT NOT NULL,
      issueId TEXT,
      read INTEGER DEFAULT 0,
      createdAt TEXT NOT NULL,
      FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_issues_createdAt ON issues(createdAt DESC);
    CREATE INDEX IF NOT EXISTS idx_issues_status ON issues(status);
    CREATE INDEX IF NOT EXISTS idx_issues_category ON issues(category);
    CREATE INDEX IF NOT EXISTS idx_issues_severity ON issues(severity);
    CREATE INDEX IF NOT EXISTS idx_issues_reporterId ON issues(reporterId);
    CREATE INDEX IF NOT EXISTS idx_comments_issue_createdAt ON comments(issueId, createdAt);
    CREATE INDEX IF NOT EXISTS idx_notifications_user_createdAt ON notifications(userId, createdAt DESC);
    CREATE INDEX IF NOT EXISTS idx_timeline_issueId ON timeline_events(issueId);
    CREATE INDEX IF NOT EXISTS idx_upvotes_issueId ON upvotes(issueId);
    CREATE INDEX IF NOT EXISTS idx_verifications_issueId ON verifications(issueId);
  `);

  // Seed Data if empty
  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number };
  if (userCount.count === 0) {
    seedDatabase();
  }
}

function seedDatabase() {
  const insertUser = db.prepare(`
    INSERT INTO users (id, name, email, password, role, points, avatar, joinedAt, streak, lastActiveDate, issuesReported, issuesVerified, commentsPosted)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  
  const insertBadge = db.prepare(`
    INSERT INTO badges (id, userId, name, icon, description, requirement, threshold, dateEarned)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertIssue = db.prepare(`
    INSERT INTO issues (id, title, description, category, severity, status, lat, lng, address, imageUrl, aiConfidence, aiDescription, department, upvotes, verifiedCount, isVerifiedByAuthority, reporterId, reporterName, reporterAvatar, createdAt, resolvedAt, resolvedNotes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertTimeline = db.prepare(`
    INSERT INTO timeline_events (issueId, status, date, description, actor)
    VALUES (?, ?, ?, ?, ?)
  `);

  const insertComment = db.prepare(`
    INSERT INTO comments (id, issueId, authorId, authorName, authorAvatar, content, createdAt, role)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const today = new Date().toISOString();

  // Seed Users
  const citizenPassword = bcrypt.hashSync('hero123', 10);
  insertUser.run('user-1', 'Alex Rivera', 'alex@hero.com', citizenPassword, 'Citizen', 340, 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex', '2025-11-15', 5, today, 8, 12, 15);
  
  const authPassword = bcrypt.hashSync('admin123', 10);
  insertUser.run('user-2', 'Commissioner Patel', 'admin@hero.com', authPassword, 'Authority', 0, 'https://api.dicebear.com/7.x/avataaars/svg?seed=Patel', '2025-10-01', 0, today, 0, 0, 5);

  insertUser.run('user-3', 'Ravi K', 'ravi@hero.com', citizenPassword, 'Citizen', 100, 'https://api.dicebear.com/7.x/avataaars/svg?seed=Ravi', '2025-12-01', 2, today, 2, 5, 3);
  insertUser.run('user-community-1', 'Priya Sharma', 'priya@hero.com', citizenPassword, 'Citizen', 150, 'https://api.dicebear.com/7.x/avataaars/svg?seed=Priya', '2026-01-10', 3, today, 5, 8, 10);
  insertUser.run('user-community-2', 'Sanjay Gupta', 'sanjay@hero.com', citizenPassword, 'Citizen', 200, 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sanjay', '2026-02-20', 4, today, 6, 10, 12);
  insertUser.run('user-community-3', 'Anita Desai', 'anita@hero.com', citizenPassword, 'Citizen', 250, 'https://api.dicebear.com/7.x/avataaars/svg?seed=Anita', '2026-03-15', 5, today, 7, 12, 14);
  insertUser.run('user-community-4', 'Vikram Singh', 'vikram@hero.com', citizenPassword, 'Citizen', 300, 'https://api.dicebear.com/7.x/avataaars/svg?seed=Vikram', '2026-04-10', 6, today, 8, 15, 16);
  insertUser.run('user-community-5', 'Meera Reddy', 'meera@hero.com', citizenPassword, 'Citizen', 350, 'https://api.dicebear.com/7.x/avataaars/svg?seed=Meera', '2026-05-05', 7, today, 9, 18, 18);
  insertUser.run('user-community-6', 'Arjun M', 'arjun@hero.com', citizenPassword, 'Citizen', 400, 'https://api.dicebear.com/7.x/avataaars/svg?seed=Arjun', '2026-06-01', 8, today, 10, 20, 20);
  insertUser.run('user-community-7', 'Neha K', 'neha@hero.com', citizenPassword, 'Citizen', 450, 'https://api.dicebear.com/7.x/avataaars/svg?seed=Neha', '2026-06-15', 9, today, 11, 22, 22);
  insertUser.run('user-community-8', 'Karthik S', 'karthik@hero.com', citizenPassword, 'Citizen', 500, 'https://api.dicebear.com/7.x/avataaars/svg?seed=Karthik', '2026-06-20', 10, today, 12, 25, 25);

  // Seed Badges for Alex
  insertBadge.run('badge-1', 'user-1', 'First Report', 'Target', 'Reported your first community issue', 'Report 1 issue', 1, '2025-12-01');
  insertBadge.run('badge-2', 'user-1', 'Community Guardian', 'Shield', 'Verified 5 community issues', 'Verify 5 issues', 5, '2026-01-15');

  // Seed Issue 1
  insertIssue.run('issue-1', 'Deep Pothole on MG Road', 'A massive pothole has developed near the metro station, causing severe traffic slowdowns and posing a risk to two-wheelers.', 'Pothole', 'Critical', 'In Progress', 24.2792, 86.6413, 'MG Road, near Trinity Metro, Madhupur', 'https://picsum.photos/seed/pothole1/800/500', 0.95, 'Large structural anomaly on road surface detected. High risk of vehicular damage.', 'Roads & Infrastructure', 45, 12, 1, 'user-1', 'Alex Rivera', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex', '2026-06-20T10:00:00Z', null, null);
  insertTimeline.run('issue-1', 'Reported', '2026-06-20T10:00:00Z', 'Issue reported by citizen', 'Alex Rivera');
  insertTimeline.run('issue-1', 'Under Review', '2026-06-21T09:00:00Z', 'Assigned to inspection team', 'Authority');
  insertTimeline.run('issue-1', 'In Progress', '2026-06-22T14:30:00Z', 'Repair crew dispatched', 'Authority');
  insertComment.run('c1', 'issue-1', 'user-3', 'Ravi K', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Ravi', 'Almost fell off my bike here yesterday!', '2026-06-20T11:00:00Z', 'Citizen');

  // Seed Issue 2
  insertIssue.run('issue-2', 'Broken Streetlight at Indiranagar 100ft Road', 'Streetlight pole number 45 is completely dark. The area is unsafe for pedestrians at night.', 'Streetlight', 'High', 'Reported', 24.2822, 86.6843, '100ft Road, Indiranagar, Madhupur', 'https://picsum.photos/seed/light1/800/500', 0.88, 'Non-functional illumination unit detected during low light conditions.', 'Electrical & Lighting', 28, 5, 0, 'user-community-1', 'Priya Sharma', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Priya', '2026-06-25T18:30:00Z', null, null);
  insertTimeline.run('issue-2', 'Reported', '2026-06-25T18:30:00Z', 'Issue reported by citizen', 'Priya Sharma');

  // Seed Issue 3
  insertIssue.run('issue-3', 'Water Pipe Burst in Koramangala', 'Major water leakage flooding the 4th Block intersection. Thousands of liters wasting.', 'Water Leakage', 'Critical', 'Resolved', 24.2392, 86.6643, '4th Block, Koramangala, Madhupur', 'https://picsum.photos/seed/water1/800/500', 0.92, 'Significant localized flooding due to pressurized water release.', 'Water & Sewage', 85, 25, 1, 'user-community-2', 'Sanjay Gupta', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sanjay', '2026-06-15T08:00:00Z', '2026-06-16T16:00:00Z', 'Main valve replaced and pipe patched.');
  insertTimeline.run('issue-3', 'Reported', '2026-06-15T08:00:00Z', 'Issue reported by citizen', 'Sanjay Gupta');
  insertTimeline.run('issue-3', 'Under Review', '2026-06-15T09:15:00Z', 'Emergency team notified', 'Authority');
  insertTimeline.run('issue-3', 'In Progress', '2026-06-15T11:00:00Z', 'Team on site', 'Authority');
  insertTimeline.run('issue-3', 'Resolved', '2026-06-16T16:00:00Z', 'Leak fixed', 'Authority');
  insertComment.run('c2', 'issue-3', 'user-2', 'Commissioner Patel', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Patel', 'Our rapid response team is on it.', '2026-06-15T09:30:00Z', 'Authority');

  // Issue 4
  insertIssue.run('issue-4', 'Garbage Dump near School', 'Uncollected waste piling up near the primary school in Jayanagar.', 'Waste Management', 'Medium', 'Under Review', 24.2322, 86.6243, 'Jayanagar 3rd Block, Madhupur', 'https://picsum.photos/seed/trash1/800/500', 0.89, 'Accumulation of uncontained solid waste in public area.', 'Waste Management', 32, 8, 0, 'user-1', 'Alex Rivera', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex', '2026-06-26T07:45:00Z', null, null);
  insertTimeline.run('issue-4', 'Reported', '2026-06-26T07:45:00Z', 'Issue reported by citizen', 'Alex Rivera');
  insertTimeline.run('issue-4', 'Under Review', '2026-06-26T14:00:00Z', 'Scheduled for next collection cycle', 'Authority');

  console.log('Database seeded successfully');
}

export function resetDatabase() {
  db.exec(`
    DROP TABLE IF EXISTS notifications;
    DROP TABLE IF EXISTS verifications;
    DROP TABLE IF EXISTS upvotes;
    DROP TABLE IF EXISTS comments;
    DROP TABLE IF EXISTS timeline_events;
    DROP TABLE IF EXISTS issues;
    DROP TABLE IF EXISTS badges;
    DROP TABLE IF EXISTS users;
  `);
  initDB();
}

export function closeDatabase() {
  if (!db.open) return;
  db.pragma('wal_checkpoint(TRUNCATE)');
  db.close();
}
