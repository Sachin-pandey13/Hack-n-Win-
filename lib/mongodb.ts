import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI || "";
const options = {};

let client: MongoClient;
let clientPromise: Promise<MongoClient>;

declare global {
  // eslint-disable-next-line no-var
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

function getClientPromise(): Promise<MongoClient> {
  if (!uri) {
    throw new Error("Please add MONGODB_URI to .env.local");
  }

  if (process.env.NODE_ENV === "development") {
    if (!global._mongoClientPromise) {
      client = new MongoClient(uri, options);
      global._mongoClientPromise = client.connect();
      console.log("→ mongodb: creating new clientPromise (dev)");
    }
    return global._mongoClientPromise;
  } else {
    client = new MongoClient(uri, options);
    return client.connect();
  }
}

// Lazy initialization — don't connect at import time (breaks CI builds)
clientPromise = null as any;

export default new Proxy({} as { promise: Promise<MongoClient> }, {
  get(_target, prop) {
    if (prop === "then" || prop === "catch" || prop === "finally") {
      if (!clientPromise) clientPromise = getClientPromise();
      return (clientPromise as any)[prop].bind(clientPromise);
    }
    return undefined;
  },
}) as unknown as Promise<MongoClient>;

export async function getDb() {
  if (!clientPromise) clientPromise = getClientPromise();
  const c = await clientPromise;
  return c.db(process.env.MONGODB_DB || "codeelysium");
}