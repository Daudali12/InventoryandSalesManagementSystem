require('dotenv').config();
const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const { prisma } = require('../config/db');
const { chromium } = require(process.env.PLAYWRIGHT_PATH || 'C:/Users/DELL/AppData/Local/ms-playwright-go/1.57.0/package');
const origin = process.env.TEST_ORIGIN || 'http://127.0.0.1:5173';
const email = `signup-${randomUUID()}@example.test`;
const password = `Test-${randomUUID()}`;
async function post(path, data) {
  return fetch(`${origin}/api/auth/${path}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
}
(async () => {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  try {
    assert.equal((await post('signup', { name: 'Test', email: 'invalid', password })).status, 400);
    const page = await browser.newPage();
    await page.goto(`${origin}/login`);
    await page.getByRole('button', { name: 'Create an account', exact: true }).click();
    await page.getByLabel('Full name').fill('Signup verification');
    await page.getByLabel('Email address').fill(email);
    await page.getByLabel('Password', { exact: true }).fill(password);
    await page.getByRole('button', { name: 'Create account', exact: true }).click();
    await page.waitForURL('**/dashboard');
    await page.waitForLoadState('networkidle');
    await page.reload();
    await page.waitForLoadState('networkidle');
    assert.ok(page.url().endsWith('/dashboard'));
    const user = await prisma.user.findUnique({ where: { email } });
    assert.equal(user.role, 'STAFF');
    assert.notEqual(user.passwordHash, password);
    assert.equal((await post('signup', { name: 'Duplicate', email: email.toUpperCase(), password, role: 'ADMIN' })).status, 409);
    assert.equal((await post('login', { email, password: 'wrong-password' })).status, 401);
    const login = await post('login', { email: email.toUpperCase(), password });
    assert.equal(login.status, 200);
    const data = await login.json();
    assert.equal(data.user.role, 'STAFF');
    assert.equal(data.user.passwordHash, undefined);
    const restricted = await fetch(`${origin}/api/users`, { headers: { Authorization: `Bearer ${data.accessToken}` } });
    assert.equal(restricted.status, 403);
    await page.evaluate(() => localStorage.clear());
    await page.goto(`${origin}/login`);
    await page.getByLabel('Email address').fill(email);
    await page.getByLabel('Password', { exact: true }).fill(password);
    await page.getByRole('button', { name: 'Sign in as Admin', exact: true }).click();
    await page.waitForURL('**/dashboard');
    console.log('PASS: signup, session reload, subsequent browser login, duplicate email, invalid input/password, and admin restriction.');
  } finally {
    await browser.close();
    await prisma.user.deleteMany({ where: { email } });
    await prisma.$disconnect();
  }
})().catch(error => { console.error(error.message); process.exitCode = 1; });
