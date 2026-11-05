import mongoose from "mongoose";

const uri = process.env.MONGODB_URI;
if (!uri) throw new Error("MONGODB_URI is missing");
await mongoose.connect(uri);
const orders = mongoose.connection.collection("orders");
const now = new Date();
const revenueBefore = await orders.aggregate([{ $match: { status: { $ne: "cancelled" } } }, { $group: { _id: null, total: { $sum: "$total" } } }]).next();
const result = await orders.updateMany(
  { $or: [{ isArchived: { $exists: false } }, { statusChangedAt: { $exists: false } }, { paymentStatus: { $exists: false } }] },
  [{ $set: { isArchived: { $ifNull: ["$isArchived", false] }, archivedAt: { $ifNull: ["$archivedAt", null] }, statusChangedAt: { $ifNull: ["$statusChangedAt", { $ifNull: ["$updatedAt", { $ifNull: ["$createdAt", now] }] }] }, paymentStatus: { $ifNull: ["$paymentStatus", { $cond: [{ $ne: [{ $ifNull: ["$paidAt", null] }, null] }, "paid", "unpaid"] }] } } }]
);
await Promise.all([
  orders.createIndex({ isArchived: 1, createdAt: -1 }, { name: "isArchived_1_createdAt_-1" }),
  orders.createIndex({ userId: 1, createdAt: -1 }, { name: "userId_1_createdAt_-1" }),
  orders.createIndex({ isArchived: 1, status: 1, createdAt: -1 }, { name: "isArchived_1_status_1_createdAt_-1" }),
  orders.createIndex({ status: 1, statusChangedAt: 1 }, { name: "status_1_statusChangedAt_1" }),
]);
const revenueAfter = await orders.aggregate([{ $match: { status: { $ne: "cancelled" } } }, { $group: { _id: null, total: { $sum: "$total" } } }]).next();
console.log(JSON.stringify({ matched: result.matchedCount, modified: result.modifiedCount, revenueBefore: revenueBefore?.total || 0, revenueAfter: revenueAfter?.total || 0 }));
await mongoose.disconnect();
