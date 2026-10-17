import { NextResponse } from "next/server";
import { db } from "@/server/db";
import { documents, users } from "@/server/db/schema";
import { desc, ilike, or, sql } from "drizzle-orm";
import { getAuthenticatedActor, logServerAudit } from "@/server/security/audit-auth";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const page = Math.max(1, Number(searchParams.get("page")) || 1);
    const limit = Math.max(1, Number(searchParams.get("limit")) || 5);
    const search = searchParams.get("search")?.trim() || "";
    const offset = (page - 1) * limit;

    const whereClause = search
      ? or(
          ilike(documents.name, `%${search}%`),
          ilike(documents.type, `%${search}%`),
          ilike(documents.status, `%${search}%`)
        )
      : undefined;

    const data = await db
      .select()
      .from(documents)
      .where(whereClause)
      .orderBy(desc(documents.createdAt))
      .limit(limit)
      .offset(offset);

    const totalResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(documents)
      .where(whereClause);

    const teamResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(users);

    const total = Number(totalResult[0]?.count || 0);
    const teamCount = Math.max(1, Number(teamResult[0]?.count || 1));

    return NextResponse.json(
      {
        data,
        teamCount,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit) || 1,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Failed to fetch documents:", error);
    return NextResponse.json({ error: "Failed to fetch documents" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const actor = await getAuthenticatedActor();
    if (!actor.authenticated) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { name, type, status, dueDate, cost } = body;

    if (!name || !dueDate) {
      return NextResponse.json({ error: "Name and dueDate are required" }, { status: 400 });
    }

    const formattedDate =
      typeof dueDate === "string" && !dueDate.includes("T")
        ? dueDate
        : new Date(dueDate).toISOString().split("T")[0];

    const inserted = await db
      .insert(documents)
      .values({
        name: String(name).trim(),
        type: type || "Contract",
        status: status || "Active",
        dueDate: formattedDate,
        cost: Number(cost) || 0,
      })
      .returning();

    await logServerAudit({
      actorEmail: actor.email,
      action: "DOCUMENT_CREATED",
      targetType: "Document",
      targetName: `${inserted[0].name} (${inserted[0].type})`,
    });

    return NextResponse.json({ data: inserted[0] }, { status: 201 });
  } catch (error) {
    console.error("Failed to create document:", error);
    return NextResponse.json({ error: "Failed to create document" }, { status: 500 });
  }
}