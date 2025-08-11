import {
  pgTable,
  text,
  varchar,
  timestamp,
  jsonb,
  index,
  serial,
  integer,
  boolean,
  decimal,
  date,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table - mandatory for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table - mandatory for Replit Auth
export const users = pgTable("users", {
  id: varchar("id").primaryKey().notNull(),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  role: varchar("role", { enum: ["admin", "project_manager", "senior_architect", "junior_architect", "budget_specialist", "collaborator"] }).notNull().default("collaborator"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const projects = pgTable("projects", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  status: varchar("status", { enum: ["active", "completed", "on_hold", "cancelled"] }).notNull().default("active"),
  type: varchar("type", { enum: ["stand_imobiliario", "projeto_arquitetura", "projeto_estrutural", "reforma", "manutencao"] }).notNull().default("stand_imobiliario"),
  stage: varchar("stage", { enum: ["briefing", "conceito", "projeto", "aprovacao", "orcamento", "producao", "entrega"] }).notNull().default("briefing"),
  priority: varchar("priority", { enum: ["baixa", "media", "alta", "urgente"] }).notNull().default("media"),
  startDate: date("start_date"),
  endDate: date("end_date"),
  clientName: varchar("client_name", { length: 255 }),
  clientEmail: varchar("client_email", { length: 255 }),
  clientPhone: varchar("client_phone", { length: 50 }),
  budget: decimal("budget", { precision: 12, scale: 2 }),
  estimatedHours: decimal("estimated_hours", { precision: 7, scale: 2 }),
  actualHours: decimal("actual_hours", { precision: 7, scale: 2 }).default('0'),
  location: varchar("location", { length: 255 }),
  area: varchar("area", { length: 100 }), // square meters
  managerUserId: varchar("manager_user_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const tasks = pgTable("tasks", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  status: varchar("status", { enum: ["aberta", "em_andamento", "concluida", "cancelada"] }).notNull().default("aberta"),
  priority: varchar("priority", { enum: ["baixa", "media", "alta", "critica"] }).notNull().default("media"),
  projectId: integer("project_id").references(() => projects.id, { onDelete: 'cascade' }),
  assignedUserId: varchar("assigned_user_id").references(() => users.id),
  createdUserId: varchar("created_user_id").references(() => users.id),
  startDate: date("start_date"),
  dueDate: date("due_date"),
  estimatedHours: decimal("estimated_hours", { precision: 5, scale: 2 }),
  actualHours: decimal("actual_hours", { precision: 5, scale: 2 }).default('0'),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const taskComments = pgTable("task_comments", {
  id: serial("id").primaryKey(),
  taskId: integer("task_id").references(() => tasks.id, { onDelete: 'cascade' }).notNull(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const taskHistory = pgTable("task_history", {
  id: serial("id").primaryKey(),
  taskId: integer("task_id").references(() => tasks.id, { onDelete: 'cascade' }).notNull(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  changes: text("changes").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const files = pgTable("files", {
  id: serial("id").primaryKey(),
  filename: varchar("filename", { length: 255 }).notNull(),
  originalName: varchar("original_name", { length: 255 }).notNull(),
  mimeType: varchar("mime_type", { length: 100 }).notNull(),
  size: integer("size").notNull(),
  path: varchar("path", { length: 500 }).notNull(),
  taskId: integer("task_id").references(() => tasks.id, { onDelete: 'cascade' }),
  projectId: integer("project_id").references(() => projects.id, { onDelete: 'cascade' }),
  uploadedUserId: varchar("uploaded_user_id").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  message: text("message").notNull(),
  type: varchar("type", { enum: ["info", "warning", "error", "success"] }).notNull().default("info"),
  isRead: boolean("is_read").notNull().default(false),
  relatedTaskId: integer("related_task_id").references(() => tasks.id, { onDelete: 'cascade' }),
  relatedProjectId: integer("related_project_id").references(() => projects.id, { onDelete: 'cascade' }),
  createdAt: timestamp("created_at").defaultNow(),
});

export const timeEntries = pgTable("time_entries", {
  id: serial("id").primaryKey(),
  taskId: integer("task_id").references(() => tasks.id, { onDelete: 'cascade' }).notNull(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time"),
  duration: integer("duration"), // in minutes
  description: text("description"),
  isActive: boolean("is_active").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const projectTeams = pgTable("project_teams", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").references(() => projects.id).notNull(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  role: varchar("role", { length: 100 }).notNull(), // architect, engineer, project_manager, etc.
  permissions: varchar("permissions", { length: 50 }).default("read"), // read, write, admin
  joinedAt: timestamp("joined_at").defaultNow(),
});

export const portfolioItems = pgTable("portfolio_items", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").references(() => projects.id).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  category: varchar("category", { enum: ["obras", "projetos"] }).notNull().default("projetos"),
  featuredImage: varchar("featured_image", { length: 500 }),
  images: text("images").array(), // JSON array of image URLs
  isPublished: boolean("is_published").notNull().default(false),
  isFeatured: boolean("is_featured").notNull().default(false),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  assignedTasks: many(tasks, { relationName: "assignedTasks" }),
  createdTasks: many(tasks, { relationName: "createdTasks" }),
  comments: many(taskComments),
  files: many(files),
  notifications: many(notifications),
  timeEntries: many(timeEntries),
}));

export const projectsRelations = relations(projects, ({ many }) => ({
  tasks: many(tasks),
  files: many(files),
  notifications: many(notifications),
}));

export const tasksRelations = relations(tasks, ({ one, many }) => ({
  project: one(projects, {
    fields: [tasks.projectId],
    references: [projects.id],
  }),
  assignedUser: one(users, {
    fields: [tasks.assignedUserId],
    references: [users.id],
    relationName: "assignedTasks",
  }),
  createdUser: one(users, {
    fields: [tasks.createdUserId],
    references: [users.id],
    relationName: "createdTasks",
  }),
  comments: many(taskComments),
  history: many(taskHistory),
  files: many(files),
  timeEntries: many(timeEntries),
  notifications: many(notifications),
}));

export const taskCommentsRelations = relations(taskComments, ({ one }) => ({
  task: one(tasks, {
    fields: [taskComments.taskId],
    references: [tasks.id],
  }),
  user: one(users, {
    fields: [taskComments.userId],
    references: [users.id],
  }),
}));

export const filesRelations = relations(files, ({ one }) => ({
  task: one(tasks, {
    fields: [files.taskId],
    references: [tasks.id],
  }),
  project: one(projects, {
    fields: [files.projectId],
    references: [projects.id],
  }),
  uploadedUser: one(users, {
    fields: [files.uploadedUserId],
    references: [users.id],
  }),
}));

// Zod schemas
export const insertUserSchema = createInsertSchema(users).omit({
  createdAt: true,
  updatedAt: true,
});

export const insertProjectSchema = createInsertSchema(projects).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertTaskSchema = createInsertSchema(tasks).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  completedAt: true,
});

export const insertTaskCommentSchema = createInsertSchema(taskComments).omit({
  id: true,
  createdAt: true,
});

export const insertFileSchema = createInsertSchema(files).omit({
  id: true,
  createdAt: true,
});

export const insertNotificationSchema = createInsertSchema(notifications).omit({
  id: true,
  createdAt: true,
});

export const insertTimeEntrySchema = createInsertSchema(timeEntries).omit({
  id: true,
  createdAt: true,
});

// Types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type Project = typeof projects.$inferSelect;
export type InsertProject = z.infer<typeof insertProjectSchema>;
export type Task = typeof tasks.$inferSelect;
export type InsertTask = z.infer<typeof insertTaskSchema>;
export type TaskComment = typeof taskComments.$inferSelect;
export type InsertTaskComment = z.infer<typeof insertTaskCommentSchema>;
export type TaskHistory = typeof taskHistory.$inferSelect;
export type File = typeof files.$inferSelect;
export type InsertFile = z.infer<typeof insertFileSchema>;
export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type TimeEntry = typeof timeEntries.$inferSelect;
export type InsertTimeEntry = z.infer<typeof insertTimeEntrySchema>;

// Extended types for API responses
export type TaskWithDetails = Task & {
  project?: Project;
  assignedUser?: User;
  createdUser?: User;
  comments?: TaskComment[];
  files?: File[];
  timeEntries?: TimeEntry[];
};

export type ProjectWithTasks = Project & {
  tasks?: TaskWithDetails[];
  files?: File[];
};

export type UserWithStats = User & {
  taskCount?: number;
  completedTaskCount?: number;
  hoursWorked?: number;
  efficiency?: number;
};
