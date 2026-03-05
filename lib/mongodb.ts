// lib/mongodb.ts
import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI as string;
const dbName = process.env.MONGODB_DB || "codeelysium";

if (!uri) {
  throw new Error("Missing MONGODB_URI in env");
}

const options = {
  // leave defaults; serverSelectionTimeoutMS helps fail fast
  serverSelectionTimeoutMS: 8000,
};

let client: MongoClient;
let clientPromise: Promise<MongoClient>;

declare global {
  // eslint-disable-next-line no-var
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

if (process.env.NODE_ENV === "development") {
  if (!global._mongoClientPromise) {
    console.log("→ mongodb: creating new clientPromise (dev)");
    client = new MongoClient(uri, options);
    global._mongoClientPromise = client
      .connect()
      .then((c) => {
        console.log(`✅ mongodb: connected to ${dbName}`);
        return c;
      })
      .catch((err) => {
        console.error("❌ mongodb: connection failed", err);
        throw err;
      });
  }
  clientPromise = global._mongoClientPromise;
} else {
  client = new MongoClient(uri, options);
  clientPromise = client
    .connect()
    .then((c) => {
      console.log(`✅ mongodb: connected to ${dbName}`);
      return c;
    })
    .catch((err) => {
      console.error("❌ mongodb: connection failed", err);
      throw err;
    });
}

export default clientPromise;
