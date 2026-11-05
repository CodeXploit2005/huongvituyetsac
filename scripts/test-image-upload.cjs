const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

// Exercise the real handler with isolated authentication and provider boundaries.
function load(relative, dependencies = {}) {
  const filename = path.join(__dirname, '..', relative);
  const source = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const module = { exports: {} };
  new Function('require', 'module', 'exports', source)(name => {
    if (!(name in dependencies)) throw new Error(`Unexpected dependency: ${name}`);
    return dependencies[name];
  }, module, module.exports);
  return module.exports;
}

const validation = load('src/lib/imageUpload.ts');
let user = null;
let providerFails = false;
let calls = 0;
const { POST } = load('src/app/api/upload/route.ts', {
  '@/lib/authSession': { getCurrentUser: async () => user },
  '@/lib/imageUpload': validation,
  '@/lib/cloudinary': { uploadImage: async (bytes, target) => {
    calls++;
    assert.equal(target, user.role === 'admin' ? 'products' : 'reviews');
    assert.ok(bytes.length > 0);
    if (providerFails) throw new Error('Private provider error');
    return { secure_url: 'https://res.cloudinary.com/test/image/upload/test.png', public_id: 'test' };
  } },
});
const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=', 'base64');
function request(target = 'products', bytes = png, type = 'image/png', duplicate = false) {
  const form = new FormData();
  form.append('target', target);
  form.append('file', new File([bytes], 'photo.png', { type }));
  if (duplicate) form.append('file', new File([bytes], 'second.png', { type }));
  return new Request('http://localhost/api/upload', { method: 'POST', body: form });
}
async function main() {
  assert.equal((await POST(request())).status, 401);
  user = { role: 'user' };
  assert.equal((await POST(request())).status, 403);
  assert.equal((await POST(request('reviews'))).status, 201);
  user = { role: 'admin' };
  const success = await POST(request());
  assert.equal(success.status, 201);
  assert.deepEqual(await success.json(), { success: true, url: 'https://res.cloudinary.com/test/image/upload/test.png', publicId: 'test' });
  assert.equal((await POST(request('invalid'))).status, 400);
  assert.equal((await POST(request('products', Buffer.from('fake image')))).status, 400);
  assert.equal((await POST(request('products', png, 'text/plain'))).status, 400);
  assert.equal((await POST(request('products', Buffer.alloc(0)))).status, 400);
  assert.equal((await POST(request('products', png, 'image/png', true))).status, 400);
  assert.equal((await POST(request('products', Buffer.alloc(validation.MAX_IMAGE_BYTES + 1)))).status, 413);
  const malformed = new Request('http://localhost/api/upload', { method: 'POST', headers: { 'content-type': 'multipart/form-data; boundary=missing' }, body: 'broken' });
  assert.equal((await POST(malformed)).status, 400);
  assert.equal(calls, 2, 'Invalid requests must never reach Cloudinary');
  providerFails = true;
  const failed = await POST(request());
  assert.equal(failed.status, 503);
  assert.ok(!(await failed.text()).includes('Private provider error'));
  console.log('PASS: upload authentication, roles, success, type/signature/size validation, malformed data and private provider errors.');
}
module.exports = { load };
if (require.main === module) main().catch(error => { console.error(error); process.exitCode = 1; });
