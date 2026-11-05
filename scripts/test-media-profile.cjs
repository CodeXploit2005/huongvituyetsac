const assert = require('node:assert/strict');
const { load } = require('./test-image-upload.cjs');
const media = load('src/lib/mediaUpload.ts');
const image = load('src/lib/imageUpload.ts');
process.env.CLOUDINARY_CLOUD_NAME = 'test-cloud';
process.env.CLOUDINARY_API_SECRET = 'test-only-secret';
process.env.CLOUDINARY_API_KEY = 'test-key';
let user = null;
let savedAvatar;
let providerError = false;
let destroyed = false;
let asset = {};
const uuid = '11111111-1111-4111-8111-111111111111';
const client = {
  utils: { api_sign_request: params => { assert.equal(params.overwrite, false); return 'signed'; } },
  api: { resource: async () => { if (providerError) throw new Error('Private provider error'); return asset; } },
  uploader: { destroy: async () => { destroyed = true; } },
};
const auth = { getCurrentUser: async () => user };
const video = load('src/app/api/upload/video/route.ts', {
  'node:crypto': { randomUUID: () => uuid },
  '@/lib/authSession': auth, '@/lib/cloudinary': { getCloudinary: () => client }, '@/lib/mediaUpload': media,
});
const avatar = load('src/app/api/account/avatar/route.ts', {
  '@/lib/authSession': auth, '@/lib/mediaUpload': media,
  '@/models': { User: { findByIdAndUpdate: (id, update) => {
    assert.equal(id, 'user-a');
    assert.deepEqual(Object.keys(update.$set), ['avatar']);
    savedAvatar = update.$set.avatar;
    return { select: () => ({ lean: async () => ({ avatar: savedAvatar }) }) };
  } } },
});
const request = (body, method = 'POST') => new Request('http://localhost/api/test', { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
const cloudUrl = (kind, folder) => `https://res.cloudinary.com/test-cloud/${kind}/upload/v123/huongvituyetsac/${folder}/test.${kind === 'video' ? 'mp4' : 'png'}`;

async function main() {
  assert.equal(media.validateVideoFile({ type: 'video/mp4', size: 1 }), null);
  assert.ok(media.validateVideoFile({ type: 'image/png', size: 1 }));
  assert.ok(media.validateVideoFile({ type: 'video/mp4', size: media.MAX_VIDEO_BYTES + 1 }));
  assert.ok(!media.isCloudinaryMediaUrl('https://evil.test/test.png', 'test-cloud', 'image', 'avatars/user-a'));
  assert.equal((await video.POST(request({}))).status, 401);
  assert.equal((await avatar.PATCH(request({ avatar: null }, 'PATCH'))).status, 401);
  user = { _id: 'user-a', role: 'user' };
  const valid = { target: 'reviews', type: 'video/mp4', size: 1024 };
  assert.equal((await video.POST(request({ ...valid, target: 'products' }))).status, 403);
  assert.equal((await video.POST(request({ ...valid, target: 'avatars' }))).status, 400);
  assert.equal((await video.POST(request({ ...valid, size: -1 }))).status, 400);
  const signed = await (await video.POST(request(valid))).json();
  assert.equal(signed.params.public_id, `huongvituyetsac/reviews/user-a/${uuid}`);
  assert.ok(!JSON.stringify(signed).includes(process.env.CLOUDINARY_API_SECRET));
  const complete = { target: 'reviews', publicId: signed.params.public_id };
  assert.equal((await video.PATCH(request({ ...complete, publicId: complete.publicId.replace('user-a', 'user-b') }, 'PATCH'))).status, 400);
  asset = { resource_type: 'video', width: 320, height: 240, bytes: 1024, format: 'mp4', secure_url: cloudUrl('video', 'reviews/user-a'), public_id: complete.publicId };
  assert.equal((await video.PATCH(request(complete, 'PATCH'))).status, 200);
  asset.bytes = media.MAX_VIDEO_BYTES + 1;
  assert.equal((await video.PATCH(request(complete, 'PATCH'))).status, 400);
  assert.ok(destroyed);
  providerError = true;
  const failed = await video.PATCH(request(complete, 'PATCH'));
  assert.equal(failed.status, 503);
  assert.ok(!(await failed.text()).includes('Private provider error'));
  assert.equal((await avatar.PATCH(request({ avatar: cloudUrl('image', 'avatars/user-b') }, 'PATCH'))).status, 400);
  assert.equal((await avatar.PATCH(request({ avatar: cloudUrl('video', 'avatars/user-a') }, 'PATCH'))).status, 400);
  const ownAvatar = cloudUrl('image', 'avatars/user-a');
  assert.equal((await avatar.PATCH(request({ avatar: ownAvatar, id: 'user-b', role: 'admin' }, 'PATCH'))).status, 200);
  assert.equal(savedAvatar, ownAvatar);
  assert.equal((await avatar.PATCH(request({ avatar: null }, 'PATCH'))).status, 200);
  assert.equal(savedAvatar, null);

  let uploadOwner;
  const imageRoute = load('src/app/api/upload/route.ts', {
    '@/lib/authSession': auth, '@/lib/imageUpload': image,
    '@/lib/cloudinary': { uploadImage: async (_bytes, target, owner) => { assert.equal(target, 'avatars'); uploadOwner = owner; return { secure_url: ownAvatar, public_id: 'avatar' }; } },
  });
  const form = new FormData(); form.append('target', 'avatars');
  form.append('file', new File([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10, 0])], 'avatar.png', { type: 'image/png' }));
  assert.equal((await imageRoute.POST(new Request('http://localhost/api/upload', { method: 'POST', body: form }))).status, 201);
  assert.equal(uploadOwner, 'user-a');

  let savedReview;
  const reviews = load('src/app/api/reviews/route.ts', {
    'next/server': { NextResponse: Response }, '@/lib/authSession': auth,
    '@/lib/mongodb': { connectDB: async () => {} }, '@/lib/mediaUpload': media,
    '@/models': { Review: { create: async data => { savedReview = data; return data; } } },
  });
  const review = { productId: 'product-a', rating: 5, comment: 'Test', images: [], videos: [cloudUrl('video', 'reviews/user-a')] };
  assert.equal((await reviews.POST(request(review))).status, 201);
  assert.deepEqual(savedReview.videos, review.videos);
  assert.equal((await reviews.POST(request({ ...review, videos: [review.videos[0], review.videos[0]] }))).status, 400);
  assert.equal((await reviews.POST(request({ ...review, videos: [cloudUrl('video', 'reviews/user-b')] }))).status, 400);
  assert.equal((await reviews.POST(request({ ...review, videos: undefined }))).status, 201);
  assert.deepEqual(savedReview.videos, []);
  console.log('PASS: video signing, limits, ownership, completion, provider failure; avatar upload/save/reset; review video persistence and backward compatibility.');
}
main().catch(error => { console.error(error); process.exitCode = 1; });
