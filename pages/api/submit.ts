import type { NextApiRequest, NextApiResponse } from "next";
import clientPromise from "@/lib/mongodb";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB);

    const { userId, problemId, language, code, status } = req.body;

    const submission = {
      userId,
      problemId,
      language,
      code,
      status, // e.g. "Accepted" or "Wrong Answer"
      createdAt: new Date(),
    };

    const result = await db.collection("submissions").insertOne(submission);

    return res.status(201).json({ success: true, id: result.insertedId });
  } catch (error) {
    console.error("❌ DB error:", error);
    return res.status(500).json({ success: false, error: "Database error" });
  }
}
