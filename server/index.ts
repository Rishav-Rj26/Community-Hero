import express, { NextFunction, Request, Response } from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import { db, initDB, resetDatabase } from './db';
import { authMiddleware, AuthRequest } from './middleware/auth';

dotenv.config();

const app = express();
const PORT = Number(process.env.SERVER_PORT || 3001);
const JWT_SECRET = process.env.JWT_SECRET || 'community-hero-dev-secret-change-in-production';
const API_KEY = process.env.GEMINI_API_KEY || '';
const ISSUE_STATUSES = ['Reported', 'Under Review', 'In Progress', 'Resolved'] as const;
const ISSUE_SEVERITIES = ['Low', 'Medium', 'High', 'Critical'] as const;
const USER_ROLES = ['Citizen', 'Authority'] as const;
const MAX_UPLOAD_SIZE_BYTES = 8 * 1024 * 1024;

let ai: GoogleGenAI | null = null;
try {
  if (API_KEY) {
    ai = new GoogleGenAI({ apiKey: API_KEY });
  }
} catch {
  ai = null;
}

app.disable('x-powered-by');
app.use((_req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  next();
});
app.use(cors());
app.use(express.json({ limit: '10mb' }));

type RateLimitBucket = { count: number; resetAt: number };
const rateLimitBuckets = new Map<string, RateLimitBucket>();

function rateLimit(options: { windowMs: number; max: number }) {
  return (req: Request, res: Response, next: NextFunction) => {
    const forwardedFor = req.headers['x-forwarded-for'];
    const ip = Array.isArray(forwardedFor) ? forwardedFor[0] : forwardedFor?.split(',')[0]?.trim() || req.ip || 'unknown';
    const key = `${ip}:${req.path}`;
    const now = Date.now();
    const bucket = rateLimitBuckets.get(key);

    if (!bucket || bucket.resetAt <= now) {
      rateLimitBuckets.set(key, { count: 1, resetAt: now + options.windowMs });
      return next();
    }

    bucket.count += 1;
    if (bucket.count > options.max) {
      res.setHeader('Retry-After', Math.ceil((bucket.resetAt - now) / 1000).toString());
      return res.status(429).json({ error: 'Too many requests' });
    }

    return next();
  };
}

const authRateLimit = rateLimit({ windowMs: 60_000, max: 20 });
const aiRateLimit = rateLimit({ windowMs: 60_000, max: 30 });

const uploadDir = path.join(process.cwd(), 'server', 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${uuidv4()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: MAX_UPLOAD_SIZE_BYTES, files: 1 },
  fileFilter: (_req, file, cb) => {
    const allowed = file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/');
    cb(null, allowed);
  },
});

app.use('/uploads', express.static(uploadDir, { maxAge: '7d', immutable: true }));

initDB();

type DbUser = {
  id: string;
  name: string;
  email: string;
  password: string;
  role: 'Citizen' | 'Authority';
  points: number;
  avatar: string;
  joinedAt: string;
  streak: number;
  lastActiveDate: string;
  issuesReported: number;
  issuesVerified: number;
  commentsPosted: number;
};

type SafeUser = Omit<DbUser, 'password'> & { badges: unknown[] };

type DbIssue = {
  id: string;
  title: string;
  description: string;
  category: string;
  severity: string;
  status: string;
  lat: number;
  lng: number;
  address: string;
  imageUrl: string;
  videoUrl?: string | null;
  aiConfidence?: number | null;
  aiDescription?: string | null;
  department: string;
  upvotes: number;
  verifiedCount: number;
  isVerifiedByAuthority: number | boolean;
  reporterId: string;
  reporterName: string;
  reporterAvatar?: string | null;
  createdAt: string;
  resolvedAt?: string | null;
  resolvedNotes?: string | null;
  assignedTo?: string | null;
  estimatedResolutionDays?: number | null;
};

function badRequest(res: Response, error: string) {
  return res.status(400).json({ error });
}

function isNonEmptyString(value: unknown, maxLength = 500) {
  return typeof value === 'string' && value.trim().length > 0 && value.trim().length <= maxLength;
}

function requireString(value: unknown, field: string, maxLength = 500) {
  if (!isNonEmptyString(value, maxLength)) {
    throw new Error(`${field} is required`);
  }
  return (value as string).trim();
}

