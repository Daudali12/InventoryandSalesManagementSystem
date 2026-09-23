const test = require('node:test');
const assert = require('node:assert/strict');
const express = require('express');
const cors = require('cors');
const { createCorsOptions } = require('../config/cors');

async function serverFor(t, env) {
  const app = express();
  app.use(cors(createCorsOptions(env)));
  app.post('/login', (req, res) => res.json({ reachedLogin: true }));
  app.use((error, req, res, next) => res.status(error.status || 500).json({ message: error.message }));
  const server = app.listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));
  t.after(() => new Promise(resolve => server.close(resolve)));
  return `http://127.0.0.1:${server.address().port}`;
}

test('development permits loopback origins on changed Vite ports, including preflight', async t => {
  const base = await serverFor(t, {});
  for (const origin of ['http://localhost:5175', 'http://127.0.0.1:5174', 'http://[::1]:5173', 'http://localhost']) {
    const preflight = await fetch(`${base}/login`, { method: 'OPTIONS', headers: { Origin: origin, 'Access-Control-Request-Method': 'POST', 'Access-Control-Request-Headers': 'content-type,authorization' } });
    assert.equal(preflight.status, 204);
    assert.equal(preflight.headers.get('access-control-allow-origin'), origin);
    const response = await fetch(`${base}/login`, { method: 'POST', headers: { Origin: origin } });
    assert.equal(response.status, 200);
  }
});

test('production allows configured and same-origin requests but rejects unrelated origins', async t => {
  const base = await serverFor(t, { NODE_ENV: 'production', CORS_ORIGIN: ' https://store.example/ ', FRONTEND_URL: 'https://shop.example' });
  for (const origin of [base, 'https://store.example', 'https://shop.example']) {
    assert.equal((await fetch(`${base}/login`, { method: 'POST', headers: { Origin: origin } })).status, 200);
  }
  for (const origin of ['http://localhost:5175', 'https://unrelated.example', 'http://localhost.evil.example', 'null']) {
    const response = await fetch(`${base}/login`, { method: 'POST', headers: { Origin: origin } });
    assert.equal(response.status, 403);
    assert.equal(response.headers.get('access-control-allow-origin'), null);
  }
});
