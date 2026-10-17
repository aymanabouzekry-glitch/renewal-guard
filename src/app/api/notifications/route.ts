import { NextResponse } from "next/server";
import { db } from "@/server/db";
import { notifications, documents } from "@/server/db/schema";
import { eq, desc } from "drizzle-orm";

export async function GET() {
  try {
    // جلب آخر 10 إشعارات مع اسم المستند المرتبط بكل إشعار
    const userNotifications = await db
      .select({
        id: notifications.id,
        type: notifications.type,
        status: notifications.status,
        createdAt: notifications.createdAt,
        documentName: documents.name,
        dueDate: documents.dueDate,
      })
      .from(notifications)
      .leftJoin(documents, eq(notifications.documentId, documents.id))
      .orderBy(desc(notifications.createdAt))
      .limit(10);

    return NextResponse.json({ data: userNotifications }, { status: 200 });
  } catch (error) {
    console.error("Failed to fetch notifications:", error);
    return NextResponse.json({ error: "Failed to fetch notifications" }, { status: 500 });
  }
}