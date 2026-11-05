import "server-only";
import { Order } from "@/models";

export function findOrderById(id: string) {
  return Order.collection.findOne({ $expr: { $eq: [{ $toString: "$_id" }, String(id)] } });
}
