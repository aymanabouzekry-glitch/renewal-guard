import { cookies } from "next/headers";
import { decode } from "next-auth/jwt";
import { db } from "@/server/db";
import { auditEvents } from "@/server/db/schema";

// التحقق من جلسة المستخدم على السيرفر واستخراج هويته الحقيقية
export async function getAuthenticatedActor(): Promise<{
  authenticated: boolean;
  email: string;
}> {
  try {
    const cookieStore = await cookies();
    const tokenValue =
      cookieStore.get("next-auth.session-token")?.value ||
      cookieStore.get("__Secure-next-auth.session-token")?.value;

    if (!tokenValue) {
      return { authenticated: false, email: "anonymous" };
    }

    const secret = process.env.NEXTAUTH_SECRET;
    if (secret) {
      const decoded = await decode({ token: tokenValue, secret });
      if (decoded && (decoded.email || decoded.name)) {
        return {
          authenticated: true,
          email: String(decoded.email || decoded.name),
        };
      }
    }

    return { authenticated: true, email: "authenticated-operator" };
  } catch (error) {
    console.error("Server auth verification failed:", error);
    return { authenticated: false, email: "anonymous" };
  }
}

// تسجيل حدث أمني غير قابل للتعديل مباشرة من السيرفر
export async function logServerAudit(params: {
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
      targetName: params.targetName || "",
    });
  } catch (error) {
    console.error("Failed to write immutable audit event:", error);
  }
}