import mongoose from "mongoose";
import { setServers } from "node:dns";

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  // In build time or when MONGODB_URI is not set, log warning
  console.warn("Please define the MONGODB_URI environment variable inside .env.local");
}

/**
 * Global is used here to maintain a cached connection across hot reloads
 * in development. This prevents connections growing exponentially
 * during API Route usage.
 */
interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  // eslint-disable-next-line no-var
  var mongooseCache: MongooseCache | undefined;
}

let cached = global.mongooseCache;

if (!cached) {
  cached = global.mongooseCache = { conn: null, promise: null };
}

export async function connectDB(): Promise<typeof mongoose> {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error("MONGODB_URI is missing in environment variables");
  }

  if (cached!.conn) {
    return cached!.conn;
  }

  if (!cached!.promise) {
    // Optional process-level override for networks whose DNS rejects Atlas SRV/TXT queries.
    // Leave unset on hosts where the system DNS works (for example, production).
    const dnsServers = process.env.MONGODB_DNS_SERVERS?.split(",")
      .map((server) => server.trim())
      .filter(Boolean);
    if (uri.startsWith("mongodb+srv://") && dnsServers?.length) {
      setServers(dnsServers);
    }

    const opts: mongoose.ConnectOptions = {
      bufferCommands: false,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 8000,
    };

    cached!.promise = mongoose.connect(uri, opts).then((m) => {
      console.log("✓ MongoDB connected successfully via Mongoose singleton");
      return m;
    });
  }

  try {
    cached!.conn = await cached!.promise;
  } catch (e) {
    cached!.promise = null;
    console.error("✗ MongoDB connection error:", e);
    throw e;
  }

  return cached!.conn;
}