function isOneOf<T extends readonly string[]>(value: unknown, allowed: T): value is T[number] {
  return typeof value === 'string' && allowed.includes(value);
}

function parseFiniteNumber(value: unknown, field: string) {
  const numberValue = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(numberValue)) {
    throw new Error(`${field} must be a number`);
  }
  return numberValue;
}

function parseLocation(raw: unknown) {
  const location = typeof raw === 'string' ? JSON.parse(raw || '{}') : raw;
  if (!location || typeof location !== 'object') {
    throw new Error('location is required');
  }

  const candidate = location as { lat?: unknown; lng?: unknown; address?: unknown };
  const lat = parseFiniteNumber(candidate.lat, 'location.lat');
  const lng = parseFiniteNumber(candidate.lng, 'location.lng');
  const address = requireString(candidate.address, 'location.address', 300);

  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
    throw new Error('location coordinates are out of range');
  }

  return { lat, lng, address };
}

function getUserData(userId: string): SafeUser | null {
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId) as DbUser | undefined;
  if (!user) return null;
  const badges = db.prepare('SELECT * FROM badges WHERE userId = ?').all(userId);
  const { password: _password, ...safeUser } = user;
  return { ...safeUser, badges };
}

function getRequiredUser(req: AuthRequest, res: Response) {
  const user = getUserData(req.user!.id);
  if (!user) {
    res.status(404).json({ error: 'User not found' });
    return null;
  }
  return user;
}

function fetchIssueDetails(issueId: string) {
  const issue = db.prepare('SELECT * FROM issues WHERE id = ?').get(issueId) as DbIssue | undefined;
  if (!issue) return null;

  const { lat, lng, address, isVerifiedByAuthority, ...rest } = issue;
  const timeline = db.prepare('SELECT status, date, description, actor FROM timeline_events WHERE issueId = ? ORDER BY date ASC').all(issueId);
  const comments = db.prepare('SELECT * FROM comments WHERE issueId = ? ORDER BY createdAt ASC').all(issueId);
  const upvotedBy = db.prepare('SELECT userId FROM upvotes WHERE issueId = ?').all(issueId).map((row: any) => row.userId);
  const verifiedBy = db.prepare('SELECT userId FROM verifications WHERE issueId = ?').all(issueId).map((row: any) => row.userId);

  return {
    ...rest,
    location: { lat, lng, address },
    isVerifiedByAuthority: Boolean(isVerifiedByAuthority),
    timeline,
    comments,
    upvotedBy,
    verifiedBy,
  };
}

function getDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const earthRadiusMeters = 6371e3;
  const phi1 = lat1 * Math.PI / 180;
  const phi2 = lat2 * Math.PI / 180;
  const deltaPhi = (lat2 - lat1) * Math.PI / 180;
  const deltaLambda = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(deltaPhi / 2) ** 2 + Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return earthRadiusMeters * c;
}

function saveBase64Image(dataUrl: string) {
  const matches = dataUrl.match(/^data:(image\/(?:png|jpe?g|webp|gif));base64,(.+)$/i);
  if (!matches) return '';

  const extByMime: Record<string, string> = {
    'image/png': 'png',
    'image/jpeg': 'jpg',
    'image/jpg': 'jpg',
    'image/webp': 'webp',
    'image/gif': 'gif',
  };
  const ext = extByMime[matches[1].toLowerCase()];
  if (!ext) return '';

  const buffer = Buffer.from(matches[2], 'base64');
  if (buffer.length > MAX_UPLOAD_SIZE_BYTES) {
    throw new Error('Image exceeds the 8MB upload limit');
  }

  const filename = `${uuidv4()}.${ext}`;
  fs.writeFileSync(path.join(uploadDir, filename), buffer);
  return `/uploads/${filename}`;
}

let clients: Response[] = [];

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, ai: Boolean(ai), timestamp: new Date().toISOString() });
});

app.post('/api/auth/login', authRateLimit, (req, res) => {
  const email = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : '';
  const password = typeof req.body.password === 'string' ? req.body.password : '';
  if (!email || !password) return badRequest(res, 'Email and password are required');

  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email) as DbUser | undefined;
  if (!user || !bcrypt.compareSync(password, user.password)) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const today = new Date().toISOString().split('T')[0];
  if (user.lastActiveDate !== today) {
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    const newStreak = user.lastActiveDate === yesterday ? user.streak + 1 : 1;
    db.prepare('UPDATE users SET streak = ?, lastActiveDate = ? WHERE id = ?').run(newStreak, today, user.id);
  }

  const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
  res.json({ token, user: getUserData(user.id) });
});

