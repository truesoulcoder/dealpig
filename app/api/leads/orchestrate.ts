import { NextRequest, NextResponse } from "next/server";
import { runRawLeadProcessing, runNormalizationProcessing } from "@/lib/leadOrchestrator";

export async function POST(req: NextRequest) {
  try {
    const { filename, userId } = await req.json();
    if (!filename || !userId) return NextResponse.json({ ok: false, error: "Missing filename or userId" }, { status: 400 });

    // 1. Run raw lead processing with userId
    await runRawLeadProcessing(filename, userId);

    // 2. Run normalization & archiving
    await runNormalizationProcessing(filename);

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error.message || String(error) }, { status: 500 });
  }
}
