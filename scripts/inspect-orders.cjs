const { MongoClient } = require('mongodb');
const timer = setTimeout(() => { console.error('Database connection timed out'); process.exit(2); }, 25000);
(async () => {
 const client = new MongoClient(process.env.MONGODB_URI, {serverSelectionTimeoutMS:8000, connectTimeoutMS:8000});
 try {
  await client.connect();
  const db=client.db();
  const orders=await db.collection('orders').find({}, {projection:{_id:1,orderCode:1,createdAt:1,isArchived:1,status:1}}).sort({createdAt:-1}).toArray();
  console.log(JSON.stringify({database:db.databaseName,count:orders.length,orders},null,2));
 } finally { await client.close(); clearTimeout(timer); }
})().catch(error=>{console.error(error.name+': database inspection failed');process.exitCode=1;});