app.post('/api/auth/register', authRateLimit, (req, res) => {
  try {
    const name = requireString(req.body.name, 'name', 80);
    const email = requireString(req.body.email, 'email', 120).toLowerCase();
    const password = requireString(req.body.password, 'password', 120);
    const role = isOneOf(req.body.role, USER_ROLES) ? req.body.role : 'Citizen';

    if (!/^\S+@\S+\.\S+$/.test(email)) return badRequest(res, 'A valid email is required');
    if (password.length < 6) return badRequest(res, 'Password must be at least 6 characters');

    const id = `user-${uuidv4()}`;
    const hash = bcrypt.hashSync(password, 10);
    const today = new Date().toISOString().split('T')[0];
    const avatar = `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}`;

    db.prepare(`
      INSERT INTO users (id, name, email, password, role, avatar, joinedAt, streak, lastActiveDate)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, name, email, hash, role, avatar, new Date().toISOString(), 1, today);

    const token = jwt.sign({ id, role }, JWT_SECRET, { expiresIn: '7d' });
    res.status(201).json({ token, user: getUserData(id) });
  } catch (err: any) {
    if (err.message?.includes('UNIQUE constraint failed')) {
      return res.status(400).json({ error: 'Email already exists' });
    }
    if (err.message?.includes('required')) return badRequest(res, err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

app.get('/api/auth/me', authMiddleware, (req: AuthRequest, res) => {
  const user = getRequiredUser(req, res);
  if (!user) return;
  res.json({ user });
});

app.get('/api/events', (_req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();
  clients.push(res);

  res.on('close', () => {
    clients = clients.filter((client) => client !== res);
  });
});

function broadcast(event: string, data: unknown) {
  clients.forEach((client) => client.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
}

app.get('/api/issues', (req, res) => {
  let query = 'SELECT id FROM issues WHERE 1=1';
  const params: string[] = [];

  if (typeof req.query.category === 'string') {
    query += ' AND category = ?';
    params.push(req.query.category);
  }
  if (isOneOf(req.query.severity, ISSUE_SEVERITIES)) {
    query += ' AND severity = ?';
    params.push(req.query.severity);
  }
  if (isOneOf(req.query.status, ISSUE_STATUSES)) {
    query += ' AND status = ?';
    params.push(req.query.status);
  }
  query += ' ORDER BY createdAt DESC';

  const issueIds = db.prepare(query).all(...params).map((row: any) => row.id);
  const issues = issueIds.map((id) => fetchIssueDetails(id)).filter(Boolean);
  res.json({ issues });
});

app.get('/api/issues/:id', (req, res) => {
  const issue = fetchIssueDetails(req.params.id);
  if (!issue) return res.status(404).json({ error: 'Issue not found' });
  res.json({ issue });
});

app.post('/api/issues', authMiddleware, upload.single('media'), (req: AuthRequest, res) => {
  try {
    const user = getRequiredUser(req, res);
    if (!user) return;

    const title = requireString(req.body.title, 'title', 140);
    const description = requireString(req.body.description, 'description', 2000);
    const category = requireString(req.body.category, 'category', 80);
    const severity = isOneOf(req.body.severity, ISSUE_SEVERITIES) ? req.body.severity : 'Medium';
    const department = requireString(req.body.department, 'department', 120);
    const aiDescription = typeof req.body.aiDescription === 'string' ? req.body.aiDescription.slice(0, 2000) : '';
    const aiConfidence = Math.max(0, Math.min(1, Number(req.body.aiConfidence || 0)));
    const loc = parseLocation(req.body.location);

    let imageUrl = '';
    if (req.file) {
      imageUrl = `/uploads/${req.file.filename}`;
    } else if (typeof req.body.imageUrl === 'string' && req.body.imageUrl.startsWith('data:')) {
      imageUrl = saveBase64Image(req.body.imageUrl);
    } else if (typeof req.body.imageUrl === 'string') {
      imageUrl = req.body.imageUrl.slice(0, 1000);
    }

    const id = `issue-${uuidv4()}`;
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO issues (id, title, description, category, severity, status, lat, lng, address, imageUrl, aiConfidence, aiDescription, department, reporterId, reporterName, reporterAvatar, createdAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, title, description, category, severity, 'Reported', loc.lat, loc.lng, loc.address, imageUrl, aiConfidence, aiDescription, department, user.id, user.name, user.avatar, now);

    db.prepare('INSERT INTO timeline_events (issueId, status, date, description, actor) VALUES (?, ?, ?, ?, ?)').run(id, 'Reported', now, 'Issue reported by citizen', user.name);
    db.prepare('UPDATE users SET issuesReported = issuesReported + 1, points = points + 10 WHERE id = ?').run(user.id);
    db.prepare('INSERT INTO upvotes (issueId, userId) VALUES (?, ?)').run(id, user.id);
    db.prepare('UPDATE issues SET upvotes = upvotes + 1 WHERE id = ?').run(id);

    broadcast('issue_updated', { id });
    res.status(201).json({ issue: fetchIssueDetails(id) });
  } catch (err: any) {
    if (err.message) return badRequest(res, err.message);
    res.status(500).json({ error: 'Failed to create issue' });
  }
});

app.put('/api/issues/:id/status', authMiddleware, (req: AuthRequest, res) => {
  const user = getRequiredUser(req, res);
  if (!user) return;
  if (user.role !== 'Authority') return res.status(403).json({ error: 'Forbidden' });
  if (!isOneOf(req.body.status, ISSUE_STATUSES)) return badRequest(res, 'Invalid status');
  if (!fetchIssueDetails(req.params.id)) return res.status(404).json({ error: 'Issue not found' });

  const { id } = req.params;
  const status = req.body.status;
  const notes = typeof req.body.notes === 'string' ? req.body.notes.trim().slice(0, 1000) : '';
  const now = new Date().toISOString();
  const isResolving = status === 'Resolved';

  db.prepare('UPDATE issues SET status = ?, resolvedAt = COALESCE(resolvedAt, ?), resolvedNotes = COALESCE(?, resolvedNotes) WHERE id = ?').run(status, isResolving ? now : null, notes || null, id);
  db.prepare('INSERT INTO timeline_events (issueId, status, date, description, actor) VALUES (?, ?, ?, ?, ?)').run(id, status, now, notes || `Status updated to ${status}`, user.name);

  broadcast('issue_updated', { id });
  res.json({ issue: fetchIssueDetails(id) });
});

app.post('/api/issues/:id/upvote', authMiddleware, (req: AuthRequest, res) => {
  const { id } = req.params;
  const userId = req.user!.id;
  const issue = db.prepare('SELECT upvotes FROM issues WHERE id = ?').get(id) as { upvotes: number } | undefined;
  if (!issue) return res.status(404).json({ error: 'Issue not found' });

  const existing = db.prepare('SELECT * FROM upvotes WHERE issueId = ? AND userId = ?').get(id, userId);
  let upvoted = false;

  if (existing) {
    db.prepare('DELETE FROM upvotes WHERE issueId = ? AND userId = ?').run(id, userId);
    db.prepare('UPDATE issues SET upvotes = MAX(upvotes - 1, 0) WHERE id = ?').run(id);
  } else {
    if (issue.upvotes === 0) {
      db.prepare('UPDATE users SET points = points + 5 WHERE id = ?').run(userId);
    }
    db.prepare('INSERT INTO upvotes (issueId, userId) VALUES (?, ?)').run(id, userId);
    db.prepare('UPDATE issues SET upvotes = upvotes + 1 WHERE id = ?').run(id);
    upvoted = true;
  }

  broadcast('issue_updated', { id });
  res.json({ issue: fetchIssueDetails(id), upvoted });
});

app.post('/api/issues/:id/verify', authMiddleware, (req: AuthRequest, res) => {
  const { id } = req.params;
  const user = getRequiredUser(req, res);
  if (!user) return;

  const issue = db.prepare('SELECT reporterId, lat, lng FROM issues WHERE id = ?').get(id) as { reporterId: string; lat: number; lng: number } | undefined;
  if (!issue) return res.status(404).json({ error: 'Issue not found' });
  if (issue.reporterId === user.id) return badRequest(res, 'Cannot verify own issue');

  const lat = req.body.lat === undefined ? undefined : parseFiniteNumber(req.body.lat, 'lat');
  const lng = req.body.lng === undefined ? undefined : parseFiniteNumber(req.body.lng, 'lng');
  if (lat !== undefined && lng !== undefined && user.role !== 'Authority') {
    const distance = getDistance(lat, lng, issue.lat, issue.lng);
    if (distance > 500) {
      return badRequest(res, `You are too far away to verify this issue. Distance: ${Math.round(distance)}m. Max allowed: 500m`);
    }
  }

  const existing = db.prepare('SELECT * FROM verifications WHERE issueId = ? AND userId = ?').get(id, user.id);
  if (existing) return badRequest(res, 'Already verified');

  db.prepare('INSERT INTO verifications (issueId, userId) VALUES (?, ?)').run(id, user.id);
  db.prepare('UPDATE issues SET verifiedCount = verifiedCount + 1, isVerifiedByAuthority = CASE WHEN ? = "Authority" THEN 1 ELSE isVerifiedByAuthority END WHERE id = ?').run(user.role, id);
  db.prepare('UPDATE users SET issuesVerified = issuesVerified + 1, points = points + 15 WHERE id = ?').run(user.id);

  broadcast('issue_updated', { id });
  res.json({ issue: fetchIssueDetails(id) });
});

app.post('/api/issues/:id/comments', authMiddleware, (req: AuthRequest, res) => {
  const user = getRequiredUser(req, res);
  if (!user) return;
  if (!fetchIssueDetails(req.params.id)) return res.status(404).json({ error: 'Issue not found' });

  const content = requireString(req.body.content, 'content', 1200);
  const commentId = `c-${uuidv4()}`;
  const now = new Date().toISOString();

  db.prepare('INSERT INTO comments (id, issueId, authorId, authorName, authorAvatar, content, createdAt, role) VALUES (?, ?, ?, ?, ?, ?, ?, ?)').run(commentId, req.params.id, user.id, user.name, user.avatar, content, now, user.role);
  db.prepare('UPDATE users SET commentsPosted = commentsPosted + 1, points = points + 3 WHERE id = ?').run(user.id);

  broadcast('issue_updated', { id: req.params.id });
  res.status(201).json({ comment: { id: commentId, authorId: user.id, authorName: user.name, authorAvatar: user.avatar, content, createdAt: now, role: user.role } });
});

app.get('/api/users/leaderboard', (_req, res) => {
  const users = db.prepare('SELECT * FROM users WHERE role = "Citizen" ORDER BY points DESC').all() as SafeUser[];
  const leaderboard = users.map((user, index) => {
    const badgeRow = db.prepare('SELECT COUNT(*) as count FROM badges WHERE userId = ?').get(user.id) as { count: number };
    return {
      userId: user.id,
      name: user.name,
      avatar: user.avatar,
      points: user.points,
      level: Math.floor(user.points / 100) + 1,
      issuesReported: user.issuesReported,
      issuesVerified: user.issuesVerified,
      badgeCount: badgeRow.count,
      rank: index + 1,
    };
  });
  res.json({ leaderboard });
});

app.get('/api/users/:id', (req, res) => {
  const user = getUserData(req.params.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json({ user });
});

app.post('/api/ai/analyze-image', authRateLimit, authMiddleware, aiRateLimit, async (req, res) => {
  const fallbackResponse = {
    category: 'Pothole',
    severity: 'High',
    title: 'Road Surface Deterioration Detected',
    description: 'AI analysis has detected significant road surface damage.',
    department: 'Roads & Infrastructure',
    confidence: 0.87,
    recommendations: ['Schedule road repair'],
  };

  const imageData = typeof req.body.imageData === 'string' ? req.body.imageData : '';
  const mimeType = typeof req.body.mimeType === 'string' ? req.body.mimeType : 'image/jpeg';
  if (!imageData) return badRequest(res, 'imageData is required');
  if (!ai) return res.json(fallbackResponse);

  try {
    const base64Data = imageData.split(',')[1] || imageData;
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [{
        role: 'user',
        parts: [
          { text: 'Analyze this image for civic issues and return a JSON object with category, severity, title, description, department, confidence, and recommendations array. Return ONLY JSON.' },
          { inlineData: { mimeType, data: base64Data } },
        ],
      }],
    });

    const text = response.text?.replace(/```json\n?|\n?```/g, '').trim() || '';
    res.json(JSON.parse(text));
  } catch {
    res.json(fallbackResponse);
  }
});

app.post('/api/ai/chat', aiRateLimit, async (req, res) => {
  let message = '';
  try {
    message = requireString(req.body.message, 'message', 2000);
  } catch (err: any) {
    return badRequest(res, err.message || 'message is required');
  }
  const context = req.body.context || {};
  const history = Array.isArray(req.body.history) ? req.body.history : [];
  if (!ai) return res.json({ text: `I'm the fallback AI. You said: ${message}` });

  try {
    const contents = [
      { role: 'user', parts: [{ text: `You are Community Hero AI. Context: ${JSON.stringify(context)}` }] },
      ...history.slice(-10).map((h: any) => ({ role: h.role === 'user' ? 'user' : 'model', parts: [{ text: String(h.text || h.content || '') }] })),
      { role: 'user', parts: [{ text: message }] },
    ];

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: contents as any,
    });

    res.json({ text: response.text || '' });
  } catch {
    res.json({ text: `I encountered an error. You said: ${message}` });
  }
});

