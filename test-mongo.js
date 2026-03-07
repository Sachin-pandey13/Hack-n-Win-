// test-mongo.js
require("dotenv").config({ path: ".env.local" });
const { MongoClient } = require("mongodb");

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB || "codeelysium";

(async () => {
  try {
    console.log("→ Trying to connect to MongoDB...");
    const client = new MongoClient(uri);
    await client.connect();

    console.log("✅ MongoDB connected");

    const db = client.db(dbName);
    const collections = await db.listCollections().toArray();
    console.log("📂 Collections:", collections.map(c => c.name));

    await client.close();
  } catch (err) {
    console.error("❌ CONNECT ERROR:", err);
  }
})();