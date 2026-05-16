import { ObjectId, GridFSBucket } from "mongodb";
import { Readable } from "stream";
import { getDb } from "@/lib/mongo-client";
import { NextResponse } from "next/server";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id || !ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }

    const db = await getDb();
    const bucket = new GridFSBucket(db, { bucketName: "fs" });

    const stream = bucket.openDownloadStream(new ObjectId(id));

    // convert Node stream → Web stream for Next.js
    const webStream = Readable.toWeb(stream as any);

    return new Response(webStream as any, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": "inline",
      },
    });
  } catch (error: any) {
    console.error("PDF fetch error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to fetch PDF" },
      { status: 500 }
    );
  }
}