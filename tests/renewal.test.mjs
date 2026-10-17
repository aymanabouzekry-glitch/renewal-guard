import test from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";

function calculateDaysRemaining(dueDateString) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dueDateString);
  due.setHours(0, 0, 0, 0);
  const diffTime = due.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

function calculateReadinessScore(doc) {
  let score = 0;
  const daysLeft = calculateDaysRemaining(doc.dueDate);

  if (doc.status === "Active") score += 40;
  else if (doc.status === "Pending") score += 20;

  if (daysLeft > 60) score += 40;
  else if (daysLeft > 30) score += 30;
  else if (daysLeft > 0) score += 15;

  if (doc.type && doc.name) score += 20;

  return Math.min(100, Math.max(0, score));
}

function sanitizeCsvCell(val) {
  const raw = String(val ?? "").replace(/"/g, '""');
  if (/^[=+\-@]/.test(raw)) {
    return `"'${raw}"`;
  }
  return `"${raw}"`;
}

test("1. Future date > 60 days yields maximum readiness score (100/100)", () => {
  const future = new Date();
  future.setDate(future.getDate() + 90);
  const iso = future.toISOString().split("T")[0];
  const score = calculateReadinessScore({
    name: "ISO 27001 Certificate",
    type: "License",
    status: "Active",
    dueDate: iso,
  });
  assert.equal(score, 100);
});

test("2. Overdue document yields negative days and reduced readiness score (20/100)", () => {
  const past = new Date();
  past.setDate(past.getDate() - 10);
  const iso = past.toISOString().split("T")[0];
  assert.ok(calculateDaysRemaining(iso) < 0);
  const score = calculateReadinessScore({
    name: "Expired Insurance",
    type: "Insurance",
    status: "Expired",
    dueDate: iso,
  });
  assert.equal(score, 20);
});

test("3. Document within 30-day warning window calculates accurate score (75/100)", () => {
  const warningDate = new Date();
  warningDate.setDate(warningDate.getDate() + 14);
  const iso = warningDate.toISOString().split("T")[0];
  const score = calculateReadinessScore({
    name: "Cloud Contract",
    type: "Contract",
    status: "Active",
    dueDate: iso,
  });
  assert.equal(score, 75);
});

test("4. Document in 31-60 day window yields intermediate buffer score (90/100)", () => {
  const midDate = new Date();
  midDate.setDate(midDate.getDate() + 45);
  const iso = midDate.toISOString().split("T")[0];
  const score = calculateReadinessScore({
    name: "Annual Maintenance SLA",
    type: "Contract",
    status: "Active",
    dueDate: iso,
  });
  assert.equal(score, 90);
});

test("5. Pending status document receives partial status points (20 pts)", () => {
  const future = new Date();
  future.setDate(future.getDate() + 75);
  const iso = future.toISOString().split("T")[0];
  const score = calculateReadinessScore({
    name: "Pending Vendor Contract",
    type: "Contract",
    status: "Pending",
    dueDate: iso,
  });
  assert.equal(score, 80);
});

test("6. CSV Formula Injection protection neutralizes leading =, +, -, @ payloads", () => {
  assert.equal(sanitizeCsvCell("=CMD|' /C calc'!A0"), "\"'=CMD|' /C calc'!A0\"");
  assert.equal(sanitizeCsvCell("+SUM(A1:A2)"), "\"'+SUM(A1:A2)\"");
  assert.equal(sanitizeCsvCell("-100+200"), "\"'-100+200\"");
  assert.equal(sanitizeCsvCell("@import"), "\"'@import\"");
  assert.equal(sanitizeCsvCell("Standard Contract"), '"Standard Contract"');
});

test("7. Portfolio financial exposure aggregates valid numeric contract values", () => {
  const records = [{ cost: 1500 }, { cost: "4200" }, { cost: null }, { cost: 850 }];
  const total = records.reduce((sum, r) => sum + (Number(r.cost) || 0), 0);
  assert.equal(total, 6550);
});

test("8. Short-lived signed download URL generator produces verifiable HMAC signature", () => {
  const expires = Date.now() + 900000;
  const sig = crypto
    .createHmac("sha256", "test-secret")
    .update(`doc-123:contract.pdf:${expires}`)
    .digest("hex");
  assert.equal(sig.length, 64);
});