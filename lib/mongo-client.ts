import { MongoClient } from "mongodb";

const dbName = process.env.MONGODB_DB || "codeelysium";

declare global {
  // eslint-disable-next-line no-var
  var _mongoClientPromise2: Promise<MongoClient> | undefined;
}

let clientPromise: Promise<MongoClient> | null = null;

function ensureClient(): Promise<MongoClient> {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error("MONGODB_URI missing");
  }

  if (!clientPromise) {
    if (process.env.NODE_ENV === "development") {
      if (!global._mongoClientPromise2) {
        const client = new MongoClient(uri);
        global._mongoClientPromise2 = client.connect();
      }
      clientPromise = global._mongoClientPromise2;
    } else {
      const client = new MongoClient(uri);
      clientPromise = client.connect();
    }
  }

  return clientPromise;
}

export async function getDb() {
  const c = await ensureClient();
  return c.db(dbName);
}