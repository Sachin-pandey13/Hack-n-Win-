// app/api/problems/[id]/route.ts
import { NextResponse } from "next/server";
import { PROBLEMS } from "@/lib/problem";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id) return NextResponse.json({ error: "missing id" }, { status: 400 });

    // Try to find problem by id
    const found = PROBLEMS.find((p: any) => String(p.id) === String(id));
    if (!found) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json(found, { status: 200 });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message ?? "Server error" },
      { status: 500 }
    );
  }
}
