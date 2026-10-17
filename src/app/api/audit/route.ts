import { NextResponse } from "next/server";
import { db } from "@/server/db";
import { auditEvents } from "@/server/db/schema";
import { desc } from "drizzle-orm";

export async function GET() {
  try {
    const logs = await db
      .select()
      .from(auditEvents)
      .orderBy(desc(auditEvents.createdAt))
      .limit(20);

    return NextResponse.json({ data: logs }, { status: 200 });
  } catch (error) {
    console.error("Failed to fetch audit logs:", error);
    return NextResponse.json({ error: "Failed to fetch audit logs" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { actorEmail, action, targetType, targetName } = body;

    const inserted = await db
      .insert(auditEvents)
      .values({
        actorEmail: actorEmail || "system@renewalguard.com",
        action: action || "SYSTEM_EVENT",
        targetType: targetType || "System",
        targetName: targetName || "",
      })
      .returning();

    return NextResponse.json({ data: inserted[0] }, { status: 201 });
  } catch (error) {
    console.error("Failed to create audit event:", error);
    return NextResponse.json({ error: "Failed to record audit event" }, { status: 500 });
  }
}