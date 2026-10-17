import { NextResponse } from "next/server";
import { db } from "@/server/db";
import { settings } from "@/server/db/schema";
import { getAuthenticatedActor, logServerAudit } from "@/server/security/audit-auth";
import { getStorageAdapterStatus, getEmailAdapterStatus } from "@/server/integrations/adapters";

export async function GET() {
  try {
    const existing = await db.select().from(settings).limit(1);
    const current = existing[0] || {
      appName: "RenewalGuard",
      primaryColor: "#2563eb",
      contactEmail: "admin@renewalguard.com",
    };

    return NextResponse.json(
      {
        ...current,
        integrations: {
          storage: getStorageAdapterStatus(),
          email: getEmailAdapterStatus(),
          database: { provider: "NEON_POSTGRESQL", connected: true },
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Failed to fetch settings:", error);
    return NextResponse.json(
      {
        appName: "RenewalGuard",
        primaryColor: "#2563eb",
        contactEmail: "admin@renewalguard.com",
      },
      { status: 200 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const actor = await getAuthenticatedActor();
    if (!actor.authenticated) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const appName = String(body.appName || "RenewalGuard").trim().slice(0, 60);
    const primaryColor = /^#[0-9A-Fa-f]{6}$/.test(body.primaryColor || "")
      ? body.primaryColor
      : "#2563eb";
    const contactEmail = String(body.contactEmail || "admin@renewalguard.com")
      .trim()
      .slice(0, 100);

    const existing = await db.select().from(settings).limit(1);

    if (existing.length === 0) {
      await db.insert(settings).values({
        appName,
        primaryColor,
        contactEmail,
      });
    } else {
      await db.update(settings).set({
        appName,
        primaryColor,
        contactEmail,
        updatedAt: new Date(),
      });
    }

    await logServerAudit({
      actorEmail: actor.email,
      action: "SETTINGS_UPDATED",
      targetType: "WhiteLabel",
      targetName: `${appName} (${primaryColor})`,
    });

    return NextResponse.json({ success: true, appName, primaryColor, contactEmail });
  } catch (error) {
    console.error("Failed to save settings:", error);
    return NextResponse.json({ error: "Failed to save settings" }, { status: 500 });
  }
}