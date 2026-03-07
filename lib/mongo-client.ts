import { MongoClient } from "mongodb"

const uri = process.env.MONGODB_URI!
const dbName = process.env.MONGODB_DB || "codeelysium"

if (!uri) {
  throw new Error("MONGODB_URI missing")
}

let client: MongoClient
let clientPromise: Promise<MongoClient>

declare global {
  // eslint-disable-next-line no-var
  var _mongoClientPromise: Promise<MongoClient> | undefined
}

if (!global._mongoClientPromise) {
  client = new MongoClient(uri)
  global._mongoClientPromise = client.connect()
}

clientPromise = global._mongoClientPromise

export async function getDb() {
  const c = await clientPromise
  return c.db(dbName)
}