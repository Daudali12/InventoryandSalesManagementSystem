const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const ts = require('typescript');
const filename = path.resolve(__dirname, '../src/features/auth/response.ts');
const compiled = ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } });
const responseModule = new Module(filename, module);
responseModule._compile(compiled.outputText, filename);
const { parseAuthResponse, parseProfileResponse, parseTokenResponse } = responseModule.exports;
const user = { id: 'test-id', name: 'Test user', email: 'test@example.test', role: 'ADMIN' };
const session = { user, accessToken: 'access', refreshToken: 'refresh' };

test('accepts the original nested login response without undefined user.role', () => {
  const result = parseAuthResponse({ success: true, data: session });
  assert.equal(result.user.role, 'ADMIN');
  assert.deepEqual(result, session);
});
test('accepts top-level login responses and legacy token field', () => {
  assert.deepEqual(parseAuthResponse({ success: true, ...session }), session);
  assert.deepEqual(parseAuthResponse({ data: { user, token: 'access', refreshToken: 'refresh' } }), session);
});
test('rejects incomplete authentication before it reaches the role selector or store', () => {
  for (const value of [undefined, null, {}, { data: {} }, { ...session, user: undefined }, { ...session, refreshToken: undefined }, { ...session, user: { ...user, role: 'UNKNOWN' } }]) {
    assert.throws(() => parseAuthResponse(value), /incomplete login response/);
  }
});
test('profile accepts current and legacy envelopes, but rejects missing users', () => {
  for (const value of [{ user }, { data: user }, { data: { user } }]) assert.deepEqual(parseProfileResponse(value), user);
  assert.throws(() => parseProfileResponse({ success: true }), /session could not be verified/);
});

test('refresh validates both tokens before replacing a working session', () => {
  assert.deepEqual(parseTokenResponse({data:{accessToken:'next-access',refreshToken:'next-refresh'}}), {accessToken:'next-access',refreshToken:'next-refresh'});
  for (const value of [null, {}, {accessToken:'only-access'}, {accessToken:'',refreshToken:'refresh'}]) assert.throws(() => parseTokenResponse(value), /renew your session/);
});
