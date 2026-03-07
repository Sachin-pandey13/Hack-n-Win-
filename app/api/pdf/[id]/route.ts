import { ObjectId, GridFSBucket } from "mongodb"
import { Readable } from "stream"
import { getDb } from "@/lib/mongo-client"

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  const db = await getDb()

  const bucket = new GridFSBucket(db, { bucketName: "fs" })

  const stream = bucket.openDownloadStream(new ObjectId(params.id))

  // convert Node stream → Web stream for Next.js
  const webStream = Readable.toWeb(stream as any)

  return new Response(webStream, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": "inline"
    }
  })
}