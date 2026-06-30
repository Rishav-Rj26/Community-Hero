import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import net from 'node:net';
import path from 'node:path';
import test from 'node:test';

const rootDir = process.cwd();
const tempDir = path.join(rootDir, '.tmp-tests');
fs.mkdirSync(tempDir, { recursive: true });

function getFreePort() {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.on('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const address = server.address();
      const port = typeof address === 'object' && address ? address.port : 0;
      server.close(() => resolve(port));
    });
  });
}

async function waitForHealth(baseUrl, child, output) {
  for (let attempt = 0; attempt < 40; attempt += 1) {
    if (child.exitCode !== null) {
      throw new Error(`Server exited early with code ${child.exitCode}\n${output()}`);
    }

    try {
      const response = await fetch(`${baseUrl}/api/health`);
      if (response.ok) return;
    } catch {
      // Server is still booting.
    }

    await new Promise((resolve) => setTimeout(resolve, 250));
  }

  throw new Error(`Timed out waiting for API health\n${output()}`);
}

async function startServer() {
  const port = await getFreePort();
  const dbPath = path.join(tempDir, `community-hero-${process.pid}-${Date.now()}.db`);
  const command = process.platform === 'win32' ? 'npm.cmd' : 'npm';
  const child = spawn(command, ['exec', 'tsx', 'server/index.ts'], {
    cwd: rootDir,
    env: {
      ...process.env,
      DATABASE_PATH: dbPath,
      SERVER_PORT: String(port),
      JWT_SECRET: 'test-secret',
      GEMINI_API_KEY: '',
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  let stdout = '';
  let stderr = '';
  child.stdout.on('data', (chunk) => { stdout += chunk.toString(); });
  child.stderr.on('data', (chunk) => { stderr += chunk.toString(); });

  const baseUrl = `http://127.0.0.1:${port}`;
  await waitForHealth(baseUrl, child, () => `${stdout}\n${stderr}`);

  return {
    baseUrl,
    dbPath,
    output: () => `${stdout}\n${stderr}`,
    async stop() {
      if (child.exitCode === null) {
        child.kill();
        await new Promise((resolve) => child.once('exit', resolve));
      }
      for (const suffix of ['', '-shm', '-wal']) {
        fs.rmSync(`${dbPath}${suffix}`, { force: true });
      }
    },
  };
}

async function request(baseUrl, pathName, options = {}) {
  const response = await fetch(`${baseUrl}${pathName}`, {
    ...options,
    headers: {
      ...(options.body && !(options.body instanceof FormData) ? { 'content-type': 'application/json' } : {}),
      ...(options.headers || {}),
    },
  });
  const text = await response.text();
  const body = text ? JSON.parse(text) : null;
  return { response, body };
}

test('API starts with security headers and seeded issues', async () => {
  const server = await startServer();
  try {
    const health = await fetch(`${server.baseUrl}/api/health`);
    assert.equal(health.status, 200);
    assert.equal(health.headers.get('x-powered-by'), null);
    assert.equal(health.headers.get('x-frame-options'), 'DENY');
    assert.equal(health.headers.get('x-content-type-options'), 'nosniff');

    const { response, body } = await request(server.baseUrl, '/api/issues');
    assert.equal(response.status, 200);
    assert.equal(body.issues.length, 4);
  } finally {
    await server.stop();
  }
});

test('auth validates input and returns safe user payloads', async () => {
  const server = await startServer();
  try {
    const invalid = await request(server.baseUrl, '/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name: 'Bad Email', email: 'not-an-email', password: 'secret1', role: 'Citizen' }),
    });
    assert.equal(invalid.response.status, 400);

    const login = await request(server.baseUrl, '/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'alex@hero.com', password: 'hero123' }),
    });
    assert.equal(login.response.status, 200);
    assert.equal(typeof login.body.token, 'string');
    assert.equal(login.body.user.email, 'alex@hero.com');
    assert.equal('password' in login.body.user, false);
  } finally {
    await server.stop();
  }
});

test('issue lifecycle enforces auth, validation, and authority status changes', async () => {
  const server = await startServer();
  try {
    const unauthorized = await request(server.baseUrl, '/api/issues', {
      method: 'POST',
      body: JSON.stringify({ title: 'Nope' }),
    });
    assert.equal(unauthorized.response.status, 401);

    const citizenLogin = await request(server.baseUrl, '/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'alex@hero.com', password: 'hero123' }),
    });
    const citizenToken = citizenLogin.body.token;

    const created = await request(server.baseUrl, '/api/issues', {
      method: 'POST',
      headers: { authorization: `Bearer ${citizenToken}` },
      body: JSON.stringify({
        title: 'Loose manhole cover',
        description: 'A loose manhole cover is rattling loudly and may shift into traffic.',
        category: 'Road Damage',
        severity: 'High',
        department: 'Roads & Infrastructure',
        aiConfidence: 0.73,
        aiDescription: 'Possible road hazard requiring inspection.',
        imageUrl: 'https://picsum.photos/seed/manhole/800/500',
        location: { lat: 24.28, lng: 86.64, address: 'Central Road, Madhupur' },
      }),
    });
    assert.equal(created.response.status, 201);
    assert.equal(created.body.issue.title, 'Loose manhole cover');
    assert.equal(created.body.issue.upvotes, 1);

    const selfVerify = await request(server.baseUrl, `/api/issues/${created.body.issue.id}/verify`, {
      method: 'POST',
      headers: { authorization: `Bearer ${citizenToken}` },
      body: JSON.stringify({ lat: 24.28, lng: 86.64 }),
    });
    assert.equal(selfVerify.response.status, 400);

    const authorityLogin = await request(server.baseUrl, '/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'admin@hero.com', password: 'admin123' }),
    });
    const authorityToken = authorityLogin.body.token;

    const statusUpdate = await request(server.baseUrl, `/api/issues/${created.body.issue.id}/status`, {
      method: 'PUT',
      headers: { authorization: `Bearer ${authorityToken}` },
      body: JSON.stringify({ status: 'Resolved', notes: 'Crew repaired and secured the cover.' }),
    });
    assert.equal(statusUpdate.response.status, 200);
    assert.equal(statusUpdate.body.issue.status, 'Resolved');
    assert.equal(statusUpdate.body.issue.resolvedNotes, 'Crew repaired and secured the cover.');
  } finally {
    await server.stop();
  }
});