import { NextResponse } from "next/server";
import { db } from "@/server/db";
import { documents } from "@/server/db/schema";
import { desc } from "drizzle-orm";
import { getAuthenticatedActor, logServerAudit } from "@/server/security/audit-auth";

function sanitizeCsvCell(val: unknown): string {
  const raw = String(val ?? "").replace(/"/g, '""');
  if (/^[=+\-@]/.test(raw)) {
    return `"'${raw}"`;
  }
  return `"${raw}"`;
}

export async function GET() {
  try {
    const actor = await getAuthenticatedActor();
    if (!actor.authenticated) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const allDocs = await db
      .select()
      .from(documents)
      .orderBy(desc(documents.createdAt));

    const headers = ["Name,Type,Status,DueDate,Cost"];
    const rows = allDocs.map((doc) => {
      const safeName = sanitizeCsvCell(doc.name);
      const safeType = sanitizeCsvCell(doc.type);
      const safeStatus = sanitizeCsvCell(doc.status);
      const dateStr =
        typeof doc.dueDate === "string"
          ? doc.dueDate.split("T")[0]
          : new Date(doc.dueDate).toISOString().split("T")[0];
      return `${safeName},${safeType},${safeStatus},${dateStr},${Number(doc.cost) || 0}`;
    });

    const csvContent = [headers, ...rows].join("\n");

    await logServerAudit({
      actorEmail: actor.email,
      action: "CSV_EXPORTED",
      targetType: "BulkExport",
      targetName: `Exported ${allDocs.length} sanitized records`,
    });

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": 'attachment; filename="renewalguard_documents_export.csv"',
      },
    });
  } catch (error) {
    console.error("Export failed:", error);
    return NextResponse.json({ error: "Failed to export CSV" }, { status: 500 });
  }
}