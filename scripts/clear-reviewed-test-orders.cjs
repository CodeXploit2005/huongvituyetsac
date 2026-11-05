// One-time reset of the 23 test orders explicitly reviewed on 2026-09-13.
// Never selects new orders or changes products, users, coupons or reviews.
const { MongoClient, ObjectId, BSON } = require('mongodb');
const fs = require('node:fs');
const path = require('node:path');
const ids = [
 '6a9eb7230593c3f310580399','6a9eb6ad0593c3f310580398','6a99ae8b13df355bb96dbc03',
 '6a99ab1f4bc0ae1a129862f3','6a99aaf64bc0ae1a129862f2','6a999049a640346009b22ab6',
 '6a99901ca640346009b22ab5','6a997e77a640346009b22ab4','6a9849cead22061e7e1aaeb4',
 '6a9846f2ad22061e7e1aaeb3','6a98446dad22061e7e1aaeb2','6a98445aad22061e7e1aaeb1',
 '6a984447ad22061e7e1aaeb0','6a983a3bad22061e7e1aaeaf','6a983711ad22061e7e1aaeae',
 '6a97e681ad22061e7e1aaead','6a97d4f1ad22061e7e1aaea9','6a97bbacad22061e7e1aaea8',
 '6a97bb88ad22061e7e1aaea7','6a97bb53ad22061e7e1aaea6','6a97b245ad22061e7e1aaea5',
 '6a97ac17ad22061e7e1aaea4','6a96f67bad22061e7e1aaea2'
].map(id => new ObjectId(id));
async function main() {
 const client = new MongoClient(process.env.MONGODB_URI, {serverSelectionTimeoutMS:8000,connectTimeoutMS:8000});
 try {
  await client.connect();
  const db = client.db();
  if (db.databaseName !== 'huongvituyetsac') throw new Error('Unexpected database; no changes made');
  const orders = db.collection('orders');
  const filter = {_id: {$in: ids}};
  const snapshot = await orders.find(filter).toArray();
  if (snapshot.length !== 23) throw new Error('Reviewed order count changed; no changes made');
  const backupDir = path.resolve(__dirname, '../.local-order-cleanup');
  fs.mkdirSync(backupDir, {recursive:true});
  const backup = path.join(backupDir, 'test-orders-2026-09-13.ejson');
  fs.writeFileSync(backup, BSON.EJSON.stringify({database:db.databaseName,backedUpAt:new Date(),orders:snapshot},null,2,{relaxed:false}), {flag:'wx'});
  const saved = BSON.EJSON.parse(fs.readFileSync(backup,'utf8'));
  if (saved.orders.length !== snapshot.length) throw new Error('Backup verification failed; no changes made');
  if (process.argv[2] !== '--apply') {console.log('Backup saved. No deletion without --apply.');return;}
  const result = await orders.deleteMany(filter);
  const remainingSelected = await orders.countDocuments(filter);
  const remainingAll = await orders.countDocuments({});
  const revenue = await orders.aggregate([{$match:{paymentStatus:'paid',status:{$ne:'cancelled'}}},{$group:{_id:null,total:{$sum:'$total'}}}]).next();
  const report = {completedAt:new Date().toISOString(),deleted:result.deletedCount,remainingSelected,remainingAll,revenue:revenue?.total||0,backup};
  fs.writeFileSync(path.join(backupDir,'cleanup-result.json'), JSON.stringify(report,null,2));
  console.log(JSON.stringify(report,null,2));
  if (remainingSelected!==0 || result.deletedCount!==23) throw new Error('Cleanup count mismatch; inspect report');
 } finally {await client.close();}
}
main().catch(error=>{console.error(error.message.includes('mongodb')?'Database operation failed':error.message);process.exitCode=1;});
