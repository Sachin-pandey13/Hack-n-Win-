// test-mongo.js
require("dotenv").config();
const { MongoClient } = require("mongodb");

const uri = process.env.MONGODB_URI ||
  "mongodb+srv://sachinkumara1me_db_user:Sachin%40%21%21312@codeelysium.sisfjel.mongodb.net/codeelysium?retryWrites=true&w=majority";

(async () => {
  console.log("→ Trying to connect to MongoDB...");
  const client = new MongoClient(uri, {
    serverSelectionTimeoutMS: 8000,
    // keep defaults for TLS; we may set NODE_OPTIONS if needed
  });
  try {
    await client.connect();
    const db = client.db(process.env.MONGODB_DB || "codeelysium");
    const collections = await db.listCollections().toArray();
    console.log("✅ Connected — collections:", collections.map(c => c.name));
    await client.close();
    process.exit(0);
  } catch (err) {
    console.error("❌ CONNECT ERROR:", err);
    process.exit(1);
  }
})();
