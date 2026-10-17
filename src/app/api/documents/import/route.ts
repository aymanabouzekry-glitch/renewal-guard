import { NextResponse } from "next/server";
import { db } from "@/server/db";
import { documents } from "@/server/db/schema";
import { requireServerAuth, recordServerAudit } from "@/server/security/guard";

export async function POST(req: Request) {
  try {
    const user = await requireServerAuth();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { records } = body;

    if (!records || !Array.isArray(records) || records.length === 0) {
      return NextResponse.json({ error: "No valid records found to import." }, { status: 400 });
    }

    let importedCount = 0;
    let skippedCount = 0;

    for (const row of records) {
      const parsedDate = row.dueDate ? new Date(row.dueDate) : null;
      if (row.name && parsedDate && !isNaN(parsedDate.getTime())) {
        const formattedDate = parsedDate.toISOString().split("T")[0];

        await db.insert(documents).values({
          name: String(row.name).trim(),
          type: row.type || "Contract",
          status: row.status || "Active",
          dueDate: formattedDate,
          cost: Number(row.cost) || 0,
        });
        importedCount++;
      } else {
        skippedCount++;
      }
    }

    await recordServerAudit({
      actorEmail: user.email,
      action: "CSV_IMPORTED",
      targetType: "DataPortability",
      targetName: `Imported: ${importedCount}, Skipped: ${skippedCount}`,
    });

    return NextResponse.json(
      {
        message: "Import completed successfully",
        imported: importedCount,
        skipped: skippedCount,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Import failed:", error);
    return NextResponse.json(
      { error: "Failed to import data. Please check your CSV format." },
      { status: 500 }
    );
  }
}