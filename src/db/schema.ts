// File: src/db/schema.ts
import { pgTable, serial, text, boolean, integer, timestamp } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  role: text("role").default("auditor").notNull(), // 'admin', 'auditor', 'viewer'
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const auditChecklists = pgTable("audit_checklists", {
  id: serial("id").primaryKey(),
  month: text("month").notNull(), // 'Agustus', 'September', 'Oktober'
  domain: text("domain").notNull(), // 'MQAA', '6S', 'Visual Management', 'HSE', 'PS'
  title: text("title").notNull(),
  description: text("description"),
  area: text("area").default("All"), // 'Cutting', 'Prep', 'CSC', 'All'
  auditDate: text("audit_date"), // YYYY-MM-DD
  completed: boolean("completed").default(false).notNull(),
  completedAt: timestamp("completed_at"),
  completedBy: text("completed_by"),
  orderIndex: integer("order_index").default(0).notNull(),
  isCustom: boolean("is_custom").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const auditReports = pgTable("audit_reports", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  area: text("area").notNull(), // 'Cutting', 'Prep', 'CSC'
  domain: text("domain").notNull(), // 'MQAA', '6S', 'Visual Management', 'HSE', 'PS'
  findingDescription: text("finding_description").notNull(),
  rootCause: text("root_cause").notNull(), // Required Column #1
  actionPlan: text("action_plan").notNull(), // Required Column #2
  lessonLearned: text("lesson_learned").notNull(), // Required Column #3
  auditorName: text("auditor_name").notNull(),
  severity: text("severity").default("Medium").notNull(), // 'Low', 'Medium', 'High', 'Critical'
  status: text("status").default("Open").notNull(), // 'Open', 'In Progress', 'Resolved'
  auditDate: text("audit_date").notNull(), // YYYY-MM-DD
  photoUrls: text("photo_urls").array(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const weeklyReports = pgTable("weekly_reports", {
  id: serial("id").primaryKey(),
  weekNumber: integer("week_number").notNull(),
  title: text("title").notNull(),
  area: text("area").default("All"), // 'Cutting', 'Prep', 'CSC', 'All'
  mondayTasks: text("monday_tasks").notNull(),
  tuesdayTasks: text("tuesday_tasks").notNull(),
  wednesdayTasks: text("wednesday_tasks").notNull(),
  thursdayTasks: text("thursday_tasks").notNull(),
  fridayTasks: text("friday_tasks").notNull(),
  mondayStatus: text("monday_status").default("pending").notNull(), // 'pending', 'in_progress', 'completed'
  tuesdayStatus: text("tuesday_status").default("pending").notNull(),
  wednesdayStatus: text("wednesday_status").default("pending").notNull(),
  thursdayStatus: text("thursday_status").default("pending").notNull(),
  fridayStatus: text("friday_status").default("pending").notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Alias for backward compatibility
export const weeklyCadence = weeklyReports;

export const auditLogs = pgTable("audit_logs", {
  id: serial("id").primaryKey(),
  action: text("action").notNull(), // 'CREATE', 'UPDATE', 'DELETE', 'LOGIN'
  entity: text("entity").notNull(), // 'CHECKLIST', 'REPORT', 'USER', 'SYSTEM'
  entityId: integer("entity_id"),
  details: text("details"),
  performedBy: text("performed_by"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const appSettings = pgTable("app_settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const loginAttempts = pgTable("login_attempts", {
  id: serial("id").primaryKey(),
  ipAddress: text("ip_address").notNull(),
  attemptCount: integer("attempt_count").default(1).notNull(),
  lastAttemptAt: timestamp("last_attempt_at").defaultNow().notNull(),
  lockedUntil: timestamp("locked_until"),
});
