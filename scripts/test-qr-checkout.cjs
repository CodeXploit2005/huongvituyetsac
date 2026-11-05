// Exercise the real route with an in-memory database; never create customer orders.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const ts = require('typescript');
process.env.AUTH_SECRET = 'test-only-qr-checkout-secret';
const rows = new Map();
let user = { _id: 'test-user' };
const product = { _id: 'product-1', name: { vi: 'Test', en: 'Test' }, images: ['/file.svg'], price: 33000, shippingFee: 5000 };
function load(relative, mocks = {}) {
  const filename = path.resolve(relative);
  const mod = new Module(filename, module);
  mod.paths = module.paths;
  const base = mod.require.bind(mod);
  mod.require = id => id in mocks ? mocks[id] : base(id);
  mod._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true } }).outputText, filename);
  return mod.exports;
}
const tokens = load('src/lib/checkoutToken.ts');
const Order = {
  async create(data) { const row = { ...data, _id: `saved-${rows.size}` }; rows.set(data.orderCode, row); return row; },
  async findOneAndUpdate(query, update) {
    if (!rows.has(query.orderCode)) await this.create(update.$setOnInsert);
    return rows.get(query.orderCode);
  },
};
const api = load('src/app/api/orders/route.ts', {
  '@/lib/mongodb': { connectDB: async () => {} },
  '@/lib/authSession': { getCurrentUser: async () => user, getCurrentAdmin: async () => null },
  '@/lib/checkoutToken': tokens,
  '@/models': { Order, Product: { collection: { findOne: async () => product } }, Coupon: {} },
});
const post = async body => {
  const response = await api.POST(new Request('http://localhost/api/orders', { method: 'POST', body: JSON.stringify(body) }));
  return { status: response.status, data: await response.json() };
};
const checkout = { customerName: 'Test', phone: '0900000000', email: 'test@example.invalid', address: 'Test address', province: 'Test', paymentMethod: 'vietqr', items: [{ productId: 'product-1', quantity: 2 }], total: 1, status: 'confirmed', paymentStatus: 'paid' };
(async () => {
  const draft = await post(checkout);
  assert.equal(draft.status, 200);
  assert.equal(draft.data.total, 71000, 'Server calculates prices rather than trusting the cart');
  assert.ok(draft.data.checkoutToken);
  assert.equal(rows.size, 0, 'Opening QR and abandoning it must not persist any order');
  const confirm = { checkoutToken: draft.data.checkoutToken, total: 1, paymentStatus: 'paid' };
  user = null;
  assert.equal((await post(confirm)).status, 401);
  user = { _id: 'another-user' };
  assert.equal((await post(confirm)).status, 400);
  user = { _id: 'test-user' };
  const [payload, mac] = confirm.checkoutToken.split('.');
  const altered = JSON.parse(Buffer.from(payload, 'base64url'));
  altered.order.total = 1;
  assert.equal((await post({ checkoutToken: Buffer.from(JSON.stringify(altered)).toString('base64url') + '.' + mac })).status, 400);
  assert.equal((await post({ checkoutToken: tokens.signCheckout(altered.order, Date.now() - 1) })).status, 400);
  assert.equal(rows.size, 0);
  const saved = await post(confirm);
  assert.equal(saved.status, 201);
  assert.equal(saved.data.total, 71000);
  assert.equal(saved.data.paymentStatus, 'unpaid');
  assert.equal(saved.data.status, 'pending');
  assert.equal(saved.data.orderCode, draft.data.orderCode, 'Transfer reference stays unchanged');
  const repeated = await post(confirm);
  assert.equal(repeated.data._id, saved.data._id);
  assert.equal(rows.size, 1, 'Retry does not create a duplicate');
  const cod = await post({ ...checkout, paymentMethod: 'cod' });
  assert.equal(cod.status, 201);
  assert.equal(rows.size, 2, 'COD still saves immediately');
  assert.equal((await post({ ...checkout, items: [] })).status, 400);
  console.log('QR checkout: quote, abandonment, confirmation, retry, authorization, tampering, expiry and COD passed.');
})().catch(error => { console.error(error); process.exitCode = 1; });
