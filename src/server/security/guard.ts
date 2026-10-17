import { getServerSession } from "next-auth";
import { db } from "@/server/db";
import { auditEvents } from "@/server/db/schema";

/**
 * التحقق من جلسة المستخدم على السيرفر (البند 9 و 10 من المواصفات)
 */
export async function requireServerAuth() {
  const session = await getServerSession();
  if (!session || !session.user) {
    return null;
  }
  return {
    name: session.user.name || "Authorized User",
    email: session.user.email || session.user.name || "authenticated@renewalguard.local",
  };
}

/**
 * تسجيل حدث أمني غير قابل للتعديل من جهة السيرفر مباشرة (البند 7.12)
 */
export async function recordServerAudit(params: {
  actorEmail: string;
  action: string;
  targetType: string;
  targetName?: string;
}) {
  try {
    await db.insert(auditEvents).values({
      actorEmail: params.actorEmail,
      action: params.action,
      targetType: params.targetType,
      targetName: params.targetName || "-",
    });
  } catch (error) {
    console.error("Failed to write server audit event:", error);
  }
}