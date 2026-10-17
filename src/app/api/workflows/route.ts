import { NextResponse } from "next/server";
import { db } from "@/server/db";
import { renewalTasks } from "@/server/db/schema";
import { desc, eq } from "drizzle-orm";
import { getAuthenticatedActor, logServerAudit } from "@/server/security/audit-auth";

export async function GET() {
  try {
    const tasks = await db
      .select()
      .from(renewalTasks)
      .orderBy(desc(renewalTasks.createdAt));

    return NextResponse.json({ data: tasks }, { status: 200 });
  } catch (error) {
    console.error("Failed to fetch workflow tasks:", error);
    return NextResponse.json({ error: "Failed to fetch workflow tasks" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const actor = await getAuthenticatedActor();
    if (!actor.authenticated) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { documentName, title, assignee, priority, status, dueDate, notes } = body;

    if (!title || !documentName || !dueDate) {
      return NextResponse.json(
        { error: "Task title, document name, and due date are required" },
        { status: 400 }
      );
    }

    const inserted = await db
      .insert(renewalTasks)
      .values({
        documentName: String(documentName).trim(),
        title: String(title).trim(),
        assignee: assignee || actor.email,
        priority: priority || "High",
        status: status || "Pending Approval",
        approvalDecision: "Pending",
        dueDate,
        notes: notes || "",
      })
      .returning();

    await logServerAudit({
      actorEmail: actor.email,
      action: "WORKFLOW_TASK_CREATED",
      targetType: "WorkflowTask",
      targetName: `${inserted[0].title} (${inserted[0].documentName})`,
    });

    return NextResponse.json({ data: inserted[0] }, { status: 201 });
  } catch (error) {
    console.error("Error creating workflow task:", error);
    return NextResponse.json({ error: "Failed to create task" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const actor = await getAuthenticatedActor();
    if (!actor.authenticated) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { id, status, approvalDecision, notes } = body;

    if (!id) {
      return NextResponse.json({ error: "Task ID is required" }, { status: 400 });
    }

    const updated = await db
      .update(renewalTasks)
      .set({
        status: status || "Completed",
        approvalDecision: approvalDecision || "Approved",
        approvedBy: actor.email,
        notes: notes !== undefined ? notes : undefined,
        updatedAt: new Date(),
      })
      .where(eq(renewalTasks.id, id))
      .returning();

    if (updated.length === 0) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    await logServerAudit({
      actorEmail: actor.email,
      action: `WORKFLOW_${(approvalDecision || status || "UPDATED").toUpperCase()}`,
      targetType: "ApprovalWorkflow",
      targetName: `${updated[0].title} -> ${approvalDecision || status}`,
    });

    return NextResponse.json({ data: updated[0] }, { status: 200 });
  } catch (error) {
    console.error("Error updating workflow task:", error);
    return NextResponse.json({ error: "Failed to update workflow" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const actor = await getAuthenticatedActor();
    if (!actor.authenticated) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "Task ID required" }, { status: 400 });
    }

    const deleted = await db
      .delete(renewalTasks)
      .where(eq(renewalTasks.id, id))
      .returning();

    if (deleted.length > 0) {
      await logServerAudit({
        actorEmail: actor.email,
        action: "WORKFLOW_TASK_DELETED",
        targetType: "WorkflowTask",
        targetName: deleted[0].title,
      });
    }

    return NextResponse.json({ message: "Deleted" }, { status: 200 });
  } catch (error) {
    console.error("Error deleting workflow task:", error);
    return NextResponse.json({ error: "Failed to delete task" }, { status: 500 });
  }
}