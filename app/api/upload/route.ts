import { NextResponse } from "next/server"
import fs from "fs"
import path from "path"
import { getDb } from "@/lib/mongodb"

export async function POST(req: Request) {
try {
const formData = await req.formData()

const file = formData.get("file") as File
const className = formData.get("class") as string
const subject = formData.get("subject") as string
const topic = formData.get("topic") as string

if (!file) {
  return NextResponse.json({ error: "No file uploaded" }, { status: 400 })
}

const bytes = await file.arrayBuffer()
const buffer = Buffer.from(bytes)

// absolute storage path
const dirPath = path.join(process.cwd(), "public", "notes", subject)

// FORCE create directory tree
fs.mkdirSync(dirPath, { recursive: true })

const safeFileName = file.name.replace(/\s+/g, "_")

const filePath = path.join(dirPath, safeFileName)

// write PDF
fs.writeFileSync(filePath, buffer)

const db = await getDb()

await db.collection("notes").insertOne({
  class: className,
  subject,
  topic,
  fileName: safeFileName,
  filePath: `/notes/${subject}/${safeFileName}`,
  createdAt: new Date()
})

return NextResponse.json({
  success: true,
  path: `/notes/${subject}/${safeFileName}`
})

} catch (error) {
console.error("UPLOAD ERROR:", error)
return NextResponse.json({ error: "Upload failed" }, { status: 500 })
}
}