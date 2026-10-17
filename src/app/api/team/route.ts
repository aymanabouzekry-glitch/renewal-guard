import { NextResponse } from "next/server";
import { db } from "@/server/db";
import { auditEvents, renewalTasks } from "@/server/db/schema";
import { desc } from "drizzle-orm";
import { getAuthenticatedActor, logServerAudit } from "@/server/security/audit-auth";

export async function GET() {
  try {
    const actor = await getAuthenticatedActor();
    const [logs, tasks] = await Promise.all([
      db.select().from(auditEvents).orderBy(desc(auditEvents.createdAt)).limit(200),
      db.select().from(renewalTasks).orderBy(desc(renewalTasks.createdAt)),
    ]);

    const membersMap = new Map<
      string,
      {
        id: string;
        name: string;
        email: string;
        role: string;
        department: string;
        status: string;
        auditCount: number;
        tasksCount: number;
        lastActive: string;
      }
    >();

    // تسجيل المشغل الرئيسي الحالي
    if (actor.email && actor.email !== "anonymous") {
      membersMap.set(actor.email.toLowerCase(), {
        id: "primary-admin",
        name: actor.email.split("@")[0],
        email: actor.email,
        role: "System Admin",
        department: "Executive Operations",
        status: "Active",
        auditCount: 0,
        tasksCount: 0,
        lastActive: new Date().toISOString(),
      });
    }

    // استخراج أعضاء الفريق المضافين وسجل النشاط الفعلي من قاعدة البيانات
    logs.forEach((log) => {
      if (log.action === "TEAM_MEMBER_INVITED" && log.targetName) {
        const parts = String(log.targetName).split("|").map((s) => s.trim());
        const name = parts[0] || "Team Operator";
        const email = (parts[1] || "operator@company.com").toLowerCase();
        const department = parts[2] || "Legal & Compliance";
        const role = log.targetType || "Legal Reviewer";

        if (!membersMap.has(email)) {
          membersMap.set(email, {
            id: log.id,
            name,
            email,
            role,
            department,
            status: "Active",
            auditCount: 1,
            tasksCount: 0,
            lastActive: log.createdAt ? new Date(log.createdAt).toISOString() : new Date().toISOString(),
          });
        }
      }

      const actorKey = String(log.actorEmail || "").toLowerCase();
      if (actorKey && actorKey !== "system") {
        if (!membersMap.has(actorKey)) {
          membersMap.set(actorKey, {
            id: log.id,
            name: actorKey.split("@")[0],
            email: log.actorEmail,
            role: "Operations Lead",
            department: "Contract Governance",
            status: "Active",
            auditCount: 1,
            tasksCount: 0,
            lastActive: log.createdAt ? new Date(log.createdAt).toISOString() : new Date().toISOString(),
          });
        } else {
          const existing = membersMap.get(actorKey)!;
          existing.auditCount += 1;
        }
      }
    });

    // حساب عدد مهام سير العمل المسندة لكل عضو
    tasks.forEach((t) => {
      const assigneeKey = String(t.assignee || "").toLowerCase();
      if (membersMap.has(assigneeKey)) {
        membersMap.get(assigneeKey)!.tasksCount += 1;
      }
    });

    return NextResponse.json(
      { data: Array.from(membersMap.values()) },
      { status: 200 }
    );
  } catch (error) {
    console.error("Failed to load team directory:", error);
    return NextResponse.json({ error: "Failed to load team" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const actor = await getAuthenticatedActor();
    if (!actor.authenticated) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const name = String(body.name || "").trim();
    const email = String(body.email || "").trim().toLowerCase();
    const role = String(body.role || "Legal Reviewer").trim();
    const department = String(body.department || "Legal & Procurement").trim();

    if (!name || !email) {
      return NextResponse.json(
        { error: "Name and email are required" },
        { status: 400 }
      );
    }

    await logServerAudit({
      actorEmail: actor.email,
      action: "TEAM_MEMBER_INVITED",
      targetType: role,
      targetName: `${name} | ${email} | ${department}`,
    });

    return NextResponse.json(
      {
        message: "Team member provisioned and logged to audit trail",
        member: { name, email, role, department, status: "Active" },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Failed to invite team member:", error);
    return NextResponse.json(
      { error: "Failed to provision team member" },
      { status: 500 }
    );
  }
}