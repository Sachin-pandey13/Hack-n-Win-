import { NextResponse } from "next/server"
import { getDb } from "@/lib/mongodb"

export async function GET() {

  try {

    const db = await getDb()

    const notes = await db
      .collection("notes")
      .find({})
      .sort({ createdAt: -1 })
      .toArray()

    return NextResponse.json(notes)

  } catch (error) {

    console.error("notes api error:", error)

    return NextResponse.json(
      { error: "Failed to fetch notes" },
      { status: 500 }
    )

  }

}