app.post('/api/ai/insights', aiRateLimit, async (req, res) => {
  const { issues } = req.body;
  if (!ai || !issues || !Array.isArray(issues) || issues.length === 0) {
    return res.json({
      text: 'Predictive insights based on actual data.',
      insights: [{
        title: 'Rising Issue Trend',
        description: 'Certain categories are seeing an uptick.',
        confidence: 0.8,
        type: 'trend',
      }],
    });
  }

  try {
    const simplifiedIssues = issues.slice(0, 50).map((i: any) => ({
      c: i.category,
      s: i.severity,
      st: i.status,
      l: i.location?.address || 'Unknown',
      d: new Date(i.createdAt).toISOString().split('T')[0]
    }));

    const prompt = `Analyze this civic issue data (JSON format) and provide 3-4 predictive insights. 
Data: ${JSON.stringify(simplifiedIssues)}

Respond in valid JSON matching this schema:
{
  "text": "Overall summary of the data",
  "insights": [
    {
      "title": "Short catchy title",
      "description": "Clear explanation of the trend or insight",
      "type": "trend" | "hotspot" | "severity" | "resolution",
      "confidence": number between 0 and 1
    }
  ]
}
No markdown formatting, just pure JSON.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      }
    });

    const resultText = response.text || "{}";
    const parsed = JSON.parse(resultText);
    res.json(parsed);
  } catch (error) {
    console.error("Insights error:", error);
    res.json({
      text: 'Predictive insights based on actual data.',
      insights: [{
        title: 'System Notice',
        description: 'Unable to generate real-time insights right now.',
        confidence: 0.5,
        type: 'trend',
      }],
    });
  }
});

app.get('/api/notifications', authMiddleware, (req: AuthRequest, res) => {
  const notifications = db.prepare('SELECT * FROM notifications WHERE userId = ? ORDER BY createdAt DESC').all(req.user!.id).map((notification: any) => ({ ...notification, read: Boolean(notification.read) }));
  res.json({ notifications });
});

app.put('/api/notifications/:id/read', authMiddleware, (req: AuthRequest, res) => {
  db.prepare('UPDATE notifications SET read = 1 WHERE id = ? AND userId = ?').run(req.params.id, req.user!.id);
  res.json({ success: true });
});

app.put('/api/notifications/read-all', authMiddleware, (req: AuthRequest, res) => {
  db.prepare('UPDATE notifications SET read = 1 WHERE userId = ?').run(req.user!.id);
  res.json({ success: true });
});

app.post('/api/reset', authMiddleware, (req: AuthRequest, res) => {
  if (req.user!.role !== 'Authority') return res.status(403).json({ error: 'Forbidden' });
  resetDatabase();
  res.json({ success: true });
});

app.use('/api', (_req, res) => {
  res.status(404).json({ error: 'API route not found' });
});

app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  if (err instanceof multer.MulterError) {
    return res.status(400).json({ error: err.message });
  }
  if (err.message === 'Unsupported media type') {
    return res.status(400).json({ error: err.message });
  }
  console.error(err);
  return res.status(500).json({ error: 'Server error' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});