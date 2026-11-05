import mongoose, { Schema } from "mongoose";
const schema = new Schema({
  name: { type: String, required: true, maxlength: 100 },
  email: { type: String, required: true, maxlength: 254 },
  phone: { type: String, default: "", maxlength: 25 },
  subject: { type: String, required: true },
  message: { type: String, required: true, maxlength: 5000 },
  status: { type: String, enum: ["new", "processing", "resolved"], default: "new", index: true },
  note: { type: String, default: "", maxlength: 5000 },
}, { timestamps: true });
schema.index({ createdAt: -1 });
// Also register the new field on an existing model during development hot reload.
if (mongoose.models.SupportTicket && !mongoose.models.SupportTicket.schema.path("phone")) {
  mongoose.models.SupportTicket.schema.add({ phone: { type: String, default: "", maxlength: 25 } });
}
export const SupportTicketModel = mongoose.models.SupportTicket || mongoose.model("SupportTicket", schema);
