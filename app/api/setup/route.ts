import { NextResponse } from "next/server";
import { needsAdminSetup } from "@/lib/admin-setup";

export async function GET() {
    const needsSetup = await needsAdminSetup();
    return NextResponse.json({ needsSetup });
}
