import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();

    const file = formData.get("file") as File;
    const className = formData.get("class") as string;
    const subject = formData.get("subject") as string;
    const topic = formData.get("topic") as string;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const safeFileName = file.name.replace(/\s+/g, "_");

    const db = await getDb();

    // Store file content as binary in MongoDB instead of filesystem
    // (Vercel has a read-only filesystem)
    const result = await db.collection("notes").insertOne({
      class: className,
      subject,
      topic,
      fileName: safeFileName,
      fileContent: buffer,
      contentType: file.type || "application/pdf",
      fileSize: buffer.length,
      createdAt: new Date(),
    });

    return NextResponse.json({
      success: true,
      id: result.insertedId.toString(),
      fileName: safeFileName,
    });
  } catch (error) {
    console.error("UPLOAD ERROR:", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}