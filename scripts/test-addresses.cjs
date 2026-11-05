// Test address persistence using an in-memory repository, never real customer data.
const assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path'), Module = require('node:module'), ts = require('typescript');
let currentUser = { _id: 'owner' };
const record = { _id: 'owner', addresses: [] };
const User = { findOneAndUpdate(query, update) { return { select() { return { async lean() {
  if (query._id !== record._id) return null;
  const index = record.addresses.findIndex(a => a.id === query['addresses.id']);
  if (query['addresses.id'] && index < 0) return null;
  if (update.$push) {
    if (record.addresses.length >= 10) return null;
    record.addresses.push(update.$push.addresses);
  }
  if (update.$set) for (const [key,value] of Object.entries(update.$set)) record.addresses[index][key.replace('addresses.$.', '')] = value;
  if (update.$pull) record.addresses.splice(index, 1);
  return structuredClone(record);
} }; } }; } };
function loadRoute() {
  const filename = path.resolve('src/app/api/account/addresses/route.ts');
  const mod = new Module(filename, module); mod.paths = module.paths;
  const base = mod.require.bind(mod);
  mod.require = id => id === '@/models' ? { User } : id === '@/lib/authSession' ? { getCurrentUser: async () => currentUser } : base(id);
  mod._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText, filename);
  return mod.exports;
}
async function call(method, data) {
  const response = await loadRoute()[method](new Request('http://localhost/api/account/addresses', { method, body: JSON.stringify(data) }));
  return { status: response.status, data: await response.json() };
}
(async () => {
  const address = { label: 'Home', receiverName: 'Test', phone: '0900000000', address: 'Test street', province: 'Thành phố Hồ Chí Minh', isDefault: true };
  assert.equal((await call('POST', { ...address, province: '' })).status, 400);
  const saved = await call('POST', address);
  assert.equal(saved.status, 201);
  const id = saved.data.addresses[0].id;
  const edited = await call('PUT', { ...address, addressId: id, address: 'Updated street', province: 'Đà Nẵng', isDefault: false });
  assert.equal(edited.status, 200);
  assert.equal(record.addresses.length, 1);
  assert.equal(edited.data.addresses[0].id, id);
  assert.equal(record.addresses[0].address, 'Updated street');
  assert.equal(record.addresses[0].province, 'Đà Nẵng');
  assert.equal(record.addresses[0].isDefault, true);
  assert.equal((await call('PUT', { ...address, addressId: id, phone: 'bad' })).status, 400);
  assert.equal(record.addresses[0].province, 'Đà Nẵng');
  currentUser = { _id: 'another-owner' };
  assert.equal((await call('PUT', { ...address, addressId: id })).status, 404);
  currentUser = null;
  assert.equal((await call('PUT', { ...address, addressId: id })).status, 401);
  currentUser = { _id: 'owner' };
  assert.equal(record.addresses.length, 1, 'Stored across independently loaded route instances');
  assert.equal((await call('DELETE', { addressId: id })).status, 200);
  assert.equal(record.addresses.length, 0);
  console.log('Address tests passed: save, edit in place, persistence, province, validation, ownership and explicit delete.');
})().catch(error => { console.error(error); process.exitCode = 1; });
