import { NextResponse } from "next/server";
import { db } from "@/server/db";
import { documents, notifications } from "@/server/db/schema";
import { eq, and } from "drizzle-orm";

export async function GET() {
  try {
    // 1. جلب كل المستندات من قاعدة البيانات
    const allDocs = await db.select().from(documents);
    let newNotificationsCount = 0;

    for (const doc of allDocs) {
      // 2. حساب الأيام المتبقية
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const expiration = new Date(doc.dueDate);
      expiration.setHours(0, 0, 0, 0);
      const diffTime = expiration.getTime() - today.getTime();
      const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      // 3. لو المستند متأخر أو فاضله 30 يوم أو أقل
      if (daysLeft <= 30 && doc.status !== "Expired") {
        
        // 4. فحص منع التكرار (Deduplication): هل عملنا إشعار للمستند ده قبل كده؟
        const existing = await db
          .select()
          .from(notifications)
          .where(and(
            eq(notifications.documentId, doc.id),
            eq(notifications.type, "Upcoming Renewal")
          ));

        // 5. لو مفيش إشعار سابق، هننشئ واحد جديد
        if (existing.length === 0) {
          await db.insert(notifications).values({
            documentId: doc.id,
            type: "Upcoming Renewal",
            status: "Pending", // لسه متبعتش كإيميل
            scheduledFor: new Date(),
          });
          newNotificationsCount++;
        }
      }
    }

    return NextResponse.json({
      message: "Renewal check job completed successfully.",
      newNotificationsCreated: newNotificationsCount
    }, { status: 200 });

  } catch (error) {
    console.error("Job error:", error);
    return NextResponse.json({ error: "Failed to run background job" }, { status: 500 });
  }
}