import { NextResponse } from "next/server";
import { db } from "@/server/db";
import { documents } from "@/server/db/schema";
import { desc, ilike, or, sql } from "drizzle-orm";

// 1. دالة جلب البيانات (مع دعم البحث والترقيم)
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "5"); // هنعرض 5 مستندات في الصفحة عشان نجرب
    const search = searchParams.get("search") || "";
    const offset = (page - 1) * limit;

    // تجهيز شرط البحث (باسم المستند أو نوعه)
    const searchCondition = search
      ? or(
          ilike(documents.name, `%${search}%`),
          ilike(documents.type, `%${search}%`)
        )
      : undefined;

    // جلب البيانات للصفحة الحالية فقط
    const paginatedDocuments = await db
      .select()
      .from(documents)
      .where(searchCondition)
      .orderBy(desc(documents.createdAt))
      .limit(limit)
      .offset(offset);

    // حساب إجمالي عدد المستندات
    const totalCountResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(documents)
      .where(searchCondition);
      
    const totalCount = Number(totalCountResult[0].count);
    const totalPages = Math.ceil(totalCount / limit);

    return NextResponse.json({
      data: paginatedDocuments,
      pagination: {
        total: totalCount,
        page,
        limit,
        totalPages,
      }
    }, { status: 200 });
  } catch (error) {
    console.error("Error fetching documents:", error);
    return NextResponse.json({ error: "Failed to fetch documents" }, { status: 500 });
  }
}

// 2. دالة حفظ البيانات (زي ما هي)
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, type, status, dueDate, cost } = body;

    const newDocument = await db.insert(documents).values({
      name,
      type,
      status: status || "Active",
      dueDate: dueDate,
      cost: Number(cost) || 0,
    }).returning();

    return NextResponse.json({ message: "Document created successfully!", document: newDocument[0] }, { status: 201 });
  } catch (error) {
    console.error("Error saving document:", error);
    return NextResponse.json({ error: "Failed to save document" }, { status: 500 });
  }
}