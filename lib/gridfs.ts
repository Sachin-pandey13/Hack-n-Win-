import mongoose from "mongoose"

const MONGODB_URI = process.env.MONGODB_URI!

let bucket: mongoose.mongo.GridFSBucket

export async function connectGridFS() {
  if (mongoose.connection.readyState !== 1) {
    await mongoose.connect(MONGODB_URI, {
      dbName: process.env.MONGODB_DB || "codeelysium"
    })
  }

  if (!bucket) {
    bucket = new mongoose.mongo.GridFSBucket(
      mongoose.connection.db!,
      { bucketName: "fs" }
    )
  }

  return bucket
}