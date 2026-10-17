import { pgTable, text, timestamp, uuid, primaryKey, varchar, integer, date } from 'drizzle-orm/pg-core';

export const organizations = pgTable('organizations', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name'),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const organizationMemberships = pgTable('organization_memberships', {
  userId: uuid('user_id').notNull().references(() => users.id),
  organizationId: uuid('organization_id').notNull().references(() => organizations.id),
  role: text('role').notNull().default('member'), // roles: admin, member
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (t) => ({
  pk: primaryKey({ columns: [t.userId, t.organizationId] }),
}));

export const documents = pgTable("documents", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  type: text("type").notNull(),
  status: text("status").notNull(),
  dueDate: text("due_date").notNull(),
  cost: integer("cost").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  // السطر ده اللي ناقص ومحتاجين نضيفه
  updatedAt: timestamp("updated_at"),
});

// جدول الإشعارات والتنبيهات المجدولة (Phase 6)
export const notifications = pgTable("notifications", {
  id: uuid("id").defaultRandom().primaryKey(),
  documentId: uuid("document_id").references(() => documents.id, { onDelete: "cascade" }),
  type: text("type").notNull(), // نوع الإشعار: مثلاً 'Reminder', 'Overdue'
  status: text("status").notNull().default("Pending"), // حالة الإرسال: Pending, Sent, Failed
  scheduledFor: timestamp("scheduled_for").notNull(), // موعد إرسال الإشعار
  sentAt: timestamp("sent_at"), // وقت الإرسال الفعلي
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// جدول الإعدادات العامة (Phase 8 - White-label)
export const settings = pgTable("settings", {
  id: uuid("id").defaultRandom().primaryKey(),
  appName: text("app_name").notNull().default("RenewalGuard"), // اسم التطبيق
  primaryColor: text("primary_color").notNull().default("#0f172a"), // اللون الأساسي
  contactEmail: text("contact_email"), // إيميل التواصل للشركة
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// جدول سجل المراقبة الأمنية غير القابل للتعديل (Phase 9 - Audit Log)
export const auditEvents = pgTable("audit_events", {
  id: uuid("id").defaultRandom().primaryKey(),
  actorEmail: text("actor_email").notNull(), // إيميل أو اسم المستخدم اللي قام بالعملية
  action: text("action").notNull(), // نوع العملية: مثلاً DOCUMENT_CREATED, CSV_IMPORTED, SETTINGS_UPDATED
  targetType: text("target_type").notNull(), // العنصر المستهدف: Document, Settings, Export
  targetName: text("target_name"), // اسم المستند أو تفاصيل إضافية
  createdAt: timestamp("created_at").defaultNow().notNull(), // التوقيت الدقيق للعملية
});

// جدول مهام التحضير للتجديد وسير عمل الاعتمادات (Phase 3 & 4 - Workflows & Approvals)
export const renewalTasks = pgTable("renewal_tasks", {
  id: uuid("id").defaultRandom().primaryKey(),
  documentId: uuid("document_id"), // ربط اختياري بالمستند
  documentName: text("document_name").notNull(), // اسم العقد أو الوثيقة المرتبطة
  title: text("title").notNull(), // عنوان المهمة أو طلب الاعتماد
  assignee: text("assignee").notNull().default("Operations Team"), // المسؤول عن التنفيذ
  priority: text("priority").notNull().default("High"), // Critical, High, Medium, Low
  status: text("status").notNull().default("In Progress"), // In Progress, Pending Approval, Approved, Completed
  approvalDecision: text("approval_decision").default("Pending"), // Pending, Approved, Rejected
  approvedBy: text("approved_by"), // اسم وإيميل المعتمد
  dueDate: text("due_date").notNull(), // موعد استحقاق المهمة
  notes: text("notes"), // ملاحظات المراجعة أو سبب القرار
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow(),
});